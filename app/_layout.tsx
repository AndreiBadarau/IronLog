// ../../_layout.tsx
import { Slot, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider, useAuth } from "../src/providers/AuthProvider";

function AuthGate() {
  const { user, initialization } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (initialization) return; // Wait for initialization to complete
    const inAuthGroup = segments[0] === "(auth)";
    
    if (!user && !inAuthGroup) {
      // If no user and not in auth group, redirect to sign-in
      router.replace("/(auth)/login");
    } else if (user && inAuthGroup) {
      // If user is signed in and in auth group, redirect to home
      router.replace("/");
    }
  }, [user, initialization, segments, router]);

  if (initialization) {
    // Show a loading indicator while checking auth state
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return <Slot />;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <SafeAreaProvider style={{ flex: 1 }}>
        <StatusBar style="dark"/>
      <AuthGate />
      </SafeAreaProvider>
    </AuthProvider>
  );
}