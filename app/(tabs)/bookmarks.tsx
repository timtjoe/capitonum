// Bookmarks.tsx  (Android-only)
import React, { useEffect, useRef, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Image,
  Animated,
  LayoutAnimation,
  UIManager,
  Dimensions,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { IArticle, useBookmark, bookmarksEmitter } from "@/hooks/useBookmark";
import { useIsFocused } from "@react-navigation/native";
import { openInAppBrowser } from "@/components/Browser";
import Ionicons from "@expo/vector-icons/Ionicons";
import { getIconUrl } from "@/hooks/useIcon";
import * as Haptics from "expo-haptics";

const WIKIPEDIA_ICON_URL = getIconUrl("wikipedia");
const BOOKMARKS_KEY = "@bookmarks";
const SCREEN_WIDTH = Dimensions.get("window").width;

// Enable LayoutAnimation on Android (Android-only project)
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

/**
 * Single card: handles the slide+fade-out animation when unbookmarking.
 * After the animation completes it calls handleBookmarkToggle() (hook)
 * and then notifies parent with onRemove(id).
 */
const MediaBlock = ({
  article,
  onRemove,
}: {
  article: IArticle;
  onRemove: (id: string) => void;
}) => {
  const { isBookmarked, handleBookmarkToggle } = useBookmark(article);

  const translateX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;

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

  const animateOutThenRemove = async () => {
    // visual slide + fade
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: SCREEN_WIDTH, // slide fully out to the right
        duration: 320,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 260,
        useNativeDriver: true,
      }),
    ]).start(async () => {
      // After the card visually disappears, update storage (hook) and notify parent
      try {
        await handleBookmarkToggle(); // updates AsyncStorage and emits bookmarksUpdated
      } catch (err) {
        console.error("toggle bookmark failed:", err);
      } finally {
        onRemove(article.id);
      }
    });
  };

  const onBookmarkPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // In the bookmarks list the items should be bookmarked; only animate when removing.
    if (isBookmarked) {
      animateOutThenRemove();
    } else {
      // If not bookmarked (edge case), just toggle without animation
      handleBookmarkToggle();
    }
  };

  return (
    <Animated.View
      style={[
        styles.item,
        {
          opacity,
          transform: [{ translateX }],
        },
      ]}
    >
      <Pressable onPress={handleOpen} style={styles.pressableInner}>
        {article.imageUrl && (
          <View style={styles.imageContainer}>
            <Image source={article.imageUrl} style={styles.image} />
          </View>
        )}

        <View style={styles.contentContainer}>
          <View style={styles.textBlock}>
            <Text style={styles.body} numberOfLines={4} ellipsizeMode="tail">
              {article.body}
            </Text>
          </View>

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
                name={isBookmarked ? "bookmark" : "bookmark-outline"}
                size={20}
                color={isBookmarked ? "#007AFF" : "#666"}
              />
            </Pressable>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
};

/**
 * Bookmarks screen: maintains local array of bookmarked articles.
 * When onRemove(id) is called we use LayoutAnimation to animate the
 * layout change (other cards sliding into place).
 */
export default function Bookmarks() {
  const [bookmarkedArticles, setBookmarkedArticles] = useState<IArticle[]>([]);
  const isFocused = useIsFocused();

  const loadBookmarks = async () => {
    try {
      const bookmarks = await AsyncStorage.getItem(BOOKMARKS_KEY);
      if (bookmarks !== null) {
        let articlesToDisplay: IArticle[] = JSON.parse(bookmarks);
        articlesToDisplay = articlesToDisplay.reverse(); // most recent first
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

  // Called by MediaBlock after its exit animation completes.
  const handleRemove = (id: string) => {
    // Configure a springy layout animation so the following cards slide up naturally.
    LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
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
  // MediaBlock styles
  item: {
    display: "flex",
    flexDirection: "row",
    alignItems: "flex-start",
    borderRadius: 15,
    backgroundColor: "#fff",
    overflow: "hidden",
    maxHeight: 120,
    marginBottom: 10,
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
