// src/components/index.tsx
import React, {ReactNode} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import {T, PALETTE, Fonts} from '../theme';
import {getInitials, Member} from '../utils';

// ── Avatar ────────────────────────────────────────────────────────────────

interface AvatarProps {
  member?: Member | null;
  size?: number;
  pulse?: boolean;
}

export const Avatar = ({member, size = 40, pulse = false}: AvatarProps) => {
  const initials = getInitials(member?.name || '?');
  return (
    <View
      style={[
        styles.avatarBase,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: member?.color || T.muted,
          shadowColor: pulse ? member?.color || T.muted : 'transparent',
          shadowOpacity: pulse ? 0.5 : 0,
          shadowRadius: pulse ? 8 : 0,
          elevation: pulse ? 4 : 0,
        },
      ]}>
      <Text
        style={{
          fontSize: size * 0.35,
          fontWeight: '700',
          color: 'rgba(0,0,0,0.75)',
        }}>
        {initials}
      </Text>
    </View>
  );
};

// ── Button ────────────────────────────────────────────────────────────────

type ButtonVariant = 'primary' | 'ghost' | 'danger' | 'solid' | 'success' | 'info';

interface ButtonProps {
  children: ReactNode;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

const BTN_STYLES: Record<ButtonVariant, {bg: string; color: string; border: string}> = {
  primary: {bg: T.accentBg, color: T.accent, border: `${T.accent}40`},
  ghost: {bg: 'transparent', color: T.dim, border: T.border},
  danger: {bg: T.dangerBg, color: T.danger, border: `${T.danger}40`},
  solid: {bg: T.accent, color: '#0a0508', border: T.accent},
  success: {bg: T.successBg, color: T.success, border: `${T.success}40`},
  info: {bg: T.infoBg, color: T.info, border: `${T.info}40`},
};

export const Btn = ({
  children,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  style,
  textStyle,
  fullWidth = false,
}: ButtonProps) => {
  const v = BTN_STYLES[variant];
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      style={[
        styles.btn,
        {backgroundColor: v.bg, borderColor: v.border},
        fullWidth && {width: '100%', justifyContent: 'center'},
        (disabled || loading) && {opacity: 0.5},
        style,
      ]}>
      {loading ? (
        <ActivityIndicator size="small" color={v.color} />
      ) : (
        <Text style={[styles.btnText, {color: v.color}, textStyle]}>
          {children}
        </Text>
      )}
    </TouchableOpacity>
  );
};

// ── Field ─────────────────────────────────────────────────────────────────

interface FieldProps {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  numberOfLines?: number;
  style?: ViewStyle;
}

export const Field = ({
  label,
  value,
  onChange,
  placeholder,
  multiline = false,
  numberOfLines = 4,
  style,
}: FieldProps) => (
  <View style={[{marginBottom: 14}, style]}>
    {label && (
      <Text style={styles.fieldLabel}>{label}</Text>
    )}
    <TextInput
      value={value}
      onChangeText={onChange}
      placeholder={placeholder}
      placeholderTextColor={T.muted}
      multiline={multiline}
      numberOfLines={multiline ? numberOfLines : 1}
      style={[styles.input, multiline && styles.textarea]}
    />
  </View>
);

// ── Divider ───────────────────────────────────────────────────────────────

export const Divider = ({label}: {label?: string}) => (
  <View style={styles.dividerRow}>
    <View style={styles.dividerLine} />
    {label && <Text style={styles.dividerLabel}>{label}</Text>}
    <View style={styles.dividerLine} />
  </View>
);

// ── Tag ───────────────────────────────────────────────────────────────────

export const Tag = ({label, color}: {label: string; color?: string}) => (
  <View
    style={[
      styles.tag,
      {
        backgroundColor: `${color || T.accent}18`,
        borderColor: `${color || T.accent}35`,
      },
    ]}>
    <Text style={[styles.tagText, {color: color || T.accent}]}>{label}</Text>
  </View>
);

// ── Toggle ────────────────────────────────────────────────────────────────

export const Toggle = ({
  value,
  onToggle,
}: {
  value: boolean;
  onToggle: () => void;
}) => (
  <TouchableOpacity
    onPress={onToggle}
    activeOpacity={0.8}
    style={[styles.toggle, {backgroundColor: value ? T.accent : T.muted}]}>
    <View
      style={[styles.toggleThumb, {transform: [{translateX: value ? 18 : 2}]}]}
    />
  </TouchableOpacity>
);

// ── Color Picker ──────────────────────────────────────────────────────────

export const ColorPicker = ({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (c: string) => void;
}) => (
  <View style={styles.colorGrid}>
    {PALETTE.map(c => (
      <TouchableOpacity
        key={c}
        onPress={() => onSelect(c)}
        activeOpacity={0.8}
        style={[
          styles.colorSwatch,
          {backgroundColor: c},
          selected === c && styles.colorSwatchSelected,
        ]}
      />
    ))}
  </View>
);

// ── Empty State ───────────────────────────────────────────────────────────

export const Empty = ({
  icon,
  msg,
  action,
}: {
  icon: string;
  msg: string;
  action?: ReactNode;
}) => (
  <View style={styles.emptyContainer}>
    <Text style={styles.emptyIcon}>{icon}</Text>
    <Text style={styles.emptyMsg}>{msg}</Text>
    {action}
  </View>
);

// ── Section Row (for settings lists) ─────────────────────────────────────

export const SectionRow = ({
  label,
  value,
  onToggle,
  sublabel,
  disabled = false,
}: {
  label: string;
  value: boolean;
  onToggle: () => void;
  sublabel?: string;
  disabled?: boolean;
}) => (
  <View style={[styles.sectionRow, disabled && {opacity: 0.4}]}>
    <View style={{flex: 1}}>
      <Text style={styles.sectionRowLabel}>{label}</Text>
      {sublabel && <Text style={styles.sectionRowSub}>{sublabel}</Text>}
    </View>
    <Toggle value={value && !disabled} onToggle={disabled ? () => {} : onToggle} />
  </View>
);

// ── Styles ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  avatarBase: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: {width: 0, height: 0},
  },
  btn: {
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  btnText: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: Fonts.body,
  },
  fieldLabel: {
    fontSize: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: T.dim,
    marginBottom: 5,
    fontWeight: '600',
  },
  input: {
    backgroundColor: T.surface,
    color: T.text,
    borderWidth: 1,
    borderColor: T.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: Fonts.body,
  },
  textarea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 18,
    gap: 10,
  },
  dividerLine: {flex: 1, height: 1, backgroundColor: T.border},
  dividerLabel: {
    fontSize: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: T.muted,
    fontWeight: '600',
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    borderWidth: 1,
  },
  tagText: {fontSize: 11, fontWeight: '500', letterSpacing: 0.5},
  toggle: {
    width: 40,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
  },
  toggleThumb: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#fff',
    position: 'absolute',
  },
  colorGrid: {flexDirection: 'row', flexWrap: 'wrap', gap: 8},
  colorSwatch: {width: 30, height: 30, borderRadius: 15, borderWidth: 2, borderColor: 'transparent'},
  colorSwatchSelected: {borderColor: '#fff'},
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyIcon: {fontSize: 36, marginBottom: 12, opacity: 0.4},
  emptyMsg: {fontSize: 13, color: T.dim, textAlign: 'center', lineHeight: 20, marginBottom: 16},
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
    paddingHorizontal: 14,
  },
  sectionRowLabel: {fontSize: 14, color: T.text, fontWeight: '500'},
  sectionRowSub: {fontSize: 11, color: T.muted, marginTop: 2},
});
