import { Tabs } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";

const Options = (title: string, icon: string) => ({
  title,
  tabBarLabel: "",
  tabBarIcon: ({ focused }: { focused: boolean }) => (
    <Ionicons
      name={(focused ? icon?.replace("-outline", "") : icon) as any}
      size={48}
      color="black"
      style={{
        marginTop: 48,
        height: 48,
        width: 48,
      }}
    />
  ),
});

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          height: 148,
          borderWidth: 0,
          elevation: 0,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={Options("Explore", "compass-outline")}
      />
      <Tabs.Screen
        name="(search)"
        options={Options("Search", "search-outline")}
      />
      <Tabs.Screen
        name="bookmarks"
        options={Options("Bookmarks", "bookmark-outline")}
      />
    </Tabs>
  );
}
