import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  enableNetwork,
  getDocs,
  orderBy,
  query,
  setDoc,
  where,
} from "firebase/firestore";
import { db } from "../config/firebaseConfig";
import { Exercise, Workout } from "../types/workout";

// Storage keys
const STORAGE_KEYS = {
  WORKOUTS: "workouts_cache",
  EXERCISES: "exercises_cache",
  SYNC_STATUS: "sync_status",
  PENDING_UPLOADS: "pending_uploads",
};

class WorkoutService {
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  // ================== WORKOUT OPERATIONS ==================

  async createWorkout(
    workout: Omit<
      Workout,
      "id" | "userId" | "createdAt" | "updatedAt" | "synced"
    >
  ): Promise<Workout> {
    const newWorkout: Workout = {
      ...workout,
      id: `workout_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: this.userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      synced: false,
    };

    // Save locally first (offline-first)
    await this.saveWorkoutLocally(newWorkout);

    // Try to sync to Firestore
    try {
      await this.syncWorkoutToFirestore(newWorkout);
    } catch {
      console.log("Offline: Workout saved locally, will sync later");
      await this.addToPendingUploads(newWorkout.id);
    }

    return newWorkout;
  }

  async updateWorkout(
    workoutId: string,
    updates: Partial<Workout>
  ): Promise<void> {
    const workout = await this.getWorkoutById(workoutId);
    if (!workout) throw new Error("Workout not found");

    const updatedWorkout: Workout = {
      ...workout,
      ...updates,
      updatedAt: new Date().toISOString(),
      synced: false,
    };

    await this.saveWorkoutLocally(updatedWorkout);

    try {
      await this.syncWorkoutToFirestore(updatedWorkout);
    } catch {
      await this.addToPendingUploads(workoutId);
    }
  }

  async deleteWorkout(workoutId: string): Promise<void> {
    const workout = await this.getWorkoutById(workoutId);
    if (!workout) return;

    // Soft delete locally
    const deletedWorkout: Workout = {
      ...workout,
      isDeleted: true,
      updatedAt: new Date().toISOString(),
      synced: false,
    };

    await this.saveWorkoutLocally(deletedWorkout);

    try {
      await deleteDoc(doc(db, "workouts", workoutId));
      await this.removeWorkoutLocally(workoutId);
    } catch {
      await this.addToPendingUploads(workoutId);
    }
  }

  async getWorkouts(): Promise<Workout[]> {
    // Get from local storage first
    const localWorkouts = await this.getWorkoutsLocally();

    // Try to sync from Firestore if online
    try {
      await this.syncWorkoutsFromFirestore();
      return await this.getWorkoutsLocally(); // Return updated local data
    } catch {
      console.log("Offline: Using cached workouts");
      return localWorkouts.filter((w) => !w.isDeleted);
    }
  }

  async getWorkoutById(workoutId: string): Promise<Workout | null> {
    const workouts = await this.getWorkoutsLocally();
    return workouts.find((w) => w.id === workoutId && !w.isDeleted) || null;
  }

  // ================== EXERCISE OPERATIONS ==================

  async getExercises(): Promise<Exercise[]> {
    // Try to get from cache first
    const cachedExercises = await this.getExercisesLocally();

    try {
      // Load exercises from JSON file
      const jsonExercises = await this.loadExercisesFromJSON();
      // Fetch user's custom exercises
      const userExercises = await this.fetchUserExercises();

      const allExercises = [...jsonExercises, ...userExercises];
      await this.cacheExercises(allExercises);

      return allExercises;
    } catch (error) {
      console.log("Error loading exercises, using cached:", error);
      return cachedExercises;
    }
  }

  async createCustomExercise(
    exercise: Omit<Exercise, "id" | "isCustom" | "createdBy">
  ): Promise<Exercise> {
    const newExercise: Exercise = {
      ...exercise,
      id: `exercise_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      isCustom: true,
      createdBy: this.userId,
      isApproved: false, // Pending admin approval
    };

    try {
      // Save to user's custom exercises collection
      await addDoc(
        collection(db, "exercises", "users", this.userId),
        newExercise
      );

      // Also add to admin review queue
      await addDoc(collection(db, "exercise_review_queue"), {
        ...newExercise,
        submittedAt: new Date().toISOString(),
        userId: this.userId,
      });

      // Update local cache
      const exercises = await this.getExercisesLocally();
      exercises.push(newExercise);
      await this.cacheExercises(exercises);

      return newExercise;
    } catch {
      // If offline, save to pending uploads
      await this.addToPendingExerciseUploads(newExercise);
      return newExercise;
    }
  }

