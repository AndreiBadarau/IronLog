import Screen from "@/src/components/Screen";
import { useAuth } from "@/src/providers/AuthProvider";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Link, useRouter } from "expo-router";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Image,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

const BG = require("../../assets/images/background.jpeg");

export default function ForgotPasswordScreen() {
  const { resetPassword } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async () => {
    setMessage("");
    setError("");

    if (!email.trim()) {
      setError("Please enter your email address");
      return;
    }

    if (!isValidEmail(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setLoading(true);
    try {
      const success = await resetPassword(email.trim());
      if (success) {
        setMessage("Password reset email sent! Check your inbox.");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        setError("Failed to send reset email. Please try again.");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } catch (err: any) {
      setError(err.message || "Failed to send reset email.");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <Image source={BG} style={styles.bg} resizeMode="cover" />
      <View style={styles.overlay} />

      <Screen style={{ backgroundColor: "transparent" }}>
        <KeyboardAvoidingView
          behavior={Platform.select({ ios: "padding", android: undefined })}
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.select({ ios: 60, android: 0 })}
        >
          <ScrollView
            contentContainerStyle={styles.container}
            keyboardShouldPersistTaps="handled"
          >
            {/* Back Button */}
            <Pressable
              onPress={() => router.back()}
              style={styles.backButton}
              accessibilityRole="button"
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </Pressable>

            <Text style={styles.title}>Forgot Password</Text>
            <Text style={styles.subtitle}>
              Enter your email address and we&apos;ll send you a link to reset
              your password.
            </Text>

            <View style={styles.card}>
              <Text style={styles.label}>Email Address</Text>
              <TextInput
                placeholder="Enter your email"
                placeholderTextColor="#9A9A9A"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles.input}
                accessibilityLabel="Email"
                returnKeyType="done"
                onSubmitEditing={handleSubmit}
              />

              <Pressable
                onPress={handleSubmit}
                disabled={loading}
                style={[styles.primaryBtn, loading && styles.disabled]}
                accessibilityRole="button"
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.primaryText}>Send Reset Link</Text>
                )}
              </Pressable>

              {!!message && (
                <Text style={styles.successMessage}>{message}</Text>
              )}
              {!!error && <Text style={styles.errorMessage}>{error}</Text>}

              <View style={styles.bottomRow}>
                <Text style={styles.bottomText}>Remember your password? </Text>
                <Link href="/(auth)/login">
                  <Text style={styles.bottomLink}>Sign In</Text>
                </Link>
              </View>
            </View>

            <View style={{ height: 60 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  placeholder: { color: "#cacacaff" },
  bg: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    height: "100%",
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  container: {
    flexGrow: 1,
    padding: 24,
    alignItems: "center",
    justifyContent: "flex-start",
  },
  backButton: {
    alignSelf: "flex-start",
    marginTop: 20,
    marginBottom: 20,
    padding: 8,
  },
  title: {
    color: "#fff",
    fontSize: 34,
    fontWeight: "700",
    marginBottom: 12,
    textAlign: "center",
  },
  subtitle: {
    color: "#fff",
    fontSize: 16,
    marginBottom: 24,
    textAlign: "center",
    opacity: 0.8,
  },
  card: {
    width: "100%",
    marginTop: 6,
    padding: 18,
    backgroundColor: "transparent",
  },
  label: { color: "#fff", marginBottom: 6, fontSize: 16 },
  input: {
    backgroundColor: "rgba(180, 180, 180, 0.35)",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    color: "#ffffffff",
  },
  primaryBtn: {
    marginTop: 8,
    backgroundColor: "#2EA0FF",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  disabled: { opacity: 0.6 },
  primaryText: { color: "#fff", fontWeight: "700" },
  successMessage: {
    color: "#4ADE80",
    marginTop: 12,
    textAlign: "center",
    fontSize: 14,
  },
  errorMessage: {
    color: "#FFB02E",
    marginTop: 12,
    textAlign: "center",
    fontSize: 14,
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 24,
  },
  bottomText: { color: "#fff" },
  bottomLink: { color: "#2EA0FF", fontWeight: "700" },
});
