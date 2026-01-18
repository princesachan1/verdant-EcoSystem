#include "backend_types.h"

// ============================================================================
// NUTRITION MODULE: BIO-METRIC SCORING & DAILY AUDITS
// ============================================================================
// Implements nutrition analysis and daily goal tracking with penalties

#define MIN_SCORE 0.0
#define MAX_SCORE 100.0
#define PENALTY_RATE 0.25  // 25% penalty for missing goals (maybe too harsh?)
#define GOAL_ADHERENCE_THRESHOLD 0.80  // 80% is passing

// Nutrition scoring weights (evidence-based from research papers)
#define PROTEIN_WEIGHT 1.5
#define FIBER_WEIGHT 4.0  // Fiber is super important!
#define SODIUM_PENALTY_DIVISOR 80.0
#define HIGH_CALORIE_THRESHOLD 800
#define HIGH_CALORIE_PENALTY 15.0

// Caloric conversion factors (kcal per gram)
#define PROTEIN_KCAL 4.0
#define CARB_KCAL 4.0
#define FAT_KCAL 9.0

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate estimated caloric content from macronutrients
 */
static inline double calculate_calories(int protein, int carbs, int fats) {
    return (protein * PROTEIN_KCAL) + (carbs * CARB_KCAL) + (fats * FAT_KCAL);
}

/**
 * Clamp value between min and max
 */
static inline double clamp(double value, double min, double max) {
    if (value < min) return min;
    if (value > max) return max;
    return value;
}

/**
 * Determine nutrition verdict based on bio-score
 */
static const char* get_nutrition_verdict(double score) {
    if (score >= 85.0) return "Nutrient Dense (A+)";
    if (score >= 70.0) return "Well Balanced (A)";
    if (score >= 55.0) return "Balanced (B)";
    if (score >= 40.0) return "Energy Heavy (C)";
    return "Limiting Nutrient Profile (D)";
}

/**
 * Calculate bio-metric nutrition score
 * Higher scores indicate better nutritional quality
 */
static double calculate_bio_score(int protein, int carbs, int fats, 
                                  int fiber, int sodium) {
    // Start with base score
    double score = 50.0;
    
    // Positive contributions
    score += (protein * PROTEIN_WEIGHT);  // Protein is beneficial
    score += (fiber * FIBER_WEIGHT);      // Fiber is highly beneficial
    
    // Negative contributions
    score -= (sodium / SODIUM_PENALTY_DIVISOR); // High sodium is detrimental
    
    // Caloric density penalty
    double calories = calculate_calories(protein, carbs, fats);
    if (calories > HIGH_CALORIE_THRESHOLD) {
        score -= HIGH_CALORIE_PENALTY;
    }
    
    // Macro balance bonus (protein-to-carb ratio)
    if (carbs > 0) {
        double protein_carb_ratio = (double)protein / carbs;
        if (protein_carb_ratio >= 0.3 && protein_carb_ratio <= 0.5) {
            score += 5.0; // Bonus for good balance
        }
    }
    
    // Fat quality consideration (moderate fat is okay)
    if (fats > 0 && fats < 30) {
        score += 3.0; // Bonus for moderate fat
    } else if (fats >= 50) {
        score -= 8.0; // Penalty for very high fat
    }
    
    // Clamp to valid range
    return clamp(score, MIN_SCORE, MAX_SCORE);
}

// ============================================================================
// EXPORTED FUNCTIONS
// ============================================================================

/**
 * Analyze nutrition profile and calculate bio-metric score
 * 
 * @param protein Protein content in grams
 * @param carbs Carbohydrate content in grams
 * @param fats Fat content in grams
 * @param fiber Fiber content in grams
 * @param sodium Sodium content in milligrams
 * @param output_buffer Buffer to write JSON result
 * @param buffer_size Size of output buffer
 */
