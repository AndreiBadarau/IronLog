/**
 * Calculator Service for 1RM (One Rep Max) calculations
 * Supports three calculation modes for strength training exercises
 * Handles both weighted exercises and bodyweight exercises
 */

export type ExerciseType =
  | "Squat"
  | "Bench"
  | "Deadlift"
  | "Pull Up"
  | "Muscle Up"
  | "Dips";
export type CalculationMode = "RepsToRM" | "RMToReps" | "RMToWeight";
export type WeightUnit = "kg" | "lbs";

export interface CalculationInput {
  exercise: ExerciseType;
  mode: CalculationMode;
  addedWeight?: number; // Weight added (for bodyweight exercises) or total weight (for barbell exercises)
  reps?: number;
  rm?: number;
  bodyweight?: number; // User's bodyweight (required for bodyweight exercises)
  unit: WeightUnit;
}

/**
 * Check if an exercise uses bodyweight
 */
export function isBodyweightExercise(exercise: ExerciseType): boolean {
  return (
    exercise === "Pull Up" || exercise === "Muscle Up" || exercise === "Dips"
  );
}

export interface CalculationResult {
  value: number;
  description: string;
  unit: string;
}

// ============================================================================
// SQUAT FORMULAS
// ============================================================================

/**
 * Calculate 1RM from weight and reps for SQUAT
 * Uses polynomial formula for reps <= 10, exponential for reps > 10
 */
function calculateSquatRepsToRM(weight: number, reps: number): number {
  if (reps <= 10) {
    return (
      (100 * weight) / (0.1914 * Math.pow(reps, 2) - 5.2087 * reps + 104.43)
    );
  } else {
    return (100 * weight) / (101.33 * Math.pow(Math.E, -0.037 * reps));
  }
}

/**
 * Calculate reps from RM and weight for SQUAT
 */
function calculateSquatRMToReps(rm: number, weight: number): number {
  let result =
    (5.2087 * rm -
      Math.sqrt(
        Math.pow(5.2087 * rm, 2) -
          4 * 0.1914 * rm * (104.43 * rm - 100 * weight)
      )) /
    (2 * 0.1914 * rm);

  if (result > 10 || isNaN(result)) {
    result = -Math.log((0.98687 * weight) / rm) / 0.037;
  }

  return result;
}

/**
 * Calculate weight from RM and reps for SQUAT
 */
function calculateSquatRMToWeight(rm: number, reps: number): number {
  if (reps <= 10) {
    return (rm * (0.1914 * Math.pow(reps, 2) - 5.2087 * reps + 104.43)) / 100;
  } else {
    return (101.33 * Math.pow(Math.E, -0.037 * reps) * rm) / 100;
  }
}

// ============================================================================
// BENCH FORMULAS
// ============================================================================

/**
 * Calculate 1RM from weight and reps for BENCH
 */
function calculateBenchRepsToRM(weight: number, reps: number): number {
  if (reps <= 10) {
    return (
      (100 * weight) / (0.1025 * Math.pow(reps, 2) - 3.8208 * reps + 103.59)
    );
  } else {
    return (100 * weight) / (102.22 * Math.pow(Math.E, -0.031 * reps));
  }
}

/**
 * Calculate reps from RM and weight for BENCH
 */
function calculateBenchRMToReps(rm: number, weight: number): number {
  let result =
    (3.8208 * rm - Math.sqrt(-27.873387 * Math.pow(rm, 2) + 41 * rm * weight)) /
    (0.205 * rm);
  if (result > 10 || isNaN(result)) {
    result = -(Math.log((0.9783 * weight) / rm) / Math.log(2.71828)) / 0.031;
  }

  return result;
}

/**
 * Calculate weight from RM and reps for BENCH
 */
function calculateBenchRMToWeight(rm: number, reps: number): number {
  if (reps <= 10) {
    return (rm * (0.1025 * Math.pow(reps, 2) - 3.8208 * reps + 103.59)) / 100;
  } else {
    return (102.22 * Math.pow(Math.E, -0.031 * reps) * rm) / 100;
  }
}

// ============================================================================
// DEADLIFT FORMULAS
// ============================================================================

/**
 * Calculate 1RM from weight and reps for DEADLIFT
 * TODO: Add deadlift-specific formulas
 */
function calculateDeadliftRepsToRM(weight: number, reps: number): number {
  // Placeholder - add your deadlift formula here
  return calculateSquatRepsToRM(weight, reps);
}

/**
 * Calculate reps from RM and weight for DEADLIFT
 */
function calculateDeadliftRMToReps(rm: number, weight: number): number {
  // Placeholder - add your deadlift formula here
  return calculateSquatRMToReps(rm, weight);
}

/**
 * Calculate weight from RM and reps for DEADLIFT
 */
