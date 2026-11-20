/**
 * SteadyAI — Sign In / Sign Up Screen
 * Professional animated auth with real backend connection
 */
import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, SafeAreaView,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
  StyleSheet, Animated, StatusBar, Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';

const { width } = Dimensions.get('window');
type Mode = 'signin' | 'signup';
type Role = 'MEMBER' | 'COACH';

// ─── Theme ────────────────────────────────────────────────────────────────────
const C = {
  bg: '#07040a',
  bgCard: '#120d09',
  bgInput: '#1a120c',
  accent: '#f3c99f',
  accentDim: '#a8927c',
  accentMuted: '#2a1c0e',
  text: '#f5f0eb',
  textSub: '#9e8c7e',
  textMuted: '#5c4d40',
  border: '#2a1f14',
  danger: '#e05c5c',
  success: '#5cbb8a',
};

// ─── Input Field ──────────────────────────────────────────────────────────────
function Field({
  label, value, onChange, placeholder, secureText, keyboardType, autoCapitalize, suffix,
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; secureText?: boolean; keyboardType?: any;
  autoCapitalize?: any; suffix?: React.ReactNode;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={f.fieldWrap}>
      <Text style={f.fieldLabel}>{label}</Text>
      <View style={[f.inputRow, focused && f.inputRowFocused]}>
        <TextInput
          style={f.input}
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={C.textMuted}
          secureTextEntry={secureText}
          keyboardType={keyboardType ?? 'default'}
          autoCapitalize={autoCapitalize ?? 'none'}
          autoCorrect={false}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        {suffix}
      </View>
    </View>
  );
}

