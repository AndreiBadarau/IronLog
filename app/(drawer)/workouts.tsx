import BackgroundWrapper from "@/src/components/BackgroundWrapper";
import ConfirmDialog from "@/src/components/ConfirmDialog";
import DraftWorkoutBuilder from "@/src/components/DraftWorkoutBuilder";
import { useAuth } from "@/src/providers/AuthProvider";
import { WorkoutService } from "@/src/services/workoutService";
import { DraftWorkout } from "@/src/types/draftWorkout";
import { Workout } from "@/src/types/workout";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useHeaderHeight } from "@react-navigation/elements";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function WorkoutsScreen() {
  const headerHeight = useHeaderHeight();
  const { user } = useAuth();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showActiveWorkout, setShowActiveWorkout] = useState(false);
  const [existingDraft, setExistingDraft] = useState<DraftWorkout | null>(null);
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);
  const [showWorkoutDetail, setShowWorkoutDetail] = useState(false);
  const [isEditingWorkout, setIsEditingWorkout] = useState(false);

  // Confirm dialog state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [workoutToDelete, setWorkoutToDelete] = useState<string | null>(null);

  const workoutService = useMemo(
    () => (user ? new WorkoutService(user.uid) : null),
    [user]
  );

  const loadWorkouts = useCallback(async () => {
    if (!workoutService) return;

    try {
      setLoading(true);
      const userWorkouts = await workoutService.getWorkouts();
      // Sort by date (newest first)
      const sortedWorkouts = userWorkouts.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      setWorkouts(sortedWorkouts);

      // Check for existing draft
      const draftData = await AsyncStorage.getItem("current_draft_workout");
      if (draftData) {
        setExistingDraft(JSON.parse(draftData));
      } else {
        setExistingDraft(null);
      }
    } catch (error) {
      console.error("Error loading workouts:", error);
      Alert.alert("Error", "Failed to load workouts");
    } finally {
      setLoading(false);
    }
  }, [workoutService]);

  useFocusEffect(
    useCallback(() => {
      loadWorkouts();
    }, [loadWorkouts])
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadWorkouts();
    setRefreshing(false);
  }, [loadWorkouts]);

  const updateDraftStatus = useCallback(async () => {
    const draftData = await AsyncStorage.getItem("current_draft_workout");
    if (draftData) {
      setExistingDraft(JSON.parse(draftData));
    } else {
      setExistingDraft(null);
    }
  }, []);

  const handleNewWorkout = () => {
    setShowActiveWorkout(true);
  };

  const handleDeleteWorkout = (workoutId: string) => {
    setWorkoutToDelete(workoutId);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteWorkout = async () => {
    if (!workoutToDelete) return;

    try {
      await workoutService?.deleteWorkout(workoutToDelete);
      await loadWorkouts(); // Refresh the list
    } catch {
      // For now, we'll keep this as Alert since it's just an error message
      Alert.alert("Error", "Failed to delete workout");
    } finally {
      setShowDeleteConfirm(false);
      setWorkoutToDelete(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const getWorkoutSummary = (workout: Workout) => {
    const exerciseCount = workout.exercises?.length || 0;
    const totalSets = (workout.exercises || []).reduce(
      (sum, ex) => sum + (ex.sets?.length || 0),
      0
    );
    const cardioCount = workout.cardioSessions?.length || 0;

    let summary = `${exerciseCount} exercise${exerciseCount !== 1 ? "s" : ""}`;
    if (totalSets > 0) summary += ` • ${totalSets} sets`;
    if (cardioCount > 0) summary += ` • ${cardioCount} cardio`;

    return summary;
  };

  const renderWorkoutItem = ({ item: workout }: { item: Workout }) => (
    <TouchableOpacity
      style={styles.workoutCard}
      onPress={() => {
        setSelectedWorkout(workout);
        setIsEditingWorkout(false);
        setShowWorkoutDetail(true);
      }}
    >
      <View style={styles.workoutHeader}>
        <View style={styles.workoutTitleContainer}>
          <Text style={styles.workoutTitle}>
            {workout.title || "Untitled Workout"}
          </Text>
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

      {/* {workout.duration && workout.duration > 0 && (
        <Text style={styles.workoutDuration}>
          <Ionicons name="time-outline" size={14} color="#888" />{" "}
          {workout.duration} min
        </Text>
      )} */}

      {(workout.duration ?? 0) > 0 && (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 8,
          }}
        >
          <Ionicons name="time-outline" size={14} color="#888" />
          <Text style={[styles.workoutDuration, { marginLeft: 6 }]}>
            {workout.duration} min
          </Text>
        </View>
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
      {/* <View style={styles.titleContainer}>
        <Text style={styles.screenTitle}>Your Workouts</Text>
      </View> */}

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
            {existingDraft ? "New Workout" : "Start Workout"}
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
            keyExtractor={(item) => item.id || `workout-${Math.random()}`}
            renderItem={renderWorkoutItem}
            ListHeaderComponent={renderHeader}
            ListEmptyComponent={renderEmptyState}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
            style={styles.flatList}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor="#2EA0FF"
                colors={["#2EA0FF"]}
              />
            }
          />
        )}
      </View>

      {/* Draft Workout Builder */}
      {showActiveWorkout && workoutService && (
        <DraftWorkoutBuilder
          visible={showActiveWorkout}
          onClose={async () => {
            setShowActiveWorkout(false);
            // Always refresh draft status when closing
            await updateDraftStatus();
          }}
          onWorkoutSaved={async () => {
            setShowActiveWorkout(false);
            await loadWorkouts();
          }}
          onDraftUpdated={updateDraftStatus}
          workoutService={workoutService}
          existingDraft={existingDraft}
        />
      )}

      {/* Workout Detail Modal */}
      {showWorkoutDetail && selectedWorkout && workoutService && (
        <WorkoutDetailModal
          visible={showWorkoutDetail}
          workout={selectedWorkout}
          isEditing={isEditingWorkout}
          workoutService={workoutService}
          onClose={() => {
            setShowWorkoutDetail(false);
            setSelectedWorkout(null);
            setIsEditingWorkout(false);
          }}
          onEdit={() => setIsEditingWorkout(true)}
          onSave={async (updatedWorkout) => {
            try {
              await workoutService.updateWorkout(
                selectedWorkout.id,
                updatedWorkout
              );
              await loadWorkouts();
              setIsEditingWorkout(false);
              setShowWorkoutDetail(false);
              setSelectedWorkout(null);
            } catch (error) {
              console.error("Error updating workout:", error);
              Alert.alert("Error", "Failed to update workout");
            }
          }}
          onDelete={async () => {
            await handleDeleteWorkout(selectedWorkout.id);
            setShowWorkoutDetail(false);
            setSelectedWorkout(null);
          }}
        />
      )}

      {/* Delete Workout Confirmation */}
      <ConfirmDialog
        visible={showDeleteConfirm}
        title="Delete Workout"
        message="Are you sure you want to delete this workout? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDeleteWorkout}
        onCancel={() => {
          setShowDeleteConfirm(false);
          setWorkoutToDelete(null);
        }}
      />
    </BackgroundWrapper>
  );
}

