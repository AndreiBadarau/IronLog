import BackgroundWrapper from "@/src/components/BackgroundWrapper";
import { useHeaderHeight } from "@react-navigation/elements";
import { useState } from "react";
import { ActivityIndicator, Alert, Image, Pressable, Text, View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import Screen from "../../src/components/Screen";
import { useAuth } from "../../src/providers/AuthProvider";
import { pickAndUploadProfilePhoto } from "../../src/services/profilePhoto";

//TODO: add more profile features (birthdate, etc.)

export default function ProfileScreen() {
  const { user, reloadUser } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const headerHeight = useHeaderHeight();

  const changePhoto = async () => {
    try {
      setUploading(true);
      setProgress(0);
      const url = await pickAndUploadProfilePhoto(setProgress);
      if (url) await reloadUser();
    } catch (e: any) {
      Alert.alert("Upload failed", e?.message ?? "Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Screen>
      <BackgroundWrapper>
        <ScrollView style={{ flex: 1, paddingTop: headerHeight - 25 }}>
      <View style={{ padding: 20, alignItems: "center", gap: 16 }}>
        <Image
          source={
            user?.photoURL
              ? { uri: user.photoURL }
              : require("../../assets/images/avatar-placeholder.png")
          }
          style={{ width: 120, height: 120, borderRadius: 60, backgroundColor: "#222" }}
        />
        <Text style={{ color: "white", fontSize: 20, fontWeight: "700" }}>
          {user?.displayName || "Athlete"}
        </Text>
        {!!user?.email && <Text style={{ color: "#aaa" }}>{user.email}</Text>}

        <Pressable
          onPress={changePhoto}
          disabled={uploading}
          style={{
            backgroundColor: "#0E2A3A",
            paddingVertical: 12,
            paddingHorizontal: 18,
            borderRadius: 999,
            opacity: uploading ? 0.7 : 1,
          }}
        >
          {uploading ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <ActivityIndicator color="#fff" />
              <Text style={{ color: "white", fontWeight: "600" }}>
                Uploading {Math.round(progress * 100)}%
              </Text>
            </View>
          ) : (
            <Text style={{ color: "white", fontWeight: "600" }}>Change profile photo</Text>
          )}
        </Pressable>
      </View>
      </ScrollView>
      </BackgroundWrapper>
    </Screen>
  );
}
