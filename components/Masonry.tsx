import React, { useMemo } from "react";
import {
  StyleSheet,
  View,
  Text,
  Image,
  ScrollView,
  ImageSourcePropType,
  Pressable,
} from "react-native";
import { useRouter } from "expo-router";
import { MockData } from "./MockData";
import { SAI } from "./SAI";

// Constants
const NUM_COLUMNS = 2;
const ITEM_MARGIN = 10;
const IMAGE_MAX_HEIGHT = 150;

// Types
export interface IArticle {
  [x: string]: any;
  id: string;
  imageUrl?: ImageSourcePropType;
  body: string;
}

// Utility: Estimate height (improved over binary check)
const estimateItemHeight = (article: IArticle): number => {
  const textLength = article.body?.length || 0;
  const baseTextHeight = 20;
  const textLines = Math.ceil(textLength / 40);
  const textHeight = baseTextHeight * textLines;
  const imageHeight = article.imageUrl ? IMAGE_MAX_HEIGHT : 0;
  return textHeight + imageHeight + 20; // padding + margin
};



// Component: Waterfall Grid
const Masonry = () => {
  const columns = useMemo(() => {
    const columnData: IArticle[][] = Array.from(
      { length: NUM_COLUMNS },
      () => []
    );
    const columnHeights = Array.from({ length: NUM_COLUMNS }, () => 0);

    MockData.forEach((article) => {
      const estHeight = estimateItemHeight(article);
      const shortestColumnIndex = columnHeights.indexOf(
        Math.min(...columnHeights)
      );

      columnData[shortestColumnIndex].push(article);
      columnHeights[shortestColumnIndex] += estHeight;
    });

    return columnData;
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {columns.map((column, colIndex) => (
        <View key={`col-${colIndex}`} style={styles.column}>
          {column.map((article) => (
            <SAI key={article.id} article={article} />
          ))}
        </View>
      ))}
    </ScrollView>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    paddingHorizontal: 5,
    marginVertical: 5,
    marginTop: 0,
  },
  column: {
    flex: 1,
    marginHorizontal: ITEM_MARGIN / 2,
  },
  item: {
    marginBottom: ITEM_MARGIN,
    backgroundColor: "#fff",
    borderRadius: 15,
    overflow: "hidden",
  },
  imageContainer: {
    width: "100%",
    maxHeight: 120,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  body: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "700",
    padding: 10,
  },
});

export default Masonry;
