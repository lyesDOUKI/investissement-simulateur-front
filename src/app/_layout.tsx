import { Stack } from "expo-router";
import { palette as p } from "@/presentation/theme";

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: p.canvas },
      }}
    />
  );
}
