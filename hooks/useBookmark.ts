import { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { IArticle } from "@/components/Masonry";
import { EventEmitter } from "events";

const BOOKMARKS_KEY = "@bookmarks";
export const bookmarksEmitter = new EventEmitter();

export const useBookmark = (article: IArticle) => {
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

  const handleBookmarkToggle = async () => {
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
      } else {
        bookmarkedArticles.push(article);
      }

      await AsyncStorage.setItem(
        BOOKMARKS_KEY,
        JSON.stringify(bookmarkedArticles)
      );
      setIsBookmarked(!isCurrentlyBookmarked);
      bookmarksEmitter.emit("bookmarksUpdated"); // Emit event on change
    } catch (e) {
      console.error("Failed to save bookmark:", e);
    }
  };

  return { isBookmarked, handleBookmarkToggle };
};

export { IArticle };
