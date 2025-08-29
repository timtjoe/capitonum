import { useRouter } from "expo-router";
import { IArticle } from "./Masonry";
import { Pressable, View, Image, Text, StyleSheet } from "react-native";
import { Linking } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useBookmark } from "@/hooks/useBookmark";
import { getIconUrl } from "@/hooks/useIcon";
// import { useBookmark } from "./useBookmark";

const WIKIPEDIA_ICON_URL = getIconUrl("wikipedia")

export const MediaBlock = ({ article }: { article: IArticle }) => {
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
      {/* Image Block */}
      {article.imageUrl && (
        <View style={styles.imageContainer}>
          <Image source={article.imageUrl} style={styles.image} />
        </View>
      )}
      <View style={styles.contentContainer}>
        {/* Text Block */}
        <View style={styles.textBlock}>
          <Text style={styles.body} numberOfLines={4} ellipsizeMode="tail">
            {article.body}
          </Text>
        </View>

        {/* Footer Block with Links and Bookmark Icon */}
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

          <Pressable
            onPress={handleBookmarkToggle}
            style={styles.bookmarkButton}
          >
            <Ionicons
              name={isBookmarked ? "bookmark" : "bookmark-outline"}
              size={20}
              color={isBookmarked ? "#007AFF" : "#666"}
            />
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  item: {
    display: "flex",
    flexDirection: "row",
    alignItems: "flex-start",
    borderRadius: 15,
    backgroundColor: "#fff",
    overflow: "hidden",
    maxHeight: 120
  },
  imageContainer: {
    width: 108,
    height:120,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover"
  },
  contentContainer: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    padding: 8,
    minHeight: 120
  },
  textBlock: {
    paddingBottom: 4
  },
  body: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "700",
  },

  footerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    marginTop: "auto"
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
