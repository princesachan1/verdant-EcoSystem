"""
Database connection and helper functions for PostgreSQL
"""
import psycopg2
from psycopg2 import pool, extras
import os
import json
from contextlib import contextmanager

# Database configuration from environment variables
DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'port': os.getenv('DB_PORT', '5432'),
    'database': os.getenv('DB_NAME', 'verdant_db'),
    'user': os.getenv('DB_USER', 'verdant_user'),
    'password': os.getenv('DB_PASSWORD', 'verdant_pass')
}

# Connection pool
connection_pool = None

def init_db_pool(minconn=1, maxconn=10):
    """Initialize the database connection pool"""
    global connection_pool
    try:
        connection_pool = psycopg2.pool.SimpleConnectionPool(
            minconn,
            maxconn,
            **DB_CONFIG
        )
        print(f"✅ Database connection pool created successfully")
        return True
    except Exception as e:
        print(f"❌ Error creating connection pool: {e}")
        return False

@contextmanager
def get_db_connection():
    """Context manager for database connections"""
    conn = None
    try:
        conn = connection_pool.getconn()
        yield conn
        conn.commit()
    except Exception as e:
        if conn:
            conn.rollback()
        raise e
    finally:
        if conn:
            connection_pool.putconn(conn)

@contextmanager
def get_db_cursor(commit=True):
    """Context manager for database cursor with automatic commit/rollback"""
    with get_db_connection() as conn:
        cursor = conn.cursor(cursor_factory=extras.RealDictCursor)
        try:
            yield cursor
            if commit:
                conn.commit()
        except Exception as e:
            conn.rollback()
            raise e
        finally:
            cursor.close()

# ===== USER OPERATIONS =====

def get_user(user_id):
    """Get user by ID"""
    with get_db_cursor() as cursor:
        cursor.execute("SELECT * FROM users WHERE id = %s", (user_id,))
        return dict(cursor.fetchone()) if cursor.rowcount > 0 else None

def create_user(user_data):
    """Create a new user"""
    with get_db_cursor() as cursor:
        cursor.execute("""
            INSERT INTO users (id, name, email, phone, address, wallet, green_points)
            VALUES (%(id)s, %(name)s, %(email)s, %(phone)s, %(address)s, %(wallet)s, %(green_points)s)
            RETURNING *
        """, user_data)
        return dict(cursor.fetchone())

def update_user(user_id, updates):
    """Update user fields"""
    set_clause = ', '.join([f"{k} = %s" for k in updates.keys()])
    values = list(updates.values()) + [user_id]
    
    with get_db_cursor() as cursor:
        cursor.execute(f"""
            UPDATE users SET {set_clause}
            WHERE id = %s
            RETURNING *
        """, values)
        return dict(cursor.fetchone()) if cursor.rowcount > 0 else None

def update_user_wallet(user_id, amount):
    """Update user wallet balance (atomic operation)"""
    with get_db_cursor() as cursor:
        cursor.execute("""
            UPDATE users 
            SET wallet = wallet + %s
            WHERE id = %s AND wallet + %s >= 0
            RETURNING wallet
        """, (amount, user_id, amount))
        result = cursor.fetchone()
        return result['wallet'] if result else None

def update_user_points(user_id, points):
    """Update user green points"""
    with get_db_cursor() as cursor:
        cursor.execute("""
            UPDATE users 
            SET green_points = green_points + %s
            WHERE id = %s
            RETURNING green_points
        """, (points, user_id))
        result = cursor.fetchone()
        return result['green_points'] if result else None

# ===== MENU OPERATIONS =====

def get_all_menu_items():
    """Get all active menu items"""
    with get_db_cursor() as cursor:
        cursor.execute("""
            SELECT * FROM menu_items 
            WHERE is_active = TRUE
            ORDER BY id
        """)
        return [dict(row) for row in cursor.fetchall()]

