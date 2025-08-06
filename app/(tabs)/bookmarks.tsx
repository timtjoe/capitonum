import { StyleSheet, Text, View, ScrollView } from "react-native";
import { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { IArticle } from "@/components/Masonry";
import { useIsFocused } from "@react-navigation/native";
import { MediaBlock } from "@/components/MediaBlock";
import { bookmarksEmitter } from "@/hooks/useBookmark"; // Import the emitter

const BOOKMARKS_KEY = "@bookmarks";

export default function Bookmarks() {
  const [bookmarkedArticles, setBookmarkedArticles] = useState<IArticle[]>([]);
  const isFocused = useIsFocused();

  const loadBookmarks = async () => {
    try {
      const bookmarks = await AsyncStorage.getItem(BOOKMARKS_KEY);
      if (bookmarks !== null) {
        const articlesToDisplay: IArticle[] = JSON.parse(bookmarks);
        setBookmarkedArticles(articlesToDisplay);
      }
    } catch (e) {
      console.error("Failed to load bookmarks:", e);
    }
  };

  useEffect(() => {
    // Initial load and subsequent loads when the screen is focused
    if (isFocused) {
      loadBookmarks();
    }

    // Subscribe to updates from the emitter
    bookmarksEmitter.on("bookmarksUpdated", loadBookmarks);

    // Clean up the subscription on unmount
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
