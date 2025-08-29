import { useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { EventEmitter } from "events";
import { IArticle } from "@/app/(tabs)/Discover";

const BOOKMARKS_KEY = "@bookmarks";
export const bookmarksEmitter = new EventEmitter();

// REFACTORED: Add an optional callback for feedback
export const useBookmark = (
  article: IArticle,
  onBookmarkCallback?: (isAdding: boolean) => void
) => {
  const [isBookmarked, setIsBookmarked] = useState(false);

  useEffect(() => {
    const checkBookmarkStatus = async () => {
      try {
        const bookmarks = await AsyncStorage.getItem(BOOKMARKS_KEY);
        if (bookmarks !== null) {
          const bookmarkedArticles = JSON.parse(bookmarks);
          setIsBookmarked(
            bookmarkedArticles.some(
              (bookmarkedArticle: IArticle) =>
                bookmarkedArticle.id === article.id
            )
          );
        }
      } catch (e) {
        console.error("Failed to load bookmark status:", e);
      }
    };
    checkBookmarkStatus();
  }, [article.id]);

  const handleBookmarkToggle = useCallback(async () => {
    try {
      const bookmarks = await AsyncStorage.getItem(BOOKMARKS_KEY);
      let bookmarkedArticles: IArticle[] = bookmarks
        ? JSON.parse(bookmarks)
        : [];

      const isCurrentlyBookmarked = bookmarkedArticles.some(
        (bookmarkedArticle) => bookmarkedArticle.id === article.id
      );

      if (isCurrentlyBookmarked) {
        bookmarkedArticles = bookmarkedArticles.filter(
          (bookmarkedArticle) => bookmarkedArticle.id !== article.id
        );
        onBookmarkCallback?.(false); // Call callback for removal
      } else {
        bookmarkedArticles.push(article);
        onBookmarkCallback?.(true); // Call callback for adding
      }

      await AsyncStorage.setItem(
        BOOKMARKS_KEY,
        JSON.stringify(bookmarkedArticles)
      );
      setIsBookmarked(!isCurrentlyBookmarked);
      bookmarksEmitter.emit("bookmarksUpdated");
    } catch (e) {
      console.error("Failed to save bookmark:", e);
    }
  }, [article, onBookmarkCallback]);

  return { isBookmarked, handleBookmarkToggle };
};

export { IArticle };