def get_menu_item(item_id):
    """Get menu item by ID"""
    with get_db_cursor() as cursor:
        cursor.execute("SELECT * FROM menu_items WHERE id = %s", (item_id,))
        return dict(cursor.fetchone()) if cursor.rowcount > 0 else None

def search_menu_items(query):
    """Search menu items by name or category"""
    with get_db_cursor() as cursor:
        cursor.execute("""
            SELECT * FROM menu_items 
            WHERE is_active = TRUE 
            AND (name ILIKE %s OR category ILIKE %s)
            ORDER BY popularity DESC
        """, (f'%{query}%', f'%{query}%'))
        return [dict(row) for row in cursor.fetchall()]

def update_menu_stock(item_id, quantity_change):
    """Update menu item stock"""
    with get_db_cursor() as cursor:
        cursor.execute("""
            UPDATE menu_items 
            SET stock = stock + %s
            WHERE id = %s AND stock + %s >= 0
            RETURNING stock
        """, (quantity_change, item_id, quantity_change))
        result = cursor.fetchone()
        return result['stock'] if result else None

def add_menu_item(item_data):
    """Add new menu item"""
    with get_db_cursor() as cursor:
        cursor.execute("""
            INSERT INTO menu_items (name, category, price, image, stock, calories, protein)
            VALUES (%(name)s, %(category)s, %(price)s, %(image)s, %(stock)s, %(calories)s, %(protein)s)
            RETURNING *
        """, item_data)
        return dict(cursor.fetchone())

# ===== ORDER OPERATIONS =====

def create_order(order_data):
    """Create a new order"""
    with get_db_cursor() as cursor:
        # Convert items list to JSON string if it's not already
        items_json = json.dumps(order_data['items']) if isinstance(order_data['items'], list) else order_data['items']
        
        cursor.execute("""
            INSERT INTO orders (id, user_id, items, total, points, status, user_name, address, phone)
            VALUES (%(id)s, %(user_id)s, %(items)s, %(total)s, %(points)s, %(status)s, %(user_name)s, %(address)s, %(phone)s)
            RETURNING *
        """, {
            'id': order_data['id'],
            'user_id': order_data['user_id'],
            'items': items_json,
            'total': order_data['total'],
            'points': order_data['points'],
            'status': order_data['status'],
            'user_name': order_data['user_name'],
            'address': order_data['address'],
            'phone': order_data['phone']
        })
        return dict(cursor.fetchone())

def get_all_users():
    """Get all users from database"""
    with get_db_cursor() as cursor:
        cursor.execute("""
            SELECT id, name, email, phone, address, wallet, 
                   green_points, daily_protein_goal, daily_cal_goal,
                   today_protein, today_cals, created_at
            FROM users
            ORDER BY created_at DESC
        """)
        return [dict(row) for row in cursor.fetchall()]

def get_user_orders(user_id, limit=10):
    """Get user's orders"""
    with get_db_cursor() as cursor:
        cursor.execute("""
            SELECT * FROM orders 
            WHERE user_id = %s
            ORDER BY created_at DESC
            LIMIT %s
        """, (user_id, limit))
        return [dict(row) for row in cursor.fetchall()]

def get_all_orders(limit=50):
    """Get all orders (for admin)"""
    with get_db_cursor() as cursor:
        cursor.execute("""
            SELECT * FROM orders 
            ORDER BY created_at DESC
            LIMIT %s
        """, (limit,))
        return [dict(row) for row in cursor.fetchall()]

def update_order_status(order_id, status):
    """Update order status"""
    with get_db_cursor() as cursor:
        cursor.execute("""
            UPDATE orders 
            SET status = %s
            WHERE id = %s
            RETURNING *
        """, (status, order_id))
        return dict(cursor.fetchone()) if cursor.rowcount > 0 else None

# ===== TRANSACTION OPERATIONS =====

