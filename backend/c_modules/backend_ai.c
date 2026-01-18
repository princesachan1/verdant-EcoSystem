#include "backend_types.h"

// ============================================================================
// AI MODULE: CUSTOMER SEGMENTATION & CLUSTERING
// ============================================================================
// Implements 4-tier K-Means clustering for customer segmentation
// Clusters: Titanium, Gold, Silver, Bronze based on eco-points and spending
//
// Author: Backend Team
// Created: Dec 2025
// Last Modified: Jan 2026
// TODO: Experiment with different K values (maybe 5 clusters?)
// TODO: Add silhouette score calculation for cluster quality

#define NUM_CLUSTERS 4
#define MAX_ITERATIONS 50
#define CONVERGENCE_THRESHOLD 0.01

// Strategic centroids for business-driven segmentation
// X-axis: Green Points (Eco-consciousness)
// Y-axis: Wallet Balance (Spending power)
// Note: These initial values were chosen based on our user data analysis
static float centroids[NUM_CLUSTERS][2] = {
    {30.0, 30.0},      // Bronze: Low Eco, Low Spend (casual users)
    {150.0, 30.0},     // Silver: High Eco, Low Spend (eco-warriors on budget)
    {30.0, 500.0},     // Gold: Low Eco, High Spend (high spenders)
    {500.0, 1000.0}    // Titanium: High Eco, High Spend (premium eco-conscious)
};

static const char* cluster_names[NUM_CLUSTERS] = {
    "Bronze", "Silver", "Gold", "Titanium"
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate Euclidean distance between two points
 */
static inline float euclidean_distance(float x1, float y1, float x2, float y2) {
    float dx = x1 - x2;
    float dy = y1 - y2;
    return sqrtf(dx * dx + dy * dy);
}

/**
 * Calculate churn risk based on spending patterns
 * Returns risk percentage (0-100)
 */
static float calculate_churn_risk(int wallet_balance) {
    if (wallet_balance < 50) return 85.0f;
    if (wallet_balance < 200) return 55.0f;
    if (wallet_balance < 500) return 25.0f;
    return 5.0f;
}

/**
 * Assign each data point to nearest centroid
 * Returns 1 if any assignment changed, 0 otherwise
 */
static int assign_clusters(int count, const int* points, const int* wallets, 
                           int* assignments) {
    int changed = 0;
    
    for (int i = 0; i < count; i++) {
        float x = (float)points[i];
        float y = (float)wallets[i];
        
        // Find nearest centroid
        int best_cluster = 0;
        float min_distance = euclidean_distance(x, y, 
                                               centroids[0][0], centroids[0][1]);
        
        for (int k = 1; k < NUM_CLUSTERS; k++) {
            float distance = euclidean_distance(x, y, 
                                               centroids[k][0], centroids[k][1]);
            if (distance < min_distance) {
                min_distance = distance;
                best_cluster = k;
            }
        }
        
        if (assignments[i] != best_cluster) {
            assignments[i] = best_cluster;
            changed = 1;
        }
    }
    
    return changed;
}

/**
 * Update centroids based on current cluster assignments
 * Returns maximum centroid movement
 */
static float update_centroids(int count, const int* points, const int* wallets,
                              const int* assignments) {
    float new_centroids[NUM_CLUSTERS][2] = {{0}};
    int cluster_counts[NUM_CLUSTERS] = {0};
    float max_movement = 0.0f;
    
    // Accumulate sums for each cluster
    for (int i = 0; i < count; i++) {
        int cluster = assignments[i];
        new_centroids[cluster][0] += (float)points[i];
        new_centroids[cluster][1] += (float)wallets[i];
        cluster_counts[cluster]++;
    }
    
    // Calculate new centroids and track movement
    for (int k = 0; k < NUM_CLUSTERS; k++) {
        if (cluster_counts[k] > 0) {
            float new_x = new_centroids[k][0] / cluster_counts[k];
            float new_y = new_centroids[k][1] / cluster_counts[k];
            
            // Use weighted average for stability (70% new, 30% old)
            float updated_x = 0.7f * new_x + 0.3f * centroids[k][0];
            float updated_y = 0.7f * new_y + 0.3f * centroids[k][1];
            
            // Track maximum movement
            float movement = euclidean_distance(centroids[k][0], centroids[k][1],
                                               updated_x, updated_y);
            if (movement > max_movement) {
                max_movement = movement;
            }
            
            centroids[k][0] = updated_x;
            centroids[k][1] = updated_y;
        }
    }
    
    return max_movement;
}

// ============================================================================
// EXPORTED FUNCTION
// ============================================================================

/**
 * Perform K-Means clustering on customer data
 * 
 * @param count Number of customers
 * @param points Array of green points (eco-consciousness metric)
 * @param wallets Array of wallet balances (spending power metric)
 * @param output_buffer Buffer to write JSON result
 * @param buffer_size Size of output buffer
 */
EXPORT void perform_clustering(int count, int* points, int* wallets, 
                               char* output_buffer, int buffer_size) {
    // Input validation
    if (count <= 0 || !points || !wallets || !output_buffer || buffer_size < 100) {
        if (output_buffer && buffer_size > 0) {
            strncpy(output_buffer, "[]", buffer_size - 1);
            output_buffer[buffer_size - 1] = '\0';
        }
        return;
    }
    
    // Allocate memory for cluster assignments
    int* assignments = (int*)calloc(count, sizeof(int));
    if (!assignments) {
        strncpy(output_buffer, "[]", buffer_size - 1);
        output_buffer[buffer_size - 1] = '\0';
        return;
    }
    
    // Run K-Means algorithm
    int iteration = 0;
    int converged = 0;
    
    while (iteration < MAX_ITERATIONS && !converged) {
        // Assign points to clusters
        int changed = assign_clusters(count, points, wallets, assignments);
        
        // Update centroids
        float movement = update_centroids(count, points, wallets, assignments);
        
        // Check convergence
        if (!changed || movement < CONVERGENCE_THRESHOLD) {
            converged = 1;
        }
        
        iteration++;
    }
    
    // Build JSON output
    int offset = 0;
    offset += snprintf(output_buffer + offset, buffer_size - offset, "[");
    
    for (int i = 0; i < count && offset < buffer_size - 150; i++) {
        int cluster = assignments[i];
        float churn = calculate_churn_risk(wallets[i]);
        
        int written = snprintf(output_buffer + offset, buffer_size - offset,
            "{\"x\":%d,\"y\":%d,\"cluster\":\"%s\",\"churn\":%.1f}",
            points[i], wallets[i], cluster_names[cluster], churn);
        
        if (written < 0 || written >= buffer_size - offset) {
            break; // Buffer overflow protection
        }
        
        offset += written;
        
        if (i < count - 1 && offset < buffer_size - 2) {
            output_buffer[offset++] = ',';
        }
    }
    
    if (offset < buffer_size - 1) {
        output_buffer[offset++] = ']';
        output_buffer[offset] = '\0';
    }
    
    free(assignments);
}