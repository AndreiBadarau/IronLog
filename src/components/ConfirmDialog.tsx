import React from "react";
import {
  GestureResponderEvent,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

type Intent = "default" | "danger" | "success" | "warning";

type BtnOverride = {
  container?: object;
  text?: object;
};

type Props = {
  visible: boolean;
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: (e?: GestureResponderEvent) => void;
  onCancel: (e?: GestureResponderEvent) => void;
  /** quick theme switch: red/green/etc */
  intent?: Intent;
  /** optional style overrides */
  confirmStyle?: BtnOverride;
  cancelStyle?: BtnOverride;
  /** swap buttons order (e.g., confirm on the left) */
  reverseButtons?: boolean;
  /** hide cancel button if needed */
  hideCancel?: boolean;
  /** disable closing when tapping the backdrop */
  disableBackdropClose?: boolean;
};

const palette = {
  surface: "#080b11ff", // card bg
  surfaceText: "#FFFFFF",
  subtleText: "#D1D5DB",

  defaultConfirmBg: "#3B82F6",
  defaultConfirmText: "#FFFFFF",

  dangerConfirmBg: "#DC2626",
  dangerConfirmText: "#FFFFFF",

  successConfirmBg: "#10B981",
  successConfirmText: "#0B1F17",

  warningConfirmBg: "#F59E0B",
  warningConfirmText: "#1F1300",

  cancelText: "#9CA3AF",
};

export default function ConfirmDialog({
  visible,
  title,
  message,
  confirmText = "OK",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  intent = "default",
  confirmStyle,
  cancelStyle,
  reverseButtons = false,
  hideCancel = false,
  disableBackdropClose = false,
}: Props) {
  const scheme = getScheme(intent);

  const Buttons = (
    <View
      style={[
        styles.actions,
        reverseButtons && { flexDirection: "row-reverse" },
      ]}
    >
      {!hideCancel && (
        <Pressable
          onPress={onCancel}
          style={[styles.btn, styles.btnGhost, cancelStyle?.container]}
        >
          <Text style={[styles.btnGhostText, cancelStyle?.text]}>
            {cancelText}
          </Text>
        </Pressable>
      )}
      <Pressable
        onPress={onConfirm}
        style={[
          styles.btn,
          { backgroundColor: scheme.confirmBg },
          confirmStyle?.container,
        ]}
      >
        <Text
          style={[
            styles.btnSolidText,
            { color: scheme.confirmText },
            confirmStyle?.text,
          ]}
        >
          {confirmText}
        </Text>
      </Pressable>
    </View>
  );

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={onCancel}
    >
      <View style={styles.backdrop}>
        <Pressable
          style={{ flex: 1 }}
          onPress={disableBackdropClose ? undefined : onCancel}
        />
        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          {!!message && <Text style={styles.message}>{message}</Text>}
          {Buttons}
        </View>
        <Pressable
          style={{ flex: 1 }}
          onPress={disableBackdropClose ? undefined : onCancel}
        />
      </View>
    </Modal>
  );
}

function getScheme(intent: Intent) {
  switch (intent) {
    case "danger":
      return {
        confirmBg: palette.dangerConfirmBg,
        confirmText: palette.dangerConfirmText,
      };
    case "success":
      return {
        confirmBg: palette.successConfirmBg,
        confirmText: palette.successConfirmText,
      };
    case "warning":
      return {
        confirmBg: palette.warningConfirmBg,
        confirmText: palette.warningConfirmText,
      };
    default:
      return {
        confirmBg: palette.defaultConfirmBg,
        confirmText: palette.defaultConfirmText,
      };
  }
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    width: "86%",
    backgroundColor: palette.surface,
    borderRadius: 16,
    padding: 16,
  },
  title: { color: palette.surfaceText, fontSize: 18, fontWeight: "700" },
  message: {
    color: palette.subtleText,
    fontSize: 14,
    marginTop: 8,
    marginBottom: 16,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
  },
  btn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 12 },
  btnGhost: { backgroundColor: "transparent" },
  btnGhostText: { color: palette.cancelText, fontWeight: "600" },
  btnSolidText: { fontWeight: "700" },
});