  // ================== SYNC OPERATIONS ==================

  async syncPendingData(): Promise<void> {
    try {
      await enableNetwork(db);

      // Sync pending workouts
      const pendingWorkouts = await this.getPendingUploads();
      for (const workoutId of pendingWorkouts) {
        const workout = await this.getWorkoutById(workoutId);
        if (workout) {
          await this.syncWorkoutToFirestore(workout);
          await this.removePendingUpload(workoutId);
        }
      }

      // Sync pending exercises
      await this.syncPendingExercises();

      console.log("Sync completed successfully");
    } catch (error) {
      console.error("Sync failed:", error);
    }
  }

  // ================== PRIVATE HELPER METHODS ==================

  private async loadExercisesFromJSON(): Promise<Exercise[]> {
    try {
      // Load exercises from the JSON file
      const exercisesData = require("../../assets/gym_exercises.json");

      // Transform JSON data to Exercise interface
      const exercises: Exercise[] = exercisesData.map(
        (exercise: any, index: number) => ({
          id: `exercise_${index}_${exercise.name
            .toLowerCase()
            .replace(/\s+/g, "_")}`,
          name: exercise.name,
          popularity: exercise.popularity,
          bw: exercise.bw,
          category: exercise.bw === 1 ? "bodyweight" : "strength",
          muscleGroups: this.inferMuscleGroups(exercise.name),
          isCustom: false,
        })
      );

      // Sort by popularity (highest first)
      return exercises.sort((a, b) => b.popularity - a.popularity);
    } catch (error) {
      console.error("Error loading exercises from JSON:", error);
      return [];
    }
  }

  private inferMuscleGroups(exerciseName: string): string[] {
    const name = exerciseName.toLowerCase();
    const muscleGroups: string[] = [];

    // Basic muscle group inference based on exercise name
    if (
      name.includes("squat") ||
      name.includes("lunge") ||
      name.includes("leg press")
    ) {
      muscleGroups.push("legs", "glutes");
    }
    if (
      name.includes("bench press") ||
      name.includes("push") ||
      name.includes("chest")
    ) {
      muscleGroups.push("chest", "triceps");
    }
    if (name.includes("pull") || name.includes("row") || name.includes("lat")) {
      muscleGroups.push("back", "biceps");
    }
    if (name.includes("deadlift") || name.includes("hip thrust")) {
      muscleGroups.push("back", "glutes", "hamstrings");
    }
    if (name.includes("curl") && name.includes("bicep")) {
      muscleGroups.push("biceps");
    }
    if (name.includes("tricep") || name.includes("skullcrusher")) {
      muscleGroups.push("triceps");
    }
    if (
      name.includes("shoulder") ||
      (name.includes("press") && !name.includes("bench"))
    ) {
      muscleGroups.push("shoulders");
    }
    if (name.includes("calf")) {
      muscleGroups.push("calves");
    }

    return muscleGroups.length > 0 ? muscleGroups : ["general"];
  }

  private async saveWorkoutLocally(workout: Workout): Promise<void> {
    const workouts = await this.getWorkoutsLocally();
    const existingIndex = workouts.findIndex((w) => w.id === workout.id);

    if (existingIndex >= 0) {
      workouts[existingIndex] = workout;
    } else {
      workouts.push(workout);
    }

    await AsyncStorage.setItem(STORAGE_KEYS.WORKOUTS, JSON.stringify(workouts));
  }

