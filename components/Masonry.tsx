import React from "react";
import { StyleSheet, View, ActivityIndicator } from "react-native";
import { SAI } from "./SAI";
import { IArticle } from "@/app/(tabs)/discover";
// import { IArticle } from "./Discover";

const ITEM_MARGIN = 10;

interface MasonryProps {
  columns: IArticle[][];
  isLoadingMore: boolean;
}

const Masonry = ({ columns, isLoadingMore }: MasonryProps) => {
  return (
    <View style={styles.container}>
      {columns.map((column, colIndex) => (
        <View key={`col-${colIndex}`} style={styles.column}>
          {column.map((article) => (
            <SAI key={article.id} article={article} />
          ))}
        </View>
      ))}
      {isLoadingMore && (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="small" color="#007AFF" />
        </View>
      )}
    </View>
  );
};

export default Masonry;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    paddingHorizontal: 5,
    marginVertical: 5,
    marginTop: 0,
    position: "relative",
  },
  column: {
    flex: 1,
    marginHorizontal: ITEM_MARGIN / 2,
  },
  loaderContainer: {
    position: "absolute",
    bottom: 20,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
});
