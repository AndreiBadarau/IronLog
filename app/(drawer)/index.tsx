// ../../(tabs)/home.tsx
import { useAuth } from "@/src/providers/AuthProvider";
import { Button, Text, View } from "react-native";

export default function HomeScreen() {
  const { user, logOut } = useAuth();
  return (
    <View style={{ flex: 1, padding: 24, gap: 12 }}>
      <Text style={{ fontSize: 18 }}>Hello{user?.email ? `, ${user.email}` : ""} 👋</Text>
      <Text>You&#39;re signed in. This is the protected area.</Text>
      <Button title="Sign out" onPress={logOut} />
    </View>
  );
}
