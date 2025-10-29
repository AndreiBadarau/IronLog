import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  enableNetwork,
  getDoc,
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
  LAST_SYNC_TIME: "last_sync_time",
};

// Sync rate limiting constants
const SYNC_COOLDOWN_HOURS = 18;
const SYNC_COOLDOWN_MS = SYNC_COOLDOWN_HOURS * 60 * 60 * 1000; // 18 hours in milliseconds

class WorkoutService {
  private userId: string;
  private isAnonymous: boolean;

  constructor(userId: string, isAnonymous: boolean = false) {
    this.userId = userId;
    this.isAnonymous = isAnonymous;
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

    // Only try to sync if user is not anonymous
    if (!this.isAnonymous) {
      try {
        await this.syncWorkoutToFirestore(newWorkout);
      } catch {
        console.log("Offline: Workout saved locally, will sync later");
        await this.addToPendingUploads(newWorkout.id);
      }
    } else {
      console.log("Anonymous user: Workout saved locally only, no sync");
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

    // Only try to sync if user is not anonymous
    if (!this.isAnonymous) {
      // Try to sync with retry mechanism
      let syncAttempts = 0;
      const maxAttempts = 3;

      while (syncAttempts < maxAttempts) {
        try {
          console.log(
            `🔄 Sync attempt ${
              syncAttempts + 1
            }/${maxAttempts} for workout: ${workoutId}`
          );
          await this.syncWorkoutToFirestore(updatedWorkout);
          console.log(
            `✅ Workout synced successfully on attempt ${syncAttempts + 1}`
          );
          return; // Success, exit function
        } catch (error) {
          syncAttempts++;
          console.log(`❌ Sync attempt ${syncAttempts} failed:`, error);

          if (syncAttempts < maxAttempts) {
            // Wait before retry (exponential backoff)
            const delay = Math.pow(2, syncAttempts - 1) * 1000; // 1s, 2s, 4s
            console.log(`⏳ Waiting ${delay}ms before retry...`);
            await new Promise((resolve) => setTimeout(resolve, delay));
          }
        }
      }

      // All attempts failed, add to pending
      console.log(
        `📋 All sync attempts failed, adding to pending uploads: ${workoutId}`
      );
      await this.addToPendingUploads(workoutId);
    } else {
      console.log("Anonymous user: Workout updated locally only, no sync");
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
    // Clean up pending uploads before getting workouts
    await this.cleanupPendingUploads();

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

  async diagnoseMobileConnectivity(): Promise<void> {
    console.log("🔍 Diagnosing mobile connectivity...");

    try {
      // Test 1: Basic fetch
      console.log("🌐 Testing basic HTTP connectivity...");
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch("https://httpbin.org/status/200", {
        method: "GET",
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      console.log("✅ Basic HTTP test:", response.ok ? "PASS" : "FAIL");
    } catch (error) {
      console.log("❌ Basic HTTP test: FAIL -", error);
    }

    try {
      // Test 2: Firebase connectivity
      console.log("🔥 Testing Firebase connectivity...");
      const testRef = doc(db, "connectivity-test", "mobile-test");
      await getDoc(testRef);
      console.log("✅ Firebase connectivity test: PASS");
    } catch (error) {
      console.log("❌ Firebase connectivity test: FAIL -", error);
    }

    try {
      // Test 3: Auth state
      console.log("🔐 Checking auth state...");
      console.log("User ID:", this.userId);
      console.log("✅ Auth state: PASS");
    } catch (error) {
      console.log("❌ Auth state test: FAIL -", error);
    }
  }

  // ================== SYNC RATE LIMITING ==================

  async canUserSync(isAnonymous: boolean): Promise<{
    canSync: boolean;
    reason?: string;
    nextSyncTime?: Date;
  }> {
    // Anonymous users cannot sync at all
    if (isAnonymous) {
      return {
        canSync: false,
        reason:
          "Anonymous users cannot sync workouts. Please create an account to enable sync.",
      };
    }

    // Check rate limiting for authenticated users
    const lastSyncTimeStr = await this.getLastSyncTime();
    if (lastSyncTimeStr) {
      const lastSyncTime = new Date(lastSyncTimeStr).getTime();
      const timeSinceLastSync = Date.now() - lastSyncTime;
      const timeRemaining = SYNC_COOLDOWN_MS - timeSinceLastSync;

      if (timeRemaining > 0) {
        const nextSyncTime = new Date(Date.now() + timeRemaining);
        const hoursRemaining = Math.ceil(timeRemaining / (1000 * 60 * 60));

        return {
          canSync: false,
          reason: `You can sync again in ${hoursRemaining} hour${
            hoursRemaining !== 1 ? "s" : ""
          }. This helps protect our servers from overuse.`,
          nextSyncTime,
        };
      }
    }

    return { canSync: true };
  }

  async syncWithPermissionCheck(): Promise<{
    success: boolean;
    syncedCount: number;
    errors: string[];
  }> {
    return this.syncPendingData();
  }

  async syncPendingData(options?: { forceSync?: boolean }): Promise<{
    success: boolean;
    syncedCount: number;
    errors: string[];
  }> {
    const result = { success: false, syncedCount: 0, errors: [] as string[] };
    const { forceSync = false } = options || {};

    try {
      console.log("🔄 Starting sync process...");

      // Check sync permissions unless forced (for internal operations)
      if (!forceSync) {
        const syncPermission = await this.canUserSync(this.isAnonymous);
        if (!syncPermission.canSync) {
          const error = syncPermission.reason || "Sync not allowed";
          console.log("🚫", error);
          result.errors.push(error);
          return result;
        }
        console.log("✅ Sync permission: GRANTED");
      }

      // Check network connectivity first
      const networkAvailable = await this.isNetworkAvailable();
      console.log("🌐 Network available:", networkAvailable);

      if (!networkAvailable) {
        const error = "No network connection available";
        console.log("❌", error);
        result.errors.push(error);
        return result;
      }

      console.log("🔗 Enabling Firebase network...");
      await enableNetwork(db);

      // Clean up pending uploads (remove deleted workouts)
      console.log("🧹 Cleaning up pending uploads...");
      await this.cleanupPendingUploads();

      // Sync pending workouts
      const pendingWorkouts = await this.getPendingUploads();
      console.log(
        `📋 Found ${pendingWorkouts.length} pending workouts to sync`
      );

      for (const workoutId of pendingWorkouts) {
        try {
          console.log(`🏋️ Syncing workout: ${workoutId}`);
          const workout = await this.getWorkoutById(workoutId);
          if (workout && !workout.isDeleted) {
            await this.syncWorkoutToFirestore(workout);
            await this.removePendingUpload(workoutId);
            result.syncedCount++;
            console.log(`✅ Successfully synced workout: ${workoutId}`);
          } else {
            // Remove invalid/deleted workout from pending list
            await this.removePendingUpload(workoutId);
            console.log(
              `🗑️ Removed invalid workout from pending: ${workoutId}`
            );
          }
        } catch (error) {
          const errorMsg = `Failed to sync workout ${workoutId}: ${error}`;
          console.error("❌", errorMsg);
          result.errors.push(errorMsg);
        }
      }

      // Sync pending exercises
      try {
        console.log("🏃 Syncing pending exercises...");
        await this.syncPendingExercises();
        console.log("✅ Exercises synced successfully");
      } catch (error) {
        const errorMsg = `Failed to sync exercises: ${error}`;
        console.error("❌", errorMsg);
        result.errors.push(errorMsg);
      }

      // Update last sync timestamp
      console.log("⏰ Updating last sync timestamp...");
      await this.updateLastSyncTime();

      result.success = result.errors.length === 0;
      console.log(
        `🎉 Sync completed! Success: ${result.success}, Synced: ${result.syncedCount}, Errors: ${result.errors.length}`
      );

      return result;
    } catch (error) {
      const errorMsg = `Sync failed: ${error}`;
      console.error("💥 Sync process failed:", errorMsg);
      result.errors.push(errorMsg);
      return result;
    }
  }

  async getPendingSyncCount(): Promise<{
    workouts: number;
    exercises: number;
  }> {
    try {
      const pendingWorkoutIds = await this.getPendingUploads();
      const pendingExercisesData = await AsyncStorage.getItem(
        "pending_exercise_uploads"
      );
      const pendingExercises = pendingExercisesData
        ? JSON.parse(pendingExercisesData)
        : [];

      // Filter out deleted workouts from pending count
      let activePendingWorkouts = 0;
      for (const workoutId of pendingWorkoutIds) {
        const workout = await this.getWorkoutById(workoutId);
        if (workout && !workout.isDeleted) {
          activePendingWorkouts++;
        }
      }

      return {
        workouts: activePendingWorkouts,
        exercises: pendingExercises.length,
      };
    } catch (error) {
      console.error("Error getting pending sync count:", error);
      return { workouts: 0, exercises: 0 };
    }
  }

  async getConflictedWorkouts(): Promise<Workout[]> {
    try {
      const workouts = await this.getWorkoutsLocally();
      // Return workouts that might have conflicts (not synced and have updatedAt different from createdAt)
      return workouts.filter(
        (w) => !w.synced && w.updatedAt !== w.createdAt && !w.isDeleted
      );
    } catch (error) {
      console.error("Error getting conflicted workouts:", error);
      return [];
    }
  }

  async forceResync(): Promise<void> {
    try {
      // Clear local sync markers to force a full resync
      const workouts = await this.getWorkoutsLocally();
      const modifiedWorkouts = workouts.map((w) => ({ ...w, synced: false }));
      await AsyncStorage.setItem(
        STORAGE_KEYS.WORKOUTS,
        JSON.stringify(modifiedWorkouts)
      );

      // Add all workouts to pending uploads
      for (const workout of modifiedWorkouts) {
        if (!workout.isDeleted) {
          await this.addToPendingUploads(workout.id);
        }
      }

      // Trigger sync (forced, bypass rate limiting)
      await this.syncPendingData({ forceSync: true });
    } catch (error) {
      console.error("Error forcing resync:", error);
      throw error;
    }
  }

  async getLastSyncTime(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem("last_sync_time");
    } catch (error) {
      console.error("Error getting last sync time:", error);
      return null;
    }
  }

  private async updateLastSyncTime(): Promise<void> {
    try {
      await AsyncStorage.setItem("last_sync_time", new Date().toISOString());
    } catch (error) {
      console.error("Error updating last sync time:", error);
    }
  }

  private async isNetworkAvailable(): Promise<boolean> {
    try {
      // Multiple approaches to check Firebase connectivity

      // Method 1: Try a simple HTTP request first
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);

        const response = await fetch("https://www.google.com/", {
          method: "HEAD",
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          return true;
        }
      } catch {
        // Continue to Firebase test
      }

      // Method 2: Try to access Firestore with shorter timeout
      const testRef = doc(db, "connectivity", "test");

      // Create a promise that will timeout after 5 seconds
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Firebase timeout")), 5000);
      });

      const firestorePromise = getDoc(testRef);

      await Promise.race([firestorePromise, timeoutPromise]);
      return true;
    } catch (error) {
      console.log("Network availability check failed:", error);
      return false;
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

  private cleanDataForFirestore(data: any): any {
    if (data === null || data === undefined) {
      return null;
    }

    if (Array.isArray(data)) {
      return data.map((item) => this.cleanDataForFirestore(item));
    }

    if (typeof data === "object") {
      const cleaned: any = {};
      for (const key in data) {
        if (data.hasOwnProperty(key)) {
          const value = data[key];
          cleaned[key] =
            value === undefined ? null : this.cleanDataForFirestore(value);
        }
      }
      return cleaned;
    }

    return data;
  }

  private async syncWorkoutToFirestore(workout: Workout): Promise<void> {
    try {
      console.log(`🔄 Syncing workout to Firestore: ${workout.id}`);

      // Validate required fields
      if (!workout.id || !workout.userId || !workout.title) {
        throw new Error(`Invalid workout data: missing required fields`);
      }

      const workoutRef = doc(db, "workouts", workout.id);

      // Ensure all required fields have valid values
      const rawWorkoutData = {
        ...workout,
        synced: true,
        // Ensure required fields are not undefined
        exercises: workout.exercises || [],
        cardioSessions: workout.cardioSessions || [],
        title: workout.title || "Untitled Workout",
        date: workout.date || new Date().toISOString(),
        createdAt: workout.createdAt || new Date().toISOString(),
        updatedAt: workout.updatedAt || new Date().toISOString(),
      };

      // Clean the workout data to replace undefined values with null
      const cleanedWorkoutData = this.cleanDataForFirestore(rawWorkoutData);

      console.log(`📤 Uploading cleaned workout data...`);
      console.log(`🧹 Cleaned data preview:`, {
        id: cleanedWorkoutData.id,
        title: cleanedWorkoutData.title,
        notes:
          cleanedWorkoutData.notes === null
            ? "null"
            : `"${cleanedWorkoutData.notes}"`,
        duration:
          cleanedWorkoutData.duration === null
            ? "null"
            : cleanedWorkoutData.duration,
        exercises: cleanedWorkoutData.exercises?.length || 0,
        cardioSessions: cleanedWorkoutData.cardioSessions?.length || 0,
        isDeleted:
          cleanedWorkoutData.isDeleted === null
            ? "null"
            : cleanedWorkoutData.isDeleted,
      });

      await setDoc(workoutRef, cleanedWorkoutData);
      console.log(`✅ Workout uploaded to Firestore successfully`);

      // Update local copy to mark as synced
      workout.synced = true;
      await this.saveWorkoutLocally(workout);
      console.log(`💾 Local workout marked as synced`);
    } catch (error) {
      console.error(`❌ Failed to sync workout to Firestore:`, error);

      // Provide more detailed error information
      if (error instanceof Error) {
        console.error(`Error details:`, {
          message: error.message,
          name: error.name,
          workoutId: workout.id,
          workoutTitle: workout.title,
        });
      }

      throw error;
    }
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

  private async cleanupPendingUploads(): Promise<void> {
    try {
      const pendingIds = await this.getPendingUploads();
      const validIds: string[] = [];

      // Only keep IDs of workouts that exist and are not deleted
      for (const workoutId of pendingIds) {
        const workout = await this.getWorkoutById(workoutId);
        if (workout && !workout.isDeleted) {
          validIds.push(workoutId);
        }
      }

      // Update the pending uploads list with only valid IDs
      await AsyncStorage.setItem(
        STORAGE_KEYS.PENDING_UPLOADS,
        JSON.stringify(validIds)
      );
    } catch (error) {
      console.error("Error cleaning up pending uploads:", error);
    }
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

    // Handle conflicts with proper merging strategy
    localWorkouts.forEach((localWorkout) => {
      const firestoreWorkout = merged.get(localWorkout.id);

      if (!firestoreWorkout) {
        // New local workout, keep it
        merged.set(localWorkout.id, localWorkout);
      } else if (!localWorkout.synced) {
        // Local changes exist, check for conflicts
        const resolvedWorkout = this.resolveWorkoutConflict(
          localWorkout,
          firestoreWorkout
        );
        merged.set(localWorkout.id, resolvedWorkout);
      }
      // If synced and exists remotely, remote version takes precedence (already in merged)
    });

    return Array.from(merged.values()).filter((w) => !w.isDeleted);
  }

  private resolveWorkoutConflict(
    localWorkout: Workout,
    remoteWorkout: Workout
  ): Workout {
    // Use the most recently updated version as base
    const localUpdated = new Date(localWorkout.updatedAt).getTime();
    const remoteUpdated = new Date(remoteWorkout.updatedAt).getTime();

    if (localUpdated > remoteUpdated) {
      // Local is newer, keep local changes but mark as needing sync
      return {
        ...localWorkout,
        synced: false,
      };
    } else if (remoteUpdated > localUpdated) {
      // Remote is newer, use remote version
      return {
        ...remoteWorkout,
        synced: true,
      };
    } else {
      // Same timestamp, merge intelligently
      return {
        ...remoteWorkout, // Use remote as base
        // Keep local title and notes if they were modified
        title:
          localWorkout.title !== remoteWorkout.title
            ? localWorkout.title
            : remoteWorkout.title,
        notes:
          localWorkout.notes !== remoteWorkout.notes
            ? localWorkout.notes
            : remoteWorkout.notes,
        // For exercises and cardio, prefer the version with more data
        exercises:
          localWorkout.exercises.length >= remoteWorkout.exercises.length
            ? localWorkout.exercises
            : remoteWorkout.exercises,
        cardioSessions:
          localWorkout.cardioSessions.length >=
          remoteWorkout.cardioSessions.length
            ? localWorkout.cardioSessions
            : remoteWorkout.cardioSessions,
        updatedAt: new Date().toISOString(),
        synced: false, // Mark as needing sync due to merge
      };
    }
  }

  private async addToPendingExerciseUploads(exercise: Exercise): Promise<void> {
    try {
      const pending = await AsyncStorage.getItem("pending_exercise_uploads");
      const pendingList = pending ? JSON.parse(pending) : [];

      // Check if exercise is already in pending list
      if (!pendingList.find((e: Exercise) => e.id === exercise.id)) {
        pendingList.push(exercise);
        await AsyncStorage.setItem(
          "pending_exercise_uploads",
          JSON.stringify(pendingList)
        );
      }
    } catch (error) {
      console.error("Error adding exercise to pending uploads:", error);
    }
  }

  private async syncPendingExercises(): Promise<void> {
    try {
      const pending = await AsyncStorage.getItem("pending_exercise_uploads");
      if (!pending) return;

      const pendingExercises: Exercise[] = JSON.parse(pending);
      const syncedExercises: Exercise[] = [];

      for (const exercise of pendingExercises) {
        try {
          // Save to user's custom exercises collection
          await addDoc(
            collection(db, "exercises", "users", this.userId),
            exercise
          );

          // Also add to admin review queue
          await addDoc(collection(db, "exercise_review_queue"), {
            ...exercise,
            submittedAt: new Date().toISOString(),
            userId: this.userId,
          });

          syncedExercises.push(exercise);
        } catch (error) {
          console.error(`Failed to sync exercise ${exercise.id}:`, error);
        }
      }

      // Remove synced exercises from pending list
      if (syncedExercises.length > 0) {
        const remainingPending = pendingExercises.filter(
          (e) => !syncedExercises.find((synced) => synced.id === e.id)
        );

        if (remainingPending.length === 0) {
          await AsyncStorage.removeItem("pending_exercise_uploads");
        } else {
          await AsyncStorage.setItem(
            "pending_exercise_uploads",
            JSON.stringify(remainingPending)
          );
        }
      }
    } catch (error) {
      console.error("Error syncing pending exercises:", error);
    }
  }
}

export { WorkoutService };
