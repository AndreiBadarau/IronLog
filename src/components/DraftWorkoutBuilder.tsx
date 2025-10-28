import { WorkoutService } from "@/src/services/workoutService";
import { DraftWorkout } from "@/src/types/draftWorkout";
import {
  CardioSession,
  Exercise,
  Set,
  WorkoutExercise,
} from "@/src/types/workout";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface DraftWorkoutBuilderProps {
  visible: boolean;
  onClose: () => void;
  onWorkoutSaved: () => void;
  onDraftUpdated?: () => void;
  workoutService: WorkoutService;
  existingDraft?: DraftWorkout | null;
}

const DRAFT_STORAGE_KEY = "current_draft_workout";

export default function DraftWorkoutBuilder({
  visible,
  onClose,
  onWorkoutSaved,
  onDraftUpdated,
  workoutService,
  existingDraft,
}: DraftWorkoutBuilderProps) {
  const [draft, setDraft] = useState<DraftWorkout | null>(
    existingDraft || null
  );
  const [availableExercises, setAvailableExercises] = useState<Exercise[]>([]);
  const [showExerciseSelector, setShowExerciseSelector] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isDiscarding, setIsDiscarding] = useState(false);

  const initializeNewDraft = useCallback(() => {
    const newDraft: DraftWorkout = {
      id: `draft_${Date.now()}`,
      title: `Workout - ${new Date().toLocaleDateString()}`,
      date: new Date().toISOString().split("T")[0],
      exercises: [],
      cardioSessions: [],
      isDraft: true,
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
    };
    setDraft(newDraft);

    // Immediately save the new draft to storage
    setTimeout(async () => {
      try {
        await AsyncStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(newDraft));
        if (onDraftUpdated) {
          onDraftUpdated();
        }
      } catch (error) {
        console.error("Error saving initial draft:", error);
      }
    }, 100);
  }, [onDraftUpdated]);

  const loadExercises = useCallback(async () => {
    try {
      const exercises = await workoutService.getExercises();
      setAvailableExercises(exercises);
    } catch (error) {
      console.error("Error loading exercises:", error);
    }
  }, [workoutService]);

  const saveDraftLocally = useCallback(async () => {
    if (!draft) return;

    const updatedDraft = {
      ...draft,
      lastModified: new Date().toISOString(),
    };

    try {
      await AsyncStorage.setItem(
        DRAFT_STORAGE_KEY,
        JSON.stringify(updatedDraft)
      );
      // Don't call setDraft here to avoid circular updates

      // Notify parent component that draft was updated
      if (onDraftUpdated) {
        onDraftUpdated();
      }
    } catch (error) {
      console.error("Error saving draft:", error);
    }
  }, [draft, onDraftUpdated]);

  // Initialize draft when modal opens
  useEffect(() => {
    if (visible && !draft) {
      initializeNewDraft();
    }
    if (visible) {
      loadExercises();
    }
  }, [visible, draft, loadExercises, initializeNewDraft]);

  // Auto-save draft on changes (debounced)
  useEffect(() => {
    if (!draft || !visible || isDiscarding) return;

    const timeoutId = setTimeout(() => {
      saveDraftLocally();
    }, 500); // Debounce for 500ms

    return () => clearTimeout(timeoutId);
  }, [draft, visible, isDiscarding, saveDraftLocally]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      setIsDiscarding(false);
    };
  }, []);

  const updateDraft = useCallback((updates: Partial<DraftWorkout>) => {
    setDraft((currentDraft) => {
      if (!currentDraft) return currentDraft;

      return {
        ...currentDraft,
        ...updates,
        lastModified: new Date().toISOString(),
      };
    });
  }, []);

  const addExercise = useCallback((exercise: Exercise) => {
    setDraft((currentDraft) => {
      if (!currentDraft) return currentDraft;

      const newExercise: WorkoutExercise = {
        id: `exercise_${Date.now()}`,
        exerciseId: exercise.id,
        exerciseName: exercise.name,
        sets: [],
        order: currentDraft.exercises.length,
      };

      return {
        ...currentDraft,
        exercises: [...currentDraft.exercises, newExercise],
        lastModified: new Date().toISOString(),
      };
    });

    setShowExerciseSelector(false);
  }, []);

  const updateExercise = useCallback(
    (exerciseId: string, updates: Partial<WorkoutExercise>) => {
      setDraft((currentDraft) => {
        if (!currentDraft) return currentDraft;

        const updatedExercises = currentDraft.exercises.map((exercise) =>
          exercise.id === exerciseId ? { ...exercise, ...updates } : exercise
        );

        return {
          ...currentDraft,
          exercises: updatedExercises,
          lastModified: new Date().toISOString(),
        };
      });
    },
    []
  );

  const removeExercise = useCallback(
    (exerciseId: string) => {
      if (!draft) return;

      Alert.alert(
        "Remove Exercise",
        "Are you sure you want to remove this exercise?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Remove",
            style: "destructive",
            onPress: () => {
              setDraft((currentDraft) => {
                if (!currentDraft) return currentDraft;

                const updatedExercises = currentDraft.exercises.filter(
                  (ex) => ex.id !== exerciseId
                );

                return {
                  ...currentDraft,
                  exercises: updatedExercises,
                  lastModified: new Date().toISOString(),
                };
              });
            },
          },
        ]
      );
    },
    [draft]
  );

  const addSet = (exerciseId: string) => {
    if (!draft) return;

    const exercise = draft.exercises.find((ex) => ex.id === exerciseId);
    if (!exercise) return;

    // Find the exercise data to check if it's bodyweight
    const exerciseData = availableExercises.find(
      (ex) => ex.id === exercise.exerciseId
    );
    const isBodyweightExercise = exerciseData?.bw === 1;

    const newSet: Set = {
      id: `set_${Date.now()}`,
      reps: 10,
      weight: isBodyweightExercise ? 0 : 20, // Default weight for weighted exercises
      isBodyweight: isBodyweightExercise,
    };

    updateExercise(exerciseId, {
      sets: [...exercise.sets, newSet],
    });
  };

  const updateSet = (
    exerciseId: string,
    setId: string,
    updates: Partial<Set>
  ) => {
    if (!draft) return;

    const exercise = draft.exercises.find((ex) => ex.id === exerciseId);
    if (!exercise) return;

    const updatedSets = exercise.sets.map((set) =>
      set.id === setId ? { ...set, ...updates } : set
    );

    updateExercise(exerciseId, { sets: updatedSets });
  };

  const removeSet = (exerciseId: string, setId: string) => {
    if (!draft) return;

    const exercise = draft.exercises.find((ex) => ex.id === exerciseId);
    if (!exercise) return;

    const updatedSets = exercise.sets.filter((set) => set.id !== setId);
    updateExercise(exerciseId, { sets: updatedSets });
  };

  const addCardioSession = useCallback(() => {
    setDraft((currentDraft) => {
      if (!currentDraft) return currentDraft;

      const newSession: CardioSession = {
        id: `cardio_${Date.now()}`,
        type: "running",
        duration: 30,
        intensity: "medium",
      };

      return {
        ...currentDraft,
        cardioSessions: [...currentDraft.cardioSessions, newSession],
        lastModified: new Date().toISOString(),
      };
    });
  }, []);

  const updateCardioSession = useCallback(
    (sessionId: string, updates: Partial<CardioSession>) => {
      setDraft((currentDraft) => {
        if (!currentDraft) return currentDraft;

        const updatedSessions = currentDraft.cardioSessions.map((session) =>
          session.id === sessionId ? { ...session, ...updates } : session
        );

        return {
          ...currentDraft,
          cardioSessions: updatedSessions,
          lastModified: new Date().toISOString(),
        };
      });
    },
    []
  );

  const removeCardioSession = useCallback(
    (sessionId: string) => {
      if (!draft) return;

      Alert.alert(
        "Remove Cardio Session",
        "Are you sure you want to remove this cardio session?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Remove",
            style: "destructive",
            onPress: () => {
              setDraft((currentDraft) => {
                if (!currentDraft) return currentDraft;

                const updatedSessions = currentDraft.cardioSessions.filter(
                  (session) => session.id !== sessionId
                );

                return {
                  ...currentDraft,
                  cardioSessions: updatedSessions,
                  lastModified: new Date().toISOString(),
                };
              });
            },
          },
        ]
      );
    },
    [draft]
  );

  const saveWorkout = async () => {
    if (!draft) return;

    if (draft.exercises.length === 0 && draft.cardioSessions.length === 0) {
      Alert.alert(
        "Empty Workout",
        "Please add at least one exercise or cardio session."
      );
      return;
    }

    try {
      setSaving(true);

      // Convert draft to workout format
      const workout = {
        title: draft.title,
        date: draft.date,
        exercises: draft.exercises,
        cardioSessions: draft.cardioSessions,
        notes: draft.notes,
        duration: calculateWorkoutDuration(),
      };

      await workoutService.createWorkout(workout);

      // Clear the draft
      await AsyncStorage.removeItem(DRAFT_STORAGE_KEY);

      onWorkoutSaved();
      onClose();
      setDraft(null);
    } catch (error) {
      console.error("Error saving workout:", error);
      Alert.alert("Error", "Failed to save workout");
    } finally {
      setSaving(false);
    }
  };

  const calculateWorkoutDuration = (): number => {
    if (!draft) return 0;

    // Simple calculation: 2 minutes per set + cardio time
    const exerciseTime = draft.exercises.reduce((total, exercise) => {
      return total + exercise.sets.length * 2;
    }, 0);

    const cardioTime = draft.cardioSessions.reduce((total, session) => {
      return total + session.duration;
    }, 0);

    return exerciseTime + cardioTime;
  };

  const discardDraft = () => {
    Alert.alert(
      "Discard Draft",
      "Are you sure? All unsaved changes will be lost.",
      [
        { text: "Keep Draft", style: "cancel" },
        {
          text: "Discard",
          style: "destructive",
          onPress: async () => {
            setIsDiscarding(true);
            await AsyncStorage.removeItem(DRAFT_STORAGE_KEY);
            setDraft(null);
            if (onDraftUpdated) {
              onDraftUpdated();
            }
            onClose();
          },
        },
      ]
    );
  };

  const handleClose = async () => {
    if (
      !draft ||
      (draft.exercises.length === 0 && draft.cardioSessions.length === 0)
    ) {
      // If empty draft, remove it from storage and close
      setIsDiscarding(true);
      await AsyncStorage.removeItem(DRAFT_STORAGE_KEY);
      if (onDraftUpdated) {
        onDraftUpdated();
      }
      onClose();
      return;
    }

    Alert.alert(
      "Save Draft?",
      "Your workout will be saved as a draft and you can continue it later.",
      [
        {
          text: "Discard",
          style: "destructive",
          onPress: discardDraft,
        },
        {
          text: "Save Draft",
          onPress: onClose,
        },
      ]
    );
  };

  if (!draft) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.headerButton}>
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>New Workout</Text>

          <TouchableOpacity
            onPress={saveWorkout}
            style={[styles.headerButton, styles.saveButton]}
            disabled={saving}
          >
            <Text style={styles.saveButtonText}>
              {saving ? "Saving..." : "Save"}
            </Text>
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.content}
        >
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Workout Title */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Workout Title</Text>
              <TextInput
                style={styles.titleInput}
                value={draft.title}
                onChangeText={(text) => updateDraft({ title: text })}
                placeholder="Enter workout title"
                placeholderTextColor="#888"
              />
            </View>

            {/* Exercises Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                  Exercises ({draft.exercises.length})
                </Text>
                <TouchableOpacity
                  onPress={() => setShowExerciseSelector(true)}
                  style={styles.addButton}
                >
                  <Ionicons name="add" size={20} color="#2EA0FF" />
                  <Text style={styles.addButtonText}>Add Exercise</Text>
                </TouchableOpacity>
              </View>

              {draft.exercises.map((exercise) => {
                const exerciseData = availableExercises.find(
                  (ex) => ex.id === exercise.exerciseId
                );
                return (
                  <ExerciseCard
                    key={exercise.id}
                    exercise={exercise}
                    exerciseData={exerciseData}
                    onUpdate={(updates) => updateExercise(exercise.id, updates)}
                    onRemove={() => removeExercise(exercise.id)}
                    onAddSet={() => addSet(exercise.id)}
                    onUpdateSet={(setId, updates) =>
                      updateSet(exercise.id, setId, updates)
                    }
                    onRemoveSet={(setId) => removeSet(exercise.id, setId)}
                  />
                );
              })}

              {draft.exercises.length === 0 && (
                <View style={styles.emptyState}>
                  <Ionicons name="barbell-outline" size={32} color="#444" />
                  <Text style={styles.emptyText}>No exercises added yet</Text>
                </View>
              )}
            </View>

            {/* Cardio Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                  Cardio ({draft.cardioSessions.length})
                </Text>
                <TouchableOpacity
                  onPress={addCardioSession}
                  style={styles.addButton}
                >
                  <Ionicons name="add" size={20} color="#2EA0FF" />
                  <Text style={styles.addButtonText}>Add Cardio</Text>
                </TouchableOpacity>
              </View>

              {draft.cardioSessions.map((session) => (
                <CardioCard
                  key={session.id}
                  session={session}
                  onUpdate={(updates) =>
                    updateCardioSession(session.id, updates)
                  }
                  onRemove={() => removeCardioSession(session.id)}
                />
              ))}
            </View>

            {/* Notes Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Notes</Text>
              <TextInput
                style={styles.notesInput}
                value={draft.notes || ""}
                onChangeText={(text) => updateDraft({ notes: text })}
                placeholder="Add workout notes..."
                placeholderTextColor="#888"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.bottomPadding} />
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Exercise Selector Modal */}
        <Modal
          visible={showExerciseSelector}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <View style={styles.selectorContainer}>
            <View style={styles.selectorHeader}>
              <Text style={styles.selectorTitle}>Select Exercise</Text>
              <TouchableOpacity onPress={() => setShowExerciseSelector(false)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={availableExercises.sort(
                (a, b) => b.popularity - a.popularity
              )}
              keyExtractor={(item) => item.id}
              renderItem={({ item: exercise }) => (
                <TouchableOpacity
                  style={styles.exerciseOption}
                  onPress={() => addExercise(exercise)}
                >
                  <View style={styles.exerciseOptionHeader}>
                    <Text style={styles.exerciseOptionName}>
                      {exercise.name}
                    </Text>
                    <View style={styles.exerciseOptionMeta}>
                      <Text style={styles.popularityText}>
                        ★ {exercise.popularity}
                      </Text>
                      {exercise.bw === 1 && (
                        <View style={styles.bodyweightIndicator}>
                          <Text style={styles.bodyweightIndicatorText}>BW</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  {exercise.category && (
                    <Text style={styles.exerciseOptionCategory}>
                      {exercise.category}
                    </Text>
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </Modal>
      </View>
    </Modal>
  );
}

// Exercise Card Component
interface ExerciseCardProps {
  exercise: WorkoutExercise;
  exerciseData?: Exercise;
  onUpdate: (updates: Partial<WorkoutExercise>) => void;
  onRemove: () => void;
  onAddSet: () => void;
  onUpdateSet: (setId: string, updates: Partial<Set>) => void;
  onRemoveSet: (setId: string) => void;
}

function ExerciseCard({
  exercise,
  exerciseData,
  onUpdate,
  onRemove,
  onAddSet,
  onUpdateSet,
  onRemoveSet,
}: ExerciseCardProps) {
  return (
    <View style={styles.exerciseCard}>
      <View style={styles.exerciseHeader}>
        <View style={styles.exerciseInfo}>
          <Text style={styles.exerciseName}>{exercise.exerciseName}</Text>
          {exerciseData?.bw === 1 && (
            <View style={styles.bodyweightBadge}>
              <Text style={styles.bodyweightBadgeText}>Bodyweight</Text>
            </View>
          )}
        </View>
        <TouchableOpacity onPress={onRemove} style={styles.removeButton}>
          <Ionicons name="trash-outline" size={20} color="#FF6B6B" />
        </TouchableOpacity>
      </View>

      {/* Sets */}
      {exercise.sets.map((set, setIndex) => (
        <View key={set.id} style={styles.setRow}>
          <Text style={styles.setNumber}>{setIndex + 1}</Text>

          <TextInput
            style={styles.setInput}
            value={set.reps?.toString() || ""}
            onChangeText={(text) =>
              onUpdateSet(set.id, { reps: parseInt(text) || 0 })
            }
            placeholder="Reps"
            placeholderTextColor="#888"
            keyboardType="numeric"
          />

          <TouchableOpacity
            style={[
              styles.bodyweightToggle,
              set.isBodyweight && styles.bodyweightActive,
            ]}
            onPress={() =>
              onUpdateSet(set.id, { isBodyweight: !set.isBodyweight })
            }
          >
            <Text
              style={[
                styles.bodyweightText,
                set.isBodyweight && styles.bodyweightTextActive,
              ]}
            >
              BW
            </Text>
          </TouchableOpacity>

          {!set.isBodyweight && (
            <TextInput
              style={styles.setInput}
              value={set.weight?.toString() || ""}
              onChangeText={(text) =>
                onUpdateSet(set.id, { weight: parseFloat(text) || 0 })
              }
              placeholder="Weight"
              placeholderTextColor="#888"
              keyboardType="numeric"
            />
          )}

          <TouchableOpacity
            onPress={() => onRemoveSet(set.id)}
            style={styles.removeSetButton}
          >
            <Ionicons name="close" size={16} color="#FF6B6B" />
          </TouchableOpacity>
        </View>
      ))}

      <TouchableOpacity onPress={onAddSet} style={styles.addSetButton}>
        <Ionicons name="add" size={16} color="#2EA0FF" />
        <Text style={styles.addSetText}>Add Set</Text>
      </TouchableOpacity>
    </View>
  );
}

// Cardio Card Component
interface CardioCardProps {
  session: CardioSession;
  onUpdate: (updates: Partial<CardioSession>) => void;
  onRemove: () => void;
}

function CardioCard({ session, onUpdate, onRemove }: CardioCardProps) {
  const [showTypePicker, setShowTypePicker] = useState(false);

  const cardioTypes: { value: CardioSession["type"]; label: string }[] = [
    { value: "running", label: "Running" },
    { value: "cycling", label: "Cycling" },
    { value: "swimming", label: "Swimming" },
    { value: "walking", label: "Walking" },
    { value: "other", label: "Other" },
  ];

  const handleRemove = () => {
    onRemove();
  };

  return (
    <View style={styles.cardioCard}>
      <View style={styles.cardioHeader}>
        <Text style={styles.cardioTitle}>Cardio Session</Text>
        <TouchableOpacity onPress={handleRemove} style={styles.removeButton}>
          <Ionicons name="trash-outline" size={20} color="#FF6B6B" />
        </TouchableOpacity>
      </View>

      <View style={styles.cardioRow}>
        <Text style={styles.cardioLabel}>Type:</Text>
        <TouchableOpacity
          style={styles.cardioTypeButton}
          onPress={() => setShowTypePicker(true)}
        >
          <Text style={styles.cardioValue}>
            {cardioTypes.find((t) => t.value === session.type)?.label ||
              "Select Type"}
          </Text>
          <Ionicons name="chevron-down" size={16} color="#888" />
        </TouchableOpacity>
      </View>

      <View style={styles.cardioRow}>
        <Text style={styles.cardioLabel}>Duration:</Text>
        <TextInput
          style={styles.cardioInput}
          value={session.duration.toString()}
          onChangeText={(text) => onUpdate({ duration: parseInt(text) || 0 })}
          placeholder="Minutes"
          placeholderTextColor="#888"
          keyboardType="numeric"
        />
        <Text style={styles.cardioUnit}>min</Text>
      </View>

      {(session.type === "running" ||
        session.type === "cycling" ||
        session.type === "walking") && (
        <View style={styles.cardioRow}>
          <Text style={styles.cardioLabel}>Distance:</Text>
          <TextInput
            style={styles.cardioInput}
            value={session.distance?.toString() || ""}
            onChangeText={(text) =>
              onUpdate({ distance: parseFloat(text) || 0 })
            }
            placeholder="Distance"
            placeholderTextColor="#888"
            keyboardType="numeric"
          />
          <Text style={styles.cardioUnit}>km</Text>
        </View>
      )}

      {/* Type Picker Modal */}
      <Modal
        visible={showTypePicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowTypePicker(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowTypePicker(false)}
        >
          <View style={styles.typePickerContainer}>
            <Text style={styles.typePickerTitle}>Select Cardio Type</Text>
            {cardioTypes.map((type) => (
              <TouchableOpacity
                key={type.value}
                style={[
                  styles.typeOption,
                  session.type === type.value && styles.typeOptionSelected,
                ]}
                onPress={() => {
                  onUpdate({ type: type.value });
                  setShowTypePicker(false);
                }}
              >
                <Text
                  style={[
                    styles.typeOptionText,
                    session.type === type.value &&
                      styles.typeOptionTextSelected,
                  ]}
                >
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#111",
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  headerButton: {
    width: 60,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
  },
  saveButton: {
    backgroundColor: "#2EA0FF",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  content: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  addButtonText: {
    color: "#2EA0FF",
    fontWeight: "600",
  },
  titleInput: {
    backgroundColor: "#111",
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    color: "#fff",
    borderWidth: 1,
    borderColor: "#333",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 32,
  },
  emptyText: {
    color: "#888",
    fontSize: 14,
    marginTop: 8,
  },
  exerciseCard: {
    backgroundColor: "#111",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#333",
  },
  exerciseHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  removeButton: {
    padding: 8,
  },
  setRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  setNumber: {
    width: 30,
    textAlign: "center",
    color: "#888",
    fontWeight: "600",
  },
  setInput: {
    flex: 1,
    backgroundColor: "#222",
    borderRadius: 6,
    padding: 8,
    color: "#fff",
    textAlign: "center",
  },
  bodyweightToggle: {
    backgroundColor: "#333",
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  bodyweightActive: {
    backgroundColor: "#2EA0FF",
  },
  bodyweightText: {
    color: "#888",
    fontSize: 12,
    fontWeight: "600",
  },
  bodyweightTextActive: {
    color: "#fff",
  },
  removeSetButton: {
    padding: 4,
  },
  addSetButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    marginTop: 8,
    paddingVertical: 8,
  },
  addSetText: {
    color: "#2EA0FF",
    fontWeight: "600",
  },
  cardioCard: {
    backgroundColor: "#111",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#333",
  },
  cardioHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  cardioTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  cardioRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  cardioLabel: {
    width: 80,
    color: "#888",
    fontWeight: "600",
  },
  cardioValue: {
    color: "#fff",
    textTransform: "capitalize",
  },
  cardioInput: {
    backgroundColor: "#222",
    borderRadius: 6,
    padding: 8,
    color: "#fff",
    textAlign: "center",
    minWidth: 60,
  },
  cardioUnit: {
    color: "#888",
    marginLeft: 8,
  },
  notesInput: {
    backgroundColor: "#111",
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    color: "#fff",
    borderWidth: 1,
    borderColor: "#333",
    minHeight: 100,
  },
  bottomPadding: {
    height: 40,
  },
  selectorContainer: {
    flex: 1,
    backgroundColor: "#000",
  },
  selectorHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#111",
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  selectorTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
  },
  exerciseOption: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  exerciseOptionName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 4,
  },
  exerciseOptionCategory: {
    fontSize: 14,
    color: "#888",
    textTransform: "capitalize",
  },
  cardioTypeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#222",
    borderRadius: 6,
    padding: 8,
    flex: 1,
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  typePickerContainer: {
    backgroundColor: "#111",
    borderRadius: 12,
    margin: 20,
    maxWidth: 300,
    width: "80%",
  },
  typePickerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
    textAlign: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  typeOption: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  typeOptionSelected: {
    backgroundColor: "#2EA0FF",
  },
  typeOptionText: {
    fontSize: 16,
    color: "#fff",
    textAlign: "center",
  },
  typeOptionTextSelected: {
    fontWeight: "600",
  },
  exerciseInfo: {
    flex: 1,
  },
  bodyweightBadge: {
    backgroundColor: "#4CAF50",
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 4,
    alignSelf: "flex-start",
  },
  bodyweightBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  exerciseOptionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  exerciseOptionMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  popularityText: {
    color: "#FFD700",
    fontSize: 14,
    fontWeight: "600",
  },
  bodyweightIndicator: {
    backgroundColor: "#4CAF50",
    borderRadius: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  bodyweightIndicatorText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "600",
  },
});
