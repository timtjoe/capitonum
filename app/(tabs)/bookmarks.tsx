import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Image,
} from "react-native";
import { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { IArticle, useBookmark } from "@/hooks/useBookmark"; // Merged and updated import
import { useIsFocused } from "@react-navigation/native";
import { bookmarksEmitter } from "@/hooks/useBookmark";
import { openInAppBrowser } from "@/components/Browser"; // Import the in-app browser function
import Ionicons from "@expo/vector-icons/Ionicons";
import { getIconUrl } from "@/hooks/useIcon";
import * as Haptics from "expo-haptics";

const WIKIPEDIA_ICON_URL = getIconUrl("wikipedia");
const BOOKMARKS_KEY = "@bookmarks";

// The MediaBlock component is now defined within this file
export const MediaBlock = ({ article }: { article: IArticle }) => {
  const { isBookmarked, handleBookmarkToggle } = useBookmark(article);
  const formattedTitle = article.title?.replace(/ /g, "_") || "";

  // Set the maximum length for the displayed title
  const MAX_TITLE_LENGTH = 15;
  const truncatedTitle =
    formattedTitle.length > MAX_TITLE_LENGTH
      ? formattedTitle.substring(0, MAX_TITLE_LENGTH) + "..."
      : formattedTitle;

  // Updated handler to open the article in the in-app browser
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const wikipediaUrl = `https://en.wikipedia.org/wiki/${formattedTitle}`;
    openInAppBrowser(wikipediaUrl);
  };

  const handleWikipediaPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const wikipediaUrl = `https://en.wikipedia.org/wiki/${formattedTitle}`;
    openInAppBrowser(wikipediaUrl);
  };

  const handleBookmarkClick = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    handleBookmarkToggle();
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
            {/* Display the truncated title */}
            <Text style={styles.wikipediaLink}>wiki/{truncatedTitle}</Text>
          </Pressable>

          <Pressable
            onPress={handleBookmarkClick}
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

// ... (rest of the file remains unchanged)

// The Bookmarks component remains as the default export
export default function Bookmarks() {
  const [bookmarkedArticles, setBookmarkedArticles] = useState<IArticle[]>([]);
  const isFocused = useIsFocused();

  const loadBookmarks = async () => {
    try {
      const bookmarks = await AsyncStorage.getItem(BOOKMARKS_KEY);
      if (bookmarks !== null) {
        let articlesToDisplay: IArticle[] = JSON.parse(bookmarks);
        // Reverse the array to show the most recent article first
        articlesToDisplay = articlesToDisplay.reverse();
        setBookmarkedArticles(articlesToDisplay);
      }
    } catch (e) {
      console.error("Failed to load bookmarks:", e);
    }
  };

  useEffect(() => {
    if (isFocused) {
      loadBookmarks();
    }
    bookmarksEmitter.on("bookmarksUpdated", loadBookmarks);
    return () => {
      bookmarksEmitter.off("bookmarksUpdated", loadBookmarks);
    };
  }, [isFocused]);

  if (bookmarkedArticles.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>
          You don't have any bookmarked articles yet.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {bookmarkedArticles.map((article) => (
        <MediaBlock key={article.id} article={article} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  // MediaBlock styles
  item: {
    display: "flex",
    flexDirection: "row",
    alignItems: "flex-start",
    borderRadius: 15,
    backgroundColor: "#fff",
    overflow: "hidden",
    maxHeight: 120,
  },
  imageContainer: {
    width: 108,
    height: 120,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  contentContainer: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    padding: 8,
    minHeight: 120,
  },
  textBlock: {
    paddingBottom: 4,
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
    marginTop: "auto",
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
  // Bookmarks component styles
  container: {
    padding: 10,
    gap: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#888",
  },
});
