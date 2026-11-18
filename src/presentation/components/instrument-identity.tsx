import { StyleSheet, Text, View, type StyleProp, type TextStyle } from "react-native";
import { palette as p } from "@/presentation/theme";

export function InstrumentIdentity({
  name,
  symbol,
  isin,
  fallback = "Support",
  titleStyle,
  metaStyle,
}: {
  name?: string | null;
  symbol?: string | null;
  isin?: string | null;
  fallback?: string;
  titleStyle?: StyleProp<TextStyle>;
  metaStyle?: StyleProp<TextStyle>;
}) {
  const title = symbol ?? name ?? isin ?? fallback;
  const displayedName = name && name !== title && name !== isin ? name : null;
  const displayedIsin = isin && isin !== symbol ? isin : null;

  return <View style={styles.identity}>
    <Text style={[styles.title, titleStyle]} numberOfLines={2}>{title}</Text>
    {displayedName || displayedIsin ? <View style={styles.identifiers}>
      {displayedName ? <Text style={[styles.name, metaStyle]} numberOfLines={1}>{displayedName}</Text> : null}
      {displayedIsin ? <Text style={[styles.isin, metaStyle]}>ISIN {displayedIsin}</Text> : null}
    </View> : null}
  </View>;
}

const styles = StyleSheet.create({
  identity: { flex: 1, minWidth: 0, gap: 3 },
  title: { color: p.ink, fontSize: 13, fontWeight: "600" },
  identifiers: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 7 },
  name: { color: p.muted, fontSize: 10 },
  isin: { color: p.muted, fontSize: 10 },
});
