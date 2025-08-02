import { Stack } from "expo-router";

export default function Layout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{title: "Search", headerShown: true}} />
      <Stack.Screen name="category" options={{title: "Category", headerShown: true}} />
      <Stack.Screen name="result" options={{title: "Search Result", headerShown: true}} />
    </Stack>
  );
}
