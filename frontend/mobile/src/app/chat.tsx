/**
 * SteadyAI — AI Chat Screen
 * Architecture: useA2UIStream drives the chat; every AI reply is rendered
 * via A2UIRenderer so the backend can send rich cards, metrics, workout plans.
 * Falls back to a plain TextBlock if the backend sends a plain text reply.
 */
import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, SafeAreaView,
  ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator,
  StyleSheet, StatusBar, Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { chatApi } from '../services/api';
import { A2UIRenderer } from '../a2ui/renderer';
import { useA2UIStream, fetchA2UISpec } from '../a2ui/useA2UIStream';
import type { A2UISpec, A2UIActionPayload } from '../a2ui/types';

const { width: SW } = Dimensions.get('window');
const C = {
  bg:        '#090605',
  card:      '#17100c',
  cardLight: '#21170f',
  accent:    '#f3c99f',
  accentDim: '#a8927c',
  accentMut: 'rgba(243,201,159,0.12)',
  text:      '#f8f3ee',
  sub:       '#d8cec5',
  muted:     '#a8927c',
  border:    'rgba(255,255,255,0.09)',
  danger:    '#fca5a5',
  success:   '#6ee7b7',
  userBubble:'#1f1208',
};

// ─── Types ────────────────────────────────────────────────────────────────────

type MsgRole = 'user' | 'assistant';

interface ChatMessage {
  id: string;
  role: MsgRole;
  /** Plain text — shown when spec is null */
  text?: string;
  /** A2UI spec — rendered via A2UIRenderer */
  spec?: A2UISpec;
  timestamp: Date;
}

// ─── Quick prompt chips ───────────────────────────────────────────────────────

