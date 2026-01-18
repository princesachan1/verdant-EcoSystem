#ifndef BACKEND_TYPES_H
#define BACKEND_TYPES_H

#include <stdio.h>
#include <string.h>
#include <stdlib.h>
#include <time.h>
#include <ctype.h>
#include <math.h>

#ifdef _WIN32
    #define EXPORT __declspec(dllexport)
#else
    #define EXPORT
#endif

#define MAX_ITEMS 200
#define MAX_NAME 100
#define MAX_CAT 50
#define MAX_IMAGE 512 

// --- ENTITIES ---
typedef struct {
    int id;
    char name[MAX_NAME];
    char category[MAX_CAT];
    float price;
    char image[MAX_IMAGE]; 
    int stock;
    int popularity;
    int calories;
    int protein;
} FoodItem;

typedef struct {
    float subtotal;
    float tax;
    float delivery_fee;
    float discount;
    float grand_total;
    int estimated_time;
    int total_calories;
    int total_protein;
} BillSummary;

typedef struct OrderNode {
    int order_id;
    int status;
    char items_summary[256];
    struct OrderNode* next;
} OrderNode;

// --- GLOBALS ---


// --- PROTOTYPES ---


// Logistics Module (backend_logistics.c)
void optimize_route(int num_stops, char* output_buffer, int buffer_size);

// Nutrition Module (backend_nutrition.c)
void analyze_nutrition(int protein, int carbs, int fats, int fiber, int sodium, 
                      char* output_buffer, int buffer_size);
void calculate_daily_audit(int current_points, int protein_consumed, int protein_goal,
                          int carbs_consumed, int carbs_goal,
                          char* output_buffer, int buffer_size);

#endif