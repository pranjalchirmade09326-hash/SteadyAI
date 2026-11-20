import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
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
  challengeApi,
  chatApi,
  communityApi,
  reportsApi,
  storeApi,
  type ReportsOverview
} from '../services/api';
import { A2UIRenderer } from '../a2ui/renderer';
import type { A2UISpec, A2UIActionPayload } from '../a2ui/types';

type Section = 'home' | 'chat' | 'nutrition' | 'workouts' | 'progress' | 'community' | 'check-in' | 'store' | 'settings';
type Challenge = Record<string, unknown> & {
  id: string;
  title: string;
  description?: string | null;
  participations?: { status?: string }[];
};
type FeedPost = {
  id: string;
  type?: string;
  content: string;
  createdAt: string;
  author?: { displayName?: string | null; username?: string };
};
type Product = Record<string, unknown> & {
  id: string;
  name: string;
  description?: string | null;
  priceCents?: number;
  currency?: string;
};

const SIDEBAR_WIDTH = 292;
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

const NAV_ITEMS: { section: Section; icon: string; label: string }[] = [
  { section: 'home', icon: '⌂', label: 'Dashboard' },
  { section: 'chat', icon: '✦', label: 'AI Health Coach' },
  { section: 'nutrition', icon: '◉', label: 'Nutrition' },
  { section: 'workouts', icon: '↗', label: 'Workouts' },
  { section: 'progress', icon: '▥', label: 'Reports' },
  { section: 'community', icon: '◎', label: 'Community' },
  { section: 'check-in', icon: '✓', label: 'Daily Check-in' },
  { section: 'store', icon: '◇', label: 'Store' },
  { section: 'settings', icon: '⚙', label: 'Settings' }
];

function ErrorText({ message }: { message: string | null }) {
  return message ? <Text accessibilityRole="alert" style={styles.errorText}>{message}</Text> : null;
}

function Loading({ label = 'Loading…' }: { label?: string }) {
  return <View style={styles.loadingInline}><ActivityIndicator color={COLORS.accent} /><Text style={styles.muted}>{label}</Text></View>;
}

// ─── A2UI spec for dashboard vitals (populated from real data when available) ─

function buildMetricsSpec(overview: ReportsOverview | null): A2UISpec {
  return {
    specId: 'dashboard-vitals',
    components: [
      {
        id: 'ds-workouts',
        type: 'MetricCard',
        props: {
          label: 'Workout sessions',
          value: String(overview?.workout.sessions ?? '—'),
          icon: '↗',
          trend: (overview?.workout.sessions ?? 0) > 0 ? 'up' : 'neutral',
          subtitle: 'last 30 days',
          color: '#f3c99f',
        },
      },
      {
        id: 'ds-meals',
        type: 'MetricCard',
        props: {
          label: 'Meals logged',
          value: String(overview?.nutrition.entries ?? '—'),
          icon: '◉',
          trend: (overview?.nutrition.entries ?? 0) > 0 ? 'up' : 'neutral',
          subtitle: `${Math.round(overview?.nutrition.calories ?? 0).toLocaleString()} kcal`,
          color: '#6ee7b7',
        },
      },
      {
        id: 'ds-streak',
        type: 'MetricCard',
        props: {
          label: 'Day streak',
          value: String(overview?.challenge.currentStreakDays ?? '—'),
          unit: 'days',
          icon: '✦',
          trend: (overview?.challenge.currentStreakDays ?? 0) > 0 ? 'up' : 'neutral',
          color: '#fde68a',
        },
      },
      {
        id: 'ds-checkin',
        type: 'MetricCard',
        props: {
          label: 'Check-in rate',
          value: overview ? String(Math.round(overview.challenge.completionRate)) : '—',
          unit: overview ? '%' : '',
          icon: '✓',
          trend: (overview?.challenge.completionRate ?? 0) >= 70 ? 'up' : 'down',
          color: '#7ec8f7',
        },
      },
    ],
  };
}

// ─── Mini inline AI chat widget ───────────────────────────────────────────────

