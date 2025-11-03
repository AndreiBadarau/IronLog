import BackgroundWrapper from "@/src/components/BackgroundWrapper";
import {
  CalculationMode,
  ExerciseType,
  WeightUnit,
  calculate,
  isBodyweightExercise,
} from "@/src/services/calculatorService";
import { useHeaderHeight } from "@react-navigation/elements";
import { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { ScrollView } from "react-native-gesture-handler";

type CalculatorStep = "exercise" | "calculator";

export default function CalculatorScreen() {
  const headerHeight = useHeaderHeight();

  // Navigation state
  const [step, setStep] = useState<CalculatorStep>("exercise");
  const [selectedExercise, setSelectedExercise] = useState<ExerciseType | null>(
    null
  );

  // Calculator state
  const [calculationMode, setCalculationMode] =
    useState<CalculationMode>("RepsToRM");
  const [weightUnit, setWeightUnit] = useState<WeightUnit>("kg");
  const [bodyweight, setBodyweight] = useState<string>("");
  const [input1, setInput1] = useState<string>("");
  const [input2, setInput2] = useState<string>("");
  const [result, setResult] = useState<string>("");

  const exercises: ExerciseType[] = [
    "Squat",
    "Bench",
    "Deadlift",
    "Pull Up",
    "Muscle Up",
    "Dips",
  ];

  // Reset calculator when exercise or mode changes
  useEffect(() => {
    setInput1("");
    setInput2("");
    setResult("");
  }, [selectedExercise, calculationMode]);

  // Calculate result whenever inputs change
  useEffect(() => {
    if (!selectedExercise) return;

    const isBW = isBodyweightExercise(selectedExercise);

    // Check if bodyweight is needed and provided
    if (isBW && !bodyweight) {
      setResult("");
      return;
    }

    try {
      const bw = isBW ? parseFloat(bodyweight) : undefined;

      if (calculationMode === "RepsToRM") {
        // Input1: Added Weight, Input2: Reps
        if (input1 === "" || input2 === "") return;
        const addedWeight = parseFloat(input1);
        const reps = parseFloat(input2);
        if (isNaN(addedWeight) || isNaN(reps)) return;

        const res = calculate({
          exercise: selectedExercise,
          mode: "RepsToRM",
          addedWeight,
          reps,
          bodyweight: bw,
          unit: weightUnit,
        });
        setResult(`${res.description}: ${res.value.toFixed(1)} ${res.unit}`);
      } else if (calculationMode === "RMToWeight") {
        // Input1: RM, Input2: Reps
        if (input1 === "" || input2 === "") return;
        const rm = parseFloat(input1);
        const reps = parseFloat(input2);
        if (isNaN(rm) || isNaN(reps)) return;

        const res = calculate({
          exercise: selectedExercise,
          mode: "RMToWeight",
          rm,
          reps,
          bodyweight: bw,
          unit: weightUnit,
        });
        setResult(`${res.description}: ${res.value.toFixed(1)} ${res.unit}`);
      } else if (calculationMode === "RMToReps") {
        // Input1: RM, Input2: Added Weight
        if (input1 === "" || input2 === "") return;
        const rm = parseFloat(input1);
        const addedWeight = parseFloat(input2);
        if (isNaN(rm) || isNaN(addedWeight)) return;

        const res = calculate({
          exercise: selectedExercise,
          mode: "RMToReps",
          rm,
          addedWeight,
          bodyweight: bw,
          unit: weightUnit,
        });
        setResult(`${res.description}: ${res.value.toFixed(1)} ${res.unit}`);
      }
    } catch {
      setResult("");
    }
  }, [
    selectedExercise,
    calculationMode,
    weightUnit,
    bodyweight,
    input1,
    input2,
  ]);

  const handleExerciseSelect = (exercise: ExerciseType) => {
    setSelectedExercise(exercise);
    setStep("calculator");
  };

  const handleBack = () => {
    setStep("exercise");
    setSelectedExercise(null);
    setBodyweight("");
    setInput1("");
    setInput2("");
    setResult("");
  };

  const getInputLabels = () => {
    if (calculationMode === "RepsToRM") {
      return { input1: "Added Weight", input2: "Number of Reps" };
    } else if (calculationMode === "RMToWeight") {
      return { input1: "Input Your RM", input2: "Number of Reps" };
    } else {
      return { input1: "Input Your RM", input2: "Added Weight" };
    }
  };

  const labels = getInputLabels();
  const isBW = selectedExercise
    ? isBodyweightExercise(selectedExercise)
    : false;

  if (step === "exercise") {
    return (
      <BackgroundWrapper>
        <ScrollView style={{ flex: 1, paddingTop: headerHeight - 25 }}>
          <View style={styles.container}>
            <Text style={styles.title}>Select Exercise</Text>
            <View style={styles.grid}>
              {exercises.map((exercise) => (
                <TouchableOpacity
                  key={exercise}
                  style={styles.exerciseCard}
                  onPress={() => handleExerciseSelect(exercise)}
                >
                  <Text style={styles.exerciseText}>{exercise}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
      </BackgroundWrapper>
    );
  }

  return (
    <BackgroundWrapper>
      <ScrollView style={{ flex: 1, paddingTop: headerHeight - 25 }}>
        <View style={styles.container}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>

          <Text style={styles.title}>{selectedExercise} Calculator</Text>

          {/* Weight Unit Toggle */}
          <View style={styles.toggleContainer}>
            <Text style={styles.label}>Unit:</Text>
            <View style={styles.toggleButtons}>
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  weightUnit === "kg" && styles.toggleButtonActive,
                ]}
                onPress={() => setWeightUnit("kg")}
              >
                <Text
                  style={[
                    styles.toggleButtonText,
                    weightUnit === "kg" && styles.toggleButtonTextActive,
                  ]}
                >
                  kg
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  weightUnit === "lbs" && styles.toggleButtonActive,
                ]}
                onPress={() => setWeightUnit("lbs")}
              >
                <Text
                  style={[
                    styles.toggleButtonText,
                    weightUnit === "lbs" && styles.toggleButtonTextActive,
                  ]}
                >
                  lbs
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Calculation Mode Toggle */}
          <View style={styles.modeContainer}>
            <Text style={styles.label}>Calculation Type:</Text>
            <TouchableOpacity
              style={[
                styles.modeButton,
                calculationMode === "RepsToRM" && styles.modeButtonActive,
              ]}
              onPress={() => setCalculationMode("RepsToRM")}
            >
              <Text
                style={[
                  styles.modeButtonText,
                  calculationMode === "RepsToRM" && styles.modeButtonTextActive,
                ]}
              >
                Reps to RM
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.modeButton,
                calculationMode === "RMToWeight" && styles.modeButtonActive,
              ]}
              onPress={() => setCalculationMode("RMToWeight")}
            >
              <Text
                style={[
                  styles.modeButtonText,
                  calculationMode === "RMToWeight" &&
                    styles.modeButtonTextActive,
                ]}
              >
                RM to Weight
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.modeButton,
                calculationMode === "RMToReps" && styles.modeButtonActive,
              ]}
              onPress={() => setCalculationMode("RMToReps")}
            >
              <Text
                style={[
                  styles.modeButtonText,
                  calculationMode === "RMToReps" && styles.modeButtonTextActive,
                ]}
              >
                RM to Reps
              </Text>
            </TouchableOpacity>
          </View>

          {/* Bodyweight Input - Always first for bodyweight exercises */}
          {isBW && (
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>
                Your Bodyweight ({weightUnit})
              </Text>
              <TextInput
                style={styles.input}
                value={bodyweight}
                onChangeText={setBodyweight}
                keyboardType="numeric"
                placeholder="Enter bodyweight"
                placeholderTextColor="#888"
              />
            </View>
          )}

          {/* Input 1 */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>
              {labels.input1} ({weightUnit})
            </Text>
            <TextInput
              style={styles.input}
              value={input1}
              onChangeText={setInput1}
              keyboardType="numeric"
              placeholder={`Enter ${labels.input1.toLowerCase()}`}
              placeholderTextColor="#888"
            />
          </View>

          {/* Input 2 */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>{labels.input2}</Text>
            <TextInput
              style={styles.input}
              value={input2}
              onChangeText={setInput2}
              keyboardType="numeric"
              placeholder={`Enter ${labels.input2.toLowerCase()}`}
              placeholderTextColor="#888"
            />
          </View>

          {/* Result */}
          {result && (
            <View style={styles.resultContainer}>
              <Text style={styles.resultText}>{result}</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </BackgroundWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 20,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  exerciseCard: {
    width: "48%",
    aspectRatio: 1,
    backgroundColor: "#2EA0FF",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  exerciseText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
    textAlign: "center",
  },
  backButton: {
    marginBottom: 16,
  },
  backText: {
    fontSize: 16,
    color: "#2EA0FF",
    fontWeight: "600",
  },
  toggleContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    marginRight: 12,
  },
  toggleButtons: {
    flexDirection: "row",
    backgroundColor: "#222",
    borderRadius: 8,
    padding: 2,
  },
  toggleButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 6,
  },
  toggleButtonActive: {
    backgroundColor: "#2EA0FF",
  },
  toggleButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#888",
  },
  toggleButtonTextActive: {
    color: "#fff",
  },
  modeContainer: {
    marginBottom: 24,
  },
  modeButton: {
    backgroundColor: "#222",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  modeButtonActive: {
    backgroundColor: "#2EA0FF",
  },
  modeButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#888",
    textAlign: "center",
  },
  modeButtonTextActive: {
    color: "#fff",
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#111",
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: "#fff",
  },
  resultContainer: {
    backgroundColor: "#2EA0FF20",
    padding: 20,
    borderRadius: 12,
    marginTop: 20,
    borderWidth: 2,
    borderColor: "#2EA0FF",
  },
  resultText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2EA0FF",
    textAlign: "center",
  },
});
