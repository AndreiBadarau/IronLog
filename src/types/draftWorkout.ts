import { CardioSession, WorkoutExercise } from './workout';

// Draft workout that persists until saved
export interface DraftWorkout {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD format
  exercises: WorkoutExercise[];
  cardioSessions: CardioSession[];
  notes?: string;
  isDraft: true;
  createdAt: string;
  lastModified: string;
}

// For managing draft state
export interface DraftWorkoutState {
  currentDraft: DraftWorkout | null;
  hasUnsavedChanges: boolean;
}