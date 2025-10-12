// ../../(app)/register.tsx
import { useAuth } from "@/src/providers/AuthProvider";
import { Link } from "expo-router";
import { useState } from "react";
import { Button, StyleSheet, Text, View } from "react-native";
import { TextInput } from "react-native-paper";

export default function RegisterScreen() {
  const { signUp } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [msg, setMsg] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);

  async function onRegister() {
    setMsg("");
    try {
      await signUp(email.trim(), password, displayName);
      // onAuthStateChanged will fire and gate will redirect to /(tabs)/home
    } catch (e: any) {
      setMsg(e?.message ?? String(e));
    }
  }

  return (
    <View style={{ flex: 1, justifyContent: "center", gap: 12, padding: 16 }}>
      {/* Header */}
      <Text style={styles.title}>Sign up</Text>
      <Text style={styles.subtitle}>Create an account to continue!</Text>

      {/* Full Name */}
      <View style={styles.field}>
        <Text style={styles.label}>Name or Nickname</Text>
        <TextInput
          mode="outlined"
          value={displayName}
          onChangeText={setDisplayName}
          placeholder="Name or Nickname"
          outlineStyle={styles.inputOutline}
          style={styles.input}
          left={<TextInput.Icon icon="account" />}
          autoCapitalize="words"
          autoComplete="name"
        />
      </View>

      {/* Email */}
      <View style={styles.field}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          mode="outlined"
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          outlineStyle={styles.inputOutline}
          style={styles.input}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          left={<TextInput.Icon icon="email" />}
        />
      </View>

      {/* Password */}
      <View style={styles.field}>
        <Text style={styles.label}>Password</Text>
        <TextInput
          mode="outlined"
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          outlineStyle={styles.inputOutline}
          style={styles.input}
          left={<TextInput.Icon icon="lock" />}
          right={
            <TextInput.Icon
              icon={showPwd ? "eye-off" : "eye"}
              onPress={() => setShowPwd((v) => !v)}
              forceTextInputFocus={false}
            />
          }
          secureTextEntry={!showPwd}
          autoComplete="password-new"
        />
      </View>

      {/* Password */}
      <View style={styles.field}>
        <Text style={styles.label}>Confirm Password</Text>
        <TextInput
          mode="outlined"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="••••••••"
          outlineStyle={styles.inputOutline}
          style={styles.input}
          left={<TextInput.Icon icon="lock" />}
          right={
            <TextInput.Icon
              icon={showConfirmPwd ? "eye-off" : "eye"}
              onPress={() => setShowConfirmPwd((v) => !v)}
              forceTextInputFocus={false}
            />
          }
          secureTextEntry={!showConfirmPwd}
          autoComplete="password-new"
        />
      </View>

      <Button title="Sign up" onPress={onRegister} />
      {!!msg && <Text style={{ color: "crimson" }}>{msg}</Text>}
      <Text>
        Already have an account? <Link href="/(auth)/login">Log in</Link>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: 16,
    backgroundColor: "#2b2b2b", // grey backdrop like your mock
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    paddingBottom: 28,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  title: {
    fontSize: 34,
    fontWeight: "700",
    marginTop: 4,
  },
  subtitle: {
    color: "#6b7280",
    marginTop: 6,
    marginBottom: 16,
    fontSize: 14,
  },
  field: {
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    color: "#6b7280",
    marginBottom: 6,
  },
  input: {
    backgroundColor: "#fff",
  },
  inputOutline: {
    borderRadius: 12,
  },
  buttonWrap: {
    marginTop: 6,
  },
  button: {
    height: 50,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 14,
  },
  footerText: {
    color: "#6b7280",
    fontSize: 14,
  },
  loginLink: {
    color: "#2E65F5",
    fontWeight: "600",
  },
});
