import Masonry from "@/components/Masonry";
import { StatusBar, StyleSheet, Text, View } from "react-native";

export default function Discover() {
  return (
    <View style={styles.view}>
      <Masonry />
    </View>
  );
}

const styles = StyleSheet.create({
  view: {
    backgroundColor: "#F3F5F6",
  },
});
