import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
import { nutritionApi, type NutritionEntry } from '../services/api';

export default function MobileNutritionScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const [mealInput, setMealInput] = useState('');
  const [meals, setMeals] = useState<NutritionEntry[]>([]);
  const [goals, setGoals] = useState<{ dailyCalorieTarget: number; dailyProteinG: number | null; dailyCarbsG: number | null; dailyFatG: number | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadNutrition = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const [entries, dailyGoals] = await Promise.all([
        nutritionApi.getEntries(token),
        nutritionApi.getGoals(token)
      ]);
      setMeals(entries);
      setGoals(dailyGoals);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load nutrition data.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void Promise.resolve().then(loadNutrition);
  }, [loadNutrition]);

  const todaysMeals = useMemo(() => meals.filter((meal) =>
    new Date(meal.consumedAt).toDateString() === new Date().toDateString()
  ), [meals]);
  const totals = useMemo(() => todaysMeals.reduce((result, meal) => ({
    calories: result.calories + (meal.totalCalories ?? 0),
    protein: result.protein + (meal.totalProteinG ?? 0),
    carbs: result.carbs + (meal.totalCarbsG ?? 0),
    fat: result.fat + (meal.totalFatG ?? 0)
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 }), [todaysMeals]);

  const handleSaveTextMeal = async () => {
    if (!mealInput.trim() || !token || saving) return;
    setSaving(true);
    setError(null);
    try {
      await nutritionApi.logMeal(mealInput.trim(), token);
      setMealInput('');
      await loadNutrition();
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : 'Could not save this meal.';
      setError(message);
      Alert.alert('Meal not saved', message);
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
            <Text style={styles.headerTitle}>Nutrition</Text>
            <Text style={styles.headerSub}>Your logged meals and daily targets</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Daily Macros Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTag}>DAILY MACRO INTAKE</Text>
              <Text style={styles.cardHighlight}>{Math.round(totals.calories)} / {goals?.dailyCalorieTarget ?? '—'} kcal</Text>
            </View>

            <View style={styles.progressBarTrack}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${Math.min(100, Math.round((totals.calories / (goals?.dailyCalorieTarget || 1)) * 100))}%` }
                ]}
              />
            </View>

            <View style={styles.macroGrid}>
              <View style={styles.macroItem}>
                <Text style={styles.macroValue}>{Math.round(totals.protein)}g</Text>
                <Text style={styles.macroLabel}>Protein ({goals?.dailyProteinG ?? '—'}g)</Text>
              </View>
              <View style={styles.macroItem}>
                <Text style={styles.macroValue}>{Math.round(totals.carbs)}g</Text>
                <Text style={styles.macroLabel}>Carbs ({goals?.dailyCarbsG ?? '—'}g)</Text>
              </View>
              <View style={styles.macroItem}>
                <Text style={styles.macroValue}>{Math.round(totals.fat)}g</Text>
                <Text style={styles.macroLabel}>Fats ({goals?.dailyFatG ?? '—'}g)</Text>
              </View>
            </View>
          </View>

          {/* Camera upload is not enabled until the mobile image-upload flow is implemented. */}
          <View style={[styles.card, styles.visionCard]}>
            <View style={styles.visionHeaderRow}>
              <Text style={styles.visionEmoji}>📷</Text>
              <View style={styles.visionHeaderTextGroup}>
                <Text style={styles.visionTitle}>Meal logging</Text>
                <Text style={styles.visionSub}>Describe a meal below to save it to your nutrition history.</Text>
              </View>
            </View>

            <Text style={styles.visionSub}>Nutrition estimates are provided by the configured backend service.</Text>
          </View>

          {/* Manual Text Log */}
          <View style={styles.card}>
            <Text style={styles.cardTag}>OR QUICK TEXT LOGGING</Text>
            <View style={styles.textInputRow}>
              <TextInput
                style={styles.input}
                placeholder="e.g. 3 eggs, whole wheat toast & coffee"
                placeholderTextColor="#a8927c"
                value={mealInput}
                onChangeText={setMealInput}
                onSubmitEditing={() => void handleSaveTextMeal()}
              />
              <TouchableOpacity
                style={styles.addMealBtn}
                onPress={() => void handleSaveTextMeal()}
                disabled={saving || !mealInput.trim()}
                activeOpacity={0.8}
              >
                {saving ? <ActivityIndicator color="#1d140d" /> : <Text style={styles.addMealBtnText}>Log</Text>}
              </TouchableOpacity>
            </View>
          </View>

          {/* Meal History */}
          <Text style={styles.sectionTitle}>Today&apos;s Logged Meals ({todaysMeals.length})</Text>

          {error && <Text style={styles.sectionTitle}>{error}</Text>}
          {loading && <ActivityIndicator color="#f3c99f" />}
          {!loading && !todaysMeals.length && <Text style={styles.headerSub}>No meals logged today yet.</Text>}
          {todaysMeals.map((meal) => (
            <View key={meal.id} style={styles.mealCard}>
              <View style={styles.mealMainRow}>
                <View style={styles.mealInfo}>
                  <Text style={styles.mealTitle}>{meal.rawText || meal.items?.map((item) => item.name).join(', ') || 'Meal entry'}</Text>
                  <Text style={styles.mealTime}>
                    {new Date(meal.consumedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
                <View style={styles.mealCaloriesBadge}>
                  <Text style={styles.mealCaloriesText}>{Math.round(meal.totalCalories ?? 0)} kcal</Text>
                </View>
              </View>

              <View style={styles.mealMacroRow}>
                <Text style={styles.mealMacroPill}>P: {Math.round(meal.totalProteinG ?? 0)}g</Text>
                <Text style={styles.mealMacroPill}>C: {Math.round(meal.totalCarbsG ?? 0)}g</Text>
                <Text style={styles.mealMacroPill}>F: {Math.round(meal.totalFatG ?? 0)}g</Text>
              </View>
            </View>
          ))}
        </ScrollView>

        {/* Bottom Tab Bar */}
        <View style={styles.bottomTabBar}>
          <TouchableOpacity style={styles.tabItem} onPress={() => router.push('/dashboard')}>
            <Text style={styles.tabIcon}>🏠</Text>
            <Text style={styles.tabLabel}>Dashboard</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.tabItem, styles.tabItemActive]}>
            <Text style={styles.tabIcon}>🥗</Text>
            <Text style={[styles.tabLabel, styles.tabLabelActive]}>Nutrition</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.tabItem} onPress={() => router.push('/workouts')}>
            <Text style={styles.tabIcon}>🏋️</Text>
            <Text style={styles.tabLabel}>Workouts</Text>
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
  card: {
    backgroundColor: 'rgba(28, 20, 15, 0.85)',
    borderColor: 'rgba(243, 201, 159, 0.18)',
    borderWidth: 1,
    borderRadius: 22,
    padding: 16,
    marginBottom: 14
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  cardTag: {
    fontSize: 10,
    fontWeight: '800',
    color: '#f3c99f',
    letterSpacing: 0.8
  },
  cardHighlight: {
    fontSize: 12,
    fontWeight: '700',
    color: '#34d399'
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    marginVertical: 10,
    overflow: 'hidden'
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#f3c99f',
    borderRadius: 8
  },
  macroGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: 14,
    padding: 10,
    marginTop: 4
  },
  macroItem: {
    alignItems: 'center',
    flex: 1
  },
  macroValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff'
  },
  macroLabel: {
    fontSize: 9,
    color: '#a8927c',
    marginTop: 2
  },
  visionCard: {
    borderColor: 'rgba(56, 189, 248, 0.3)',
    backgroundColor: 'rgba(12, 34, 56, 0.55)'
  },
  visionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  visionEmoji: {
    fontSize: 28,
    marginRight: 12
  },
  visionHeaderTextGroup: {
    flex: 1
  },
  visionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#38bdf8'
  },
  visionSub: {
    fontSize: 11,
    color: '#bae6fd',
    marginTop: 2
  },
  scanToastText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#34d399',
    marginBottom: 10
  },
  visionActionBtn: {
    backgroundColor: '#38bdf8',
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: 'center'
  },
  visionActionBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0c0806'
  },
  textInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8
  },
  input: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#ffffff',
    fontSize: 13
  },
  addMealBtn: {
    backgroundColor: '#f3c99f',
    borderRadius: 16,
    paddingVertical: 11,
    paddingHorizontal: 18
  },
  addMealBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1d140d'
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#d8c0ad',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 8,
    marginBottom: 10
  },
  mealCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    marginBottom: 10
  },
  mealMainRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  mealInfo: {
    flex: 1,
    marginRight: 10
  },
  mealTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff'
  },
  mealTime: {
    fontSize: 11,
    color: '#a8927c',
    marginTop: 3
  },
  aiBadge: {
    color: '#38bdf8',
    fontWeight: '700'
  },
  mealCaloriesBadge: {
    backgroundColor: 'rgba(243, 201, 159, 0.15)',
    borderColor: 'rgba(243, 201, 159, 0.3)',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 8
  },
  mealCaloriesText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#f3c99f'
  },
  mealMacroRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)'
  },
  mealMacroPill: {
    fontSize: 11,
    color: '#a8927c',
    fontWeight: '600'
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
