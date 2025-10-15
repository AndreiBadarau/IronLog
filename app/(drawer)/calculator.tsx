import BackgroundWrapper from "@/src/components/BackgroundWrapper";
import { useHeaderHeight } from "@react-navigation/elements";
import { Text, View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";

export default function CalculatorScreen() {

  const headerHeight = useHeaderHeight();

  return (
    <BackgroundWrapper>
      <ScrollView style={{ flex: 1, paddingTop: headerHeight - 25 }}>
      <View style={{ flex: 1, padding: 16 }}>
        <Text style={{ fontSize: 22, fontWeight: "700" }}>1RM Calculator</Text>
      </View>
      </ScrollView>
    </BackgroundWrapper>
  );
}
