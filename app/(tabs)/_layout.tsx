import { Tabs } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import Header from "@/components/Header";

const Options = (title: string, icon: string) => ({
  title,
  tabBarLabel: "",
  tabBarIcon: ({ focused }: { focused: boolean }) => (
    <Ionicons
      name={(focused ? icon?.replace("-outline", "") : icon) as any}
      size={38}
      color="black"
      style={{
        marginTop: 38,
        height: 38,
        width: 38,
      }}
    />
  ),
  header: () => <Header title={title} />,
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
        name="discover"
        options={Options("Discover", "compass-outline")}
      />
      <Tabs.Screen
        name="search"
        options={Options("Search", "search-outline")}
      />
      <Tabs.Screen
        name="bookmarks"
        options={Options("Bookmarks", "bookmark-outline")}
      />
    </Tabs>
  );
}
