import * as ImagePicker from "expo-image-picker";
import React, { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";

import { useSafety } from "@/providers/safety-provider";

export default function ReportScreen() {
  const { submitReport, refreshLocation, currentLocation } = useSafety();
  const [description, setDescription] = useState<string>("");
  const [vehicleNumber, setVehicleNumber] = useState<string>("");
  const [instagramAccount, setInstagramAccount] = useState<string>("");
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [anonymous, setAnonymous] = useState<boolean>(true);
  const [imageUri, setImageUri] = useState<string | null>(null);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.6,
    });

    if (!result.canceled && result.assets.length > 0) {
      setImageUri(result.assets[0]?.uri ?? null);
    }
  };

  const handleSubmit = () => {
    if (description.trim().length < 12) {
      Alert.alert("Add details", "Please provide a clear description with at least 12 characters.");
      return;
    }

    submitReport({ description, vehicleNumber, instagramAccount, phoneNumber, imageUri, anonymous });
    setDescription("");
    setVehicleNumber("");
    setInstagramAccount("");
    setPhoneNumber("");
    setImageUri(null);
    Alert.alert("Report submitted", "Your report has been securely stored for admin review.");
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} testID="report-screen">
      <Text style={styles.title}>Anonymous Reporting</Text>
      <Text style={styles.subtitle}>Help stop trafficking by reporting suspicious activities safely.</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Description</Text>
        <TextInput
          value={description}
          onChangeText={setDescription}
          style={styles.input}
          multiline
          placeholder="Describe what happened, persons involved, and time"
          testID="report-description-input"
        />

        <Text style={styles.label}>Vehicle Number (optional)</Text>
        <TextInput
          value={vehicleNumber}
          onChangeText={setVehicleNumber}
          style={styles.singleLineInput}
          placeholder="e.g. DL 01 AB 1234"
          autoCapitalize="characters"
          testID="report-vehicle-number-input"
        />

        <Text style={styles.label}>Instagram Account (optional)</Text>
        <TextInput
          value={instagramAccount}
          onChangeText={setInstagramAccount}
          style={styles.singleLineInput}
          placeholder="e.g. @suspicious_account"
          autoCapitalize="none"
          testID="report-instagram-input"
        />

        <Text style={styles.label}>Phone Number (optional)</Text>
        <TextInput
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          style={styles.singleLineInput}
          placeholder="e.g. +91 9876543210"
          keyboardType="phone-pad"
          autoCapitalize="none"
          testID="report-phone-input"
        />

        <Text style={styles.label}>Location</Text>
        <Text style={styles.locationValue} testID="report-location-label">
          {currentLocation.label}
        </Text>
        <Pressable style={styles.secondaryButton} onPress={refreshLocation} testID="refresh-location-button">
          <Text style={styles.secondaryButtonText}>Auto-detect location</Text>
        </Pressable>

        <Pressable style={styles.secondaryButton} onPress={pickImage} testID="upload-image-button">
          <Text style={styles.secondaryButtonText}>{imageUri ? "Image selected" : "Upload optional image"}</Text>
        </Pressable>

        <View style={styles.switchRow}>
          <Text style={styles.switchText}>Submit anonymously</Text>
          <Switch value={anonymous} onValueChange={setAnonymous} testID="anonymous-switch" />
        </View>

        <Pressable style={styles.submitButton} onPress={handleSubmit} testID="submit-report-button">
          <Text style={styles.submitText}>Submit Report</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fbf9ff" },
  content: { padding: 16, gap: 12 },
  title: { fontSize: 26, fontWeight: "800", color: "#2a1345" },
  subtitle: { color: "#654f89" },
  card: { backgroundColor: "#fff", borderRadius: 16, padding: 14, gap: 10 },
  label: { fontWeight: "700", color: "#3b2263" },
  input: {
    borderWidth: 1,
    borderColor: "#dfd2f7",
    borderRadius: 12,
    minHeight: 130,
    textAlignVertical: "top",
    padding: 10,
    color: "#2f174d",
  },
  singleLineInput: {
    borderWidth: 1,
    borderColor: "#dfd2f7",
    borderRadius: 12,
    height: 44,
    paddingHorizontal: 10,
    color: "#2f174d",
  },
  locationValue: {
    backgroundColor: "#f4edff",
    borderRadius: 10,
    padding: 10,
    color: "#472e71",
    fontWeight: "600",
  },
  secondaryButton: { backgroundColor: "#efe7ff", borderRadius: 12, paddingVertical: 10, alignItems: "center" },
  secondaryButtonText: { color: "#4a2d7d", fontWeight: "700" },
  switchRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  switchText: { color: "#412967", fontWeight: "700" },
  submitButton: { backgroundColor: "#6a34d8", borderRadius: 14, paddingVertical: 13, alignItems: "center" },
  submitText: { color: "#fff", fontWeight: "800" },
});
