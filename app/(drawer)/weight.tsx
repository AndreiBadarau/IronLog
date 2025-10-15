import BackgroundWrapper from "@/src/components/BackgroundWrapper";
import { useHeaderHeight } from "@react-navigation/elements";
import { ScrollView, Text, View } from "react-native";

export default function WeightScreen() {
  const headerHeight = useHeaderHeight();
  return (
    <BackgroundWrapper>
      <ScrollView style={{ flex: 1, paddingTop: headerHeight - 25 }}>
        <View style={{ flex: 1, padding: 16 }}>
          <Text style={{ fontSize: 22, fontWeight: "700" }}>Weight Log</Text>
        </View>
      </ScrollView>
    </BackgroundWrapper>
  );
}
