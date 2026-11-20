/**
 * A2UI Components — dark-theme native implementations
 * Each component maps one-to-one to an A2UIComponentType.
 * All use the SteadyAI dark palette so they blend into the app.
 */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type {
  TextBlockProps,
  MetricCardProps,
  ActionButtonProps,
  NutritionCardProps,
  ProgressBarProps,
  AlertBannerProps,
  WorkoutCardProps,
  ChatCardProps,
  QuickReplyProps,
} from '../types';

// ─── Shared palette (matches app theme) ──────────────────────────────────────
const P = {
  bg:       '#17100c',
  bgDeep:   '#090605',
  accent:   '#f3c99f',
  accentDim:'#a8927c',
  accentMut:'rgba(243,201,159,0.12)',
  text:     '#f8f3ee',
  sub:      '#d8cec5',
  muted:    '#a8927c',
  border:   'rgba(255,255,255,0.09)',
  success:  '#6ee7b7',
  danger:   '#fca5a5',
  info:     '#7ec8f7',
  warning:  '#fde68a',
};

// ─── TextBlock ────────────────────────────────────────────────────────────────

export function TextBlock({ text, variant = 'body', color }: TextBlockProps) {
  const style = [
    t.textBase,
    variant === 'heading' && t.textHeading,
    variant === 'caption' && t.textCaption,
    variant === 'label'   && t.textLabel,
    color ? { color } : undefined,
  ];
  return <Text style={style}>{text}</Text>;
}

// ─── MetricCard ───────────────────────────────────────────────────────────────

export function MetricCard({ label, value, unit, trend, icon, subtitle, color }: MetricCardProps) {
  const trendColor  = trend === 'up' ? P.success : trend === 'down' ? P.danger : P.muted;
  const trendArrow  = trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→';
  const borderColor = color ?? P.accent;

  return (
    <View style={[t.metricCard, { borderLeftColor: borderColor }]}>
      <View style={t.metricTop}>
        {icon ? <Text style={t.metricIcon}>{icon}</Text> : null}
        <Text style={t.metricLabel}>{label}</Text>
        {trend ? <Text style={[t.metricTrend, { color: trendColor }]}>{trendArrow}</Text> : null}
      </View>
      <View style={t.metricValueRow}>
        <Text style={t.metricValue}>{value}</Text>
        {unit ? <Text style={t.metricUnit}> {unit}</Text> : null}
      </View>
      {subtitle ? <Text style={t.metricSubtitle}>{subtitle}</Text> : null}
    </View>
  );
}

// ─── ActionButton ─────────────────────────────────────────────────────────────

interface ActionButtonInternalProps extends ActionButtonProps {
  onPress: (action: string) => void;
}

export function ActionButton({ label, action, variant = 'primary', disabled, onPress }: ActionButtonInternalProps) {
  return (
    <TouchableOpacity
      style={[t.actionBtn,
        variant === 'secondary' && t.actionBtnSecondary,
        variant === 'danger'    && t.actionBtnDanger,
        disabled && t.actionBtnDisabled,
      ]}
      onPress={() => !disabled && onPress(action)}
      activeOpacity={0.8}
      disabled={!!disabled}
    >
      <Text style={[t.actionBtnText,
        variant === 'secondary' && t.actionBtnTextSecondary,
        variant === 'danger'    && t.actionBtnTextDanger,
      ]}>{label}</Text>
    </TouchableOpacity>
  );
}

// ─── NutritionCard ────────────────────────────────────────────────────────────

export function NutritionCard({ mealName, calories, protein, carbs, fat }: NutritionCardProps) {
  return (
    <View style={t.nutritionCard}>
      <Text style={t.nutritionTitle}>{mealName}</Text>
      <Text style={t.nutritionCal}>{calories} kcal</Text>
      <View style={t.macroRow}>
        <MacroPill label="Protein" value={`${protein}g`} color="#6ee7b7" />
        <MacroPill label="Carbs"   value={`${carbs}g`}   color={P.accent} />
        <MacroPill label="Fat"     value={`${fat}g`}     color="#fca5a5" />
      </View>
    </View>
  );
}

function MacroPill({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={[t.macroPill, { borderColor: color }]}>
      <Text style={[t.macroPillLabel, { color }]}>{label}</Text>
      <Text style={t.macroPillValue}>{value}</Text>
    </View>
  );
}

// ─── ProgressBar ──────────────────────────────────────────────────────────────

