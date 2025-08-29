import { Text, View, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { Link, usePathname } from "expo-router";

const logo = require("@/assets/images/logo.svg");

type Props = {
  title?: string;
};

export default function Header({ title = "Capitonum" }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.imgContainer}>
        <Image style={styles.image} source={logo} />
      </View>
      <Text style={styles.text}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 98,
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  text: {
    color: "black",
    fontSize: 28,
    fontWeight: "bold",
    flex: 1,
    lineHeight: 28,
    textAlign: "center",
  },
  centeredText: {},
  imgContainer: {
    width: 28,
    height: 27,
  },
  image: {
    width: "90%",
    height: "100%",
    resizeMode: "contain",
  },
});