// Workout Detail Modal Component
interface WorkoutDetailModalProps {
  visible: boolean;
  workout: Workout;
  isEditing: boolean;
  workoutService: WorkoutService;
  onClose: () => void;
  onEdit: () => void;
  onSave: (updatedWorkout: Partial<Workout>) => void;
  onDelete: () => void;
}

function WorkoutDetailModal({
  visible,
  workout,
  isEditing,
  onClose,
  onEdit,
  onSave,
  onDelete,
}: WorkoutDetailModalProps) {
  const insets = useSafeAreaInsets();
  const [editedTitle, setEditedTitle] = useState(workout.title || "");
  const [editedNotes, setEditedNotes] = useState(workout.notes || "");
  const [editedExercises, setEditedExercises] = useState(
    workout.exercises || []
  );
  const [editedCardioSessions, setEditedCardioSessions] = useState(
    workout.cardioSessions || []
  );

  // Confirm dialog state for this modal
  const [showRemoveExerciseConfirm, setShowRemoveExerciseConfirm] =
    useState(false);
  const [exerciseToRemove, setExerciseToRemove] = useState<string | null>(null);
  const [showRemoveCardioConfirm, setShowRemoveCardioConfirm] = useState(false);
  const [cardioToRemove, setCardioToRemove] = useState<string | null>(null);

  // Reset edit values when workout changes
  useEffect(() => {
    setEditedTitle(workout.title || "");
    setEditedNotes(workout.notes || "");
    setEditedExercises(workout.exercises || []);
    setEditedCardioSessions(workout.cardioSessions || []);
  }, [
    workout.id,
    workout.title,
    workout.notes,
    workout.exercises,
    workout.cardioSessions,
  ]);

  const formatDate = (dateString: string) => {
    if (!dateString) return "Unknown date";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Invalid date";
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatExerciseDetails = (exercise: any) => {
    const sets = exercise?.sets || [];
    if (sets.length === 0) return "No sets recorded";

    return (
      sets
        .map((set: any, index: number) => {
          if (set?.isBodyweight) {
            return `Set ${index + 1}: ${set?.reps || 0} reps (bodyweight)`;
          } else {
            return `Set ${index + 1}: ${set?.reps || 0} reps × ${
              set?.weight || 0
            } lbs`;
          }
        })
        .join("\n") || "No sets recorded"
    );
  };

  const formatCardioDetails = (session: any) => {
    let details = `${session?.type || "Unknown"} - ${
      session?.duration || 0
    } min`;
    if (session?.distance) {
      details += ` - ${session.distance} km`;
    }
    return details || "No details available";
  };

  // Helper functions for editing exercises
  // const updateExercise = (exerciseId: string, updates: any) => {
  //   setEditedExercises((prev) =>
  //     prev.map((ex) => (ex.id === exerciseId ? { ...ex, ...updates } : ex))
  //   );
  // };

  const removeExercise = (exerciseId: string) => {
    setExerciseToRemove(exerciseId);
    setShowRemoveExerciseConfirm(true);
  };

  const confirmRemoveExercise = () => {
    if (!exerciseToRemove) return;

    setEditedExercises((prev) =>
      prev.filter((ex) => ex.id !== exerciseToRemove)
    );

    setShowRemoveExerciseConfirm(false);
    setExerciseToRemove(null);
  };

  const updateSet = (exerciseId: string, setId: string, updates: any) => {
    setEditedExercises((prev) =>
      prev.map((ex) => {
        if (ex.id === exerciseId) {
          return {
            ...ex,
            sets:
              ex.sets?.map((set) =>
                set.id === setId ? { ...set, ...updates } : set
              ) || [],
          };
        }
        return ex;
      })
    );
  };

  const addSet = (exerciseId: string) => {
    const newSet = {
      id: `set_${Date.now()}`,
      reps: 10,
      weight: 20,
      isBodyweight: false,
    };

    setEditedExercises((prev) =>
      prev.map((ex) => {
        if (ex.id === exerciseId) {
          return {
            ...ex,
            sets: [...(ex.sets || []), newSet],
          };
        }
        return ex;
      })
    );
  };

  const removeSet = (exerciseId: string, setId: string) => {
    setEditedExercises((prev) =>
      prev.map((ex) => {
        if (ex.id === exerciseId) {
          return {
            ...ex,
            sets: ex.sets?.filter((set) => set.id !== setId) || [],
          };
        }
        return ex;
      })
    );
  };

  // Helper functions for editing cardio sessions
  const updateCardioSession = (sessionId: string, updates: any) => {
    setEditedCardioSessions((prev) =>
      prev.map((session) =>
        session.id === sessionId ? { ...session, ...updates } : session
      )
    );
  };

  const removeCardioSession = (sessionId: string) => {
    setCardioToRemove(sessionId);
    setShowRemoveCardioConfirm(true);
  };

  const confirmRemoveCardio = () => {
    if (!cardioToRemove) return;

    setEditedCardioSessions((prev) =>
      prev.filter((session) => session.id !== cardioToRemove)
    );

    setShowRemoveCardioConfirm(false);
    setCardioToRemove(null);
  };

  const handleSave = () => {
    onSave({
      title: editedTitle,
      notes: editedNotes,
      exercises: editedExercises,
      cardioSessions: editedCardioSessions,
    });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        {/* Header */}
        <View style={[styles.modalHeader, { paddingTop: insets.top + 16 }]}>
          <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>

          <Text style={styles.modalTitle}>Workout Details</Text>

          <View style={styles.modalActions}>
            {!isEditing ? (
              <>
                <TouchableOpacity onPress={onEdit} style={styles.editButton}>
                  <Ionicons name="create-outline" size={20} color="#2EA0FF" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={onDelete}
                  style={styles.modalDeleteButton}
                >
                  <Ionicons name="trash-outline" size={20} color="#FF6B6B" />
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <ScrollView style={styles.modalContent}>
          {/* Workout Title */}
          <View style={styles.detailSection}>
            <Text style={styles.sectionLabel}>Title</Text>
            {isEditing ? (
              <TextInput
                style={styles.editInput}
                value={editedTitle}
                onChangeText={setEditedTitle}
                placeholder="Enter workout title"
                placeholderTextColor="#888"
              />
            ) : (
              <Text style={styles.sectionValue}>
                {workout.title || "Untitled Workout"}
              </Text>
            )}
          </View>

          {/* Date */}
          <View style={styles.detailSection}>
            <Text style={styles.sectionLabel}>Date</Text>
            <Text style={styles.sectionValue}>
              {formatDate(workout.date || "")}
            </Text>
          </View>

          {/* Duration */}
          {(workout.duration ?? 0) > 0 && (
            <View style={styles.detailSection}>
              <Text style={styles.sectionLabel}>Duration</Text>
              <Text style={styles.sectionValue}>
                {workout.duration || 0} minutes
              </Text>
            </View>
          )}

          {/* Exercises */}
          {(isEditing ? editedExercises : workout.exercises) &&
            (isEditing ? editedExercises : workout.exercises).length > 0 && (
              <View style={styles.detailSection}>
                <Text style={styles.sectionLabel}>
                  Exercises (
                  {(isEditing ? editedExercises : workout.exercises)?.length ||
                    0}
                  )
                </Text>
                {((isEditing ? editedExercises : workout.exercises) || []).map(
                  (exercise, index) => (
                    <View
                      key={exercise?.id || `exercise-${index}`}
                      style={styles.exerciseDetail}
                    >
                      <View style={styles.exerciseDetailHeader}>
                        <Text style={styles.exerciseName}>
                          {exercise?.exerciseName || "Unknown Exercise"}
                        </Text>
                        {isEditing && (
                          <TouchableOpacity
                            onPress={() => removeExercise(exercise.id)}
                            style={styles.removeExerciseButton}
                          >
                            <Ionicons
                              name="trash-outline"
                              size={16}
                              color="#FF6B6B"
                            />
                          </TouchableOpacity>
                        )}
                      </View>

                      {isEditing ? (
                        <View style={styles.editingSetsContainer}>
                          {(exercise.sets || []).map((set, setIndex) => (
                            <View
                              key={set.id || `set-${setIndex}`}
                              style={styles.editingSetRow}
                            >
                              <Text style={styles.setNumber}>
                                {setIndex + 1}
                              </Text>

                              <TextInput
                                style={styles.setEditInput}
                                value={set.reps?.toString() || ""}
                                onChangeText={(text) =>
                                  updateSet(exercise.id, set.id, {
                                    reps: parseInt(text) || 0,
                                  })
                                }
                                placeholder="Reps"
                                placeholderTextColor="#888"
                                keyboardType="numeric"
                              />

                              <TouchableOpacity
                                style={[
                                  styles.bodyweightToggleSmall,
                                  set.isBodyweight &&
                                    styles.bodyweightActiveSmall,
                                ]}
                                onPress={() =>
                                  updateSet(exercise.id, set.id, {
                                    isBodyweight: !set.isBodyweight,
                                  })
                                }
                              >
                                <Text
                                  style={[
                                    styles.bodyweightTextSmall,
                                    set.isBodyweight &&
                                      styles.bodyweightTextActiveSmall,
                                  ]}
                                >
                                  BW
                                </Text>
                              </TouchableOpacity>

                              {!set.isBodyweight && (
                                <TextInput
                                  style={styles.setEditInput}
                                  value={set.weight?.toString() || ""}
                                  onChangeText={(text) =>
                                    updateSet(exercise.id, set.id, {
                                      weight: parseFloat(text) || 0,
                                    })
                                  }
                                  placeholder="Weight"
                                  placeholderTextColor="#888"
                                  keyboardType="numeric"
                                />
                              )}

                              <TouchableOpacity
                                onPress={() => removeSet(exercise.id, set.id)}
                                style={styles.removeSetButtonSmall}
                              >
                                <Ionicons
                                  name="close"
                                  size={12}
                                  color="#FF6B6B"
                                />
                              </TouchableOpacity>
                            </View>
                          ))}

                          <TouchableOpacity
                            onPress={() => addSet(exercise.id)}
                            style={styles.addSetButtonSmall}
                          >
                            <Ionicons name="add" size={14} color="#2EA0FF" />
                            <Text style={styles.addSetTextSmall}>Add Set</Text>
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <Text style={styles.exerciseSets}>
                          {formatExerciseDetails(exercise) ||
                            "No sets recorded"}
                        </Text>
                      )}
                    </View>
                  )
                )}
              </View>
            )}

          {/* Cardio Sessions */}
          {(isEditing ? editedCardioSessions : workout.cardioSessions) &&
            (isEditing ? editedCardioSessions : workout.cardioSessions).length >
              0 && (
              <View style={styles.detailSection}>
                <Text style={styles.sectionLabel}>
                  Cardio Sessions (
                  {(isEditing ? editedCardioSessions : workout.cardioSessions)
                    ?.length || 0}
                  )
                </Text>
                {(
                  (isEditing ? editedCardioSessions : workout.cardioSessions) ||
                  []
                ).map((session, index) => (
                  <View
                    key={session?.id || `cardio-${index}`}
                    style={styles.cardioDetail}
                  >
                    {isEditing ? (
                      <View style={styles.cardioEditContainer}>
                        <View style={styles.cardioEditHeader}>
                          <View style={styles.cardioEditRow}>
                            <Text style={styles.cardioEditLabel}>Type:</Text>
                            <TextInput
                              style={styles.cardioEditInput}
                              value={session?.type || ""}
                              onChangeText={(text) =>
                                updateCardioSession(session.id, { type: text })
                              }
                              placeholder="Cardio type"
                              placeholderTextColor="#888"
                            />
                          </View>
                          <TouchableOpacity
                            onPress={() => removeCardioSession(session.id)}
                            style={styles.removeCardioButton}
                          >
                            <Ionicons
                              name="trash-outline"
                              size={16}
                              color="#FF6B6B"
                            />
                          </TouchableOpacity>
                        </View>

                        <View style={styles.cardioEditRow}>
                          <Text style={styles.cardioEditLabel}>
                            Duration (min):
                          </Text>
                          <TextInput
                            style={styles.cardioEditInput}
                            value={session?.duration?.toString() || ""}
                            onChangeText={(text) =>
                              updateCardioSession(session.id, {
                                duration: parseInt(text) || 0,
                              })
                            }
                            placeholder="Minutes"
                            placeholderTextColor="#888"
                            keyboardType="numeric"
                          />
                        </View>

                        {session?.distance !== undefined && (
                          <View style={styles.cardioEditRow}>
                            <Text style={styles.cardioEditLabel}>
                              Distance (km):
                            </Text>
                            <TextInput
                              style={styles.cardioEditInput}
                              value={session.distance?.toString() || ""}
                              onChangeText={(text) =>
                                updateCardioSession(session.id, {
                                  distance: parseFloat(text) || 0,
                                })
                              }
                              placeholder="Distance"
                              placeholderTextColor="#888"
                              keyboardType="numeric"
                            />
                          </View>
                        )}
                      </View>
                    ) : (
                      <Text style={styles.cardioInfo}>
                        {formatCardioDetails(session) || "No details available"}
                      </Text>
                    )}
                  </View>
                ))}
              </View>
            )}

          {/* Notes */}
          <View style={styles.detailSection}>
            <Text style={styles.sectionLabel}>Notes</Text>
            {isEditing ? (
              <TextInput
                style={[styles.editInput, styles.notesInput]}
                value={editedNotes}
                onChangeText={setEditedNotes}
                placeholder="Add workout notes..."
                placeholderTextColor="#888"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            ) : (
              <Text style={styles.sectionValue}>
                {workout.notes || "No notes added"}
              </Text>
            )}
          </View>
        </ScrollView>

        {/* Remove Exercise Confirmation */}
        <ConfirmDialog
          visible={showRemoveExerciseConfirm}
          title="Remove Exercise"
          message="Are you sure you want to remove this exercise? This action cannot be undone."
          confirmText="Remove"
          cancelText="Cancel"
          onConfirm={confirmRemoveExercise}
          onCancel={() => {
            setShowRemoveExerciseConfirm(false);
            setExerciseToRemove(null);
          }}
        />

        {/* Remove Cardio Session Confirmation */}
        <ConfirmDialog
          visible={showRemoveCardioConfirm}
          title="Remove Cardio Session"
          message="Are you sure you want to remove this cardio session? This action cannot be undone."
          confirmText="Remove"
          cancelText="Cancel"
          onConfirm={confirmRemoveCardio}
          onCancel={() => {
            setShowRemoveCardioConfirm(false);
            setCardioToRemove(null);
          }}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingBottom: 16,
    alignItems: "center",
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 20,
    textShadowColor: "rgba(0, 0, 0, 0.8)",
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
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  draftButton: {
    backgroundColor: "#FF6B35",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
    shadowColor: "#FF6B35",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  titleContainer: {
    flex: 1,
    marginRight: 15,
  },
  draftIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
  },
  draftIndicatorText: {
    color: "#FF6B35",
    fontSize: 14,
    fontWeight: "600",
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: "#000",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: "#111",
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
  },
  modalActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  editButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  modalDeleteButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  saveButton: {
    backgroundColor: "#2EA0FF",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  detailSection: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 8,
  },
  sectionValue: {
    fontSize: 16,
    color: "#ccc",
    lineHeight: 22,
  },
  editInput: {
    backgroundColor: "#111",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#fff",
    borderWidth: 1,
    borderColor: "#333",
  },
  notesInput: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  exerciseDetail: {
    backgroundColor: "#111",
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#333",
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 8,
  },
  exerciseSets: {
    fontSize: 14,
    color: "#ccc",
    lineHeight: 20,
  },
  cardioDetail: {
    backgroundColor: "#111",
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#333",
  },
  cardioInfo: {
    fontSize: 14,
    color: "#ccc",
    textTransform: "capitalize",
  },
  exerciseDetailHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  removeExerciseButton: {
    padding: 4,
    borderRadius: 4,
    backgroundColor: "rgba(255, 107, 107, 0.1)",
  },
  editingSetsContainer: {
    marginTop: 8,
  },
  editingSetRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 6,
  },
  setNumber: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#FFF",
    width: 24,
    textAlign: "center",
    marginRight: 8,
  },
  setEditInput: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    color: "#FFF",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    fontSize: 14,
    minWidth: 50,
    textAlign: "center",
    marginHorizontal: 4,
  },
  bodyweightToggleSmall: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  bodyweightActiveSmall: {
    backgroundColor: "#2EA0FF",
  },
  bodyweightTextSmall: {
    fontSize: 12,
    color: "#FFF",
    fontWeight: "bold",
  },
  bodyweightTextActiveSmall: {
    color: "#FFF",
  },
  removeSetButtonSmall: {
    padding: 2,
    marginLeft: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255, 107, 107, 0.1)",
  },
  addSetButtonSmall: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(46, 160, 255, 0.1)",
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 4,
    marginTop: 4,
  },
  addSetTextSmall: {
    fontSize: 12,
    color: "#2EA0FF",
    marginLeft: 4,
    fontWeight: "600",
  },
  cardioEditContainer: {
    padding: 4,
  },
  cardioEditHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  cardioEditRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    flex: 1,
  },
  cardioEditLabel: {
    fontSize: 14,
    color: "#FFF",
    fontWeight: "600",
    width: 120,
  },
  cardioEditInput: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    color: "#FFF",
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 4,
    fontSize: 14,
    flex: 1,
    marginLeft: 8,
  },
  removeCardioButton: {
    padding: 4,
    borderRadius: 4,
    backgroundColor: "rgba(255, 107, 107, 0.1)",
    marginLeft: 8,
  },
});