function calculateDeadliftRMToWeight(rm: number, reps: number): number {
  // Placeholder - add your deadlift formula here
  return calculateSquatRMToWeight(rm, reps);
}

// ============================================================================
// PULL UP FORMULAS
// ============================================================================

/**
 * Calculate 1RM from weight and reps for PULL UP
 * TODO: Add pull up-specific formulas
 */
function calculatePullUpRepsToRM(weight: number, reps: number): number {
  // Placeholder - add your pull up formula here
  return calculateSquatRepsToRM(weight, reps);
}

/**
 * Calculate reps from RM and weight for PULL UP
 */
function calculatePullUpRMToReps(rm: number, weight: number): number {
  // Placeholder - add your pull up formula here
  return calculateSquatRMToReps(rm, weight);
}

/**
 * Calculate weight from RM and reps for PULL UP
 */
function calculatePullUpRMToWeight(rm: number, reps: number): number {
  // Placeholder - add your pull up formula here
  return calculateSquatRMToWeight(rm, reps);
}

// ============================================================================
// MUSCLE UP FORMULAS
// ============================================================================

/**
 * Calculate 1RM from weight and reps for MUSCLE UP
 * TODO: Add muscle up-specific formulas
 */
function calculateMuscleUpRepsToRM(weight: number, reps: number): number {
  // Placeholder - add your muscle up formula here
  return calculateSquatRepsToRM(weight, reps);
}

/**
 * Calculate reps from RM and weight for MUSCLE UP
 */
function calculateMuscleUpRMToReps(rm: number, weight: number): number {
  // Placeholder - add your muscle up formula here
  return calculateSquatRMToReps(rm, weight);
}

/**
 * Calculate weight from RM and reps for MUSCLE UP
 */
function calculateMuscleUpRMToWeight(rm: number, reps: number): number {
  // Placeholder - add your muscle up formula here
  return calculateSquatRMToWeight(rm, reps);
}

// ============================================================================
// DIPS FORMULAS
// ============================================================================

/**
 * Calculate 1RM from weight and reps for DIPS
 * TODO: Add dips-specific formulas
 */
function calculateDipsRepsToRM(weight: number, reps: number): number {
  // Placeholder - add your dips formula here
  return calculateSquatRepsToRM(weight, reps);
}

/**
 * Calculate reps from RM and weight for DIPS
 */
function calculateDipsRMToReps(rm: number, weight: number): number {
  // Placeholder - add your dips formula here
  return calculateSquatRMToReps(rm, weight);
}

/**
 * Calculate weight from RM and reps for DIPS
 */
function calculateDipsRMToWeight(rm: number, reps: number): number {
  // Placeholder - add your dips formula here
  return calculateSquatRMToWeight(rm, reps);
}

// ============================================================================
// EXERCISE-SPECIFIC ROUTING
// ============================================================================

/**
 * Route to the correct RepsToRM formula based on exercise
 */
function calculateRepsToRM(
  exercise: ExerciseType,
  weight: number,
  reps: number
): number {
  switch (exercise) {
    case "Squat":
      return calculateSquatRepsToRM(weight, reps);
    case "Bench":
      return calculateBenchRepsToRM(weight, reps);
    case "Deadlift":
      return calculateDeadliftRepsToRM(weight, reps);
    case "Pull Up":
      return calculatePullUpRepsToRM(weight, reps);
    case "Muscle Up":
      return calculateMuscleUpRepsToRM(weight, reps);
    case "Dips":
      return calculateDipsRepsToRM(weight, reps);
  }
}

/**
 * Route to the correct RMToReps formula based on exercise
 */
function calculateRMToReps(
  exercise: ExerciseType,
  rm: number,
  weight: number
): number {
  switch (exercise) {
    case "Squat":
      return calculateSquatRMToReps(rm, weight);
    case "Bench":
      return calculateBenchRMToReps(rm, weight);
    case "Deadlift":
      return calculateDeadliftRMToReps(rm, weight);
    case "Pull Up":
      return calculatePullUpRMToReps(rm, weight);
    case "Muscle Up":
      return calculateMuscleUpRMToReps(rm, weight);
    case "Dips":
      return calculateDipsRMToReps(rm, weight);
  }
}

/**
 * Route to the correct RMToWeight formula based on exercise
 */
function calculateRMToWeight(
  exercise: ExerciseType,
  rm: number,
  reps: number
): number {
  switch (exercise) {
    case "Squat":
      return calculateSquatRMToWeight(rm, reps);
    case "Bench":
      return calculateBenchRMToWeight(rm, reps);
    case "Deadlift":
      return calculateDeadliftRMToWeight(rm, reps);
    case "Pull Up":
      return calculatePullUpRMToWeight(rm, reps);
    case "Muscle Up":
      return calculateMuscleUpRMToWeight(rm, reps);
    case "Dips":
      return calculateDipsRMToWeight(rm, reps);
  }
}

