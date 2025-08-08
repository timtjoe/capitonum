import { Tabs } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import Header from "@/components/Header";
import { View, Text, StyleSheet } from "react-native";

const Options = (title: string, icon: string) => ({
  title,
  tabBarLabelStyle: styles.label,
  tabBarActiveLabelStyle: styles.labelFocused,
  tabBarIcon: ({ focused }: { focused: boolean }) => (
    <View style={styles.container}>
      <Ionicons
        name={(focused ? icon?.replace("-outline", "") : icon) as any}
        size={32}
        color={focused ? "black" : "black"}
        style={{
          height: "120%",
          width: "100%",
          marginBottom: 4
        }}
      />
    </View>
  ),
  header: () => <Header title={title} />,
});

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          height: 110,
          elevation: 0,
          borderWidth: 0,
          paddingTop: 8,
        },
      }}
    >
      <Tabs.Screen
        name="Discover"
        options={Options("Discover", "compass-outline")}
      />
      <Tabs.Screen
        name="Search"
        options={Options("Search", "search-outline")}
      />
      <Tabs.Screen
        name="Bookmarks"
        options={Options("Bookmarks", "bookmark-outline")}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  label: {
    fontSize: 10,
    color: "black",
  },
  labelFocused: {
    fontWeight: "bold",
  },
});
