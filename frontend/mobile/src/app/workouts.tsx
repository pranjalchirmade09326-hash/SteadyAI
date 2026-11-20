import React, { useCallback, useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { workoutApi, type WorkoutHistory } from '../services/api';

export default function MobileWorkoutsScreen() {
  const router = useRouter();
  const { token, user } = useAuth();
  const [history, setHistory] = useState<WorkoutHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [duration, setDuration] = useState('');
  const [completedExercises, setCompletedExercises] = useState('');
  const [totalExercises, setTotalExercises] = useState('');
  const [selectedFeedback, setSelectedFeedback] = useState<'TOO_EASY' | 'JUST_RIGHT' | 'TOO_HARD' | null>(null);
  const [saving, setSaving] = useState(false);
  const [rpeSavedMsg, setRpeSavedMsg] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      setHistory(await workoutApi.getHistory(token));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load workout history.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void Promise.resolve().then(loadHistory);
  }, [loadHistory]);

  const totalCount = history?.sessions ?? history?.totalWorkouts ?? 0;
  const averageMinutes = history?.avgDurationMinutes ?? history?.averageDurationMinutes ?? 0;
  const totalMinutes = history?.totalMinutes ?? history?.totalDurationMinutes ?? Math.round(totalCount * averageMinutes);

  const saveSession = async () => {
    const minutes = Number(duration);
    const completed = Number(completedExercises);
    const total = Number(totalExercises);
    if (!token || !user || !Number.isFinite(minutes) || minutes <= 0 ||
      !Number.isInteger(completed) || !Number.isInteger(total) || total <= 0 ||
      completed < 0 || completed > total || !selectedFeedback) {
      Alert.alert('Check workout details', 'Enter a valid duration, completed exercise count, total exercise count, and session effort.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await workoutApi.saveSession({
        userId: user.id,
        sessionId: `mobile-${Date.now()}`,
        completedAt: new Date().toISOString(),
        totalDurationMinutes: minutes,
        completedExercises: completed,
        totalExercises: total,
        feedback: selectedFeedback
      }, token);
      setDuration('');
      setCompletedExercises('');
      setTotalExercises('');
      setSelectedFeedback(null);
      setRpeSavedMsg('Workout session saved');
      await loadHistory();
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : 'Unable to save workout session.';
      setError(message);
      Alert.alert('Workout not saved', message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Top Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Workout Routines</Text>
            <Text style={styles.headerSub}>Progressive Overload & Adaptive Sets</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Weekly Consistency Goal Card */}
          <View style={styles.progressCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTag}>7-DAY ADHERENCE</Text>
              <Text style={styles.cardHighlight}>{totalCount} sessions logged</Text>
            </View>
            <Text style={styles.progressTitle}>Weekly Consistency</Text>
            <Text style={styles.progressSubtitle}>{totalMinutes} minutes recorded · {history?.streakDays ?? 0} day streak</Text>
          </View>

          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Workout history</Text>
          </View>

          {loading && <ActivityIndicator color="#f3c99f" />}
          {error && <Text style={styles.progressSubtitle}>{error}</Text>}
          {!loading && totalCount === 0 && <Text style={styles.progressSubtitle}>No workout sessions have been logged yet.</Text>}
          {!loading && totalCount > 0 && (
            <View style={styles.exerciseCard}>
              <Text style={styles.exerciseName}>{totalCount} workout sessions</Text>
              <Text style={styles.exerciseCategory}>Average session: {Math.round(averageMinutes)} min · completion: {Math.round((history?.avgCompletionRate ?? 0) * 100)}%</Text>
              <Text style={styles.cueText}>Last effort: {history?.lastFeedback?.replace('_', ' ').toLowerCase() || 'not rated'}</Text>
            </View>
          )}

          <View style={styles.rpeCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTag}>SESSION INTENSITY (RPE SCALE)</Text>
              {rpeSavedMsg && <Text style={styles.rpeToast}>{rpeSavedMsg}</Text>}
            </View>
            <Text style={styles.rpePrompt}>Record a completed workout session</Text>
            <TextInput style={styles.sessionInput} placeholder="Duration in minutes" placeholderTextColor="#a8927c" keyboardType="number-pad" value={duration} onChangeText={setDuration} />
            <TextInput style={styles.sessionInput} placeholder="Exercises completed" placeholderTextColor="#a8927c" keyboardType="number-pad" value={completedExercises} onChangeText={setCompletedExercises} />
            <TextInput style={styles.sessionInput} placeholder="Total exercises" placeholderTextColor="#a8927c" keyboardType="number-pad" value={totalExercises} onChangeText={setTotalExercises} />

            <View style={styles.rpeGrid}>
              {([
                ['TOO_EASY', 'Easy'],
                ['JUST_RIGHT', 'Right'],
                ['TOO_HARD', 'Hard']
              ] as const).map(([feedback, label]) => {
                const isSelected = selectedFeedback === feedback;
                return (
                  <TouchableOpacity
                    key={feedback}
                    style={[styles.rpeBox, isSelected && styles.rpeBoxSelected]}
                    onPress={() => setSelectedFeedback(feedback)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.rpeNumber, isSelected && styles.rpeNumberSelected]}>{label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <TouchableOpacity style={styles.saveSessionButton} onPress={() => void saveSession()} disabled={saving}>
              {saving ? <ActivityIndicator color="#1d140d" /> : <Text style={styles.saveSessionText}>Save workout</Text>}
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Bottom Tab Bar */}
        <View style={styles.bottomTabBar}>
          <TouchableOpacity style={styles.tabItem} onPress={() => router.push('/dashboard')}>
            <Text style={styles.tabIcon}>🏠</Text>
            <Text style={styles.tabLabel}>Dashboard</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.tabItem} onPress={() => router.push('/nutrition')}>
            <Text style={styles.tabIcon}>🥗</Text>
            <Text style={styles.tabLabel}>Nutrition</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.tabItem, styles.tabItemActive]}>
            <Text style={styles.tabIcon}>🏋️</Text>
            <Text style={[styles.tabLabel, styles.tabLabelActive]}>Workouts</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.tabItem} onPress={() => router.push('/chat')}>
            <Text style={styles.tabIcon}>🤖</Text>
            <Text style={styles.tabLabel}>AI Coach</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0c0806'
  },
  container: {
    flex: 1,
    backgroundColor: '#0c0806'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    gap: 12
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  backButtonText: {
    fontSize: 18,
    color: '#f3c99f',
    fontWeight: 'bold'
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff'
  },
  headerSub: {
    fontSize: 10,
    color: '#a8927c'
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24
  },
  progressCard: {
    backgroundColor: 'rgba(28, 20, 15, 0.85)',
    borderColor: 'rgba(243, 201, 159, 0.18)',
    borderWidth: 1,
    borderRadius: 22,
    padding: 16,
    marginBottom: 16
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6
  },
  cardTag: {
    fontSize: 10,
    fontWeight: '800',
    color: '#f3c99f',
    letterSpacing: 0.8
  },
  cardHighlight: {
    fontSize: 11,
    fontWeight: '700',
    color: '#34d399'
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff'
  },
  progressSubtitle: {
    fontSize: 11,
    color: '#a8927c',
    marginTop: 2,
    marginBottom: 12
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  dayCircle: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 7,
    width: 42
  },
  dayCircleDone: {
    backgroundColor: 'rgba(52, 211, 153, 0.2)',
    borderColor: '#34d399',
    borderWidth: 1
  },
  dayCircleToday: {
    backgroundColor: 'rgba(243, 201, 159, 0.25)',
    borderColor: '#f3c99f',
    borderWidth: 1
  },
  dayText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#a8927c'
  },
  dayTextActive: {
    color: '#ffffff'
  },
  dayStatusEmoji: {
    fontSize: 11,
    color: '#34d399',
    fontWeight: 'bold',
    marginTop: 2
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#d8c0ad',
    textTransform: 'uppercase',
    letterSpacing: 0.8
  },
  completionRatio: {
    fontSize: 11,
    fontWeight: '700',
    color: '#f3c99f'
  },
  exerciseCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    marginBottom: 10
  },
  exerciseCardCompleted: {
    opacity: 0.65,
    borderColor: 'rgba(52, 211, 153, 0.3)'
  },
  exerciseTopRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#a8927c',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10
  },
  checkCircleActive: {
    borderColor: '#34d399',
    backgroundColor: '#34d399'
  },
  checkCheck: {
    color: '#0c0806',
    fontWeight: 'bold',
    fontSize: 12
  },
  exerciseNameBox: {
    flex: 1
  },
  exerciseName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff'
  },
  exerciseNameCompleted: {
    textDecorationLine: 'line-through'
  },
  exerciseCategory: {
    fontSize: 10,
    color: '#a8927c',
    marginTop: 2
  },
  setsBadge: {
    backgroundColor: 'rgba(243, 201, 159, 0.15)',
    borderRadius: 10,
    paddingVertical: 4,
    paddingHorizontal: 8
  },
  setsBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#f3c99f'
  },
  exerciseDetailsRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)'
  },
  weightText: {
    fontSize: 11,
    color: '#a8927c'
  },
  weightValue: {
    color: '#ffffff',
    fontWeight: '700'
  },
  cueText: {
    fontSize: 11,
    color: '#bae6fd',
    marginTop: 4,
    fontStyle: 'italic'
  },
  rpeCard: {
    backgroundColor: 'rgba(28, 20, 15, 0.85)',
    borderColor: 'rgba(243, 201, 159, 0.18)',
    borderWidth: 1,
    borderRadius: 22,
    padding: 16,
    marginTop: 8,
    marginBottom: 16
  },
  rpeToast: {
    fontSize: 10,
    fontWeight: '700',
    color: '#34d399'
  },
  rpePrompt: {
    fontSize: 12,
    color: '#a8927c',
    marginBottom: 10
  },
  sessionInput: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderRadius: 12,
    color: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8
  },
  saveSessionButton: {
    backgroundColor: '#f3c99f',
    borderRadius: 12,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12
  },
  saveSessionText: {
    color: '#1d140d',
    fontWeight: '800'
  },
  rpeGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6
  },
  rpeBox: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 8
  },
  rpeBoxSelected: {
    borderColor: '#f3c99f',
    backgroundColor: 'rgba(243, 201, 159, 0.2)'
  },
  rpeNumber: {
    fontSize: 14,
    fontWeight: '800',
    color: '#a8927c'
  },
  rpeNumberSelected: {
    color: '#f3c99f'
  },
  rpeLabel: {
    fontSize: 8,
    color: '#705e50',
    marginTop: 2,
    textAlign: 'center'
  },
  bottomTabBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: '#120d09'
  },
  tabItem: {
    alignItems: 'center'
  },
  tabItemActive: {
    transform: [{ scale: 1.05 }]
  },
  tabIcon: {
    fontSize: 20
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#a8927c',
    marginTop: 2
  },
  tabLabelActive: {
    color: '#f3c99f',
    fontWeight: '800'
  }
});
