import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface SyncSummaryProps {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncTime: string | null;
  pendingCount: {
    workouts: number;
    exercises: number;
  };
  syncErrors: string[];
  onSync: () => void;
  onClearErrors: () => void;
}

export default function SyncSummary({
  isOnline,
  isSyncing,
  lastSyncTime,
  pendingCount,
  syncErrors,
  onSync,
  onClearErrors,
}: SyncSummaryProps) {
  const formatLastSync = (lastSyncTime: string | null) => {
    if (!lastSyncTime) return "Never synced";

    const now = new Date();
    const syncDate = new Date(lastSyncTime);
    const diffMs = now.getTime() - syncDate.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const totalPending = pendingCount.workouts + pendingCount.exercises;
  const hasErrors = syncErrors.length > 0;

  return (
    <View style={styles.container}>
      {/* Connection Status */}
      <View style={styles.statusRow}>
        <View style={styles.statusLeft}>
          <Ionicons
            name={isOnline ? "wifi" : "wifi-outline"}
            size={16}
            color={isOnline ? "#4CAF50" : "#FF6B6B"}
          />
          <Text
            style={[
              styles.statusText,
              { color: isOnline ? "#4CAF50" : "#FF6B6B" },
            ]}
          >
            {isOnline ? "Online" : "Offline"}
          </Text>
        </View>

        <Text style={styles.lastSyncText}>{formatLastSync(lastSyncTime)}</Text>
      </View>

      {/* Pending Items */}
      {totalPending > 0 && (
        <View style={styles.pendingRow}>
          <View style={styles.pendingLeft}>
            <Ionicons name="cloud-upload-outline" size={14} color="#FFA500" />
            <Text style={styles.pendingText}>
              {totalPending} item{totalPending !== 1 ? "s" : ""} pending sync
            </Text>
          </View>
        </View>
      )}

      {/* Sync Errors */}
      {hasErrors && (
        <View style={styles.errorRow}>
          <View style={styles.errorLeft}>
            <Ionicons name="warning-outline" size={14} color="#FF6B6B" />
            <Text style={styles.errorText}>
              {syncErrors.length} sync error{syncErrors.length !== 1 ? "s" : ""}
            </Text>
          </View>
          <TouchableOpacity onPress={onClearErrors} style={styles.clearButton}>
            <Text style={styles.clearButtonText}>Clear</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Sync Button */}
      <TouchableOpacity
        style={[
          styles.syncButton,
          isSyncing && styles.syncButtonDisabled,
          !isOnline && styles.syncButtonOffline,
        ]}
        onPress={onSync}
        disabled={isSyncing || !isOnline}
      >
        <Ionicons
          name={isSyncing ? "hourglass-outline" : "refresh"}
          size={16}
          color={!isOnline ? "#666" : "#fff"}
        />
        <Text
          style={[
            styles.syncButtonText,
            !isOnline && styles.syncButtonTextOffline,
          ]}
        >
          {isSyncing ? "Syncing..." : "Sync Now"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "rgba(17, 17, 17, 0.7)",
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  statusLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: "600",
  },
  lastSyncText: {
    fontSize: 12,
    color: "#888",
  },
  pendingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  pendingLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  pendingText: {
    fontSize: 12,
    color: "#FFA500",
  },
  errorRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  errorLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  errorText: {
    fontSize: 12,
    color: "#FF6B6B",
  },
  clearButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: "rgba(255, 107, 107, 0.1)",
  },
  clearButtonText: {
    fontSize: 11,
    color: "#FF6B6B",
    fontWeight: "600",
  },
  syncButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#2EA0FF",
    paddingVertical: 10,
    borderRadius: 8,
  },
  syncButtonDisabled: {
    backgroundColor: "#555",
  },
  syncButtonOffline: {
    backgroundColor: "#333",
  },
  syncButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  syncButtonTextOffline: {
    color: "#666",
  },
});
