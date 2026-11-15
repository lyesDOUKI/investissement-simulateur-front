import DateTimePicker, { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { palette as p, radius } from "@/presentation/theme";
import { formatDateValue, parseDateValue } from "@/presentation/utils/date-picker-format";

export function DateField({ label, value, onChange, helper }: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  helper?: string;
}) {
  const date = parseDateValue(value);
  const openAndroidPicker = () => DateTimePickerAndroid.open({
    value: date,
    mode: "date",
    design: "material",
    title: "Choisir une date",
    positiveButton: { label: "Valider" },
    negativeButton: { label: "Annuler" },
    onValueChange: (_event, selectedDate) => onChange(formatDateValue(selectedDate)),
  });
  const onDateChange = (_event: unknown, selectedDate: Date) => onChange(formatDateValue(selectedDate));

  return <View style={styles.wrap}>
    <Text style={styles.label}>{label}</Text>
    {Platform.OS === "ios" ? <View style={styles.field}>
      <DateTimePicker
        value={date}
        mode="date"
        display="compact"
        locale="fr-FR"
        themeVariant="dark"
        accentColor={p.forestLight}
        accessibilityLabel={label}
        onValueChange={onDateChange}
      />
    </View> : <Pressable onPress={openAndroidPicker} accessibilityRole="button" accessibilityLabel={`${label}, ${value}. Ouvrir le calendrier.`} style={styles.field}>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.icon}>▦</Text>
    </Pressable>}
    {helper ? <Text style={styles.helper}>{helper}</Text> : null}
  </View>;
}

const styles = StyleSheet.create({
  wrap: { gap: 7 },
  label: { color: p.ink, fontSize: 13, fontWeight: "600" },
  field: { minHeight: 52, flexDirection: "row", alignItems: "center", justifyContent: "flex-start", borderWidth: 1, borderColor: p.line, borderRadius: radius.field, backgroundColor: p.paper, paddingHorizontal: 14 },
  value: { color: p.ink, fontSize: 16 },
  icon: { color: p.forestLight, fontSize: 19 },
  helper: { color: p.muted, fontSize: 12, lineHeight: 17 },
});