def create_transaction(transaction_data):
    """Create a transaction record"""
    with get_db_cursor() as cursor:
        cursor.execute("""
            INSERT INTO transactions (user_id, type, amount, description, payment_method, order_id)
            VALUES (%(user_id)s, %(type)s, %(amount)s, %(description)s, %(payment_method)s, %(order_id)s)
            RETURNING *
        """, transaction_data)
        return dict(cursor.fetchone())

def get_user_transactions(user_id, limit=20):
    """Get user's transaction history"""
    with get_db_cursor() as cursor:
        cursor.execute("""
            SELECT * FROM transactions 
            WHERE user_id = %s
            ORDER BY created_at DESC
            LIMIT %s
        """, (user_id, limit))
        return [dict(row) for row in cursor.fetchall()]

# ===== REVIEW OPERATIONS =====

def add_review(review_data):
    """Add a review for a menu item"""
    with get_db_cursor() as cursor:
        cursor.execute("""
            INSERT INTO reviews (item_id, user_id, review_text, sentiment_score)
            VALUES (%(item_id)s, %(user_id)s, %(review_text)s, %(sentiment_score)s)
            RETURNING *
        """, review_data)
        return dict(cursor.fetchone())

def get_item_reviews(item_id):
    """Get all reviews for a menu item"""
    with get_db_cursor() as cursor:
        cursor.execute("""
            SELECT r.*, u.name as user_name
            FROM reviews r
            JOIN users u ON r.user_id = u.id
            WHERE r.item_id = %s
            ORDER BY r.created_at DESC
        """, (item_id,))
        return [dict(row) for row in cursor.fetchall()]

def get_item_average_sentiment(item_id):
    """Get average sentiment score for an item"""
    with get_db_cursor() as cursor:
        cursor.execute("""
            SELECT AVG(sentiment_score) as avg_sentiment
            FROM reviews
            WHERE item_id = %s
        """, (item_id,))
        result = cursor.fetchone()
        return float(result['avg_sentiment']) if result and result['avg_sentiment'] else 3.0

# ===== ANALYTICS OPERATIONS =====

def get_order_frequency_by_item(days=30):
    """Get order frequency per menu item over specified days"""
    with get_db_cursor() as cursor:
        cursor.execute("""
            SELECT 
                mi.id,
                mi.name,
                mi.category,
                mi.stock,
                mi.price,
                COUNT(o.id) as order_count,
                SUM(jsonb_array_length(o.items)) as total_items_ordered
            FROM menu_items mi
            LEFT JOIN orders o ON o.created_at >= NOW() - INTERVAL '%s days'
                AND o.items::text LIKE '%%' || mi.name || '%%'
            WHERE mi.is_active = TRUE
            GROUP BY mi.id, mi.name, mi.category, mi.stock, mi.price
            ORDER BY order_count DESC
        """, (days,))
        return [dict(row) for row in cursor.fetchall()]

def get_low_stock_items(threshold=20):
    """Get items below stock threshold"""
    with get_db_cursor() as cursor:
        cursor.execute("""
            SELECT 
                id,
                name,
                category,
                stock,
                price,
                popularity
            FROM menu_items
            WHERE is_active = TRUE AND stock <= %s
            ORDER BY stock ASC
        """, (threshold,))
        return [dict(row) for row in cursor.fetchall()]

def get_reviews_summary():
    """Get aggregated review statistics per item"""
    with get_db_cursor() as cursor:
        cursor.execute("""
            SELECT 
                mi.id,
                mi.name,
                mi.category,
                COUNT(r.id) as review_count,
                COALESCE(AVG(r.sentiment_score), 3.0) as avg_sentiment,
                MAX(r.created_at) as last_review_date
            FROM menu_items mi
            LEFT JOIN reviews r ON r.item_id = mi.id
            WHERE mi.is_active = TRUE
            GROUP BY mi.id, mi.name, mi.category
            HAVING COUNT(r.id) > 0
            ORDER BY avg_sentiment DESC
        """)
        return [dict(row) for row in cursor.fetchall()]

