/**
 * A2UI — Agent-to-User Interface
 * The AI backend sends a JSON spec; the app renders it as native components.
 * This is the single source of truth for all A2UI types.
 */

// ─── Component registry ───────────────────────────────────────────────────────

export type A2UIComponentType =
  | 'TextBlock'
  | 'MetricCard'
  | 'ActionButton'
  | 'WorkoutCard'
  | 'NutritionCard'
  | 'ProgressBar'
  | 'Divider'
  | 'AlertBanner'
  | 'ChatCard'      // Rich response card inside chat
  | 'QuickReply';   // Tappable quick-reply chip row

// ─── Base component ───────────────────────────────────────────────────────────

export interface A2UIBaseComponent {
  id: string;
  type: A2UIComponentType;
  props: Record<string, string | number | boolean | string[]>;
}

// ─── Prop shapes per component type ──────────────────────────────────────────

export interface TextBlockProps {
  text: string;
  variant?: 'body' | 'heading' | 'caption' | 'label';
  color?: string;
}

export interface MetricCardProps {
  label: string;
  value: string;
  unit?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon?: string;
  subtitle?: string;
  color?: string;
}

export interface ActionButtonProps {
  label: string;
  action: string;   // pre-approved action ID dispatched via onAction
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
}

export interface WorkoutCardProps {
  title: string;
  duration: string;
  difficulty: string;
  exercises: string; // JSON-stringified Exercise[] — parsed inside component
}

export interface NutritionCardProps {
  mealName: string;
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
}

export interface ProgressBarProps {
  label: string;
  current: string;   // numeric string e.g. "65"
  total: string;     // numeric string e.g. "100"
  unit?: string;
  color?: string;
}

export interface AlertBannerProps {
  message: string;
  severity: 'info' | 'warning' | 'success' | 'error';
}

/** Rich card rendered as a bubble attachment inside the AI chat */
export interface ChatCardProps {
  title: string;
  body: string;
  icon?: string;
  action?: string;        // action ID dispatched on "View" tap
  actionLabel?: string;   // defaults to "View"
  color?: string;         // accent color for the card border
}

/** Row of tappable quick-reply chips; labels are pipe-separated e.g. "Yes|No|Skip" */
export interface QuickReplyProps {
  labels: string;    // pipe-separated: "Show my plan|Log a meal|Recovery tips"
  action: string;    // base action ID; dispatched as `${action}:${label}`
}

// ─── Top-level spec (what backend / useA2UIStream sends) ─────────────────────

export interface A2UISpec {
  specId?: string;
  components: A2UIBaseComponent[];
}

// ─── Action dispatch payload ──────────────────────────────────────────────────

export interface A2UIActionPayload {
  action: string;
  sourceComponentId: string;
  data?: Record<string, unknown>;
}