/**
 * Main calculation function that routes to the appropriate calculator based on mode
 * Automatically handles bodyweight exercises by adding bodyweight to added weight
 *
 * @param input - Calculation parameters including exercise, mode, and required values
 * @returns Calculation result with value, description, and unit
 * @throws Error if required parameters are missing or invalid
 */
export function calculate(input: CalculationInput): CalculationResult {
  const { exercise, mode, addedWeight, reps, rm, bodyweight, unit } = input;

  const isBW = isBodyweightExercise(exercise);

  // Validate bodyweight for bodyweight exercises
  if (isBW && !bodyweight) {
    throw new Error(`Bodyweight is required for ${exercise}`);
  }

  // Calculate total weight (for bodyweight exercises, add bodyweight to added weight)
  const getTotalWeight = (added: number = 0): number => {
    return isBW ? (bodyweight || 0) + added : added;
  };

  // Validate inputs based on mode
  if (mode === "RepsToRM") {
    if (addedWeight === undefined || reps === undefined) {
      throw new Error("Added weight and reps are required");
    }
    if (isNaN(addedWeight) || isNaN(reps) || addedWeight < 0 || reps <= 0) {
      throw new Error("Invalid input values");
    }

    const totalWeight = getTotalWeight(addedWeight);
    const result = calculateRepsToRM(exercise, totalWeight, reps);

    // For bodyweight exercises, return the RM minus bodyweight (just the added weight component)
    const displayValue = isBW
      ? Math.max(0, result - (bodyweight || 0))
      : result;

    return {
      value: displayValue,
      description: "Your estimated 1RM",
      unit: unit,
    };
  }

  if (mode === "RMToReps") {
    if (rm === undefined || addedWeight === undefined) {
      throw new Error("RM and added weight are required");
    }
    if (isNaN(rm) || isNaN(addedWeight) || rm < 0 || addedWeight < 0) {
      throw new Error("Invalid input values");
    }

    // For bodyweight exercises, rm is the added weight at 1 rep, so total RM = rm + bodyweight
    const totalRM = getTotalWeight(rm);
    const totalWeight = getTotalWeight(addedWeight);

    if (totalWeight > totalRM) {
      throw new Error("Added weight cannot be greater than your 1RM");
    }

    const result = calculateRMToReps(exercise, totalRM, totalWeight);
    return {
      value: result,
      description: `Estimated reps`,
      unit: "reps",
    };
  }

  if (mode === "RMToWeight") {
    if (rm === undefined || reps === undefined) {
      throw new Error("RM and reps are required");
    }
    if (isNaN(rm) || isNaN(reps) || rm < 0 || reps <= 0) {
      throw new Error("Invalid input values");
    }

    // For bodyweight exercises, rm is the added weight at 1 rep
    const totalRM = getTotalWeight(rm);
    const result = calculateRMToWeight(exercise, totalRM, reps);

    // For bodyweight exercises, return just the added weight component
    const displayValue = isBW
      ? Math.max(0, result - (bodyweight || 0))
      : result;

    return {
      value: displayValue,
      description: `Estimated weight for ${reps} reps`,
      unit: unit,
    };
  }

  throw new Error(`Invalid calculation mode: ${mode}`);
}

/**
 * Validate calculation input without performing the calculation
 * Useful for form validation
 *
 * @param input - Calculation parameters to validate
 * @returns Object with isValid boolean and optional error message
 */
export function validateInput(input: CalculationInput): {
  isValid: boolean;
  error?: string;
} {
  const { exercise, mode, addedWeight, reps, rm, bodyweight } = input;

  const isBW = isBodyweightExercise(exercise);

  // Check bodyweight for bodyweight exercises
  if (isBW && (!bodyweight || bodyweight <= 0)) {
    return { isValid: false, error: "Bodyweight is required" };
  }

  if (mode === "RepsToRM") {
    if (addedWeight === undefined || reps === undefined) {
      return { isValid: false, error: "Added weight and reps are required" };
    }
    if (isNaN(addedWeight) || isNaN(reps) || addedWeight < 0 || reps <= 0) {
      return {
        isValid: false,
        error: "Invalid input values",
      };
    }
  }

  if (mode === "RMToReps") {
    if (rm === undefined || addedWeight === undefined) {
      return { isValid: false, error: "RM and added weight are required" };
    }
    if (isNaN(rm) || isNaN(addedWeight) || rm < 0 || addedWeight < 0) {
      return {
        isValid: false,
        error: "Invalid input values",
      };
    }
  }

  if (mode === "RMToWeight") {
    if (rm === undefined || reps === undefined) {
      return { isValid: false, error: "RM and reps are required" };
    }
    if (isNaN(rm) || isNaN(reps) || rm < 0 || reps <= 0) {
      return { isValid: false, error: "Invalid input values" };
    }
  }

  return { isValid: true };
}
