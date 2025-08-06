import { useRouter } from "expo-router";
import { IArticle } from "./Masonry";
import { Pressable, View, Image, Text, StyleSheet } from "react-native";
import { Linking } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useBookmark } from "@/hooks/useBookmark";
import { getIconUrl } from "@/hooks/useIcon";
// import { useBookmark } from "./useBookmark";

const ITEM_MARGIN = 10;
const WIKIPEDIA_ICON_URL = getIconUrl("wikipedia")

export const SAI = ({ article }: { article: IArticle }) => {
  const router = useRouter();
  const { isBookmarked, handleBookmarkToggle } = useBookmark(article);

  const handlePress = () => {
    router.push({ pathname: "/reader", params: { id: article.id } });
  };

  const formattedTitle = article.title?.replace(/ /g, "_") || "";
  const wikipediaUrl = `https://en.wikipedia.org/wiki/${formattedTitle}`;

  const handleWikipediaPress = () => {
    Linking.openURL(wikipediaUrl);
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
      <Text style={styles.body} numberOfLines={4} ellipsizeMode="tail">
        {article.body}
      </Text>

      <View style={styles.footerContainer}>
        <Pressable
          onPress={handleWikipediaPress}
          style={styles.wikipediaLinkContainer}
        >
          <Image
            source={{ uri: WIKIPEDIA_ICON_URL }}
            style={styles.wikipediaIcon}
          />
          <Text style={styles.wikipediaLink}>wiki/{formattedTitle}</Text>
        </Pressable>

        <Pressable onPress={handleBookmarkToggle} style={styles.bookmarkButton}>
          <Ionicons
            name={isBookmarked ? "bookmark" : "bookmark-outline"}
            size={20}
            color={isBookmarked ? "#007AFF" : "#666"}
          />
        </Pressable>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
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
  footerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  wikipediaLinkContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  wikipediaIcon: {
    width: 18,
    height: 18,
    marginRight: 5,
  },
  wikipediaLink: {
    fontSize: 12,
    color: "#007AFF",
  },
  bookmarkButton: {
    padding: 5,
  },
});
