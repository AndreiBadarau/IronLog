// ../../(tabs)/_layout.tsx
import { Tabs } from "expo-router";

export default function TabsLayout() {
  return (
    <Tabs initialRouteName="home" screenOptions={{ headerShown: true }}>
      <Tabs.Screen name="home" options={{ title: "Home" }} />
      {/* <Tabs.Screen name="workouts" options={{ title: "Workouts" }} /> */}
     {/*  <Tabs.Screen name="calculator" options={{ title: "1RM" }} /> */}
     {/*  <Tabs.Screen name="weight" options={{ title: "Weight" }} /> */}
    </Tabs>
  );
}
