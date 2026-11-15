import type { ReactNode } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { palette as p, radius } from "@/presentation/theme";

export function PageHeading({
  eyebrow,
  title,
  subtitle,
  action,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <View style={ui.heading}>
      <View style={{ flex: 1, gap: 5 }}>
        {eyebrow ? <Text style={ui.eyebrow}>{eyebrow}</Text> : null}
        <Text style={ui.pageTitle}>{title}</Text>
        {subtitle ? <Text style={ui.subtitle}>{subtitle}</Text> : null}
      </View>
      {action}
    </View>
  );
}

export function Card({
  children,
  style,
}: {
  children: ReactNode;
  style?: object;
}) {
  return <View style={[ui.card, style]}>{children}</View>;
}

export function SectionTitle({
  title,
  action,
}: {
  title: string;
  action?: ReactNode;
}) {
  return (
    <View style={ui.sectionHeading}>
      <Text style={ui.sectionTitle}>{title}</Text>
      {action}
    </View>
  );
}

export function ActionButton({
  label,
  onPress,
  tone = "dark",
  disabled = false,
  loading = false,
}: {
  label: string;
  onPress: () => void;
  tone?: "dark" | "light" | "quiet";
  disabled?: boolean;
  loading?: boolean;
}) {
  return (
    <Pressable
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        ui.action,
        tone === "dark" && ui.actionDark,
        tone === "light" && ui.actionLight,
        tone === "quiet" && ui.actionQuiet,
        (disabled || loading) && ui.actionDisabled,
        pressed && !disabled && !loading && { opacity: 0.78, transform: [{ scale: 0.99 }] },
      ]}
    >
      <Text
        style={[
          ui.actionText,
          tone === "light" && ui.actionTextLight,
          tone === "quiet" && ui.actionTextQuiet,
          (disabled || loading) && { color: p.muted },
        ]}
      >
        {loading ? <View style={ui.loadingContent}><ActivityIndicator size="small" color={tone === "dark" ? p.onForest : tone === "light" ? p.forest : p.forestLight} /><Text style={[ui.actionText, tone === "light" && ui.actionTextLight, tone === "quiet" && ui.actionTextQuiet]}>Traitement…</Text></View> : label}
      </Text>
    </Pressable>
  );
}

export function TextField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  helper,
  suffix,
  autoCapitalize,
  secureTextEntry,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "decimal-pad" | "number-pad" | "email-address" | "phone-pad";
  helper?: string;
  suffix?: string;
  autoCapitalize?: "none" | "characters" | "sentences";
  secureTextEntry?: boolean;
}) {
  return (
    <View style={ui.fieldWrap}>
      <Text style={ui.fieldLabel}>{label}</Text>
      <View style={ui.inputShell}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={p.placeholder}
          keyboardType={keyboardType ?? "default"}
          autoCapitalize={autoCapitalize ?? "sentences"}
          autoCorrect={false}
          secureTextEntry={secureTextEntry}
          style={ui.input}
        />
        {suffix ? <Text style={ui.suffix}>{suffix}</Text> : null}
      </View>
      {helper ? <Text style={ui.helper}>{helper}</Text> : null}
    </View>
  );
}

export function Pill({
  label,
  active = false,
  onPress,
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
}) {
  const content = (
    <Text style={[ui.pillText, active && ui.pillTextActive]}>{label}</Text>
  );
  if (!onPress)
    return <View style={[ui.pill, active && ui.pillActive]}>{content}</View>;
  return (
    <Pressable onPress={onPress} style={[ui.pill, active && ui.pillActive]}>
      {content}
    </Pressable>
  );
}

export function Divider() {
  return <View style={ui.divider} />;
}

export const text = StyleSheet.create({
  label: { color: p.muted, fontSize: 13, fontWeight: "500" },
  body: { color: p.ink, fontSize: 15, lineHeight: 22 },
  caption: { color: p.muted, fontSize: 12, lineHeight: 18 },
  value: { color: p.ink, fontSize: 17, fontWeight: "700" },
  green: { color: p.forestLight, fontWeight: "700" },
});

const ui = StyleSheet.create({
  heading: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 14,
    marginBottom: 22,
  },
  eyebrow: {
    color: p.forestLight,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  pageTitle: {
    color: p.ink,
    fontSize: 29,
    fontWeight: "700",
    letterSpacing: -0.7,
  },
  subtitle: { color: p.muted, fontSize: 14, lineHeight: 20, maxWidth: 540 },
  card: {
    backgroundColor: p.paper,
    borderRadius: radius.card,
    borderColor: p.line,
    borderWidth: 1,
    padding: 19,
  },
  sectionHeading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 24,
    marginBottom: 11,
  },
  sectionTitle: { color: p.ink, fontSize: 17, fontWeight: "700" },
  action: {
    minHeight: 51,
    paddingHorizontal: 20,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  actionDark: { backgroundColor: p.forest },
  actionLight: { backgroundColor: p.mint },
  actionQuiet: { backgroundColor: p.softGreen },
  actionDisabled: { backgroundColor: p.disabled },
  loadingContent: { flexDirection: "row", alignItems: "center", gap: 9 },
  actionText: { color: p.onForest, fontSize: 15, fontWeight: "700" },
  actionTextLight: { color: p.forest },
  actionTextQuiet: { color: p.forestLight },
  fieldWrap: { gap: 7 },
  fieldLabel: { color: p.ink, fontSize: 13, fontWeight: "600" },
  inputShell: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 52,
    borderRadius: radius.field,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: p.line,
    backgroundColor: p.paper,
  },
  input: {
    flex: 1,
    color: p.ink,
    fontSize: 16,
    paddingVertical: 12,
    outlineStyle: "none" as never,
  },
  suffix: { color: p.muted, fontSize: 14, marginLeft: 8 },
  helper: { color: p.muted, fontSize: 12, lineHeight: 17 },
  pill: {
    borderRadius: radius.pill,
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: p.line,
    backgroundColor: p.paper,
  },
  pillActive: { backgroundColor: p.forest, borderColor: p.forest },
  pillText: { color: p.muted, fontSize: 13, fontWeight: "600" },
  pillTextActive: { color: p.onForest },
  divider: { height: 1, backgroundColor: p.line },
});
