import { Tabs } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import Topbar from "@/components/Topbar";

const Options = (title: string, icon: string) => ({
  title,
  tabBarLabel: "",
  header: ({ navigation, route }:any) => ( <Topbar navigation={navigation} route={route} />
  ),
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
        name="discover"
        options={{
          title: "Discover",
  tabBarLabel: "",
  header: ({ navigation, route }:any) => ( <Topbar navigation={navigation} route={route} />
  ),
  tabBarIcon: ({ focused }: { focused: boolean }) => (
    <Ionicons
      name={(focused ? ("compass")?.replace("-outline", "") : "compass") as any}
      size={48}
      color="black"
      style={{
        marginTop: 48,
        height: 48,
        width: 48,
      }}
    />)
        }}
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
