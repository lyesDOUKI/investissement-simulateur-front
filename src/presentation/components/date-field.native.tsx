import { useState } from "react";
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
  const [open, setOpen] = useState(false);
  const date = parseDateValue(value);
  const openPicker = () => {
    if (Platform.OS === "android") {
      DateTimePickerAndroid.open({
        value: date,
        mode: "date",
        design: "material",
        title: "Choisir une date",
        positiveButton: { label: "Valider" },
        negativeButton: { label: "Annuler" },
        onChange: (event, selectedDate) => {
          if (event.type === "set" && selectedDate) onChange(formatDateValue(selectedDate));
        },
      });
      return;
    }
    setOpen((current) => !current);
  };

  return <View style={styles.wrap}>
    <Text style={styles.label}>{label}</Text>
    <Pressable onPress={openPicker} accessibilityRole="button" accessibilityLabel={`${label}, ${value}. Ouvrir le calendrier.`} style={styles.field}>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.icon}>▦</Text>
    </Pressable>
    {helper ? <Text style={styles.helper}>{helper}</Text> : null}
    {Platform.OS === "ios" && open ? <View style={styles.calendar}>
      <DateTimePicker
        value={date}
        mode="date"
        display="inline"
        locale="fr-FR"
        themeVariant="dark"
        accentColor={p.forestLight}
        onChange={(_event, selectedDate) => {
          if (selectedDate) onChange(formatDateValue(selectedDate));
        }}
      />
      <Pressable accessibilityRole="button" onPress={() => setOpen(false)} style={styles.doneButton}>
        <Text style={styles.doneText}>Terminé</Text>
      </Pressable>
    </View> : null}
  </View>;
}

const styles = StyleSheet.create({
  wrap: { gap: 7 },
  label: { color: p.ink, fontSize: 13, fontWeight: "600" },
  field: { minHeight: 52, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderWidth: 1, borderColor: p.line, borderRadius: radius.field, backgroundColor: p.paper, paddingHorizontal: 14 },
  value: { color: p.ink, fontSize: 16 },
  icon: { color: p.forestLight, fontSize: 19 },
  helper: { color: p.muted, fontSize: 12, lineHeight: 17 },
  calendar: { borderWidth: 1, borderColor: p.line, borderRadius: radius.field, backgroundColor: p.paper, padding: 10, alignItems: "flex-end" },
  doneButton: { minHeight: 40, justifyContent: "center", paddingHorizontal: 14 },
  doneText: { color: p.forestLight, fontSize: 14, fontWeight: "700" },
});