def get_trending_items(min_reviews=3):
    """Get items with recent sentiment changes (trending positive or negative)"""
    with get_db_cursor() as cursor:
        cursor.execute("""
            WITH recent_reviews AS (
                SELECT 
                    item_id,
                    AVG(sentiment_score) as recent_sentiment
                FROM reviews
                WHERE created_at >= NOW() - INTERVAL '7 days'
                GROUP BY item_id
                HAVING COUNT(*) >= %s
            ),
            all_reviews AS (
                SELECT 
                    item_id,
                    AVG(sentiment_score) as overall_sentiment
                FROM reviews
                GROUP BY item_id
            )
            SELECT 
                mi.id,
                mi.name,
                mi.category,
                ar.overall_sentiment,
                rr.recent_sentiment,
                (rr.recent_sentiment - ar.overall_sentiment) as sentiment_change
            FROM menu_items mi
            JOIN recent_reviews rr ON rr.item_id = mi.id
            JOIN all_reviews ar ON ar.item_id = mi.id
            WHERE mi.is_active = TRUE
            ORDER BY ABS(rr.recent_sentiment - ar.overall_sentiment) DESC
            LIMIT 10
        """, (min_reviews,))
        return [dict(row) for row in cursor.fetchall()]

def get_order_items_analysis(days=30):
    """Analyze items from orders to calculate demand"""
    with get_db_cursor() as cursor:
        cursor.execute("""
            SELECT 
                o.created_at::date as order_date,
                item->>'name' as item_name,
                COUNT(*) as order_count
            FROM orders o,
            jsonb_array_elements(o.items) as item
            WHERE o.created_at >= NOW() - INTERVAL '%s days'
            GROUP BY o.created_at::date, item->>'name'
            ORDER BY order_date DESC, order_count DESC
        """, (days,))
        return [dict(row) for row in cursor.fetchall()]



# ===== INTELLIGENCE & ANALYTICS =====

def get_menu_analysis():
    """Get menu items with popularity and price for BCG Matrix"""
    with get_db_cursor() as cursor:
        # Join menu with order counts to determine popularity
        # Assumes item names in orders match menu names
        cursor.execute("""
            SELECT 
                m.id,
                m.name, 
                m.price, 
                m.category,
                COUNT(item) as popularity
            FROM menu_items m
            LEFT JOIN orders o ON o.created_at > NOW() - INTERVAL '30 days'
            LEFT JOIN jsonb_array_elements(o.items) as item ON item->>'name' = m.name
            WHERE m.is_active = TRUE
            GROUP BY m.id
        """)
        return [dict(row) for row in cursor.fetchall()]

def get_inactive_users(days=14):
    """Find users who haven't ordered in X days (Churn Risk)"""
    with get_db_cursor() as cursor:
        cursor.execute("""
            SELECT 
                u.id, 
                u.name, 
                u.email, 
                u.wallet,
                MAX(o.created_at) as last_active
            FROM users u
            LEFT JOIN orders o ON u.id = o.user_id
            GROUP BY u.id
            HAVING MAX(o.created_at) < NOW() - INTERVAL '%s days' 
                OR MAX(o.created_at) IS NULL
            ORDER BY u.wallet DESC
        """, (days,))
        # Convert datetime to string for JSON serialization
        results = []
        for row in cursor.fetchall():
            d = dict(row)
            if d['last_active']:
                d['last_active'] = d['last_active'].isoformat()
            else:
                d['last_active'] = "Never"
            results.append(d)
        return results

# ===== UTILITY FUNCTIONS =====

def execute_query(query, params=None, fetch=True):
    """Execute a custom query"""
    with get_db_cursor() as cursor:
        cursor.execute(query, params or ())
        if fetch:
            return [dict(row) for row in cursor.fetchall()]
        return cursor.rowcount

def test_connection():
    """Test database connection"""
    try:
        with get_db_cursor() as cursor:
            cursor.execute("SELECT version();")
            version = cursor.fetchone()
            print(f"✅ Database connected: {version['version']}")
            return True
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return False
