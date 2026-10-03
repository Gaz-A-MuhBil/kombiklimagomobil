import { forwardRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius } from '../theme';

// Form parçaları: etiketli giriş alanı, onay kutusu, ana buton ve hata kutusu (tüm köşeler 4px)

export const Field = forwardRef<TextInput, TextInputProps & { label: string; hint?: string; secure?: boolean }>(function Field(
  { label, hint, secure, style, ...rest }, ref
) {
  const [hidden, setHidden] = useState(!!secure);
  const [focus, setFocus] = useState(false);
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={s.label}>{label}</Text>
      <View style={[s.box, rest.multiline && s.boxMulti, focus && s.boxFocus]}>
        <TextInput
          ref={ref}
          placeholderTextColor={colors.muted}
          secureTextEntry={hidden}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          style={[s.input, rest.multiline && s.inputMulti, style]}
          {...rest}
        />
        {secure && (
          <Pressable onPress={() => setHidden(!hidden)} hitSlop={8} accessibilityLabel={hidden ? 'Parolayı göster' : 'Parolayı gizle'}>
            <Ionicons name={hidden ? 'eye-outline' : 'eye-off-outline'} size={20} color={colors.muted} />
          </Pressable>
        )}
      </View>
      {hint ? <Text style={s.hint}>{hint}</Text> : null}
    </View>
  );
});

export function Check({ checked, onChange, children }: { checked: boolean; onChange: (v: boolean) => void; children: React.ReactNode }) {
  return (
    <Pressable onPress={() => onChange(!checked)} accessibilityRole="checkbox" accessibilityState={{ checked }} style={s.check}>
      <View style={[s.tick, checked && s.tickOn]}>{checked && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}</View>
      <Text style={s.checkText}>{children}</Text>
    </Pressable>
  );
}

export function Button({ label, onPress, loading, variant = 'primary', icon }: {
  label: string; onPress: () => void; loading?: boolean; variant?: 'primary' | 'ghost'; icon?: keyof typeof Ionicons.glyphMap;
}) {
  const ghost = variant === 'ghost';
  return (
    <Pressable onPress={onPress} disabled={loading} accessibilityRole="button"
      style={({ pressed }) => [s.btn, ghost ? s.btnGhost : s.btnPrimary, (pressed || loading) && { opacity: 0.8 }]}>
      {loading ? <ActivityIndicator color={ghost ? colors.primary : '#FFFFFF'} /> : (
        <>
          {icon && <Ionicons name={icon} size={18} color={ghost ? colors.primary : '#FFFFFF'} />}
          <Text style={[s.btnText, ghost && { color: colors.primary }]}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

export function ErrorBox({ text }: { text: string | null }) {
  if (!text) return null;
  return (
    <View style={s.error} accessibilityRole="alert">
      <Ionicons name="alert-circle" size={18} color="#B91C1C" />
      <Text style={s.errorText}>{text}</Text>
    </View>
  );
}

export const link = { color: colors.primary, fontWeight: '700' as const, textDecorationLine: 'underline' as const };

const s = StyleSheet.create({
  label: { color: colors.text, fontSize: 13.5, fontWeight: '700', marginBottom: 6 },
  box: {
    flexDirection: 'row', alignItems: 'center', gap: 8, height: 48, paddingHorizontal: 14, borderRadius: radius,
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.bg,
  },
  // çok satırlı alan: kutu içerikle uzar, yazı sol üstten başlar
  boxMulti: { height: undefined, minHeight: 112, alignItems: 'flex-start', paddingVertical: 12 },
  boxFocus: { borderColor: colors.accent },
  input: { flex: 1, color: colors.text, fontSize: 15.5, paddingVertical: 0 },
  inputMulti: { minHeight: 88, textAlignVertical: 'top', lineHeight: 21 },
  hint: { color: colors.muted, fontSize: 12, marginTop: 5 },
  check: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', marginBottom: 12 },
  tick: { width: 22, height: 22, borderRadius: radius, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  tickOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  checkText: { flex: 1, color: colors.text, fontSize: 13.5, lineHeight: 20 },
  btn: { height: 50, borderRadius: radius, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center' },
  btnPrimary: { backgroundColor: colors.primary },
  btnGhost: { backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border },
  btnText: { color: '#FFFFFF', fontSize: 15.5, fontWeight: '700' },
  error: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', padding: 12, borderRadius: radius, backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA', marginBottom: 14 },
  errorText: { flex: 1, color: '#B91C1C', fontSize: 13.5, lineHeight: 19 },
});
