import { WorkoutService } from "@/src/services/workoutService";
import { useCallback, useEffect, useState } from "react";
import { AppState, AppStateStatus } from "react-native";

interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncTime: string | null;
  pendingCount: {
    workouts: number;
    exercises: number;
  };
  syncErrors: string[];
  hasPendingSync: boolean;
}

interface UseSyncReturn extends SyncStatus {
  triggerSync: () => Promise<void>;
  clearSyncErrors: () => void;
}

export function useSync(workoutService: WorkoutService | null): UseSyncReturn {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: false,
    isSyncing: false,
    lastSyncTime: null,
    pendingCount: { workouts: 0, exercises: 0 },
    syncErrors: [],
    hasPendingSync: false,
  });

  // Load initial sync status
  const loadSyncStatus = useCallback(async () => {
    if (!workoutService) return;

    try {
      const [lastSyncTime, pendingCount] = await Promise.all([
        workoutService.getLastSyncTime(),
        workoutService.getPendingSyncCount(),
      ]);

      setSyncStatus((prev) => ({
        ...prev,
        lastSyncTime,
        pendingCount,
        hasPendingSync: pendingCount.workouts > 0 || pendingCount.exercises > 0,
      }));
    } catch (error) {
      console.error("Error loading sync status:", error);
    }
  }, [workoutService]);

  // Trigger manual sync
  const triggerSync = useCallback(async () => {
    if (!workoutService || syncStatus.isSyncing) return;

    setSyncStatus((prev) => ({ ...prev, isSyncing: true, syncErrors: [] }));

    try {
      const result = await workoutService.syncPendingData();

      // Reload sync status after sync
      await loadSyncStatus();

      setSyncStatus((prev) => ({
        ...prev,
        isSyncing: false,
        syncErrors: result.errors,
        lastSyncTime: new Date().toISOString(),
      }));
    } catch (error) {
      setSyncStatus((prev) => ({
        ...prev,
        isSyncing: false,
        syncErrors: [`Sync failed: ${error}`],
      }));
    }
  }, [workoutService, syncStatus.isSyncing, loadSyncStatus]);

  // Clear sync errors
  const clearSyncErrors = useCallback(() => {
    setSyncStatus((prev) => ({ ...prev, syncErrors: [] }));
  }, []);

  // Check network connectivity using multiple fallback methods
  const checkNetworkStatus = useCallback(async () => {
    try {
      // First try a simple connectivity test with multiple endpoints
      const testUrls = [
        "https://www.google.com/favicon.ico",
        "https://httpbin.org/status/200",
        "https://jsonplaceholder.typicode.com/posts/1",
      ];

      let isOnline = false;

      for (const url of testUrls) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 3000); // Shorter timeout

          const response = await fetch(url, {
            method: "HEAD",
            signal: controller.signal,
            cache: "no-cache", // Prevent caching issues on mobile
          });

          clearTimeout(timeoutId);

          if (response.ok) {
            isOnline = true;
            break; // Found working connection
          }
        } catch {
          // Try next URL
          continue;
        }
      }

      // If all direct tests fail, assume online (conservative approach for mobile)
      if (!isOnline) {
        console.log(
          "Direct network tests failed, assuming online for mobile compatibility"
        );
        isOnline = true;
      }

      setSyncStatus((prev) => {
        const wasOffline = !prev.isOnline;
        const isNowOnline = isOnline;

        // Auto-sync when network becomes available and there are pending items
        if (
          wasOffline &&
          isNowOnline &&
          prev.hasPendingSync &&
          !prev.isSyncing &&
          workoutService
        ) {
          setTimeout(() => triggerSync(), 1000);
        }

        return {
          ...prev,
          isOnline,
        };
      });
    } catch {
      // Network request failed, assume offline
      setSyncStatus((prev) => ({ ...prev, isOnline: false }));
    }
  }, [workoutService, triggerSync]);

  // Check network status periodically
  useEffect(() => {
    checkNetworkStatus(); // Initial check

    const interval = setInterval(checkNetworkStatus, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, [checkNetworkStatus]);

  // Handle app state changes for auto-sync
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (
        nextAppState === "active" &&
        syncStatus.isOnline &&
        syncStatus.hasPendingSync &&
        !syncStatus.isSyncing &&
        workoutService
      ) {
        // Auto-sync when app becomes active
        setTimeout(() => triggerSync(), 1000); // Small delay to allow UI to settle
      }
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );

    return () => subscription?.remove();
  }, [
    syncStatus.isOnline,
    syncStatus.hasPendingSync,
    syncStatus.isSyncing,
    workoutService,
    triggerSync,
  ]);

  // Load sync status on mount and when workoutService changes
  useEffect(() => {
    loadSyncStatus();
  }, [loadSyncStatus]);

  // Periodic sync status updates
  useEffect(() => {
    if (!workoutService) return;

    const interval = setInterval(() => {
      loadSyncStatus();
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [workoutService, loadSyncStatus]);

  return {
    ...syncStatus,
    triggerSync,
    clearSyncErrors,
  };
}
