import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Image,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { IArticle, useBookmark, bookmarksEmitter } from "@/hooks/useBookmark";
import { useIsFocused } from "@react-navigation/native";
import { openInAppBrowser } from "@/components/Browser";
import Ionicons from "@expo/vector-icons/Ionicons";
import { getIconUrl } from "@/hooks/useIcon";
import * as Haptics from "expo-haptics";
import AnimatedReanimated, {
  FadeIn,
  FadeOut,
  LinearTransition,
} from "react-native-reanimated";

const WIKIPEDIA_ICON_URL = getIconUrl("wikipedia");
const BOOKMARKS_KEY = "@bookmarks";

const MediaBlock = ({
  article,
  onRemove,
}: {
  article: IArticle;
  onRemove: (id: string) => void;
}) => {
  const { isBookmarked, handleBookmarkToggle } = useBookmark(article);
  const formattedTitle = article.title?.replace(/ /g, "_") || "";
  const MAX_TITLE_LENGTH = 15;
  const truncatedTitle =
    formattedTitle.length > MAX_TITLE_LENGTH
      ? formattedTitle.substring(0, MAX_TITLE_LENGTH) + "..."
      : formattedTitle;

  const handleOpen = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    openInAppBrowser(`https://en.wikipedia.org/wiki/${formattedTitle}`);
  };

  const onBookmarkPress = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isBookmarked) {
      await handleBookmarkToggle();
      onRemove(article.id);
    } else {
      handleBookmarkToggle();
    }
  };

  return (
    <AnimatedReanimated.View
      entering={FadeIn}
      exiting={FadeOut.duration(300)} // Ensure FadeOut is called when the component is unmounted
      layout={LinearTransition.springify()}
      style={styles.item}
    >
      <Pressable onPress={handleOpen} style={styles.pressableInner}>
        {article.imageUrl && (
          <View style={styles.imageContainer}>
            <Image source={article.imageUrl} style={styles.image} />
          </View>
        )}
        <View style={styles.contentContainer}>
          <View style={styles.footerContainer}>
            <Pressable
              onPress={handleOpen}
              style={styles.wikipediaLinkContainer}
            >
              <Image
                source={{ uri: WIKIPEDIA_ICON_URL }}
                style={styles.wikipediaIcon}
              />
              <Text style={styles.wikipediaLink}>wiki/{truncatedTitle}</Text>
            </Pressable>
            <Pressable onPress={onBookmarkPress} style={styles.bookmarkButton}>
              <Ionicons
                name={isBookmarked ? "close" : "close-outline"}
                size={20}
                color={isBookmarked ? "black" : "black"}
              />
            </Pressable>
          </View>
          <View style={styles.textBlock}>
            <Text style={styles.body} numberOfLines={4} ellipsizeMode="tail">
              {article.body}
            </Text>
          </View>
        </View>
      </Pressable>
    </AnimatedReanimated.View>
  );
};

export default function Bookmarks() {
  const [bookmarkedArticles, setBookmarkedArticles] = useState<IArticle[]>([]);
  const isFocused = useIsFocused();

  const loadBookmarks = async () => {
    try {
      const bookmarks = await AsyncStorage.getItem(BOOKMARKS_KEY);
      if (bookmarks !== null) {
        let articlesToDisplay: IArticle[] = JSON.parse(bookmarks);
        articlesToDisplay = articlesToDisplay.reverse();
        setBookmarkedArticles(articlesToDisplay);
      } else {
        setBookmarkedArticles([]);
      }
    } catch (e) {
      console.error("Failed to load bookmarks:", e);
    }
  };

  useEffect(() => {
    if (isFocused) loadBookmarks();
    bookmarksEmitter.on("bookmarksUpdated", loadBookmarks);
    return () => {
      bookmarksEmitter.off("bookmarksUpdated", loadBookmarks);
    };
  }, [isFocused]);

  const handleRemove = (id: string) => {
    setBookmarkedArticles((prev) => prev.filter((a) => a.id !== id));
  };

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
        <MediaBlock
          key={article.id}
          article={article}
          onRemove={handleRemove}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  item: {
    display: "flex",
    flexDirection: "row",
    alignItems: "flex-start",
    borderRadius: 15,
    backgroundColor: "#fff",
    overflow: "hidden",
    maxHeight: 120,
    marginBottom: 5,
  },
  pressableInner: {
    flexDirection: "row",
    flex: 1,
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
    paddingBottom: 5,
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
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    marginBottom: 5,
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
    color: "black",
  },
  bookmarkButton: {
    padding: 5,
  },
  container: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    gap: 5,
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
