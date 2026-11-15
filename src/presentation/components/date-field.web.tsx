import { createElement } from "react";
import { StyleSheet, Text, View } from "react-native";
import { palette as p, radius } from "@/presentation/theme";
import { fromIsoDate, toIsoDate } from "@/presentation/utils/date-picker-format";

export function DateField({ label, value, onChange, helper }: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  helper?: string;
}) {
  return <View style={styles.wrap}>
    <Text style={styles.label}>{label}</Text>
    <View style={styles.shell}>
      {createElement("input", {
        type: "date",
        value: toIsoDate(value),
        lang: "fr-FR",
        "aria-label": label,
        onChange: (event: { currentTarget: { value: string } }) => {
          const nextValue = fromIsoDate(event.currentTarget.value);
          if (nextValue) onChange(nextValue);
        },
        style: {
          flex: 1,
          minWidth: 0,
          border: 0,
          outline: "none",
          backgroundColor: "transparent",
          color: p.ink,
          colorScheme: "dark",
          fontSize: 16,
          fontFamily: "inherit",
          padding: "12px 0",
        },
      })}
    </View>
    {helper ? <Text style={styles.helper}>{helper}</Text> : null}
  </View>;
}

const styles = StyleSheet.create({
  wrap: { gap: 7 },
  label: { color: p.ink, fontSize: 13, fontWeight: "600" },
  shell: { minHeight: 52, justifyContent: "center", borderWidth: 1, borderColor: p.line, borderRadius: radius.field, backgroundColor: p.paper, paddingHorizontal: 14 },
  helper: { color: p.muted, fontSize: 12, lineHeight: 17 },
});