  private async getWorkoutsLocally(): Promise<Workout[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.WORKOUTS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error("Error getting local workouts:", error);
      return [];
    }
  }

  private async syncWorkoutToFirestore(workout: Workout): Promise<void> {
    const workoutRef = doc(db, "workouts", workout.id);
    await setDoc(workoutRef, {
      ...workout,
      synced: true,
    });

    // Update local copy to mark as synced
    workout.synced = true;
    await this.saveWorkoutLocally(workout);
  }

  private async syncWorkoutsFromFirestore(): Promise<void> {
    const q = query(
      collection(db, "workouts"),
      where("userId", "==", this.userId),
      orderBy("createdAt", "desc")
    );

    const querySnapshot = await getDocs(q);
    const firestoreWorkouts: Workout[] = [];

    querySnapshot.forEach((doc) => {
      firestoreWorkouts.push({ ...doc.data(), id: doc.id } as Workout);
    });

    // Merge with local workouts (keep local changes for unsynced items)
    const localWorkouts = await this.getWorkoutsLocally();
    const mergedWorkouts = this.mergeWorkouts(localWorkouts, firestoreWorkouts);

    await AsyncStorage.setItem(
      STORAGE_KEYS.WORKOUTS,
      JSON.stringify(mergedWorkouts)
    );
  }

  private async fetchGlobalExercises(): Promise<Exercise[]> {
    const querySnapshot = await getDocs(
      collection(db, "exercises", "global", "list")
    );
    const exercises: Exercise[] = [];

    querySnapshot.forEach((doc) => {
      exercises.push({ ...doc.data(), id: doc.id } as Exercise);
    });

    return exercises;
  }

  private async fetchUserExercises(): Promise<Exercise[]> {
    const querySnapshot = await getDocs(
      collection(db, "exercises", "users", this.userId)
    );
    const exercises: Exercise[] = [];

    querySnapshot.forEach((doc) => {
      exercises.push({ ...doc.data(), id: doc.id } as Exercise);
    });

    return exercises;
  }

  private async cacheExercises(exercises: Exercise[]): Promise<void> {
    await AsyncStorage.setItem(
      STORAGE_KEYS.EXERCISES,
      JSON.stringify(exercises)
    );
  }

  private async getExercisesLocally(): Promise<Exercise[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.EXERCISES);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private async addToPendingUploads(workoutId: string): Promise<void> {
    const pending = await this.getPendingUploads();
    if (!pending.includes(workoutId)) {
      pending.push(workoutId);
      await AsyncStorage.setItem(
        STORAGE_KEYS.PENDING_UPLOADS,
        JSON.stringify(pending)
      );
    }
  }

  private async getPendingUploads(): Promise<string[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.PENDING_UPLOADS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private async removePendingUpload(workoutId: string): Promise<void> {
    const pending = await this.getPendingUploads();
    const filtered = pending.filter((id) => id !== workoutId);
    await AsyncStorage.setItem(
      STORAGE_KEYS.PENDING_UPLOADS,
      JSON.stringify(filtered)
    );
  }

  private async removeWorkoutLocally(workoutId: string): Promise<void> {
    const workouts = await this.getWorkoutsLocally();
    const filtered = workouts.filter((w) => w.id !== workoutId);
    await AsyncStorage.setItem(STORAGE_KEYS.WORKOUTS, JSON.stringify(filtered));
  }

  private mergeWorkouts(
    localWorkouts: Workout[],
    firestoreWorkouts: Workout[]
  ): Workout[] {
    const merged = new Map<string, Workout>();

    // Add Firestore workouts first
    firestoreWorkouts.forEach((workout) => {
      merged.set(workout.id, workout);
    });

    // Overlay local changes (unsynced items take precedence)
    localWorkouts.forEach((workout) => {
      if (!workout.synced || !merged.has(workout.id)) {
        merged.set(workout.id, workout);
      }
    });

    return Array.from(merged.values());
  }

  private async addToPendingExerciseUploads(exercise: Exercise): Promise<void> {
    // Implementation for pending exercise uploads
    // Similar to workout pending uploads
  }

  private async syncPendingExercises(): Promise<void> {
    // Implementation for syncing pending exercises
  }
}

export { WorkoutService };
