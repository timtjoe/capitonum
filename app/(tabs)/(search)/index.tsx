import { Link } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

export default function Search() {
  return (
    <View>
      <Text>Search page</Text>
      <Link href={"/(tabs)/(search)/category"}>Category</Link>
      <Link href={"/(tabs)/(search)/result"}>Result</Link>
    </View>
  );
}

const styles = StyleSheet.create({});
