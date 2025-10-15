// ../../(tabs)/_layout.tsx
import { Ionicons } from "@expo/vector-icons";
import { Drawer } from "expo-router/drawer";
import AppDrawerContent from "../../src/components/AppDrawerContent";

export default function DrawerLayout() {
  return (
    
    <Drawer
      initialRouteName="index"
      screenOptions={{
        headerShown: true,
        drawerType: "front",
        // Make the whole drawer one color
        drawerStyle: { width: 240, backgroundColor: "transparent"},
        drawerContentStyle: { backgroundColor: "#111"},
        // Scene background color - this applies to all drawer screens
        overlayColor: "rgba(0, 0, 0, 0.35)",
        sceneStyle: { backgroundColor: "#000" },
        headerTransparent: true,
        // Colors for drawer items
        drawerActiveTintColor: "#fff",
        drawerInactiveTintColor: "#aaa",
        drawerActiveBackgroundColor: "rgba(99, 99, 99, 0.75)",
        drawerInactiveBackgroundColor: "rgba(0, 0, 0, 0.35)",
        // Header style
        headerStyle: { backgroundColor: "transparent" },
        headerTitleStyle: { color: "#fff", fontWeight: "600" },
        headerTintColor: "#fff",
      }}
      drawerContent={(props) => <AppDrawerContent {...props} />}
      >
      <Drawer.Screen
        name="index"
        options={{
          title: "Daily Motivation",
          drawerIcon: ({ size, color }) => <Ionicons name="ribbon-outline" size={size} color={color} />,
        }}
      />  
      <Drawer.Screen
        name="workouts"
        options={{
          title: "Workouts",
          drawerIcon: ({ size, color }) => <Ionicons name="barbell-outline" size={size} color={color} />,
        }}
      />
      <Drawer.Screen
        name="calculator"
        options={{
          title: "1RM Calculator",
          drawerIcon: ({ size, color }) => <Ionicons name="calculator-outline" size={size} color={color} />,
        }}
      />
      <Drawer.Screen
        name="weight"
        options={{
          title: "Weight Check-In",
          drawerIcon: ({ size, color }) => <Ionicons name="trending-down-outline" size={size} color={color} />,
        }}
      />
      <Drawer.Screen
        name="profile"
        options={{
          title: "Profile",
          drawerItemStyle: { display: "none" }, // Hide from drawer menu
          drawerIcon: ({ size, color }) => <Ionicons name="person-circle-outline" size={size} color={color} />,
        }}
      />
      </Drawer>
  );
}
