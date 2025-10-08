// ../../(app)/register.tsx
import { useAuth } from "@/src/providers/AuthProvider";
import { Link } from "expo-router";
import { useState } from "react";
import { Button, Text, TextInput, View } from "react-native";

export default function RegisterScreen() {
  const { signUp } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [msg, setMsg] = useState("");

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
    <View style={{ padding: 24, gap: 12 }}>
      <TextInput
        placeholder="Display Name"
        value={displayName}
        onChangeText={setDisplayName}
        style={{ borderWidth: 1, padding: 10, borderRadius: 8 }}
      />
      <TextInput
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        style={{ borderWidth: 1, padding: 10, borderRadius: 8 }}
      />
      <TextInput
        placeholder="Password (min 6 chars)"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={{ borderWidth: 1, padding: 10, borderRadius: 8 }}
      />
      <Button title="Sign up" onPress={onRegister} />
      {!!msg && <Text style={{ color: "crimson" }}>{msg}</Text>}
      <Text>
        Already have an account?{" "}
        <Link href="/(auth)/login">
          Log in
        </Link>
      </Text>
    </View>
  );
}