EXPORT void analyze_nutrition(int protein, int carbs, int fats, int fiber, int sodium,
                              char* output_buffer, int buffer_size) {
    // Input validation
    if (!output_buffer || buffer_size < 100) {
        return;
    }
    
    // Validate macro values (prevent negative or unrealistic values)
    if (protein < 0) protein = 0;
    if (carbs < 0) carbs = 0;
    if (fats < 0) fats = 0;
    if (fiber < 0) fiber = 0;
    if (sodium < 0) sodium = 0;
    
    // Sanity check: unrealistic values
    if (protein > 200 || carbs > 500 || fats > 200 || fiber > 100 || sodium > 10000) {
        snprintf(output_buffer, buffer_size,
                "{\"error\":\"Unrealistic macro values provided\"}");
        return;
    }
    
    // Calculate bio-score
    double score = calculate_bio_score(protein, carbs, fats, fiber, sodium);
    const char* verdict = get_nutrition_verdict(score);
    
    // Build JSON output
    snprintf(output_buffer, buffer_size,
             "{\"bio_score\":%.1f,"
             "\"verdict\":\"%s\","
             "\"macros\":{"
             "\"protein\":%d,"
             "\"carbs\":%d,"
             "\"fats\":%d,"
             "\"fiber\":%d,"
             "\"sodium\":%d,"
             "\"calories\":%.0f"
             "}}",
             score, verdict, protein, carbs, fats, fiber, sodium,
             calculate_calories(protein, carbs, fats));
}

/**
 * Calculate daily habit audit with goal adherence check
 * Applies penalty if goals are not met
 * 
 * @param current_points Current green points balance
 * @param protein_consumed Protein consumed today (grams)
 * @param protein_goal Daily protein goal (grams)
 * @param carbs_consumed Carbs consumed today (grams)
 * @param carbs_goal Daily carb goal (grams)
 * @param output_buffer Buffer to write JSON result
 * @param buffer_size Size of output buffer
 */
EXPORT void calculate_daily_audit(int current_points, 
                                  int protein_consumed, int protein_goal,
                                  int carbs_consumed, int carbs_goal,
                                  char* output_buffer, int buffer_size) {
    // Input validation
    if (!output_buffer || buffer_size < 100) {
        return;
    }
    
    // Validate inputs
    if (current_points < 0) current_points = 0;
    if (protein_consumed < 0) protein_consumed = 0;
    if (carbs_consumed < 0) carbs_consumed = 0;
    
    // Check if goals are set
    if (protein_goal <= 0 || carbs_goal <= 0) {
        snprintf(output_buffer, buffer_size,
                "{\"penalty_applied\":false,"
                "\"new_points\":%d,"
                "\"reason\":\"No goals set\","
                "\"protein_adherence\":0.0,"
                "\"carbs_adherence\":0.0}",
                current_points);
        return;
    }
    
    // Calculate adherence percentages
    double protein_adherence = (double)protein_consumed / protein_goal;
    double carbs_adherence = (double)carbs_consumed / carbs_goal;
    
    // Clamp adherence to reasonable range (0-2.0 for over-achievement)
    protein_adherence = clamp(protein_adherence, 0.0, 2.0);
    carbs_adherence = clamp(carbs_adherence, 0.0, 2.0);
    
    // Check if goals are met (80% threshold)
    int protein_met = (protein_adherence >= GOAL_ADHERENCE_THRESHOLD);
    int carbs_met = (carbs_adherence >= GOAL_ADHERENCE_THRESHOLD);
    int goals_met = protein_met && carbs_met;
    
    if (goals_met) {
        // Goals met - no penalty
        snprintf(output_buffer, buffer_size,
                "{\"penalty_applied\":false,"
                "\"new_points\":%d,"
                "\"reason\":\"Goals met! Great job!\","
                "\"protein_adherence\":%.2f,"
                "\"carbs_adherence\":%.2f}",
                current_points, protein_adherence, carbs_adherence);
    } else {
        // Goals not met - apply penalty
        int penalty = (int)(current_points * PENALTY_RATE);
        if (penalty < 1 && current_points > 0) penalty = 1; // Minimum penalty
        
        int new_balance = current_points - penalty;
        if (new_balance < 0) new_balance = 0;
        
        // Determine specific reason
        const char* reason;
        if (!protein_met && !carbs_met) {
            reason = "Both protein and carb goals missed";
        } else if (!protein_met) {
            reason = "Protein goal not met";
        } else {
            reason = "Carb goal not met";
        }
        
        snprintf(output_buffer, buffer_size,
                "{\"penalty_applied\":true,"
                "\"new_points\":%d,"
                "\"deducted\":%d,"
                "\"reason\":\"%s\","
                "\"protein_adherence\":%.2f,"
                "\"carbs_adherence\":%.2f}",
                new_balance, penalty, reason, protein_adherence, carbs_adherence);
    }
}
