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

// Constants
const NUM_COLUMNS = 2;
const ITEM_MARGIN = 10;
const IMAGE_MAX_HEIGHT = 150;

// Types
export interface IArticle {
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

// Component: Single Article Item
const ArticleItem = ({ article }: { article: IArticle }) => {
  const router = useRouter();

  const handlePress = () => {
    // Navigate to the article reader tab component, passing the article ID as a parameter.
    // Assuming a route like '/reader' that can handle a dynamic ID.
    router.push({ pathname: "/reader", params: { id: article.id } });
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.item,
        {
          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      {article.imageUrl && (
        <View style={styles.imageContainer}>
          <Image
            source={article.imageUrl}
            style={styles.image}
            resizeMode="cover"
          />
        </View>
      )}
      <Text style={styles.body}>{article.body}</Text>
    </Pressable>
  );
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
            <ArticleItem key={article.id} article={article} />
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
