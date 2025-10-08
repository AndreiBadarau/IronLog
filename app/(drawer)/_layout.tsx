// ../../(tabs)/_layout.tsx
import { Ionicons } from "@expo/vector-icons";
import { Drawer } from "expo-router/drawer";
import AppDrawerContent from "../../src/components/AppDrawerContent";

export default function DrawerLayout() {
  return (
    <Drawer
      initialRouteName="workouts"
      screenOptions={{
        headerShown: true,
        drawerType: "front",
        // Make the whole drawer one color
        drawerStyle: { width: 240, backgroundColor: "#111"},
        drawerContentStyle: { backgroundColor: "#111"},
        // Scene background color
        sceneStyle: { backgroundColor: "#fff" },
        // Colors for drawer items
        drawerActiveTintColor: "#fff",
        drawerInactiveTintColor: "#aaa",
        drawerActiveBackgroundColor: "#333",
        drawerInactiveBackgroundColor: "#111",
        // Header style
        headerStyle: { backgroundColor: "#fff" },
        headerTitleStyle: { color: "black", fontWeight: "600" },
        headerTintColor: "black",
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
