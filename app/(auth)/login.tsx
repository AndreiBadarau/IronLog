import Screen from "@/src/components/Screen";
import { useAuth } from "@/src/providers/AuthProvider";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Link } from "expo-router";
import React, { useRef, useState } from "react";
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

export default function LoginScreen() {
  const { signIn, signInAsGuest, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [secure, setSecure] = useState(true);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  // Ref for input navigation
  const passwordRef = useRef<TextInput>(null);

  async function onLogin() {
    setMsg("");
    setLoading(true);
    try {
      const user = await signIn(email, password);
      if (!user) setMsg("Failed to login");
      else Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : String(e));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  }

  async function onGuestSignIn() {
    setMsg("");
    setLoading(true);
    try {
      const user = await signInAsGuest();
      if (!user) setMsg("Failed to sign in as guest");
      else Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : String(e));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  }

  async function onGoogleSignIn() {
    setMsg("");
    setLoading(true);
    try {
      const user = await signInWithGoogle();
      if (!user) setMsg("Failed to sign in with Google");
      else Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : String(e));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  }

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
            <Text style={styles.title}>Sign In</Text>

            <View style={styles.card}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                placeholder="Email Address"
                placeholderTextColor={styles.placeholder.color}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles.input}
                accessibilityLabel="Email"
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
                blurOnSubmit={false}
              />

              <Text style={styles.label}>Password</Text>
              <View style={styles.passwordRow}>
                <TextInput
                  ref={passwordRef}
                  placeholder="Password"
                  placeholderTextColor={styles.placeholder.color}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={secure}
                  style={[styles.input, styles.inputNoPad]}
                  accessibilityLabel="Password"
                  returnKeyType="done"
                  onSubmitEditing={onLogin}
                />
                <Pressable
                  onPress={() => setSecure((s) => !s)}
                  style={styles.eye}
                  accessibilityRole="button"
                >
                  <Ionicons
                    name={secure ? "eye-off" : "eye"}
                    size={18}
                    color="#c2c2c2ff"
                  />
                </Pressable>
              </View>

              <Link href="/(auth)/forgotPassword" asChild>
                <Pressable style={styles.forgotRow} accessibilityRole="button">
                  <Text style={styles.forgotText}>Forgot password?</Text>
                </Pressable>
              </Link>

              <Pressable
                onPress={onLogin}
                disabled={loading}
                style={[styles.primaryBtn, loading && styles.disabled]}
                accessibilityRole="button"
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.primaryText}>Login</Text>
                )}
              </Pressable>

              <View style={styles.dividerRow}>
                <View style={styles.divider} />
                <Text style={styles.dividerText}>Or sign in with</Text>
                <View style={styles.divider} />
              </View>

              <View style={styles.socialRow}>
                <Pressable 
                  onPress={onGoogleSignIn} 
                  disabled={loading} 
                  style={[styles.socialBtn, loading && styles.disabled]} 
                  accessibilityRole="button"
                >
                  <Text style={styles.socialText}>
                    <Ionicons name="logo-google" size={20} color="#9e0000ff" />
                  </Text>
                </Pressable>
                <Pressable
                  onPress={onGuestSignIn}
                  disabled={loading}
                  style={[styles.socialBtn, loading && styles.disabled]}
                  accessibilityRole="button"
                >
                  <Text style={styles.socialText}>Guest</Text>
                </Pressable>
              </View>

              {!!msg && <Text style={styles.feedback}>{msg}</Text>}

              <View style={styles.bottomRow}>
                <Text style={styles.bottomText}>
                  Don&apos;t have an account?{" "}
                </Text>
                <Link href="/(auth)/register">
                  <Text style={styles.bottomLink}>Sign Up</Text>
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
  title: {
    color: "#fff",
    fontSize: 34,
    fontWeight: "700",
    marginTop: 36,
    marginBottom: 18,
  },
  card: {
    width: "100%",
    marginTop: 6,
    padding: 18,
    backgroundColor: "transparent",
  },
  input: {
    backgroundColor: "rgba(180, 180, 180, 0.35)",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    color: "#ffffffff",
  },
  label: { color: "#fff", marginTop: 12, marginBottom: 6 },
  passwordRow: { flexDirection: "row", alignItems: "center" },
  eye: { padding: 8, marginLeft: 8 },
  inputNoPad: { flex: 1 },
  forgotRow: { alignSelf: "flex-end", marginTop: 8 },
  forgotText: { color: "#fff", textDecorationLine: "underline" },
  primaryBtn: {
    marginTop: 18,
    backgroundColor: "#2EA0FF",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  disabled: { opacity: 0.6 },
  primaryText: { color: "#fff", fontWeight: "700" },
  dividerRow: { flexDirection: "row", alignItems: "center", marginTop: 18 },
  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.14)",
    flex: 1,
    marginHorizontal: 12,
  },
  dividerText: { color: "#fff", fontSize: 13 },
  socialRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },
  socialBtn: {
    backgroundColor: "rgba(255,255,255,0.08)",
    paddingVertical: 14,
    paddingHorizontal: 26,
    borderRadius: 8,
    marginHorizontal: 6,
    minWidth: 140,
    alignItems: "center",
  },
  socialText: { color: "#fff", fontWeight: "700" },
  feedback: { color: "#FFB02E", marginTop: 12 },
  bottomRow: { flexDirection: "row", justifyContent: "center", marginTop: 18 },
  bottomText: { color: "#fff" },
  bottomLink: { color: "#2EA0FF", fontWeight: "700" },
});
