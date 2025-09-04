import React, { useRef, useState } from "react";
import { Modal, View, StyleSheet, TouchableOpacity, Text, Platform } from "react-native";
import { Video, ResizeMode, AVPlaybackStatusSuccess } from "expo-av";
import colors from "@/constants/colors";

interface Props {
  visible: boolean;
  sourceUrl: string;
  onClose: (markSeen: boolean) => void;
}

export default function WelcomeVideoModal({ visible, sourceUrl, onClose }: Props) {
  const videoRef = useRef<Video | null>(null);
  const [progress, setProgress] = useState(0);

  const onStatusUpdate = (status: AVPlaybackStatusSuccess) => {
    if (!status.isLoaded || !status.durationMillis) return;
    const pct = status.positionMillis / status.durationMillis;
    setProgress(pct);
  };

  // Treat dismiss (X) as "seen" so it won't reappear
  const handleClose = () => onClose(true);

  return (
    <Modal visible={visible} animationType="fade" transparent={false} onRequestClose={handleClose}>
      <View style={styles.container}>
        <Video
          ref={(r) => (videoRef.current = r)}
          style={styles.video}
          source={{ uri: sourceUrl }}
          resizeMode={ResizeMode.CONTAIN}
          shouldPlay
          isMuted
          useNativeControls
          progressUpdateIntervalMillis={400}
          onPlaybackStatusUpdate={(s) => {
            if ("isLoaded" in s && s.isLoaded) onStatusUpdate(s);
          }}
        />

        <TouchableOpacity style={styles.closeBtn} onPress={handleClose} accessibilityLabel="Close welcome video">
          <Text style={styles.closeText}>×</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.skipBtn} onPress={() => onClose(true)}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000", justifyContent: "center", alignItems: "center" },
  video: { width: "100%", height: "100%", backgroundColor: "#000" },
  closeBtn: {
    position: "absolute",
    top: Platform.select({ ios: 50, android: 20 }) as number,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
  },
  closeText: { color: "#fff", fontSize: 26, fontWeight: "800" as const, lineHeight: 26 },
  skipBtn: {
    position: "absolute",
    bottom: 40,
    alignSelf: "center",
    backgroundColor: colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 22,
  },
  skipText: { color: "#fff", fontWeight: "700" as const },
});


