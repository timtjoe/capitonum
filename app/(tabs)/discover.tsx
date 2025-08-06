import Chiplist from "@/components/Chiplist";
import Masonry from "@/components/Masonry";
import { StyleSheet, View } from "react-native";

export default function Discover() {
  return (
    <View style={styles.view}>
      <Chiplist />
      <Masonry />
    </View>
  );
}

const styles = StyleSheet.create({
  view: {
    backgroundColor: "#F3F5F6",
  },
});
