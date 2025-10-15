import BackgroundWrapper from "@/src/components/BackgroundWrapper";
import DraftWorkoutBuilder from "@/src/components/DraftWorkoutBuilder";
import { useAuth } from "@/src/providers/AuthProvider";
import { WorkoutService } from "@/src/services/workoutService";
import { DraftWorkout } from "@/src/types/draftWorkout";
import { Workout } from "@/src/types/workout";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useHeaderHeight } from "@react-navigation/elements";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";

export default function WorkoutsScreen() {
  const headerHeight = useHeaderHeight();
  const { user } = useAuth();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [showActiveWorkout, setShowActiveWorkout] = useState(false);
  const [existingDraft, setExistingDraft] = useState<DraftWorkout | null>(null);

  const workoutService = useMemo(() => 
    user ? new WorkoutService(user.uid) : null, 
    [user]
  );

  const loadWorkouts = useCallback(async () => {
    if (!workoutService) return;
    
    try {
      setLoading(true);
      const userWorkouts = await workoutService.getWorkouts();
      // Sort by date (newest first)
      const sortedWorkouts = userWorkouts.sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      setWorkouts(sortedWorkouts);
      
      // Check for existing draft
      const draftData = await AsyncStorage.getItem('current_draft_workout');
      if (draftData) {
        setExistingDraft(JSON.parse(draftData));
      } else {
        setExistingDraft(null);
      }
    } catch (error) {
      console.error('Error loading workouts:', error);
      Alert.alert('Error', 'Failed to load workouts');
    } finally {
      setLoading(false);
    }
  }, [workoutService]);

  useFocusEffect(
    useCallback(() => {
      loadWorkouts();
    }, [loadWorkouts])
  );

  const handleNewWorkout = () => {
    setShowActiveWorkout(true);
  };

  const handleDeleteWorkout = (workoutId: string) => {
    Alert.alert(
      'Delete Workout',
      'Are you sure you want to delete this workout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await workoutService?.deleteWorkout(workoutId);
              await loadWorkouts(); // Refresh the list
            } catch {
              Alert.alert('Error', 'Failed to delete workout');
            }
          }
        }
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const getWorkoutSummary = (workout: Workout) => {
    const exerciseCount = workout.exercises.length;
    const totalSets = workout.exercises.reduce((sum, ex) => sum + ex.sets.length, 0);
    const cardioCount = workout.cardioSessions.length;
    
    let summary = `${exerciseCount} exercise${exerciseCount !== 1 ? 's' : ''}`;
    if (totalSets > 0) summary += ` • ${totalSets} sets`;
    if (cardioCount > 0) summary += ` • ${cardioCount} cardio`;
    
    return summary;
  };

  const renderWorkoutItem = ({ item: workout }: { item: Workout }) => (
    <TouchableOpacity 
      style={styles.workoutCard}
      onPress={() => {
        // TODO: Navigate to workout detail/edit screen
        console.log('Open workout:', workout.id);
      }}
    >
      <View style={styles.workoutHeader}>
        <View style={styles.workoutTitleContainer}>
          <Text style={styles.workoutTitle}>{workout.title}</Text>
          <Text style={styles.workoutDate}>{formatDate(workout.date)}</Text>
        </View>
        
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteWorkout(workout.id)}
        >
          <Ionicons name="trash-outline" size={20} color="#FF6B6B" />
        </TouchableOpacity>
      </View>
      
      <Text style={styles.workoutSummary}>{getWorkoutSummary(workout)}</Text>
      
      {workout.duration && (
        <Text style={styles.workoutDuration}>
          <Ionicons name="time-outline" size={14} color="#888" /> {workout.duration} min
        </Text>
      )}
      
      {!workout.synced && (
        <View style={styles.syncStatus}>
          <Ionicons name="cloud-offline-outline" size={14} color="#FFA500" />
          <Text style={styles.syncText}>Pending sync</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.titleContainer}>
        <Text style={styles.screenTitle}>Your Workouts</Text>
        {existingDraft && (
          <View style={styles.draftIndicator}>
            <Ionicons name="document-text" size={16} color="#FF6B35" />
            <Text style={styles.draftIndicatorText}>Draft Available</Text>
          </View>
        )}
      </View>
      
      <View style={styles.buttonContainer}>
        {existingDraft && (
          <TouchableOpacity 
            style={[styles.newWorkoutButton, styles.draftButton]}
            onPress={handleNewWorkout}
          >
            <Ionicons name="play" size={20} color="#fff" />
            <Text style={styles.newWorkoutText}>Continue Draft</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity 
          style={styles.newWorkoutButton}
          onPress={() => {
            setExistingDraft(null);
            setShowActiveWorkout(true);
          }}
        >
          <Ionicons name="add" size={24} color="#fff" />
          <Text style={styles.newWorkoutText}>
            {existingDraft ? 'New Workout' : 'Start Workout'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="barbell-outline" size={64} color="#444" />
      <Text style={styles.emptyTitle}>No workouts yet</Text>
      <Text style={styles.emptySubtitle}>
        Start your fitness journey by logging your first workout
      </Text>
    </View>
  );

  const renderLoadingState = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#2EA0FF" />
      <Text style={styles.loadingText}>Loading workouts...</Text>
    </View>
  );

  return (
    <BackgroundWrapper>
      <View style={[styles.container, { paddingTop: headerHeight - 25 }]}>
        {loading ? (
          renderLoadingState()
        ) : (
          <FlatList
            data={workouts}
            keyExtractor={(item) => item.id}
            renderItem={renderWorkoutItem}
            ListHeaderComponent={renderHeader}
            ListEmptyComponent={renderEmptyState}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
            style={styles.flatList}
          />
        )}
      </View>

      {/* Draft Workout Builder */}
      {showActiveWorkout && workoutService && (
        <DraftWorkoutBuilder
          visible={showActiveWorkout}
          onClose={() => setShowActiveWorkout(false)}
          onWorkoutSaved={async () => {
            setShowActiveWorkout(false);
            await loadWorkouts();
          }}
          workoutService={workoutService}
          existingDraft={existingDraft}
        />
      )}
    </BackgroundWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingBottom: 16,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  newWorkoutButton: {
    backgroundColor: "#2EA0FF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
    shadowColor: "#2EA0FF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  newWorkoutText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  workoutCard: {
    backgroundColor: "rgba(17, 17, 17, 0.85)",
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  workoutHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  workoutTitleContainer: {
    flex: 1,
  },
  workoutTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 4,
  },
  workoutDate: {
    fontSize: 14,
    color: "#2EA0FF",
    fontWeight: "500",
  },
  deleteButton: {
    padding: 8,
    marginLeft: 12,
  },
  workoutSummary: {
    fontSize: 14,
    color: "#ccc",
    marginBottom: 8,
  },
  workoutDuration: {
    fontSize: 12,
    color: "#888",
    marginBottom: 8,
  },
  syncStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  syncText: {
    fontSize: 12,
    color: "#FFA500",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  loadingText: {
    color: "#888",
    fontSize: 16,
    marginTop: 12,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
    marginTop: 60,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "600",
    color: "#fff",
    marginTop: 20,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: "#888",
    textAlign: "center",
    lineHeight: 22,
  },
  flatList: {
    flex: 1,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  draftButton: {
    backgroundColor: "#FF6B35",
    paddingVertical: 12,
    paddingHorizontal: 16,
    shadowColor: "#FF6B35",
  },
  titleContainer: {
    flex: 1,
    marginRight: 15,
  },
  draftIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  draftIndicatorText: {
    color: '#FF6B35',
    fontSize: 14,
    fontWeight: '600',
  },
});
