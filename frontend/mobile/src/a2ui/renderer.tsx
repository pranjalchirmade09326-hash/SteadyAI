/**
 * A2UIRenderer — dispatches A2UI specs to native components.
 * Add a new component type: extend types.ts → add case here → add component in components/index.tsx
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { A2UISpec, A2UIBaseComponent, A2UIActionPayload } from './types';
import {
  TextBlock,
  MetricCard,
  ActionButton,
  NutritionCard,
  ProgressBar,
  AlertBanner,
  Divider,
  WorkoutCard,
  ChatCard,
  QuickReply,
} from './components/index';

// ─── Prop casting helpers ─────────────────────────────────────────────────────

function str(val: unknown, fallback = ''): string {
  return val !== undefined && val !== null ? String(val) : fallback;
}

function bool(val: unknown): boolean {
  return val === true || val === 'true';
}

// ─── Public renderer ──────────────────────────────────────────────────────────

interface A2UIRendererProps {
  spec: A2UISpec;
  onAction: (payload: A2UIActionPayload) => void;
  /** Horizontal layout: wraps MetricCards in a row */
  horizontal?: boolean;
}

export function A2UIRenderer({ spec, onAction, horizontal = false }: A2UIRendererProps) {
  if (!spec?.components?.length) return null;

  if (horizontal) {
    return (
      <View style={s.row}>
        {spec.components.map((comp) => (
          <View key={comp.id} style={s.rowItem}>
            <A2UIComponent component={comp} onAction={onAction} />
          </View>
        ))}
      </View>
    );
  }

  return (
    <View style={s.container}>
      {spec.components.map((comp) => (
        <A2UIComponent key={comp.id} component={comp} onAction={onAction} />
      ))}
    </View>
  );
}

// ─── Single component dispatcher ─────────────────────────────────────────────

interface A2UIComponentProps {
  component: A2UIBaseComponent;
  onAction: (payload: A2UIActionPayload) => void;
}

function A2UIComponent({ component, onAction }: A2UIComponentProps) {
  const { id, type, props } = component;

  const dispatch = (action: string, data?: Record<string, unknown>) => {
    onAction({ action, sourceComponentId: id, data });
  };

  switch (type) {
    case 'TextBlock':
      return (
        <TextBlock
          text={str(props.text)}
          variant={str(props.variant) as 'body' | 'heading' | 'caption' | 'label' || 'body'}
          color={str(props.color) || undefined}
        />
      );

    case 'MetricCard':
      return (
        <MetricCard
          label={str(props.label)}
          value={str(props.value)}
          unit={str(props.unit) || undefined}
          trend={str(props.trend) as 'up' | 'down' | 'neutral' | undefined || undefined}
          icon={str(props.icon) || undefined}
          subtitle={str(props.subtitle) || undefined}
          color={str(props.color) || undefined}
        />
      );

    case 'ActionButton':
      return (
        <ActionButton
          label={str(props.label)}
          action={str(props.action)}
          variant={str(props.variant) as 'primary' | 'secondary' | 'danger' || 'primary'}
          disabled={bool(props.disabled)}
          onPress={dispatch}
        />
      );

    case 'NutritionCard':
      return (
        <NutritionCard
          mealName={str(props.mealName)}
          calories={str(props.calories)}
          protein={str(props.protein)}
          carbs={str(props.carbs)}
          fat={str(props.fat)}
        />
      );

    case 'ProgressBar':
      return (
        <ProgressBar
          label={str(props.label)}
          current={str(props.current)}
          total={str(props.total)}
          unit={str(props.unit) || undefined}
          color={str(props.color) || undefined}
        />
      );

    case 'AlertBanner':
      return (
        <AlertBanner
          message={str(props.message)}
          severity={str(props.severity) as 'info' | 'warning' | 'success' | 'error' || 'info'}
        />
      );

    case 'WorkoutCard':
      return (
        <WorkoutCard
          title={str(props.title)}
          duration={str(props.duration)}
          difficulty={str(props.difficulty)}
          exercises={str(props.exercises, '[]')}
        />
      );

    case 'ChatCard':
      return (
        <ChatCard
          title={str(props.title)}
          body={str(props.body)}
          icon={str(props.icon) || undefined}
          action={str(props.action) || undefined}
          actionLabel={str(props.actionLabel) || undefined}
          color={str(props.color) || undefined}
          onPress={str(props.action) ? dispatch : undefined}
        />
      );

    case 'QuickReply':
      return (
        <QuickReply
          labels={str(props.labels)}
          action={str(props.action)}
          onPress={dispatch}
        />
      );

    case 'Divider':
      return <Divider />;

    default:
      return (
        <View style={s.unknown}>
          <Text style={s.unknownText}>⚠️ Unknown A2UI component: {type}</Text>
        </View>
      );
  }
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container: { gap: 4 },
  row:       { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  rowItem:   { flex: 1, minWidth: 140 },
  unknown:   { padding: 10, backgroundColor: 'rgba(252,165,165,0.1)', borderRadius: 8, borderWidth: 1, borderColor: 'rgba(252,165,165,0.3)', marginVertical: 3 },
  unknownText:{ fontSize: 12, color: '#fca5a5' },
});
