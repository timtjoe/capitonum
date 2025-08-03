import { Stack } from "expo-router";
import { Text, View, TouchableOpacity } from "react-native";

export default ({ navigation, route }: any) => {
  return (
    <View
      style={{
        height: 108,
        backgroundColor: "purple",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 15,
      }}
    >
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={{ color: "white" }}>Go Back</Text>
      </TouchableOpacity>
      <Text style={{ color: "white", fontSize: 20, fontWeight: "bold" }}>
        {route.params?.customTitle || "Default Title"}
      </Text>
      <TouchableOpacity onPress={() => alert("Settings")}>
        <Text style={{ color: "white" }}>Settings</Text>
      </TouchableOpacity>
    </View>
  );
};
