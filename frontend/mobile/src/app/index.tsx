/**
 * SteadyAI — Landing Page
 * Professional hero with animations, features, stats, CTA
 */
import React, { useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, SafeAreaView, ScrollView,
  StyleSheet, Animated, Dimensions, StatusBar, ImageBackground,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';

const { width } = Dimensions.get('window');

// ─── Theme ────────────────────────────────────────────────────────────────────
const C = {
  bg: '#07040a',
  bgCard: '#120d09',
  accent: '#f3c99f',
  accentDim: '#a8927c',
  accentMuted: '#2a1c0e',
  text: '#f5f0eb',
  textSub: '#9e8c7e',
  textMuted: '#5c4d40',
  border: '#1f160e',
  success: '#5cbb8a',
  gradient1: '#1a0d04',
};

const FEATURES = [
  { icon: '🤖', title: 'AI Health Coach', sub: '24/7 Gemini-powered guidance, personalized to your body & goals' },
  { icon: '🥗', title: 'Smart Nutrition', sub: 'AI meal logging — macros & calories calculated instantly' },
  { icon: '🏋️', title: 'Adaptive Workouts', sub: 'Dynamic plans that evolve with your progress and recovery' },
  { icon: '📊', title: 'Clinical Insights', sub: 'Health records, biomechanics tracking, PHIA-grade data security' },
];

const STATS = [
  { value: '50K+', label: 'Active Members' },
  { value: '2.1M', label: 'Workouts Logged' },
  { value: '98%', label: 'Satisfaction' },
];

const TESTIMONIALS = [
  { name: 'Arjun M.', role: 'Lost 14 kg in 3 months', quote: 'SteadyAI changed my life. The AI coach feels like having a personal trainer in my pocket 24/7.' },
  { name: 'Priya K.', role: 'Marathon runner', quote: 'My training has never been this optimized. The nutrition tracking is insanely accurate and easy.' },
];

export default function LandingPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.92)).current;
  const badgeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isLoading && user) { router.replace('/dashboard'); return; }
    Animated.sequence([
      Animated.delay(100),
      Animated.parallel([
        Animated.timing(fadeAnim,  { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 700, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, friction: 8, tension: 40, useNativeDriver: true }),
      ]),
      Animated.timing(badgeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  }, [isLoading, user]);

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />
      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent}>

        {/* ── Navbar ── */}
        <View style={s.navbar}>
          <View style={s.navLogo}>
            <Text style={s.navLogoIcon}>⚡</Text>
            <Text style={s.navLogoText}>SteadyAI</Text>
          </View>
          <TouchableOpacity style={s.navSignIn} onPress={() => router.push('/auth')} activeOpacity={0.8}>
            <Text style={s.navSignInText}>Sign In</Text>
          </TouchableOpacity>
        </View>

        {/* ── Hero ── */}
        <Animated.View style={[s.hero, { opacity: fadeAnim, transform: [{ translateY: slideAnim }, { scale: scaleAnim }] }]}>
          {/* Badge */}
          <Animated.View style={[s.heroBadge, { opacity: badgeAnim }]}>
            <View style={s.heroBadgeDot} />
            <Text style={s.heroBadgeText}>Powered by Google Gemini AI</Text>
          </Animated.View>

          <Text style={s.heroTitle}>
            Your AI-Powered{'\n'}
            <Text style={s.heroTitleAccent}>Health Revolution</Text>
          </Text>
          <Text style={s.heroSub}>
            From personalized workouts to clinical nutrition tracking — SteadyAI puts a world-class health team in your pocket.
          </Text>

          {/* CTAs */}
          <View style={s.heroCtas}>
            <TouchableOpacity style={s.ctaPrimary} onPress={() => router.push('/auth')} activeOpacity={0.88}>
              <Text style={s.ctaPrimaryText}>Get Started Free</Text>
              <Text style={s.ctaArrow}>→</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.ctaSecondary} onPress={() => router.push('/auth')} activeOpacity={0.85}>
              <Text style={s.ctaSecondaryText}>Sign In</Text>
            </TouchableOpacity>
          </View>

          {/* Trust line */}
          <Text style={s.heroTrust}>No credit card required · Cancel anytime</Text>
        </Animated.View>

        {/* ── Stats bar ── */}
        <Animated.View style={[s.statsBar, { opacity: fadeAnim }]}>
          {STATS.map((st, i) => (
            <React.Fragment key={st.label}>
              <View style={s.statItem}>
                <Text style={s.statValue}>{st.value}</Text>
                <Text style={s.statLabel}>{st.label}</Text>
              </View>
              {i < STATS.length - 1 && <View style={s.statDivider} />}
            </React.Fragment>
          ))}
        </Animated.View>

        {/* ── Features ── */}
        <View style={s.section}>
          <View style={s.sectionBadge}><Text style={s.sectionBadgeText}>FEATURES</Text></View>
          <Text style={s.sectionTitle}>Everything you need to{'\n'}transform your health</Text>
          <View style={s.featuresGrid}>
            {FEATURES.map((f) => (
              <View key={f.title} style={s.featureCard}>
                <View style={s.featureIconWrap}><Text style={s.featureIcon}>{f.icon}</Text></View>
                <Text style={s.featureTitle}>{f.title}</Text>
                <Text style={s.featureSub}>{f.sub}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── AI Preview card ── */}
        <View style={s.section}>
          <View style={s.aiPreviewCard}>
            <View style={s.aiPreviewHeader}>
              <View style={s.aiAvatarSmall}><Text style={s.aiAvatarText}>AI</Text></View>
              <View>
                <Text style={s.aiPreviewName}>SteadyAI Coach</Text>
                <View style={s.onlineDot}><View style={s.onlineDotInner} /><Text style={s.onlineText}>Online</Text></View>
              </View>
            </View>
            {[
              { role: 'ai', text: "Good morning! Based on your sleep data (7.2h) and yesterday's workout, I recommend a moderate upper-body session today. Ready to start?" },
              { role: 'user', text: "Yes! Also suggest what to eat pre-workout." },
              { role: 'ai', text: "Perfect! Have 40g oats + 1 banana + 20g whey protein 60 mins before. That gives you 380 kcal with a 3:1 carb-to-protein ratio. 🔥" },
            ].map((m, i) => (
              <View key={i} style={[s.previewBubbleWrap, m.role === 'user' && s.previewBubbleWrapUser]}>
                <View style={[s.previewBubble, m.role === 'ai' ? s.previewBubbleAI : s.previewBubbleUser]}>
                  <Text style={[s.previewBubbleText, m.role === 'user' && s.previewBubbleTextUser]}>{m.text}</Text>
                </View>
              </View>
            ))}
            <TouchableOpacity style={s.aiPreviewCta} onPress={() => router.push('/auth')} activeOpacity={0.85}>
              <Text style={s.aiPreviewCtaText}>Start chatting with your AI Coach →</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Testimonials ── */}
        <View style={s.section}>
          <View style={s.sectionBadge}><Text style={s.sectionBadgeText}>TESTIMONIALS</Text></View>
          <Text style={s.sectionTitle}>Real results, real people</Text>
          {TESTIMONIALS.map((t) => (
            <View key={t.name} style={s.testimonialCard}>
              <Text style={s.testimonialQuote}>"{t.quote}"</Text>
              <View style={s.testimonialAuthor}>
                <View style={s.testimonialAvatar}><Text style={s.testimonialAvatarText}>{t.name[0]}</Text></View>
                <View>
                  <Text style={s.testimonialName}>{t.name}</Text>
                  <Text style={s.testimonialRole}>{t.role}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* ── Final CTA ── */}
        <View style={s.finalCta}>
          <Text style={s.finalCtaTitle}>Start your transformation{'\n'}today — it's free</Text>
          <Text style={s.finalCtaSub}>Join 50,000+ members already using SteadyAI to reach their health goals.</Text>
          <TouchableOpacity style={s.ctaPrimary} onPress={() => router.push('/auth')} activeOpacity={0.88}>
            <Text style={s.ctaPrimaryText}>Create Free Account</Text>
            <Text style={s.ctaArrow}>→</Text>
          </TouchableOpacity>
        </View>

        {/* ── Footer ── */}
        <View style={s.footer}>
          <Text style={s.footerLogo}>⚡ SteadyAI</Text>
          <Text style={s.footerSub}>AI-powered health & fitness platform</Text>
          <Text style={s.footerCopy}>© 2026 SteadyAI. All rights reserved.</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: C.bg },
  scroll:      { flex: 1 },
  scrollContent: { paddingBottom: 0 },

  // Navbar
  navbar:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
  navLogo:      { flexDirection: 'row', alignItems: 'center', gap: 6 },
  navLogoIcon:  { fontSize: 20 },
  navLogoText:  { color: C.text, fontSize: 18, fontWeight: '800', letterSpacing: 0.3 },
  navSignIn:    { backgroundColor: C.bgCard, borderRadius: 20, paddingHorizontal: 18, paddingVertical: 8, borderWidth: 1, borderColor: C.border },
  navSignInText:{ color: C.accent, fontSize: 14, fontWeight: '600' },

  // Hero
  hero:         { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 32, alignItems: 'center' },
  heroBadge:    { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.accentMuted, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7, borderWidth: 1, borderColor: C.accentDim, marginBottom: 24 },
  heroBadgeDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: C.success },
  heroBadgeText:{ color: C.accentDim, fontSize: 12, fontWeight: '600', letterSpacing: 0.4 },
  heroTitle:    { fontSize: 36, fontWeight: '900', color: C.text, textAlign: 'center', lineHeight: 44, letterSpacing: -0.5 },
  heroTitleAccent: { color: C.accent },
  heroSub:      { color: C.textSub, fontSize: 15, textAlign: 'center', lineHeight: 22, marginTop: 14, maxWidth: 320 },
  heroCtas:     { flexDirection: 'row', gap: 12, marginTop: 28 },
  ctaPrimary:   { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.accent, borderRadius: 14, paddingHorizontal: 22, paddingVertical: 14 },
  ctaPrimaryText: { color: C.bg, fontSize: 15, fontWeight: '800' },
  ctaArrow:     { color: C.bg, fontSize: 16, fontWeight: '800' },
  ctaSecondary: { backgroundColor: C.bgCard, borderRadius: 14, paddingHorizontal: 22, paddingVertical: 14, borderWidth: 1, borderColor: C.border },
  ctaSecondaryText: { color: C.text, fontSize: 15, fontWeight: '600' },
  heroTrust:    { color: C.textMuted, fontSize: 12, marginTop: 14 },

  // Stats
  statsBar:     { flexDirection: 'row', backgroundColor: C.bgCard, marginHorizontal: 20, borderRadius: 16, padding: 18, marginBottom: 8, borderWidth: 1, borderColor: C.border },
  statItem:     { flex: 1, alignItems: 'center' },
  statValue:    { color: C.accent, fontSize: 22, fontWeight: '900' },
  statLabel:    { color: C.textSub, fontSize: 11, marginTop: 3, fontWeight: '500' },
  statDivider:  { width: 1, backgroundColor: C.border, marginVertical: 4 },

  // Section
  section:      { paddingHorizontal: 20, paddingTop: 32 },
  sectionBadge: { backgroundColor: C.accentMuted, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start', marginBottom: 10, borderWidth: 1, borderColor: C.accentDim },
  sectionBadgeText: { color: C.accentDim, fontSize: 10, fontWeight: '800', letterSpacing: 1.2 },
  sectionTitle: { color: C.text, fontSize: 26, fontWeight: '800', lineHeight: 33, letterSpacing: -0.3, marginBottom: 18 },

  // Features
  featuresGrid: { gap: 12 },
  featureCard:  { backgroundColor: C.bgCard, borderRadius: 16, padding: 18, borderWidth: 1, borderColor: C.border },
  featureIconWrap: { width: 46, height: 46, borderRadius: 13, backgroundColor: C.accentMuted, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  featureIcon:  { fontSize: 22 },
  featureTitle: { color: C.text, fontSize: 16, fontWeight: '700', marginBottom: 5 },
  featureSub:   { color: C.textSub, fontSize: 13, lineHeight: 19 },

  // AI Preview
  aiPreviewCard:   { backgroundColor: C.bgCard, borderRadius: 20, padding: 18, borderWidth: 1, borderColor: C.border, gap: 12 },
  aiPreviewHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: C.border },
  aiAvatarSmall:   { width: 38, height: 38, borderRadius: 19, backgroundColor: C.accentMuted, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: C.accent },
  aiAvatarText:    { color: C.accent, fontSize: 11, fontWeight: '800' },
  aiPreviewName:   { color: C.text, fontSize: 14, fontWeight: '700' },
  onlineDot:       { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  onlineDotInner:  { width: 6, height: 6, borderRadius: 3, backgroundColor: C.success },
  onlineText:      { color: C.success, fontSize: 11, fontWeight: '500' },
  previewBubbleWrap: { flexDirection: 'row' },
  previewBubbleWrapUser: { flexDirection: 'row-reverse' },
  previewBubble:   { maxWidth: '80%', borderRadius: 14, padding: 12 },
  previewBubbleAI: { backgroundColor: '#160f08', borderWidth: 1, borderColor: C.border, borderBottomLeftRadius: 4 },
  previewBubbleUser: { backgroundColor: '#2a1c0e', borderWidth: 1, borderColor: C.accentMuted, borderBottomRightRadius: 4 },
  previewBubbleText: { color: C.text, fontSize: 13, lineHeight: 19 },
  previewBubbleTextUser: { color: C.accent },
  aiPreviewCta:    { backgroundColor: C.accentMuted, borderRadius: 12, paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: C.accentDim, marginTop: 4 },
  aiPreviewCtaText:{ color: C.accent, fontSize: 14, fontWeight: '700' },

  // Testimonials
  testimonialCard: { backgroundColor: C.bgCard, borderRadius: 16, padding: 18, borderWidth: 1, borderColor: C.border, marginBottom: 12 },
  testimonialQuote:{ color: C.text, fontSize: 14, lineHeight: 21, fontStyle: 'italic', marginBottom: 14 },
  testimonialAuthor: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  testimonialAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: C.accentMuted, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.accent },
  testimonialAvatarText: { color: C.accent, fontSize: 14, fontWeight: '800' },
  testimonialName: { color: C.text, fontSize: 14, fontWeight: '700' },
  testimonialRole: { color: C.textSub, fontSize: 12, marginTop: 1 },

  // Final CTA
  finalCta:     { margin: 20, marginTop: 36, backgroundColor: C.bgCard, borderRadius: 24, padding: 28, alignItems: 'center', borderWidth: 1, borderColor: C.border, borderTopWidth: 3, borderTopColor: C.accent },
  finalCtaTitle:{ color: C.text, fontSize: 24, fontWeight: '900', textAlign: 'center', lineHeight: 32, marginBottom: 10 },
  finalCtaSub:  { color: C.textSub, fontSize: 13, textAlign: 'center', lineHeight: 19, marginBottom: 22 },

  // Footer
  footer:       { backgroundColor: '#050203', paddingVertical: 28, paddingHorizontal: 24, alignItems: 'center', gap: 6, marginTop: 8 },
  footerLogo:   { color: C.accent, fontSize: 16, fontWeight: '800' },
  footerSub:    { color: C.textMuted, fontSize: 12 },
  footerCopy:   { color: C.textMuted, fontSize: 11 },
});