export function ProgressBar({ label, current, total, unit, color = P.accent }: ProgressBarProps) {
  const pct = Math.min(100, Math.round((Number(current) / Number(total)) * 100));
  return (
    <View style={t.progressContainer}>
      <View style={t.progressLabelRow}>
        <Text style={t.progressLabel}>{label}</Text>
        <Text style={t.progressValue}>
          {current}/{total}{unit ? ` ${unit}` : ''}
        </Text>
      </View>
      <View style={t.progressTrack}>
        <View style={[t.progressFill, { width: `${pct}%` as `${number}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

// ─── AlertBanner ──────────────────────────────────────────────────────────────

const severityMap = {
  info:    { bg: 'rgba(126,200,247,0.12)', border: P.info,    text: P.info,    emoji: 'ℹ️' },
  warning: { bg: 'rgba(253,230,138,0.12)', border: P.warning, text: P.warning, emoji: '⚠️' },
  success: { bg: 'rgba(110,231,183,0.12)', border: P.success, text: P.success, emoji: '✅' },
  error:   { bg: 'rgba(252,165,165,0.12)', border: P.danger,  text: P.danger,  emoji: '❌' },
};

export function AlertBanner({ message, severity }: AlertBannerProps) {
  const s = severityMap[severity] ?? severityMap.info;
  return (
    <View style={[t.alertBanner, { backgroundColor: s.bg, borderLeftColor: s.border }]}>
      <Text style={[t.alertText, { color: s.text }]}>{s.emoji}  {message}</Text>
    </View>
  );
}

// ─── WorkoutCard ──────────────────────────────────────────────────────────────

interface ParsedExercise { name: string; reps: string }

export function WorkoutCard({ title, duration, difficulty, exercises }: WorkoutCardProps) {
  let list: ParsedExercise[] = [];
  try { list = JSON.parse(exercises) as ParsedExercise[]; } catch { /* malformed JSON — show empty */ }

  const diffColor = difficulty === 'Easy' ? P.success : difficulty === 'Hard' ? P.danger : P.warning;

  return (
    <View style={t.workoutCard}>
      <View style={t.workoutHeader}>
        <View style={{ flex: 1 }}>
          <Text style={t.workoutTitle}>{title}</Text>
          <Text style={t.workoutMeta}>⏱ {duration}</Text>
        </View>
        <View style={[t.diffBadge, { borderColor: diffColor }]}>
          <Text style={[t.diffText, { color: diffColor }]}>{difficulty}</Text>
        </View>
      </View>
      {list.length > 0 && (
        <View style={t.workoutList}>
          {list.map((ex, i) => (
            <View key={i} style={t.workoutRow}>
              <Text style={t.workoutNum}>{i + 1}</Text>
              <View style={{ flex: 1 }}>
                <Text style={t.workoutExName}>{ex.name}</Text>
                <Text style={t.workoutExReps}>{ex.reps}</Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

// ─── Divider ──────────────────────────────────────────────────────────────────

export function Divider() {
  return <View style={t.divider} />;
}

// ─── ChatCard — rich attachment card inside chat ──────────────────────────────

interface ChatCardInternalProps extends ChatCardProps {
  onPress?: (action: string) => void;
}

export function ChatCard({ title, body, icon, action, actionLabel = 'View', color = P.accent, onPress }: ChatCardInternalProps) {
  return (
    <View style={[t.chatCard, { borderLeftColor: color }]}>
      <View style={t.chatCardHeader}>
        {icon ? <Text style={t.chatCardIcon}>{icon}</Text> : null}
        <Text style={t.chatCardTitle}>{title}</Text>
      </View>
      <Text style={t.chatCardBody}>{body}</Text>
      {action && onPress && (
        <TouchableOpacity style={t.chatCardBtn} onPress={() => onPress(action)} activeOpacity={0.8}>
          <Text style={t.chatCardBtnText}>{actionLabel} →</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── QuickReply — tappable chip row ───────────────────────────────────────────

interface QuickReplyInternalProps extends QuickReplyProps {
  onPress: (action: string) => void;
}

export function QuickReply({ labels, action, onPress }: QuickReplyInternalProps) {
  const chips = labels.split('|').map((l) => l.trim()).filter(Boolean);
  return (
    <View style={t.qrRow}>
      {chips.map((chip) => (
        <TouchableOpacity
          key={chip}
          style={t.qrChip}
          onPress={() => onPress(`${action}:${chip}`)}
          activeOpacity={0.75}
        >
          <Text style={t.qrChipText}>{chip}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const t = StyleSheet.create({
  // TextBlock
  textBase:    { fontSize: 14, color: P.sub, lineHeight: 21, marginVertical: 2 },
  textHeading: { fontSize: 18, fontWeight: '800', color: P.text, marginVertical: 6 },
  textCaption: { fontSize: 11, color: P.muted, fontStyle: 'italic' },
  textLabel:   { fontSize: 11, fontWeight: '700', color: P.accentDim, textTransform: 'uppercase', letterSpacing: 0.8 },

  // MetricCard
  metricCard:     { backgroundColor: P.bg, borderRadius: 14, padding: 14, marginVertical: 4, borderWidth: 1, borderColor: P.border, borderLeftWidth: 3 },
  metricTop:      { flexDirection: 'row', alignItems: 'center', marginBottom: 6, gap: 6 },
  metricIcon:     { fontSize: 16 },
  metricLabel:    { flex: 1, fontSize: 12, color: P.muted, fontWeight: '500' },
  metricTrend:    { fontSize: 14, fontWeight: '800' },
  metricValueRow: { flexDirection: 'row', alignItems: 'baseline' },
  metricValue:    { fontSize: 26, fontWeight: '900', color: P.text },
  metricUnit:     { fontSize: 13, color: P.muted, fontWeight: '500' },
  metricSubtitle: { fontSize: 11, color: P.muted, marginTop: 4 },

  // ActionButton
  actionBtn:         { backgroundColor: P.accent, borderRadius: 12, paddingVertical: 13, paddingHorizontal: 20, alignItems: 'center', marginVertical: 5 },
  actionBtnSecondary:{ backgroundColor: 'transparent', borderWidth: 1, borderColor: P.border },
  actionBtnDanger:   { backgroundColor: 'rgba(252,165,165,0.15)', borderWidth: 1, borderColor: P.danger },
  actionBtnDisabled: { opacity: 0.4 },
  actionBtnText:         { color: '#20160f', fontWeight: '800', fontSize: 14 },
  actionBtnTextSecondary:{ color: P.text },
  actionBtnTextDanger:   { color: P.danger },

  // NutritionCard
  nutritionCard: { backgroundColor: P.bg, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: P.border, marginVertical: 4 },
  nutritionTitle:{ fontSize: 14, fontWeight: '800', color: P.text, marginBottom: 3 },
  nutritionCal:  { fontSize: 20, fontWeight: '900', color: P.accent, marginBottom: 10 },
  macroRow:      { flexDirection: 'row', gap: 7 },
  macroPill:     { flex: 1, borderWidth: 1.5, borderRadius: 9, padding: 7, alignItems: 'center' },
  macroPillLabel:{ fontSize: 10, fontWeight: '700', marginBottom: 2 },
  macroPillValue:{ fontSize: 12, fontWeight: '700', color: P.text },

  // ProgressBar
  progressContainer: { marginVertical: 5 },
  progressLabelRow:  { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  progressLabel:     { fontSize: 12, color: P.muted, fontWeight: '500' },
  progressValue:     { fontSize: 12, color: P.text, fontWeight: '700' },
  progressTrack:     { height: 7, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 4, overflow: 'hidden' },
  progressFill:      { height: '100%', borderRadius: 4 },

  // AlertBanner
  alertBanner: { borderLeftWidth: 3, borderRadius: 10, padding: 12, marginVertical: 4 },
  alertText:   { fontSize: 13, fontWeight: '500', lineHeight: 19 },

  // WorkoutCard
  workoutCard:   { backgroundColor: P.bg, borderRadius: 14, borderWidth: 1, borderColor: P.border, marginVertical: 4, overflow: 'hidden' },
  workoutHeader: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a0d04', padding: 13, gap: 10 },
  workoutTitle:  { fontSize: 14, fontWeight: '800', color: P.text, marginBottom: 2 },
  workoutMeta:   { fontSize: 11, color: P.muted },
  diffBadge:     { borderWidth: 1, borderRadius: 8, paddingHorizontal: 9, paddingVertical: 3 },
  diffText:      { fontSize: 10, fontWeight: '800' },
  workoutList:   { padding: 10, gap: 7 },
  workoutRow:    { flexDirection: 'row', alignItems: 'center', gap: 9, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 9, padding: 9 },
  workoutNum:    { width: 20, height: 20, borderRadius: 10, backgroundColor: P.accent, color: '#20160f', fontSize: 10, fontWeight: '900', textAlign: 'center', lineHeight: 20 },
  workoutExName: { fontSize: 12, fontWeight: '700', color: P.text },
  workoutExReps: { fontSize: 10, color: P.muted, marginTop: 1 },

  // Divider
  divider: { height: 1, backgroundColor: P.border, marginVertical: 7 },

  // ChatCard
  chatCard:       { backgroundColor: P.bg, borderRadius: 13, padding: 13, borderWidth: 1, borderColor: P.border, borderLeftWidth: 3, marginVertical: 4 },
  chatCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 7 },
  chatCardIcon:   { fontSize: 18 },
  chatCardTitle:  { flex: 1, fontSize: 14, fontWeight: '800', color: P.text },
  chatCardBody:   { fontSize: 13, color: P.sub, lineHeight: 19 },
  chatCardBtn:    { alignSelf: 'flex-start', marginTop: 10, backgroundColor: P.accentMut, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: P.border },
  chatCardBtnText:{ color: P.accent, fontSize: 12, fontWeight: '700' },

  // QuickReply
  qrRow:     { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginVertical: 6 },
  qrChip:    { backgroundColor: P.accentMut, borderRadius: 18, paddingHorizontal: 13, paddingVertical: 7, borderWidth: 1, borderColor: P.border },
  qrChipText:{ color: P.accentDim, fontSize: 12, fontWeight: '600' },
});
