import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import {
  coachApi,
  type CoachRosterMember,
  type CoachFeedbackItem,
  type CoachMetricsResponse
} from '../services/api';

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
  success: '#6ee7b7',
  warning: '#fcd34d'
};

export default function CoachMobileScreen() {
  const router = useRouter();
  const { user, token, logout } = useAuth();

  const [members, setMembers] = useState<CoachRosterMember[]>([]);
  const [feedbackQueue, setFeedbackQueue] = useState<CoachFeedbackItem[]>([]);
  const [metrics, setMetrics] = useState<CoachMetricsResponse>({
    totalClients: 0,
    activeClients: 0,
    adherenceRate: 1.0,
    pendingReviews: 0
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Active reply state
  const [replyId, setReplyId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isSending, setIsSending] = useState(false);

  const loadData = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      setError(null);

      const [rosterRes, queueRes, metricsRes] = await Promise.allSettled([
        coachApi.getRoster(token),
        coachApi.getFeedbackQueue(token),
        coachApi.getMetrics(token)
      ]);

      if (rosterRes.status === 'fulfilled' && rosterRes.value?.members) {
        setMembers(rosterRes.value.members);
      }
      if (queueRes.status === 'fulfilled' && queueRes.value?.queue) {
        setFeedbackQueue(queueRes.value.queue);
      }
      if (metricsRes.status === 'fulfilled' && metricsRes.value) {
        setMetrics(metricsRes.value);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load coach dashboard');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSendReply = async (feedbackRequestId: string) => {
    if (!token || !replyText.trim()) return;
    try {
      setIsSending(true);
      await coachApi.sendFeedbackReply(feedbackRequestId, replyText, token);
      Alert.alert('Success', 'Feedback response sent to member.');
      setReplyId(null);
      setReplyText('');
      await loadData();
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to send feedback');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />

      {/* Top App Bar */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSub}>COACH COMMAND CENTER</Text>
          <Text style={styles.headerTitle}>{user?.displayName || 'Coach'}</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.switchButton}
            onPress={() => router.replace('/dashboard')}
          >
            <Text style={styles.switchButtonText}>Member View</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={loadData}>
            <Text style={styles.iconButtonText}>↻</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {error ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Metrics Grid */}
        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Total Clients</Text>
            <Text style={styles.metricValue}>{metrics.totalClients}</Text>
            <Text style={styles.metricSub}>Assigned roster</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Active</Text>
            <Text style={[styles.metricValue, { color: COLORS.success }]}>{metrics.activeClients}</Text>
            <Text style={styles.metricSub}>Past 7 days</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Adherence</Text>
            <Text style={[styles.metricValue, { color: COLORS.accent }]}>
              {Math.round(metrics.adherenceRate * 100)}%
            </Text>
            <Text style={styles.metricSub}>Habit completion</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Pending</Text>
            <Text style={[styles.metricValue, { color: COLORS.warning }]}>{metrics.pendingReviews}</Text>
            <Text style={styles.metricSub}>Reviews waiting</Text>
          </View>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={COLORS.accent} style={{ marginTop: 40 }} />
        ) : (
          <>
            {/* Feedback Queue */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Pending Feedback Inquiries</Text>
              <Text style={styles.sectionSub}>Questions and reviews submitted by clients</Text>

              {feedbackQueue.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyText}>✓ All feedback inquiries cleared!</Text>
                </View>
              ) : (
                feedbackQueue.map((item) => (
                  <View key={item.id} style={styles.feedbackCard}>
                    <View style={styles.feedbackHeader}>
                      <Text style={styles.feedbackMemberName}>{item.memberName}</Text>
                      <View style={styles.statusBadge}>
                        <Text style={styles.statusBadgeText}>{item.status}</Text>
                      </View>
                    </View>
                    <Text style={styles.feedbackTopic}>{item.topic}</Text>
                    {item.context ? (
                      <Text style={styles.feedbackContext}>{item.context}</Text>
                    ) : null}

                    {replyId === item.id ? (
                      <View style={styles.replyBox}>
                        <TextInput
                          style={styles.replyInput}
                          placeholder="Type advice or adjustments for member..."
                          placeholderTextColor={COLORS.muted}
                          value={replyText}
                          onChangeText={setReplyText}
                          multiline
                        />
                        <View style={styles.replyActions}>
                          <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={() => { setReplyId(null); setReplyText(''); }}
                          >
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.sendButton}
                            disabled={isSending || !replyText.trim()}
                            onPress={() => handleSendReply(item.id)}
                          >
                            <Text style={styles.sendButtonText}>{isSending ? 'Sending...' : 'Send Reply'}</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={styles.replyTrigger}
                        onPress={() => { setReplyId(item.id); setReplyText(''); }}
                      >
                        <Text style={styles.replyTriggerText}>Reply to Member →</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ))
              )}
            </View>

            {/* Client Roster */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Assigned Client Roster</Text>
              <Text style={styles.sectionSub}>Select a member to view comprehensive clinical reports</Text>

              {members.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyText}>No assigned members in roster yet.</Text>
                </View>
              ) : (
                members.map((m) => (
                  <View key={m.id} style={styles.memberCard}>
                    <View style={styles.memberInfo}>
                      <Text style={styles.memberName}>{m.name}</Text>
                      <Text style={styles.memberEmail}>{m.email}</Text>
                      <Text style={styles.memberGoal}>Goal: {m.primaryGoal}</Text>
                      <View style={styles.memberStatsRow}>
                        <Text style={styles.memberStat}>Streak: <Text style={{ color: COLORS.accent, fontWeight: '700' }}>{m.currentStreak}d</Text></Text>
                        <Text style={styles.memberStat}>Adherence: <Text style={{ color: COLORS.success, fontWeight: '700' }}>{Math.round(m.adherenceRate * 100)}%</Text></Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      style={styles.viewReportButton}
                      onPress={() => router.push({ pathname: '/member-report' as any, params: { memberId: m.id } })}
                    >
                      <Text style={styles.viewReportButtonText}>View Reports →</Text>
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </View>
          </>
        )}
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
  headerSub: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    color: COLORS.accent
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
    marginTop: 2
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  switchButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: COLORS.cardLight,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  switchButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.accent
  },
  iconButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: COLORS.cardLight
  },
  iconButtonText: {
    fontSize: 16,
    color: COLORS.text
  },
  scrollContent: {
    padding: 16,
    gap: 20
  },
  errorBanner: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)'
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 12
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  metricCard: {
    flex: 1,
    minWidth: (SCREEN_WIDTH - 48) / 2,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.muted
  },
  metricValue: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
    marginVertical: 4
  },
  metricSub: {
    fontSize: 10,
    color: COLORS.muted
  },
  section: {
    gap: 8
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text
  },
  sectionSub: {
    fontSize: 12,
    color: COLORS.muted,
    marginBottom: 4
  },
  emptyCard: {
    padding: 24,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border
  },
  emptyText: {
    color: COLORS.muted,
    fontSize: 13
  },
  feedbackCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 6
  },
  feedbackHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  feedbackMemberName: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: 'rgba(245, 158, 11, 0.15)'
  },
  statusBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.warning
  },
  feedbackTopic: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.accent
  },
  feedbackContext: {
    fontSize: 12,
    color: COLORS.muted
  },
  replyTrigger: {
    alignSelf: 'flex-start',
    marginTop: 4,
    paddingVertical: 4
  },
  replyTriggerText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.accent
  },
  replyBox: {
    marginTop: 8,
    gap: 8
  },
  replyInput: {
    backgroundColor: COLORS.cardLight,
    borderRadius: 8,
    padding: 10,
    fontSize: 12,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 60,
    textAlignVertical: 'top'
  },
  replyActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8
  },
  cancelButton: {
    paddingHorizontal: 12,
    paddingVertical: 6
  },
  cancelButtonText: {
    color: COLORS.muted,
    fontSize: 12
  },
  sendButton: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6
  },
  sendButtonText: {
    color: '#1a0d04',
    fontWeight: '700',
    fontSize: 12
  },
  memberCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  memberInfo: {
    flex: 1,
    gap: 2
  },
  memberName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text
  },
  memberEmail: {
    fontSize: 11,
    color: COLORS.muted
  },
  memberGoal: {
    fontSize: 11,
    color: COLORS.accent,
    marginTop: 2
  },
  memberStatsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4
  },
  memberStat: {
    fontSize: 11,
    color: COLORS.muted
  },
  viewReportButton: {
    backgroundColor: 'rgba(243, 201, 159, 0.1)',
    borderWidth: 1,
    borderColor: COLORS.accent,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8
  },
  viewReportButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.accent
  }
});
