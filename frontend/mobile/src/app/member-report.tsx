import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { coachApi, type MemberReportResponse } from '../services/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const COLORS = {
  bg: '#090605',
  card: '#17100c',
  cardLight: '#21170f',
  accent: '#f3c99f',
  muted: '#a8927c',
  text: '#f8f3ee',
  border: 'rgba(255,255,255,0.09)',
  danger: '#fca5a5',
  success: '#6ee7b7'
};

export default function MemberReportMobileScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const memberId = params.memberId as string;
  const { token } = useAuth();

  const [report, setReport] = useState<MemberReportResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const authToken = token;
    if (!authToken || !memberId) return;

    async function loadReport() {
      try {
        setLoading(true);
        setError(null);
        const data = await coachApi.getMemberReports(memberId, authToken!);
        setReport(data);
      } catch (err: any) {
        if (err?.status === 403 || err?.message?.includes('Forbidden') || err?.message?.includes('not assigned')) {
          setError('403 Forbidden: You are not authorized to view reports for this member.');
        } else {
          setError(err?.message || 'Failed to load member reports');
        }
      } finally {
        setLoading(false);
      }
    }

    loadReport();
  }, [token, memberId]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Member Progress Report</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {loading ? (
          <ActivityIndicator size="large" color={COLORS.accent} style={{ marginTop: 40 }} />
        ) : error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorTitle}>Access Restricted</Text>
            <Text style={styles.errorMsg}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
              <Text style={styles.retryButtonText}>Return to Roster</Text>
            </TouchableOpacity>
          </View>
        ) : report ? (
          <>
            {/* Member Profile */}
            <View style={styles.profileCard}>
              <Text style={styles.profileName}>{report.member.name}</Text>
              <Text style={styles.profileEmail}>{report.member.email}</Text>
              <Text style={styles.profileGoal}>Primary Goal: {report.member.primaryGoal}</Text>
            </View>

            {/* Engagement Metrics */}
            <View style={styles.metricsRow}>
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>Streak</Text>
                <Text style={[styles.metricValue, { color: COLORS.accent }]}>
                  {report.engagementSummary.streakDays}d
                </Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>Check-ins</Text>
                <Text style={styles.metricValue}>
                  {report.engagementSummary.totalCheckIns}
                </Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>Adherence</Text>
                <Text style={[styles.metricValue, { color: COLORS.success }]}>
                  {Math.round(report.engagementSummary.adherenceRate * 100)}%
                </Text>
              </View>
            </View>

            {/* Workout History */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Workout Session History</Text>
              {report.workoutHistory.length === 0 ? (
                <Text style={styles.emptyText}>No workout sessions recorded.</Text>
              ) : (
                report.workoutHistory.map((w) => (
                  <View key={w.id} style={styles.rowItem}>
                    <View>
                      <Text style={styles.rowTitle}>{w.metadata?.name || 'Workout Session'}</Text>
                      <Text style={styles.rowSub}>
                        {new Date(w.startTime).toLocaleDateString()} • {new Date(w.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>
                    <Text style={styles.badgeText}>{w.durationMinutes} mins</Text>
                  </View>
                ))
              )}
            </View>

            {/* Nutrition Overview */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Nutrition & Meals</Text>
              {report.nutritionOverview.length === 0 ? (
                <Text style={styles.emptyText}>No meal entries logged.</Text>
              ) : (
                report.nutritionOverview.map((n) => (
                  <View key={n.id} style={styles.rowItem}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.rowTitle} numberOfLines={1}>{n.rawText || 'Logged meal'}</Text>
                      <Text style={styles.rowSub}>{new Date(n.consumedAt).toLocaleDateString()}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={styles.badgeText}>{n.totalCalories} kcal</Text>
                      <Text style={styles.rowSub}>{n.totalProteinG}g protein</Text>
                    </View>
                  </View>
                ))
              )}
            </View>

            {/* Check-in History */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Check-in Milestones</Text>
              {report.checkInHistory.length === 0 ? (
                <Text style={styles.emptyText}>No check-ins recorded.</Text>
              ) : (
                report.checkInHistory.map((c) => (
                  <View key={c.id} style={styles.rowItem}>
                    <View>
                      <Text style={styles.rowTitle}>{new Date(c.checkInDate).toLocaleDateString()}</Text>
                      {c.notes ? <Text style={styles.rowSub}>{c.notes}</Text> : null}
                    </View>
                    <Text style={[styles.badgeText, { color: COLORS.success }]}>{c.participationStatus}</Text>
                  </View>
                ))
              )}
            </View>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.card
  },
  backButton: {
    paddingVertical: 4,
    paddingHorizontal: 8
  },
  backButtonText: {
    color: COLORS.accent,
    fontSize: 14,
    fontWeight: '700'
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text
  },
  scrollContent: {
    padding: 16,
    gap: 16
  },
  errorBox: {
    padding: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    alignItems: 'center',
    gap: 8,
    marginTop: 40
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.danger
  },
  errorMsg: {
    fontSize: 12,
    color: COLORS.danger,
    textAlign: 'center'
  },
  retryButton: {
    marginTop: 8,
    backgroundColor: COLORS.accent,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8
  },
  retryButtonText: {
    color: '#1a0d04',
    fontSize: 12,
    fontWeight: '700'
  },
  profileCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 4
  },
  profileName: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text
  },
  profileEmail: {
    fontSize: 12,
    color: COLORS.muted
  },
  profileGoal: {
    fontSize: 12,
    color: COLORS.accent,
    marginTop: 4
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 8
  },
  metricCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center'
  },
  metricLabel: {
    fontSize: 11,
    color: COLORS.muted
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
    marginTop: 4
  },
  section: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 8
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4
  },
  emptyText: {
    fontSize: 12,
    color: COLORS.muted,
    fontStyle: 'italic'
  },
  rowItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border
  },
  rowTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text
  },
  rowSub: {
    fontSize: 11,
    color: COLORS.muted
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.accent
  }
});
