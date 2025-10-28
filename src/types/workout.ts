// Workout data types
export interface Exercise {
  id: string;
  name: string;
  popularity: number; // 0-10, for sorting exercises by popularity
  bw: number; // 0 = weighted exercise, 1 = bodyweight exercise
  category?: "strength" | "cardio" | "bodyweight"; // Optional for backward compatibility
  muscleGroups?: string[]; // Optional for backward compatibility
  isCustom?: boolean; // User-created exercise
  createdBy?: string; // User ID if custom
  isApproved?: boolean; // For admin approval of custom exercises
}

export interface Set {
  id: string;
  reps?: number;
  weight?: number; // in kg or lbs
  duration?: number; // for time-based exercises (seconds)
  distance?: number; // for cardio (km or miles)
  isBodyweight: boolean;
  restTime?: number; // seconds
  notes?: string;
}

export interface WorkoutExercise {
  id: string;
  exerciseId: string;
  exerciseName: string; // Cached for offline
  sets: Set[];
  notes?: string;
  order: number; // For exercise ordering
}

export interface CardioSession {
  id: string;
  type: "running" | "cycling" | "swimming" | "walking" | "other";
  duration: number; // minutes
  distance?: number; // km or miles
  intensity?: "low" | "medium" | "high";
  calories?: number;
  notes?: string;
}

export interface Workout {
  id: string;
  userId: string;
  title: string;
  date: string; // ISO date string
  exercises: WorkoutExercise[];
  cardioSessions: CardioSession[];
  duration?: number; // Total workout time in minutes
  notes?: string;
  createdAt: string;
  updatedAt: string;
  synced: boolean; // For offline sync tracking
  isDeleted?: boolean; // Soft delete
}

// For exercise suggestions and autocomplete
export interface ExerciseTemplate {
  id: string;
  name: string;
  category: string;
  popularSets?: {
    reps: number;
    weight?: number;
  }[];
  instructions?: string;
}

// Sync status tracking
export interface SyncStatus {
  workouts: {
    pending: string[]; // Workout IDs pending sync
    lastSync: string;
  };
  exercises: {
    lastSync: string;
  };
}
