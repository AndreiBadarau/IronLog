import React from "react";
import { Platform, StatusBar as RNStatusBar, View, ViewProps } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Props = ViewProps & { children: React.ReactNode };

export default function Screen({ children, style, ...rest }: Props) {
  const insets = useSafeAreaInsets();
  // On iOS: insets.top is the notch height. On Android with translucent bars,
  // currentHeight is a good fallback.
  const topPad = Platform.OS === "android" ? (RNStatusBar.currentHeight ?? 0) : insets.top;
  const bottomPad = insets.bottom; // useful if you have bottom bars later

  return (
    <View
      {...rest}
      style={[
        { flex: 1, paddingTop: topPad, paddingBottom: bottomPad, backgroundColor: "#0B0B0B" },
        style,
      ]}
    >
      {children}
    </View>
  );
}
