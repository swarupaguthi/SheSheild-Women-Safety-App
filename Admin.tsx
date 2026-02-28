import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import type { ReportStatus } from "@/types/safety";
import { useSafety } from "@/providers/safety-provider";

const statuses: ReportStatus[] = ["Pending", "Verified", "Forwarded", "Resolved"];

export default function AdminScreen() {
  const { reports, sosLogs, stats, updateReportStatus } = useSafety();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} testID="admin-screen">
      <Text style={styles.title}>Admin Dashboard</Text>

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.totalReports}</Text>
          <Text style={styles.statLabel}>Total Reports</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.pending}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.resolved}</Text>
          <Text style={styles.statLabel}>Resolved</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{sosLogs.length}</Text>
          <Text style={styles.statLabel}>SOS Logs</Text>
        </View>
      </View>

      <View style={styles.sectionCard} testID="heatmap-card">
        <Text style={styles.sectionTitle}>Incident Heat Map (preview)</Text>
        <View style={styles.heatRow}>
          {reports.slice(0, 14).map((report) => (
            <View
              key={report.id}
              style={[
                styles.heatDot,
                report.status === "Resolved" ? styles.heatLow : report.status === "Forwarded" ? styles.heatMid : styles.heatHigh,
              ]}
            />
          ))}
          {reports.length === 0 ? <Text style={styles.emptyText}>No incidents yet.</Text> : null}
        </View>
      </View>

      <View style={styles.sectionCard} testID="reports-list">
        <Text style={styles.sectionTitle}>Reports</Text>
        {reports.length === 0 ? <Text style={styles.emptyText}>No reports submitted yet.</Text> : null}
        {reports.map((report) => (
          <View key={report.id} style={styles.reportCard} testID={`admin-report-${report.id}`}>
            <Text style={styles.reportMeta}>{new Date(report.createdAt).toLocaleString()}</Text>
            <Text style={styles.reportDescription}>{report.description}</Text>
            <Text style={styles.reportMeta}>Location: {report.locationLabel}</Text>
            {report.vehicleNumber ? <Text style={styles.reportMeta}>Vehicle: {report.vehicleNumber}</Text> : null}
            {report.instagramAccount ? <Text style={styles.reportMeta}>Instagram: {report.instagramAccount}</Text> : null}
            {report.phoneNumber ? <Text style={styles.reportMeta}>Phone: {report.phoneNumber}</Text> : null}
            <Text style={styles.reportMeta}>Submitted as: {report.anonymous ? "Anonymous" : "Known User"}</Text>
            <Text style={styles.reportStatus}>Status: {report.status}</Text>

            <View style={styles.statusRow}>
              {statuses.map((status) => (
                <Pressable
                  key={status}
                  onPress={() => updateReportStatus(report.id, status)}
                  style={[styles.statusBtn, report.status === status ? styles.statusBtnActive : undefined]}
                  testID={`set-status-${report.id}-${status}`}
                >
                  <Text style={styles.statusBtnText}>{status}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        ))}
      </View>

      <View style={styles.sectionCard} testID="sos-logs-list">
        <Text style={styles.sectionTitle}>SOS Alert Logs</Text>
        {sosLogs.length === 0 ? <Text style={styles.emptyText}>No SOS logs yet.</Text> : null}
        {sosLogs.slice(0, 8).map((log) => (
          <View key={log.id} style={styles.logCard}>
            <Text style={styles.reportMeta}>Started: {new Date(log.startedAt).toLocaleString()}</Text>
            <Text style={styles.reportMeta}>Stopped: {log.stoppedAt ? new Date(log.stoppedAt).toLocaleString() : "Active"}</Text>
            <Text style={styles.reportMeta}>Recipients: {log.recipients.join(", ")}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fbf9ff" },
  content: { padding: 16, gap: 12, paddingBottom: 30 },
  title: { fontSize: 25, fontWeight: "800", color: "#2a1345" },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  statCard: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 12,
    gap: 3,
  },
  statValue: { fontSize: 20, fontWeight: "900", color: "#32175a" },
  statLabel: { color: "#6a5890", fontWeight: "600" },
  sectionCard: { backgroundColor: "#fff", borderRadius: 16, padding: 14, gap: 10 },
  sectionTitle: { fontWeight: "800", color: "#2f174d", fontSize: 16 },
  heatRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, alignItems: "center" },
  heatDot: { width: 18, height: 18, borderRadius: 9 },
  heatLow: { backgroundColor: "#22c55e" },
  heatMid: { backgroundColor: "#f59e0b" },
  heatHigh: { backgroundColor: "#ef4444" },
  reportCard: { borderWidth: 1, borderColor: "#e7defa", borderRadius: 14, padding: 10, gap: 6 },
  reportMeta: { color: "#5f4a83", fontSize: 12 },
  reportDescription: { color: "#2f174d", fontWeight: "700" },
  reportStatus: { color: "#32175a", fontWeight: "800" },
  statusRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  statusBtn: { borderRadius: 999, backgroundColor: "#efe7ff", paddingHorizontal: 10, paddingVertical: 6 },
  statusBtnActive: { backgroundColor: "#6a34d8" },
  statusBtnText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  logCard: { borderWidth: 1, borderColor: "#e7defa", borderRadius: 12, padding: 10, gap: 4 },
  emptyText: { color: "#7a64a6" },
});