const QUICK_PROMPTS = [
  'Create a workout plan for me',
  'Log my meal',
  'Show my progress',
  'Recovery tips',
  'Nutrition advice',
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function uid() { return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`; }
function timeStr(d: Date) { return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }

/** Converts a plain-text reply into a minimal A2UI spec */
function textToSpec(text: string): A2UISpec {
  return {
    specId: uid(),
    components: [{ id: uid(), type: 'TextBlock', props: { text, variant: 'body' } }],
  };
}

// ─── Message bubble ───────────────────────────────────────────────────────────

function MessageBubble({ msg, onAction }: { msg: ChatMessage; onAction: (p: A2UIActionPayload) => void }) {
  const isUser = msg.role === 'user';

  if (isUser) {
    return (
      <View style={b.userWrap}>
        <View style={b.userBubble}>
          <Text style={b.userText}>{msg.text}</Text>
          <Text style={b.time}>{timeStr(msg.timestamp)}</Text>
        </View>
      </View>
    );
  }

  // AI message — rendered via A2UIRenderer
  const spec = msg.spec ?? (msg.text ? textToSpec(msg.text) : null);
  return (
    <View style={b.aiWrap}>
      <View style={b.aiBadge}><Text style={b.aiBadgeText}>AI</Text></View>
      <View style={b.aiBubble}>
        {spec ? (
          <A2UIRenderer spec={spec} onAction={onAction} />
        ) : (
          <ActivityIndicator size="small" color={C.accent} />
        )}
        <Text style={b.time}>{timeStr(msg.timestamp)}</Text>
      </View>
    </View>
  );
}

const b = StyleSheet.create({
  userWrap:    { flexDirection: 'row-reverse', marginBottom: 14, paddingHorizontal: 14 },
  userBubble:  { maxWidth: SW * 0.72, backgroundColor: C.userBubble, borderRadius: 18, borderBottomRightRadius: 4, padding: 12, borderWidth: 1, borderColor: C.accentMut },
  userText:    { color: C.accent, fontSize: 14, lineHeight: 20 },
  aiWrap:      { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 14, paddingHorizontal: 14 },
  aiBadge:     { width: 28, height: 28, borderRadius: 14, backgroundColor: C.accentMut, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border, marginTop: 2, flexShrink: 0 },
  aiBadgeText: { color: C.accent, fontSize: 8, fontWeight: '900' },
  aiBubble:    { flex: 1, backgroundColor: C.card, borderRadius: 18, borderBottomLeftRadius: 4, padding: 12, borderWidth: 1, borderColor: C.border },
  time:        { color: C.muted, fontSize: 10, marginTop: 7, alignSelf: 'flex-end' },
});

// ─── Typing indicator ─────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <View style={[b.aiWrap, { paddingHorizontal: 14 }]}>
      <View style={b.aiBadge}><Text style={b.aiBadgeText}>AI</Text></View>
      <View style={[b.aiBubble, { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10 }]}>
        <ActivityIndicator size="small" color={C.accent} />
        <Text style={{ color: C.muted, fontSize: 13 }}>Thinking…</Text>
      </View>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function ChatScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const scrollRef = useRef<ScrollView>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'greeting',
      role: 'assistant',
      spec: {
        specId: 'greeting',
        components: [
          {
            id: 'g1', type: 'TextBlock',
            props: { text: "Hi! I'm your AI Health Coach powered by SteadyAI 💪\n\nAsk me anything about workouts, nutrition, recovery, or your progress.", variant: 'body' },
          },
          {
            id: 'g2', type: 'QuickReply',
            props: { labels: 'Create a workout|Log my meal|Recovery tips|My progress', action: 'quick' },
          },
        ],
      },
      timestamp: new Date(),
    },
  ]);

  const [input, setInput]   = useState('');
  const [sending, setSending] = useState(false);
  const [convId, setConvId]   = useState<string | null>(null);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages]);

  // ── Send a message ──
  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    // Add user bubble
    const userMsg: ChatMessage = { id: uid(), role: 'user', text: trimmed, timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setSending(true);

    try {
      const res = await chatApi.sendMessage(trimmed, token ?? '', convId);

      // Track conversation ID for context
      if (res.conversationId) setConvId(res.conversationId);

      // Build A2UI spec from response
      let spec: A2UISpec | undefined;

      if (res.cards && Array.isArray(res.cards) && res.cards.length > 0) {
        // Backend sent A2UI components directly
        spec = { specId: uid(), components: res.cards as A2UISpec['components'] };
      } else if (res.workoutPlan) {
        // Backend returned a workout plan object — wrap it in a WorkoutCard
        const plan = res.workoutPlan as Record<string, unknown>;
        const exercises = Array.isArray(plan.exercises)
          ? JSON.stringify(plan.exercises.map((e: Record<string, unknown>) => ({ name: e.name, reps: `${e.sets ?? ''} × ${e.reps ?? e.duration ?? ''}`.trim() })))
          : '[]';
        spec = {
          specId: uid(),
          components: [
            { id: uid(), type: 'TextBlock', props: { text: res.reply, variant: 'body' } },
            {
              id: uid(), type: 'WorkoutCard',
              props: {
                title: String(plan.name ?? 'Your Workout Plan'),
                duration: String(plan.duration ?? '45 min'),
                difficulty: String(plan.difficulty ?? 'Moderate'),
                exercises,
              },
            },
          ],
        };
      } else {
        // Plain text reply → TextBlock
        spec = textToSpec(res.reply ?? 'Done!');
      }

      const aiMsg: ChatMessage = { id: uid(), role: 'assistant', spec, timestamp: new Date() };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      const errMsg: ChatMessage = {
        id: uid(),
        role: 'assistant',
        spec: {
          specId: uid(),
          components: [
            { id: uid(), type: 'AlertBanner', props: { message: err instanceof Error ? err.message : 'Could not reach the server. Make sure the backend is running.', severity: 'error' } },
          ],
        },
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setSending(false);
    }
  }, [token, convId, sending]);

  // ── Handle A2UI action dispatches ──
  const handleAction = useCallback((payload: A2UIActionPayload) => {
    const { action } = payload;
    // QuickReply chips dispatch "quick:Label" or "action:Label"
    const label = action.includes(':') ? action.split(':').slice(1).join(':') : action;
    void sendMessage(label);
  }, [sendMessage]);

  return (
    <SafeAreaView style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />

      {/* Top bar */}
      <View style={s.topBar}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()} hitSlop={12}>
          <Text style={s.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={s.topBarCenter}>
          <View style={s.onlineDot} />
          <Text style={s.topBarTitle}>AI Health Coach</Text>
        </View>
        <View style={s.topBarBadge}><Text style={s.topBarBadgeText}>✦ GEMINI</Text></View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Messages */}
        <ScrollView
          ref={scrollRef}
          style={s.scrollArea}
          contentContainerStyle={s.scrollContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={scrollToBottom}
        >
          {messages.map((msg) => (
            <MessageBubble key={msg.id} msg={msg} onAction={handleAction} />
          ))}
          {sending && <TypingIndicator />}
          <View style={{ height: 20 }} />
        </ScrollView>

        {/* Quick prompts */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={s.promptsScroll}
          contentContainerStyle={s.promptsContent}
        >
          {QUICK_PROMPTS.map((p) => (
            <TouchableOpacity
              key={p}
              style={s.promptChip}
              onPress={() => void sendMessage(p)}
              activeOpacity={0.75}
            >
              <Text style={s.promptChipText}>{p}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Input row */}
        <View style={s.inputRow}>
          <TextInput
            style={s.input}
            value={input}
            onChangeText={setInput}
            placeholder="Ask your AI Coach…"
            placeholderTextColor={C.muted}
            multiline
            maxLength={1200}
            onSubmitEditing={() => void sendMessage(input)}
            returnKeyType="send"
          />
          <TouchableOpacity
            style={[s.sendBtn, (!input.trim() || sending) && s.sendBtnOff]}
            onPress={() => void sendMessage(input)}
            disabled={!input.trim() || sending}
            activeOpacity={0.85}
          >
            {sending
              ? <ActivityIndicator size="small" color={C.bg} />
              : <Text style={s.sendIcon}>↑</Text>
            }
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root:          { flex: 1, backgroundColor: C.bg },

  // Top bar
  topBar:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: C.border, gap: 10 },
  backBtn:       { width: 36, height: 36, borderRadius: 10, backgroundColor: C.card, alignItems: 'center', justifyContent: 'center' },
  backIcon:      { color: C.accentDim, fontSize: 17 },
  topBarCenter:  { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 7 },
  onlineDot:     { width: 8, height: 8, borderRadius: 4, backgroundColor: C.success },
  topBarTitle:   { color: C.text, fontSize: 16, fontWeight: '800' },
  topBarBadge:   { backgroundColor: C.accentMut, borderRadius: 7, paddingHorizontal: 9, paddingVertical: 4, borderWidth: 1, borderColor: C.border },
  topBarBadgeText:{ color: C.accentDim, fontSize: 9, fontWeight: '900', letterSpacing: 0.8 },

  // Chat area
  scrollArea:    { flex: 1 },
  scrollContent: { paddingTop: 14, paddingBottom: 8 },

  // Quick prompts
  promptsScroll:   { maxHeight: 44, borderTopWidth: 1, borderTopColor: C.border },
  promptsContent:  { paddingHorizontal: 12, paddingVertical: 8, gap: 7, alignItems: 'center' },
  promptChip:      { backgroundColor: C.card, borderRadius: 18, paddingHorizontal: 13, paddingVertical: 6, borderWidth: 1, borderColor: C.border },
  promptChipText:  { color: C.accentDim, fontSize: 12, fontWeight: '500' },

  // Input
  inputRow:  { flexDirection: 'row', alignItems: 'flex-end', gap: 9, paddingHorizontal: 12, paddingVertical: 10, borderTopWidth: 1, borderTopColor: C.border, backgroundColor: C.bg },
  input:     { flex: 1, backgroundColor: C.card, borderRadius: 18, paddingHorizontal: 15, paddingVertical: 10, color: C.text, fontSize: 14, maxHeight: 110, borderWidth: 1, borderColor: C.border },
  sendBtn:   { width: 42, height: 42, borderRadius: 21, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center' },
  sendBtnOff:{ backgroundColor: C.accentMut },
  sendIcon:  { color: C.bg, fontSize: 18, fontWeight: '900' },
});
