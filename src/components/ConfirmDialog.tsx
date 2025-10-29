import React from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

type Props = {
  visible: boolean;
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmDialog({
  visible,
  title,
  message,
  confirmText = "Remove",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
}: Props) {
  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={onCancel}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          {!!message && <Text style={styles.message}>{message}</Text>}

          <View style={styles.actions}>
            <Pressable onPress={onCancel} style={[styles.btn, styles.btnGhost]}>
              <Text style={styles.btnGhostText}>{cancelText}</Text>
            </Pressable>
            <Pressable
              onPress={onConfirm}
              style={[styles.btn, styles.btnDanger]}
            >
              <Text style={styles.btnDangerText}>{confirmText}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
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
    backgroundColor: "#080b11ff",
    borderRadius: 16,
    padding: 16,
  },
  title: { color: "white", fontSize: 18, fontWeight: "600", marginBottom: 6 },
  message: { color: "#D1D5DB", fontSize: 14, marginBottom: 16 },
  actions: { flexDirection: "row", justifyContent: "flex-end", gap: 8 },
  btn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 12 },
  btnGhost: { backgroundColor: "transparent" },
  btnGhostText: { color: "#9CA3AF", fontWeight: "600" },
  btnDanger: { backgroundColor: "#DC2626" },
  btnDangerText: { color: "white", fontWeight: "700" },
});