const f = StyleSheet.create({
  fieldWrap:     { marginBottom: 14 },
  fieldLabel:    { color: C.textSub, fontSize: 12, fontWeight: '600', letterSpacing: 0.8, marginBottom: 6, textTransform: 'uppercase' },
  inputRow:      { flexDirection: 'row', alignItems: 'center', backgroundColor: C.bgInput, borderRadius: 12, borderWidth: 1.5, borderColor: C.border, paddingHorizontal: 14 },
  inputRowFocused:{ borderColor: C.accent },
  input:         { flex: 1, color: C.text, fontSize: 15, paddingVertical: 13 },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function AuthScreen() {
  const router = useRouter();
  const { login, register } = useAuth();

  const [mode, setMode]         = useState<Mode>('signin');
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [role, setRole]         = useState<Role>('MEMBER');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [success, setSuccess]   = useState<string | null>(null);

  const tabAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const switchMode = (m: Mode) => {
    setMode(m);
    setError(null);
    setSuccess(null);
    Animated.spring(tabAnim, { toValue: m === 'signin' ? 0 : 1, useNativeDriver: false, tension: 60, friction: 10 }).start();
  };

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -6, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const validate = () => {
    if (!email.trim()) { setError('Email is required'); shake(); return false; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('Enter a valid email address'); shake(); return false; }
    if (!password || password.length < 8) { setError('Password must be at least 8 characters'); shake(); return false; }
    if (mode === 'signup' && !name.trim()) { setError('Full name is required'); shake(); return false; }
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    setError(null);
    try {
      if (mode === 'signin') {
        await login(email.trim().toLowerCase(), password);
        setSuccess('Welcome back!');
      } else {
        await register(name.trim(), email.trim().toLowerCase(), password, role);
        setSuccess('Account created! Welcome to SteadyAI 🎉');
      }
      setTimeout(() => router.replace('/dashboard'), 700);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Something went wrong. Please try again.';
      setError(msg);
      shake();
    } finally {
      setLoading(false);
    }
  };

  // Animated tab indicator
  const tabLeft = tabAnim.interpolate({ inputRange: [0, 1], outputRange: ['2%', '50%'] });

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          style={s.scroll}
          contentContainerStyle={s.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >

          {/* ── Back button ── */}
          <TouchableOpacity style={s.backBtn} onPress={() => router.back()} hitSlop={12}>
            <Text style={s.backIcon}>←</Text>
            <Text style={s.backText}>Back</Text>
          </TouchableOpacity>

          {/* ── Logo ── */}
          <View style={s.logoWrap}>
            <View style={s.logoCircle}>
              <Text style={s.logoIcon}>⚡</Text>
            </View>
            <Text style={s.logoName}>SteadyAI</Text>
            <Text style={s.logoTagline}>Your AI-powered health companion</Text>
          </View>

          {/* ── Tab switcher ── */}
          <View style={s.tabBar}>
            <View style={s.tabTrack}>
              <Animated.View style={[s.tabIndicator, { left: tabLeft }]} />
              <TouchableOpacity style={s.tabBtn} onPress={() => switchMode('signin')} activeOpacity={0.8}>
                <Text style={[s.tabText, mode === 'signin' && s.tabTextActive]}>Sign In</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.tabBtn} onPress={() => switchMode('signup')} activeOpacity={0.8}>
                <Text style={[s.tabText, mode === 'signup' && s.tabTextActive]}>Create Account</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ── Form card ── */}
          <Animated.View style={[s.formCard, { transform: [{ translateX: shakeAnim }] }]}>

            {/* Error banner */}
            {error && (
              <View style={s.errorBanner}>
                <Text style={s.errorIcon}>⚠️</Text>
                <Text style={s.errorText}>{error}</Text>
              </View>
            )}

            {/* Success banner */}
            {success && (
              <View style={s.successBanner}>
                <Text style={s.successIcon}>✅</Text>
                <Text style={s.successText}>{success}</Text>
              </View>
            )}

            {/* Name (signup only) */}
            {mode === 'signup' && (
              <Field
                label="Full Name"
                value={name}
                onChange={(v) => { setName(v); setError(null); }}
                placeholder="John Doe"
                autoCapitalize="words"
              />
            )}

            {/* Email */}
            <Field
              label="Email Address"
              value={email}
              onChange={(v) => { setEmail(v); setError(null); }}
              placeholder="you@example.com"
              keyboardType="email-address"
            />

            {/* Password */}
            <Field
              label="Password"
              value={password}
              onChange={(v) => { setPassword(v); setError(null); }}
              placeholder={mode === 'signup' ? 'Min. 8 characters' : 'Your password'}
              secureText={!showPass}
              suffix={
                <TouchableOpacity onPress={() => setShowPass(!showPass)} hitSlop={10}>
                  <Text style={s.eyeIcon}>{showPass ? '🙈' : '👁️'}</Text>
                </TouchableOpacity>
              }
            />

            {/* Role picker (signup only) */}
            {mode === 'signup' && (
              <View style={s.roleWrap}>
                <Text style={s.roleLabel}>I AM A</Text>
                <View style={s.roleRow}>
                  {(['MEMBER', 'COACH'] as Role[]).map((r) => (
                    <TouchableOpacity
                      key={r}
                      style={[s.roleChip, role === r && s.roleChipActive]}
                      onPress={() => setRole(r)}
                      activeOpacity={0.8}
                    >
                      <Text style={s.roleChipIcon}>{r === 'MEMBER' ? '🏃' : '🏅'}</Text>
                      <Text style={[s.roleChipText, role === r && s.roleChipTextActive]}>{r}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Forgot password (signin only) */}
            {mode === 'signin' && (
              <TouchableOpacity style={s.forgotBtn} activeOpacity={0.7}>
                <Text style={s.forgotText}>Forgot password?</Text>
              </TouchableOpacity>
            )}

            {/* Submit button */}
            <TouchableOpacity
              style={[s.submitBtn, loading && s.submitBtnLoading]}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.88}
            >
              {loading ? (
                <ActivityIndicator size="small" color={C.bg} />
              ) : (
                <>
                  <Text style={s.submitBtnText}>
                    {mode === 'signin' ? 'Sign In' : 'Create Account'}
                  </Text>
                  <Text style={s.submitArrow}>→</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View style={s.dividerRow}>
              <View style={s.dividerLine} />
              <Text style={s.dividerText}>or</Text>
              <View style={s.dividerLine} />
            </View>

            {/* Switch mode */}
            <TouchableOpacity style={s.switchBtn} onPress={() => switchMode(mode === 'signin' ? 'signup' : 'signin')} activeOpacity={0.8}>
              <Text style={s.switchText}>
                {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
                <Text style={s.switchTextAccent}>{mode === 'signin' ? 'Sign up free' : 'Sign in'}</Text>
              </Text>
            </TouchableOpacity>
          </Animated.View>

          {/* ── Terms ── */}
          <Text style={s.termsText}>
            By continuing you agree to our{' '}
            <Text style={s.termsLink}>Terms of Service</Text>
            {' '}and{' '}
            <Text style={s.termsLink}>Privacy Policy</Text>
          </Text>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: C.bg },
  scroll:       { flex: 1 },
  scrollContent:{ padding: 20, paddingBottom: 40 },

  // Back
  backBtn:      { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 24, alignSelf: 'flex-start' },
  backIcon:     { color: C.accentDim, fontSize: 18 },
  backText:     { color: C.accentDim, fontSize: 14, fontWeight: '500' },

  // Logo
  logoWrap:     { alignItems: 'center', marginBottom: 28 },
  logoCircle:   { width: 64, height: 64, borderRadius: 20, backgroundColor: C.accentMuted, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: C.accentDim, marginBottom: 12 },
  logoIcon:     { fontSize: 28 },
  logoName:     { color: C.text, fontSize: 22, fontWeight: '900', letterSpacing: 0.3 },
  logoTagline:  { color: C.textSub, fontSize: 13, marginTop: 4 },

  // Tabs
  tabBar:       { marginBottom: 20 },
  tabTrack:     { flexDirection: 'row', backgroundColor: C.bgCard, borderRadius: 14, padding: 4, borderWidth: 1, borderColor: C.border, position: 'relative' },
  tabIndicator: { position: 'absolute', top: 4, width: '48%', bottom: 4, backgroundColor: C.accentMuted, borderRadius: 10, borderWidth: 1, borderColor: C.accentDim },
  tabBtn:       { flex: 1, paddingVertical: 10, alignItems: 'center', zIndex: 1 },
  tabText:      { color: C.textMuted, fontSize: 14, fontWeight: '600' },
  tabTextActive:{ color: C.accent, fontWeight: '700' },

  // Form
  formCard:     { backgroundColor: C.bgCard, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: C.border, marginBottom: 16 },

  // Banners
  errorBanner:  { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: '#2a0a0a', borderRadius: 10, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: C.danger },
  errorIcon:    { fontSize: 14, marginTop: 1 },
  errorText:    { flex: 1, color: C.danger, fontSize: 13, lineHeight: 18 },
  successBanner:{ flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: '#0a1f12', borderRadius: 10, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: C.success },
  successIcon:  { fontSize: 14, marginTop: 1 },
  successText:  { flex: 1, color: C.success, fontSize: 13, lineHeight: 18 },

  // Eye icon
  eyeIcon:      { fontSize: 16, paddingHorizontal: 4 },

  // Role
  roleWrap:     { marginBottom: 14 },
  roleLabel:    { color: C.textSub, fontSize: 12, fontWeight: '600', letterSpacing: 0.8, marginBottom: 8, textTransform: 'uppercase' },
  roleRow:      { flexDirection: 'row', gap: 10 },
  roleChip:     { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: C.bgInput, borderRadius: 12, paddingVertical: 12, borderWidth: 1.5, borderColor: C.border },
  roleChipActive:{ backgroundColor: C.accentMuted, borderColor: C.accent },
  roleChipIcon: { fontSize: 16 },
  roleChipText: { color: C.textSub, fontSize: 14, fontWeight: '600' },
  roleChipTextActive: { color: C.accent, fontWeight: '700' },

  // Forgot
  forgotBtn:    { alignSelf: 'flex-end', marginBottom: 16, marginTop: -4 },
  forgotText:   { color: C.accentDim, fontSize: 13 },

  // Submit
  submitBtn:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: C.accent, borderRadius: 14, paddingVertical: 16, marginTop: 4 },
  submitBtnLoading: { opacity: 0.8 },
  submitBtnText:{ color: C.bg, fontSize: 16, fontWeight: '800' },
  submitArrow:  { color: C.bg, fontSize: 17, fontWeight: '800' },

  // Divider
  dividerRow:   { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 16 },
  dividerLine:  { flex: 1, height: 1, backgroundColor: C.border },
  dividerText:  { color: C.textMuted, fontSize: 12 },

  // Switch
  switchBtn:    { alignItems: 'center' },
  switchText:   { color: C.textSub, fontSize: 14, textAlign: 'center' },
  switchTextAccent: { color: C.accent, fontWeight: '700' },

  // Terms
  termsText:    { color: C.textMuted, fontSize: 11, textAlign: 'center', lineHeight: 17 },
  termsLink:    { color: C.accentDim, fontWeight: '600' },
});
