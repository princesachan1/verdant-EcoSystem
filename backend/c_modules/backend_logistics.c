#include "backend_types.h"

// ============================================================================
// LOGISTICS MODULE: ROUTE OPTIMIZATION (2-OPT TSP)
// ============================================================================

#define PI 3.14159265358979323846
#define MIN_STOPS 2
#define MAX_STOPS 100
#define MAX_ITERATIONS 200
#define GRID_SIZE 100.0

typedef struct {
    int id;
    double x;
    double y;
    char type[10]; // "HUB" or "DROP"
} DeliveryNode;

static inline double calculate_distance(const DeliveryNode* a, const DeliveryNode* b) {
    double dx = a->x - b->x;
    double dy = a->y - b->y;
    return sqrt(dx * dx + dy * dy);
}

/**
 * Calculate total route distance including return to hub
 */
static double calculate_route_distance(const DeliveryNode* nodes, const int* route, int count) {
    if (count < 2) return 0.0;
    
    double total = 0.0;
    
    // Sum distances between consecutive stops
    for (int i = 0; i < count - 1; i++) {
        total += calculate_distance(&nodes[route[i]], &nodes[route[i + 1]]);
    }
    
    // Add return distance to starting point (hub)
    total += calculate_distance(&nodes[route[count - 1]], &nodes[route[0]]);
    
    return total;
}

/**
 * Perform 2-opt swap: reverse segment between indices i and j
 */
static void two_opt_swap(const int* route, int i, int j, int count, int* new_route) {
    // Copy first segment unchanged
    for (int k = 0; k < i; k++) {
        new_route[k] = route[k];
    }
    
    // Reverse middle segment
    int idx = i;
    for (int k = j; k >= i; k--) {
        new_route[idx++] = route[k];
    }
    
    // Copy last segment unchanged
    for (int k = j + 1; k < count; k++) {
        new_route[k] = route[k];
    }
}

/**
 * Generate random delivery locations using deterministic seed
 */
static void generate_delivery_locations(DeliveryNode* nodes, int count, unsigned int seed) {
    // Hub at center
    nodes[0].id = 0;
    nodes[0].x = GRID_SIZE / 2.0;
    nodes[0].y = GRID_SIZE / 2.0;
    strcpy(nodes[0].type, "HUB");
    
    // Use provided seed for reproducibility
    srand(seed);
    
    // Generate random delivery points
    for (int i = 1; i < count; i++) {
        nodes[i].id = i;
        nodes[i].x = (double)(rand() % (int)GRID_SIZE);
        nodes[i].y = (double)(rand() % (int)GRID_SIZE);
        strcpy(nodes[i].type, "DROP");
    }
}

/**
 * Initialize route with nearest neighbor heuristic for better starting point
 */
static void initialize_route_nearest_neighbor(const DeliveryNode* nodes, int* route, int count) {
    int* visited = (int*)calloc(count, sizeof(int));
    if (!visited) {
        // Fallback to sequential if allocation fails
        for (int i = 0; i < count; i++) route[i] = i;
        return;
    }
    
    // Start at hub
    route[0] = 0;
    visited[0] = 1;
    
    // Greedily select nearest unvisited node
    for (int i = 1; i < count; i++) {
        int current = route[i - 1];
        int nearest = -1;
        double min_dist = INFINITY;
        
        for (int j = 1; j < count; j++) {
            if (!visited[j]) {
                double dist = calculate_distance(&nodes[current], &nodes[j]);
                if (dist < min_dist) {
                    min_dist = dist;
                    nearest = j;
                }
            }
        }
        
        route[i] = nearest;
        visited[nearest] = 1;
    }
    
    free(visited);
}

// ============================================================================
// EXPORTED FUNCTION
// ============================================================================

/**
 * Optimize delivery route using 2-Opt algorithm
 * 
 * @param num_stops Number of delivery stops (including hub)
 * @param output_buffer Buffer to write JSON result
 * @param buffer_size Size of output buffer
 */
EXPORT void optimize_route(int num_stops, char* output_buffer, int buffer_size) {
    // Input validation
    if (!output_buffer || buffer_size < 100) {
        return;
    }
    
    // Clamp to valid range
    if (num_stops < MIN_STOPS) num_stops = 5;
    if (num_stops > MAX_STOPS) num_stops = MAX_STOPS;
    
    // Allocate memory
    DeliveryNode* nodes = (DeliveryNode*)malloc(num_stops * sizeof(DeliveryNode));
    int* route = (int*)malloc(num_stops * sizeof(int));
    int* new_route = (int*)malloc(num_stops * sizeof(int));
    
    if (!nodes || !route || !new_route) {
        snprintf(output_buffer, buffer_size, 
                "{\"error\":\"Memory allocation failed\"}");
        free(nodes);
        free(route);
        free(new_route);
        return;
    }
    
    // Generate delivery locations (use time as seed for variety)
    generate_delivery_locations(nodes, num_stops, (unsigned int)time(NULL));
    
    // Initialize route with nearest neighbor heuristic
    initialize_route_nearest_neighbor(nodes, route, num_stops);
    
    // Run 2-Opt optimization
    double best_distance = calculate_route_distance(nodes, route, num_stops);
    int improved = 1;
    int iteration = 0;
    
    while (improved && iteration < MAX_ITERATIONS) {
        improved = 0;
        iteration++;
        
        // Try all possible 2-opt swaps
        for (int i = 1; i < num_stops - 1; i++) {
            for (int j = i + 1; j < num_stops; j++) {
                // Create new route with swap
                two_opt_swap(route, i, j, num_stops, new_route);
                
                // Calculate new distance
                double new_distance = calculate_route_distance(nodes, new_route, num_stops);
                
                // Accept if improvement found
                if (new_distance < best_distance - 0.001) { // Small epsilon for float comparison
                    memcpy(route, new_route, num_stops * sizeof(int));
                    best_distance = new_distance;
                    improved = 1;
                }
            }
        }
    }
    
    // Build JSON output
    int offset = 0;
    offset += snprintf(output_buffer + offset, buffer_size - offset,
                      "{\"total_distance\":%.2f,\"iterations\":%d,\"stops\":[",
                      best_distance, iteration);
    
    for (int i = 0; i < num_stops && offset < buffer_size - 100; i++) {
        int idx = route[i];
        int written = snprintf(output_buffer + offset, buffer_size - offset,
                              "{\"id\":%d,\"x\":%.1f,\"y\":%.1f,\"type\":\"%s\"}",
                              nodes[idx].id, nodes[idx].x, nodes[idx].y, nodes[idx].type);
        
        if (written < 0 || written >= buffer_size - offset) {
            break; // Buffer overflow protection
        }
        
        offset += written;
        
        if (i < num_stops - 1 && offset < buffer_size - 3) {
            output_buffer[offset++] = ',';
        }
    }
    
    if (offset < buffer_size - 2) {
        offset += snprintf(output_buffer + offset, buffer_size - offset, "]}");
    }
    
    // Cleanup
    free(nodes);
    free(route);
    free(new_route);
}
