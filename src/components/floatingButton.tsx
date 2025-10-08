import { Ionicons } from "@expo/vector-icons";
import { DrawerActions, useNavigation } from "@react-navigation/native";
import { Pressable } from "react-native";

export function FloatingMenuButton() {
  const nav = useNavigation();
  return (
    <Pressable
      onPress={() => nav.dispatch(DrawerActions.openDrawer())}
      style={{
        position: "absolute", top: 16, left: 16, zIndex: 10,
        width: 44, height: 44, borderRadius: 22,
        backgroundColor: "rgba(0,0,0,0.6)", alignItems: "center", justifyContent: "center"
      }}
    >
      <Ionicons name="menu" size={22} color="#fff" />
    </Pressable>
  );
}
