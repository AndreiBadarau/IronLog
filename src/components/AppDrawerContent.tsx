// components/AppDrawerContent.tsx
import { Ionicons } from "@expo/vector-icons";
import {
  DrawerContentScrollView,
  DrawerItemList,
} from "@react-navigation/drawer";
import { Image, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../providers/AuthProvider";

const ACTIVE_BG = "#323232";
const ACTIVE_TINT = "#FFFFFF";
const INACTIVE_BG = "#111";
//const SUBTLE = "#aaa";
const translucent = "rgba(0, 0, 0, 0.75)";

// Quick stat card component
function StatCard({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={{
      flex: 1,
      backgroundColor: "#1a1a1a",
      borderRadius: 8,
      padding: 8,
      alignItems: "center",
      borderWidth: 1,
      borderColor: "#2a2a2a"
    }}>
      <Ionicons name={icon as any} size={16} color="#2EA0FF" style={{ marginBottom: 2 }} />
      <Text style={{ color: "#fff", fontSize: 12, fontWeight: "600" }}>{value}</Text>
      <Text style={{ color: "#888", fontSize: 10 }}>{label}</Text>
    </View>
  );
}

export default function AppDrawerContent(props: any) {
  const { user, logOut } = useAuth();
  const { top, bottom } = useSafeAreaInsets();

  const displayName = user?.displayName || "Athlete";
  const photo = user?.photoURL || undefined;

  const currentRoute =
    props.state?.routeNames?.[props.state?.index ?? 0] ?? "workouts";
  const isProfileRoute = currentRoute === "profile";

  const goToProfile = () => {
    if (!isProfileRoute) {
      props.navigation.navigate("profile");
    }
    props.navigation.closeDrawer();
  };

  //TODO: fetch real stats from Firestore, for now using placeholders
  //TODO: make more statCard so users can select which ones to show

  return (
    <View style={{ flex: 1, backgroundColor: translucent }}>
      <DrawerContentScrollView
        {...props}
        style={{ backgroundColor: translucent }}
        contentContainerStyle={{ paddingTop: top }}
      >
        {/* PROFILE HEADER — tap anywhere to open Profile */}
        <Pressable
          onPress={goToProfile}
          android_ripple={{ color: "#1a1a1a", borderless: false }}
          // accessibilityRole="button"
          style={({ pressed }) => [
            {
              marginHorizontal: 12,
              marginTop: 8,
              padding: 12,
              borderRadius: 16,
              backgroundColor: isProfileRoute ? ACTIVE_BG : INACTIVE_BG,
              opacity: pressed ? 0.9 : 1,
              borderBottomWidth: 1,
              borderBottomColor: "#1e1e1e",
            },
          ]}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <Image
              source={
                photo
                  ? { uri: photo }
                  : require("../../assets/images/avatar-placeholder.png") // add a placeholder image into /assets
              }
              style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: translucent,
              }}
            />
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  color: isProfileRoute ? ACTIVE_TINT : "#a2a2a2",
                  fontSize: 16,
                  fontWeight: "700",
                  textAlign: "center",
                  justifyContent: "center",
                }}
                numberOfLines={2}
              >
                {displayName}
              </Text>
              
            </View>
            <Ionicons name="chevron-forward" size={20} color="#aaa" />
          </View>
        </Pressable>

        {/* Quick Stats Row */} 
        <View style={{ 
          flexDirection: "row", 
          gap: 8, 
          marginHorizontal: 12,
          marginTop: 12,
          marginBottom: 8 
        }}>
          <StatCard icon="barbell-outline" label="Biggest Lift" value="155 kg" />
          <StatCard icon="trending-up-outline" label="Volume" value="4.2k kg" />
        </View>

        {/* Drawer items */}
        <View style={{ backgroundColor: translucent, flex: 1 }}>
          <DrawerItemList {...props} />
        </View>
      </DrawerContentScrollView>

      {/* Footer actions */}
      <View
        style={{
          paddingHorizontal: 16,
          paddingBottom: bottom + 12,
          borderTopWidth: 1,
          borderTopColor: "#1e1e1e",
        }}
      >
        <Pressable
          onPress={logOut}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            paddingVertical: 12,
          }}
        >
          <Ionicons name="log-out-outline" size={20} color="#ff6666" />
          <Text style={{ color: "#ff6666", fontWeight: "600" }}>Sign out</Text>
        </Pressable>
      </View>
    </View>
  );
}