function MiniChat({ token, onOpenFull }: { token: string | null; onOpenFull: () => void }) {
  const [input, setInput]       = useState('');
  const [reply, setReply]       = useState<A2UISpec | null>(null);
  const [loading, setLoading]   = useState(false);
  const [convId, setConvId]     = useState<string | null>(null);

  const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

  const ask = async (text: string) => {
    const q = text.trim();
    if (!q || loading) return;
    setInput('');
    setLoading(true);
    setReply(null);
    try {
      const res = await chatApi.sendMessage(q, token ?? '', convId);
      if (res.conversationId) setConvId(res.conversationId);

      let spec: A2UISpec;
      if (res.cards && Array.isArray(res.cards) && res.cards.length > 0) {
        spec = { specId: uid(), components: res.cards as A2UISpec['components'] };
      } else {
        spec = {
          specId: uid(),
          components: [{ id: uid(), type: 'TextBlock', props: { text: res.reply ?? 'Done!', variant: 'body' } }],
        };
      }
      setReply(spec);
    } catch (err) {
      setReply({
        specId: uid(),
        components: [{
          id: uid(), type: 'AlertBanner',
          props: { message: err instanceof Error ? err.message : 'Backend not reachable', severity: 'error' },
        }],
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAction = (payload: A2UIActionPayload) => {
    const label = payload.action.includes(':') ? payload.action.split(':').slice(1).join(':') : payload.action;
    void ask(label);
  };

  const CHIPS = ['Workout plan', 'Log meal', 'Recovery tips', 'My progress'];

  return (
    <View style={mc.wrap}>
      <View style={mc.header}>
        <View style={mc.dot} />
        <Text style={mc.title}>AI Health Coach</Text>
        <TouchableOpacity onPress={onOpenFull} hitSlop={10}>
          <Text style={mc.expand}>Open full chat ›</Text>
        </TouchableOpacity>
      </View>

      {/* Quick chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={mc.chips}>
        {CHIPS.map((c) => (
          <TouchableOpacity key={c} style={mc.chip} onPress={() => void ask(c)} activeOpacity={0.75}>
            <Text style={mc.chipText}>{c}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Reply area */}
      {loading && (
        <View style={mc.replyBox}>
          <ActivityIndicator size="small" color={COLORS.accent} />
          <Text style={mc.thinking}>Thinking…</Text>
        </View>
      )}
      {reply && !loading && (
        <View style={mc.replyBox}>
          <A2UIRenderer spec={reply} onAction={handleAction} />
        </View>
      )}

      {/* Input */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={mc.inputRow}>
          <TextInput
            style={mc.input}
            value={input}
            onChangeText={setInput}
            placeholder="Ask your coach…"
            placeholderTextColor={COLORS.muted}
            returnKeyType="send"
            onSubmitEditing={() => void ask(input)}
          />
          <TouchableOpacity
            style={[mc.sendBtn, (!input.trim() || loading) && mc.sendBtnOff]}
            onPress={() => void ask(input)}
            disabled={!input.trim() || loading}
            activeOpacity={0.85}
          >
            <Text style={mc.sendIcon}>↑</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const mc = StyleSheet.create({
  wrap:      { backgroundColor: '#17100c', borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)', marginTop: 10, overflow: 'hidden' },
  header:    { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 14, paddingTop: 13, paddingBottom: 10 },
  dot:       { width: 7, height: 7, borderRadius: 4, backgroundColor: '#6ee7b7' },
  title:     { flex: 1, color: '#f8f3ee', fontWeight: '800', fontSize: 14 },
  expand:    { color: '#a8927c', fontSize: 12, fontWeight: '600' },
  chips:     { paddingHorizontal: 12, paddingBottom: 10, gap: 7 },
  chip:      { backgroundColor: 'rgba(243,201,159,0.10)', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)' },
  chipText:  { color: '#a8927c', fontSize: 12, fontWeight: '500' },
  replyBox:  { paddingHorizontal: 14, paddingBottom: 10, flexDirection: 'row', flexWrap: 'wrap', gap: 6, alignItems: 'center' },
  thinking:  { color: '#a8927c', fontSize: 13, marginLeft: 6 },
  inputRow:  { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingBottom: 12 },
  input:     { flex: 1, backgroundColor: '#090605', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 9, color: '#f8f3ee', fontSize: 13, borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)' },
  sendBtn:   { width: 36, height: 36, borderRadius: 18, backgroundColor: '#f3c99f', alignItems: 'center', justifyContent: 'center' },
  sendBtnOff:{ backgroundColor: 'rgba(243,201,159,0.15)' },
  sendIcon:  { color: '#20160f', fontSize: 16, fontWeight: '900' },
});

// ─── HomeSection — A2UI metrics + inline chat ─────────────────────────────────

function HomeSection({ name, token, onGoToChat, onSelect }: {
  name?: string;
  token: string | null;
  onGoToChat: () => void;
  onSelect: (section: Section) => void;
}) {
  const [overview, setOverview] = useState<ReportsOverview | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    let active = true;
    void reportsApi.getOverview(token, 30)
      .then((result) => { if (active) setOverview(result); })
      .catch((loadError: unknown) => { if (active) setError(loadError instanceof Error ? loadError.message : 'Unable to load dashboard data.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [token]);

  const metricsSpec = buildMetricsSpec(overview);

  const handleA2UIAction = (_payload: A2UIActionPayload) => {
    // MetricCards don't dispatch actions; ActionButtons from AI could navigate
  };

  return (
    <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>
      {/* Hero */}
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>MEMBER WORKSPACE</Text>
        <Text style={styles.heroTitle}>Welcome back{name ? `, ${name}` : ''}</Text>
        <Text style={styles.muted}>A clear view of your recent health activity.</Text>
      </View>

      {/* A2UI vitals grid */}
      <Text style={styles.sectionTitle}>Last 30 days</Text>
      {loading && <Loading />}
      <ErrorText message={error} />
      {!loading && (
        <A2UIRenderer
          spec={metricsSpec}
          onAction={handleA2UIAction}
          horizontal
        />
      )}

      {/* Activity summary card */}
      {overview && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Activity summary</Text>
          <Text style={styles.cardText}>
            {overview.nutrition.calories.toLocaleString()} kcal logged · {overview.workout.totalMinutes} workout min
          </Text>
          <Text style={styles.cardText}>
            {overview.community.posts} community posts · {overview.challenge.totalCheckIns} check-ins
          </Text>
        </View>
      )}

      {/* Inline AI Chat */}
      <Text style={styles.sectionTitle}>AI Health Coach</Text>
      <MiniChat token={token} onOpenFull={onGoToChat} />

      {/* Quick access */}
      <Text style={styles.sectionTitle}>Quick access</Text>
      <View style={styles.quickGrid}>
        {NAV_ITEMS.filter((item) => item.section !== 'home' && item.section !== 'settings').map((item) => (
          <TouchableOpacity
            key={item.section}
            style={styles.quickLink}
            onPress={() => item.section === 'chat' ? onGoToChat() : onSelect(item.section)}
          >
            <Text style={styles.quickIcon}>{item.icon}</Text>
            <Text style={styles.quickLabel}>{item.label}</Text>
            <Text style={styles.quickChevron}>›</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

function Metric({ label, value, icon, suffix = '' }: { label: string; value?: number; icon: string; suffix?: string }) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricIcon}>{icon}</Text>
      <Text style={styles.metricValue}>{value === undefined ? '—' : `${value}${suffix}`}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function ReportsSection({ token }: { token: string | null }) {
  const [data, setData] = useState<ReportsOverview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    let active = true;
    void reportsApi.getOverview(token, 30)
      .then((result) => { if (active) setData(result); })
      .catch((loadError: unknown) => { if (active) setError(loadError instanceof Error ? loadError.message : 'Unable to load reports.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [token]);

  return (
    <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>
      <Text style={styles.pageTitle}>Reports</Text>
      <Text style={styles.muted}>Activity summary for the last 30 days</Text>
      {loading && <Loading />}
      <ErrorText message={error} />
      {data && (
        <>
          <Text style={styles.sectionTitle}>Challenges & check-ins</Text>
          <View style={styles.card}>
            <DataRow label="Completed check-ins" value={data.challenge.completed} />
            <DataRow label="Completion rate" value={`${Math.round(data.challenge.completionRate)}%`} />
            <DataRow label="Current streak" value={`${data.challenge.currentStreakDays} days`} />
          </View>
          <Text style={styles.sectionTitle}>Nutrition</Text>
          <View style={styles.card}>
            <DataRow label="Meals logged" value={data.nutrition.entries} />
            <DataRow label="Calories recorded" value={Math.round(data.nutrition.calories)} />
            <DataRow label="Protein recorded" value={`${Math.round(data.nutrition.proteinG)} g`} />
          </View>
          <Text style={styles.sectionTitle}>Workouts</Text>
          <View style={styles.card}>
            <DataRow label="Sessions" value={data.workout.sessions} />
            <DataRow label="Time trained" value={`${data.workout.totalMinutes} min`} />
            <DataRow label="Average session" value={`${Math.round(data.workout.avgMinutesPerSession)} min`} />
          </View>
          <Text style={styles.sectionTitle}>Community</Text>
          <View style={styles.card}>
            <DataRow label="Posts" value={data.community.posts} />
            <DataRow label="Reactions received" value={data.community.reactionsReceived} />
            <DataRow label="Replies received" value={data.community.repliesReceived} />
          </View>
        </>
      )}
    </ScrollView>
  );
}

function DataRow({ label, value }: { label: string; value: string | number }) {
  return <View style={styles.dataRow}><Text style={styles.cardText}>{label}</Text><Text style={styles.dataValue}>{value}</Text></View>;
}

function CommunitySection({ token }: { token: string | null }) {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [content, setContent] = useState('');
  const [type, setType] = useState<'WIN' | 'QUESTION' | 'CHECK_IN'>('WIN');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFeed = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const feed = await communityApi.getFeed(token);
      setPosts(Array.isArray(feed) ? feed as FeedPost[] : (feed.items ?? []) as FeedPost[]);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load the community feed.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void Promise.resolve().then(loadFeed);
  }, [loadFeed]);

  const createPost = async () => {
    if (!token || !content.trim() || saving) return;
    setSaving(true);
    setError(null);
    try {
      await communityApi.createPost(content.trim(), type, token);
      setContent('');
      await loadFeed();
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : 'Unable to publish your post.';
      setError(message);
      Alert.alert('Post not published', message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>
      <Text style={styles.pageTitle}>Community</Text>
      <Text style={styles.muted}>Share progress and encourage your group.</Text>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Create a post</Text>
        <View style={styles.choiceRow}>
          {(['WIN', 'QUESTION', 'CHECK_IN'] as const).map((value) => (
            <TouchableOpacity key={value} onPress={() => setType(value)} style={[styles.choice, type === value && styles.choiceActive]}>
              <Text style={[styles.choiceText, type === value && styles.choiceTextActive]}>{value.replace('_', ' ')}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TextInput style={styles.textArea} value={content} onChangeText={setContent} placeholder="What would you like to share?" placeholderTextColor={COLORS.muted} multiline maxLength={1000} />
        <PrimaryButton label={saving ? 'Publishing…' : 'Publish post'} onPress={() => void createPost()} disabled={!content.trim() || saving} />
      </View>
      <ErrorText message={error} />
      {loading && <Loading label="Loading community posts…" />}
      {!loading && posts.length === 0 && <View style={styles.card}><Text style={styles.cardText}>No community posts are available for your group yet.</Text></View>}
      {posts.map((post) => (
        <View key={post.id} style={styles.card}>
          <View style={styles.postHeader}>
            <Text style={styles.postAuthor}>{post.author?.displayName || post.author?.username || 'Member'}</Text>
            <Text style={styles.postType}>{post.type?.replace('_', ' ') || 'POST'}</Text>
          </View>
          <Text style={styles.cardText}>{post.content}</Text>
          <Text style={styles.postDate}>{new Date(post.createdAt).toLocaleString()}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

function CheckInSection({ token }: { token: string | null }) {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadChallenges = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      setChallenges(await challengeApi.getChallenges(token) as Challenge[]);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load challenges.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void Promise.resolve().then(loadChallenges);
  }, [loadChallenges]);

  const enroll = async () => {
    if (!token) return;
    setBusy(true);
    setError(null);
    try {
      await challengeApi.enroll(token);
      await loadChallenges();
      Alert.alert('Challenge joined', 'You are enrolled and can now submit your daily check-in.');
    } catch (actionError) {
      const message = actionError instanceof Error ? actionError.message : 'Unable to join a challenge.';
      setError(message);
      Alert.alert('Could not join', message);
    } finally {
      setBusy(false);
    }
  };

  const checkIn = async (status: 'COMPLETED' | 'PARTIAL' | 'SKIPPED') => {
    if (!token) return;
    setBusy(true);
    setError(null);
    try {
      await challengeApi.checkIn(status, token);
      Alert.alert('Check-in saved', 'Your daily challenge check-in has been recorded.');
      await loadChallenges();
    } catch (actionError) {
      const message = actionError instanceof Error ? actionError.message : 'Unable to save check-in.';
      setError(message);
      Alert.alert('Check-in not saved', message);
    } finally {
      setBusy(false);
    }
  };

  const joined = challenges.find((challenge) => challenge.participations?.some((participation) => participation.status === 'JOINED'));

  return (
    <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>
      <Text style={styles.pageTitle}>Daily Check-in</Text>
      <Text style={styles.muted}>Record how you showed up for your active challenge today.</Text>
      {loading && <Loading label="Loading active challenges…" />}
      <ErrorText message={error} />
      {!loading && !challenges.length && <View style={styles.card}><Text style={styles.cardText}>There are no active challenges available right now.</Text></View>}
      {challenges.map((challenge) => (
        <View key={challenge.id} style={styles.card}>
          <Text style={styles.cardTitle}>{challenge.title}</Text>
          {!!challenge.description && <Text style={styles.cardText}>{challenge.description}</Text>}
          {challenge.participations?.length ? <Text style={styles.successText}>You are participating</Text> : null}
        </View>
      ))}
      {!loading && challenges.length > 0 && !joined && <PrimaryButton label={busy ? 'Joining…' : 'Join an active challenge'} onPress={() => void enroll()} disabled={busy} />}
      {joined && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>How did today go?</Text>
          <Text style={styles.cardText}>Your check-in can only be submitted once per day.</Text>
          <View style={styles.statusChoices}>
            <PrimaryButton label="Completed" onPress={() => void checkIn('COMPLETED')} disabled={busy} />
            <SecondaryButton label="Partially" onPress={() => void checkIn('PARTIAL')} disabled={busy} />
            <SecondaryButton label="Skipped" onPress={() => void checkIn('SKIPPED')} disabled={busy} />
          </View>
        </View>
      )}
    </ScrollView>
  );
}

function StoreSection({ token }: { token: string | null }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    void storeApi.getProducts(token)
      .then((result) => { if (active) setProducts(result.items as Product[]); })
      .catch((loadError: unknown) => { if (active) setError(loadError instanceof Error ? loadError.message : 'Unable to load the store.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [token]);

  return (
    <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>
      <Text style={styles.pageTitle}>Store</Text>
      <Text style={styles.muted}>Products and services available to members.</Text>
      {loading && <Loading label="Loading products…" />}
      <ErrorText message={error} />
      {!loading && !products.length && <View style={styles.card}><Text style={styles.cardText}>No products are available at the moment.</Text></View>}
      {products.map((product) => (
        <View key={product.id} style={styles.card}>
          <Text style={styles.cardTitle}>{product.name}</Text>
          {!!product.description && <Text style={styles.cardText}>{product.description}</Text>}
          {typeof product.priceCents === 'number' && <Text style={styles.productPrice}>{(product.priceCents / 100).toFixed(2)} {product.currency || 'USD'}</Text>}
        </View>
      ))}
    </ScrollView>
  );
}

function SettingsSection({ user, onSignOut }: { user: { displayName?: string; email?: string; role?: string } | null; onSignOut: () => void }) {
  const router = useRouter();
  return (
    <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>
      <Text style={styles.pageTitle}>Settings</Text>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{user?.displayName || 'Member'}</Text>
        <Text style={styles.cardText}>{user?.email || ''}</Text>
        <Text style={styles.postType}>{user?.role || 'MEMBER'}</Text>
      </View>
      {(user?.role === 'COACH' || user?.role === 'ADMIN') && (
        <View style={{ marginBottom: 12 }}>
          <PrimaryButton label="Open Coach Command Center →" onPress={() => router.push('/coach' as any)} />
        </View>
      )}
      <PrimaryButton label="Sign out" onPress={onSignOut} />
    </ScrollView>
  );
}

function PrimaryButton({ label, onPress, disabled = false }: { label: string; onPress: () => void; disabled?: boolean }) {
  return <TouchableOpacity style={[styles.primaryButton, disabled && styles.buttonDisabled]} onPress={onPress} disabled={disabled}><Text style={styles.primaryButtonText}>{label}</Text></TouchableOpacity>;
}

function SecondaryButton({ label, onPress, disabled = false }: { label: string; onPress: () => void; disabled?: boolean }) {
  return <TouchableOpacity style={[styles.secondaryButton, disabled && styles.buttonDisabled]} onPress={onPress} disabled={disabled}><Text style={styles.secondaryButtonText}>{label}</Text></TouchableOpacity>;
}

export default function DashboardScreen() {
  const router = useRouter();
  const { user, token, logout, isLoading } = useAuth();
  const [activeSection, setActiveSection] = useState<Section>('home');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarAnim] = useState(() => new Animated.Value(-SIDEBAR_WIDTH));
  const [overlayAnim] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (!isLoading && !user) router.replace('/auth');
  }, [isLoading, user, router]);

  const closeSidebar = useCallback(() => {
    Animated.parallel([
      Animated.spring(sidebarAnim, { toValue: -SIDEBAR_WIDTH, useNativeDriver: true, tension: 65, friction: 11 }),
      Animated.timing(overlayAnim, { toValue: 0, duration: 180, useNativeDriver: true })
    ]).start(() => setSidebarOpen(false));
  }, [sidebarAnim, overlayAnim]);

  const openSidebar = () => {
    setSidebarOpen(true);
    Animated.parallel([
      Animated.spring(sidebarAnim, { toValue: 0, useNativeDriver: true, tension: 65, friction: 11 }),
      Animated.timing(overlayAnim, { toValue: 1, duration: 200, useNativeDriver: true })
    ]).start();
  };

  const signOut = async () => {
    try {
      await logout();
      router.replace('/');
    } catch (error) {
      Alert.alert('Sign out failed', error instanceof Error ? error.message : 'Unable to clear the saved session.');
    }
  };

  const selectSection = (section: Section) => {
    closeSidebar();
    if (section === 'chat') router.push('/chat');
    else if (section === 'nutrition') router.push('/nutrition');
    else if (section === 'workouts') router.push('/workouts');
    else setActiveSection(section);
  };

  if (isLoading || !user) {
    return <View style={styles.loadingScreen}><ActivityIndicator size="large" color={COLORS.accent} /><Text style={styles.muted}>Loading your account…</Text></View>;
  }

  const currentTitle = NAV_ITEMS.find((item) => item.section === activeSection)?.label || 'Dashboard';
  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.menuButton} onPress={openSidebar}><Text style={styles.menuIcon}>☰</Text></TouchableOpacity>
        <View style={styles.topTitleGroup}><Text style={styles.brand}>STEADYAI</Text><Text style={styles.topTitle}>{currentTitle}</Text></View>
        <View style={styles.avatar}><Text style={styles.avatarText}>{user.displayName?.slice(0, 1).toUpperCase() || 'M'}</Text></View>
      </View>

      <View style={styles.screenBody}>
        {activeSection === 'home' && <HomeSection name={user.displayName} token={token} onGoToChat={() => router.push('/chat')} onSelect={selectSection} />}
        {activeSection === 'progress' && <ReportsSection token={token} />}
        {activeSection === 'community' && <CommunitySection token={token} />}
        {activeSection === 'check-in' && <CheckInSection token={token} />}
        {activeSection === 'store' && <StoreSection token={token} />}
        {activeSection === 'settings' && <SettingsSection user={user} onSignOut={() => void signOut()} />}
      </View>

      {sidebarOpen && (
        <Animated.View style={[styles.overlay, { opacity: overlayAnim }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={closeSidebar} />
        </Animated.View>
      )}
      <Animated.View style={[styles.sidebar, { transform: [{ translateX: sidebarAnim }] }]}>
        <View style={styles.sidebarTop}>
          <Text style={styles.brand}>⚡ SteadyAI</Text>
          <TouchableOpacity onPress={closeSidebar}><Text style={styles.closeIcon}>×</Text></TouchableOpacity>
        </View>
        <View style={styles.accountCard}>
          <View style={styles.sidebarAvatar}><Text style={styles.avatarText}>{user.displayName?.slice(0, 1).toUpperCase() || 'M'}</Text></View>
          <View style={{ flex: 1 }}><Text numberOfLines={1} style={styles.accountName}>{user.displayName}</Text><Text numberOfLines={1} style={styles.accountEmail}>{user.email}</Text></View>
        </View>
        <ScrollView style={styles.navList}>
          {NAV_ITEMS.map((item) => (
            <TouchableOpacity key={item.section} style={[styles.navItem, activeSection === item.section && styles.navItemActive]} onPress={() => selectSection(item.section)}>
              <Text style={styles.navIcon}>{item.icon}</Text><Text style={[styles.navLabel, activeSection === item.section && styles.navLabelActive]}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <SecondaryButton label="Sign out" onPress={() => { closeSidebar(); void signOut(); }} />
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  screenBody: { flex: 1 },
  loadingScreen: { flex: 1, backgroundColor: COLORS.bg, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingInline: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 14 },
  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  menuButton: { width: 42, height: 42, borderRadius: 13, backgroundColor: COLORS.card, alignItems: 'center', justifyContent: 'center' },
  menuIcon: { color: COLORS.text, fontSize: 18 },
  topTitleGroup: { flex: 1, marginLeft: 12 },
  brand: { color: COLORS.accent, fontSize: 11, fontWeight: '900', letterSpacing: 1.5 },
  topTitle: { color: COLORS.text, fontWeight: '700', fontSize: 15, marginTop: 2 },
  avatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: COLORS.cardLight, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.accent },
  avatarText: { color: COLORS.accent, fontWeight: '800', fontSize: 14 },
  content: { flex: 1 },
  contentInner: { padding: 18, paddingBottom: 36 },
  hero: { padding: 20, borderRadius: 20, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, marginBottom: 20 },
  eyebrow: { color: COLORS.accent, fontWeight: '800', letterSpacing: 1.5, fontSize: 10, marginBottom: 9 },
  heroTitle: { color: COLORS.text, fontSize: 24, fontWeight: '800', marginBottom: 6 },
  pageTitle: { color: COLORS.text, fontSize: 25, fontWeight: '800', marginBottom: 5 },
  muted: { color: COLORS.muted, fontSize: 12, lineHeight: 18 },
  sectionTitle: { color: COLORS.text, fontSize: 16, fontWeight: '800', marginTop: 16, marginBottom: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  metricCard: { width: (SCREEN_WIDTH - 46) / 2, minHeight: 112, padding: 14, borderRadius: 16, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border },
  metricIcon: { color: COLORS.accent, fontSize: 17 },
  metricValue: { color: COLORS.text, fontSize: 23, fontWeight: '800', marginTop: 7 },
  metricLabel: { color: COLORS.muted, fontSize: 11, marginTop: 2 },
  card: { backgroundColor: COLORS.card, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, marginTop: 10 },
  cardTitle: { color: COLORS.text, fontSize: 15, fontWeight: '800', marginBottom: 8 },
  cardText: { color: '#d8cec5', fontSize: 13, lineHeight: 20, marginTop: 3 },
  dataRow: { minHeight: 40, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: COLORS.border },
  dataValue: { color: COLORS.accent, fontSize: 13, fontWeight: '800' },
  quickGrid: { gap: 8 },
  quickLink: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 14, borderRadius: 13, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border },
  quickIcon: { color: COLORS.accent, width: 30, fontSize: 17 },
  quickLabel: { flex: 1, color: COLORS.text, fontWeight: '600', fontSize: 13 },
  quickChevron: { color: COLORS.muted, fontSize: 22 },
  errorText: { color: COLORS.danger, fontSize: 12, lineHeight: 18, marginVertical: 8 },
  choiceRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginVertical: 10 },
  choice: { borderWidth: 1, borderColor: COLORS.border, paddingVertical: 7, paddingHorizontal: 10, borderRadius: 16 },
  choiceActive: { backgroundColor: 'rgba(243,201,159,0.14)', borderColor: COLORS.accent },
  choiceText: { color: COLORS.muted, fontSize: 10, fontWeight: '700' },
  choiceTextActive: { color: COLORS.accent },
  textArea: { color: COLORS.text, minHeight: 86, backgroundColor: COLORS.bg, borderColor: COLORS.border, borderWidth: 1, borderRadius: 12, padding: 12, textAlignVertical: 'top', marginBottom: 10 },
  primaryButton: { minHeight: 44, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.accent, borderRadius: 12, paddingHorizontal: 14, marginTop: 9 },
  primaryButtonText: { color: '#20160f', fontSize: 13, fontWeight: '800' },
  secondaryButton: { minHeight: 42, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(243,201,159,0.35)', backgroundColor: COLORS.cardLight, borderRadius: 12, paddingHorizontal: 12, marginTop: 8 },
  secondaryButtonText: { color: COLORS.accent, fontSize: 12, fontWeight: '700' },
  buttonDisabled: { opacity: 0.5 },
  postHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  postAuthor: { color: COLORS.text, fontWeight: '800', fontSize: 13 },
  postType: { color: COLORS.accent, fontSize: 10, fontWeight: '800', letterSpacing: 0.7, marginTop: 6 },
  postDate: { color: COLORS.muted, fontSize: 10, marginTop: 12 },
  successText: { color: COLORS.success, fontSize: 12, fontWeight: '700', marginTop: 10 },
  statusChoices: { gap: 4, marginTop: 8 },
  productPrice: { color: COLORS.accent, fontSize: 15, fontWeight: '800', marginTop: 12 },
  overlay: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.65)', zIndex: 10 },
  sidebar: { position: 'absolute', top: 0, bottom: 0, left: 0, width: SIDEBAR_WIDTH, backgroundColor: '#110b08', zIndex: 20, elevation: 20, borderRightWidth: 1, borderRightColor: COLORS.border, padding: 16, paddingTop: 25 },
  sidebarTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  closeIcon: { color: COLORS.muted, fontSize: 26 },
  accountCard: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, backgroundColor: COLORS.card, borderRadius: 13, marginBottom: 16 },
  sidebarAvatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: COLORS.cardLight, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.accent },
  accountName: { color: COLORS.text, fontSize: 13, fontWeight: '700' },
  accountEmail: { color: COLORS.muted, fontSize: 10, marginTop: 3 },
  navList: { flex: 1 },
  navItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 12, borderRadius: 11, marginBottom: 3 },
  navItemActive: { backgroundColor: 'rgba(243,201,159,0.12)' },
  navIcon: { width: 23, textAlign: 'center', color: COLORS.muted, fontSize: 16 },
  navLabel: { color: '#c7b9ac', fontSize: 13, fontWeight: '600' },
  navLabelActive: { color: COLORS.accent, fontWeight: '800' }
});
