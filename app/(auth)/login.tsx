// ../../(app)/login.tsx
import { Link } from "expo-router";
import { useState } from "react";
import { Button, Text, TextInput, View } from "react-native";
import { useAuth } from "../../src/providers/AuthProvider";

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  async function onLogin() {
    setMsg("");
    try {
      const user = await signIn(email, password);
      if (user) {
        setMsg("Logged in as " + user.email);
      } else {
        setMsg("Failed to log in");
      }
    } catch (error) {
      if (error instanceof Error) {
        setMsg("Error: " + error.message);
      } else {
        setMsg("An unknown error occurred");
      }
    }
  }

  return (
    <View style={{ padding: 24, gap: 12 }}>
      <Text style={{ fontSize: 22, fontWeight: "600" }}>Welcome back</Text>
      <TextInput
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        style={{ borderWidth: 1, padding: 10, borderRadius: 8 }}
      />
      <TextInput
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={{ borderWidth: 1, padding: 10, borderRadius: 8 }}
      />
      <Button title="Log in" onPress={onLogin} />
      {!!msg && <Text style={{ color: "crimson" }}>{msg}</Text>}
      <Text>
        No account?{" "}
        <Link href="/(auth)/register">
          Create one
        </Link>
      </Text>
    </View>
  );
}
