import React, { useEffect, useRef, useState } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  RefreshControl,
  Pressable,
  Text,
  Image,
  ActivityIndicator,
  Share,
  Modal,
  Animated,
} from "react-native";
import { useIsFocused } from "@react-navigation/native";
import Ionicons from "@expo/vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import Octicons from "@expo/vector-icons/Octicons";
import EvilIcons from "@expo/vector-icons/EvilIcons";

import { useRefresh } from "@/hooks/useRefresh";
import { useBookmark } from "@/hooks/useBookmark";
import { openInAppBrowser } from "@/components/Browser";

// --- Constants
const NUM_COLUMNS = 2;
const FETCH_LIMIT = NUM_COLUMNS * 5;
const ITEM_MARGIN = 10;
const ICON_SIZE = 18;
const WIKIPEDIA_API_URL = "https://en.wikipedia.org/w/api.php";

const ALL_CATEGORIES = [
  { id: "0", title: "For You" },
  { id: "1", title: "Paradox" },
  { id: "2", title: "Philosophy" },
  { id: "3", title: "Problem" },
  { id: "4", title: "Algorithm" },
  { id: "5", title: "Methodology" },
  { id: "6", title: "Strategy" },
  { id: "7", title: "Principle" },
  { id: "8", title: "Science" },
  { id: "9", title: "Technology" },
  { id: "10", title: "History" },
  { id: "11", title: "Mathematics" },
  { id: "12", title: "Physics" },
  { id: "13", title: "Biology" },
  { id: "14", title: "Psychology" },
  { id: "15", title: "Sociology" },
  { id: "16", title: "Economics" },
  { id: "17", title: "Logic" },
  { id: "18", title: "Engineering" },
];

export interface IArticle {
  id: string;
  title: string;
  body: string;
  imageUrl?: { uri: string };
  [key: string]: any;
}

const CATEGORIES_STORAGE_KEY = "@user_categories";

const filterValidArticles = (articles: IArticle[]): IArticle[] => {
  return articles.filter(
    (article) =>
      article.title &&
      article.imageUrl?.uri &&
      article.body &&
      article.body.length > 50
  );
};

// REFACTORED: Add better error handling to the fetch function
const fetchArticlesForCategory = async (
  query: string,
  limit: number
): Promise<{ data?: IArticle[]; error?: string }> => {
  try {
    if (query === "For You") {
      const response = await fetch(
        `${WIKIPEDIA_API_URL}?action=query&format=json&generator=random&grnnamespace=0&grnlimit=${
          limit * 2
        }&prop=pageimages%7Cextracts&exintro=&explaintext=&pithumbsize=200&origin=*`
      );

      if (!response.ok) {
        return {
          error: "Failed to load 'For You' articles. Please try again.",
        };
      }

      const data = await response.json();
      const pages = data?.query?.pages;
      if (!pages) return { data: [] };

      const fetchedArticles = Object.values(pages).map((page: any) => ({
        id: page.pageid.toString(),
        title: page.title,
        body: page.extract,
        imageUrl: page.thumbnail ? { uri: page.thumbnail.source } : undefined,
      }));
      return { data: filterValidArticles(fetchedArticles) };
    }

    const response = await fetch(
      `${WIKIPEDIA_API_URL}?action=query&format=json&list=search&srsearch=${query}&srlimit=${limit}&prop=pageimages%7Cextracts&exintro=&explaintext=&pithumbsize=200&origin=*`
    );

    if (!response.ok) {
      return { error: `Failed to load articles for '${query}'.` };
    }

    const data = await response.json();
    const searchResults = data?.query?.search;
    if (!searchResults) return { data: [] };

    const pageIds = searchResults.map((result: any) => result.pageid).join("|");
    const detailsResponse = await fetch(
      `${WIKIPEDIA_API_URL}?action=query&format=json&pageids=${pageIds}&prop=pageimages%7Cextracts&exintro=&explaintext=&pithumbsize=200&origin=*`
    );

    if (!detailsResponse.ok) {
      return {
        error: `Failed to get details for articles related to '${query}'.`,
      };
    }

    const detailsData = await detailsResponse.json();
    const pages = detailsData?.query?.pages;
    if (!pages) return { data: [] };

    const fetchedArticles = Object.values(pages).map((page: any) => ({
      id: page.pageid.toString(),
      title: page.title,
      body: page.extract,
      imageUrl: page.thumbnail ? { uri: page.thumbnail.source } : undefined,
    }));
    return { data: filterValidArticles(fetchedArticles) };
  } catch (error) {
    console.error("Fetch failed:", error);
    return { error: "Network error. Please check your connection." };
  }
};

// --- Single Article Item (SAI)
// REFACTORED: Add `onBookmarkCallback` to provide feedback to the parent
const ArticleItem = React.memo(
  ({
    article,
    onBookmarkCallback,
  }: {
    article: IArticle;
    onBookmarkCallback: (isAdding: boolean) => void;
  }) => {
    const { isBookmarked, handleBookmarkToggle } = useBookmark(
      article,
      onBookmarkCallback
    );

    const onBookmarkPress = () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      handleBookmarkToggle();
    };

    const onShare = async () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const formattedTitle = article.title?.replace(/ /g, "_") || "";
      const wikipediaUrl = `https://en.wikipedia.org/wiki/${formattedTitle}`;
      try {
        await Share.share({
          message: `Check out this Wikipedia article: ${wikipediaUrl}`,
          url: wikipediaUrl,
          title: article.title,
        });
      } catch (error) {
        if (error instanceof Error) {
          console.error("Failed to share:", error.message);
        } else {
          console.error("Failed to share with unknown error:", error);
        }
      }
    };

    const openArticleInBrowser = () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const formattedTitle = article.title?.replace(/ /g, "_") || "";
      const wikipediaUrl = `https://en.wikipedia.org/wiki/${formattedTitle}`;
      openInAppBrowser(wikipediaUrl);
    };

    return (
      <Pressable
        onPress={openArticleInBrowser}
        style={({ pressed }) => [
          styles.article,
          { opacity: pressed ? 0.8 : 1, marginBottom: ITEM_MARGIN },
        ]}
      >
        {article.imageUrl && (
          <View style={styles.cover}>
            <Image source={article.imageUrl} style={styles.image} />
          </View>
        )}
        <Text style={styles.body} numberOfLines={6} ellipsizeMode="tail">
          {article.body}
        </Text>

        <View style={styles.footer}>
          <Pressable onPress={onShare} style={styles.iconButton}>
            <Ionicons name="share-outline" size={18} color="#666" />
          </Pressable>
          <Pressable onPress={onBookmarkPress} style={styles.iconButton}>
            <Ionicons
              name={isBookmarked ? "bookmark" : "bookmark-outline"}
              size={ICON_SIZE}
              color={isBookmarked ? "black" : "#666"}
            />
          </Pressable>
        </View>
      </Pressable>
    );
  }
);

// --- Custom Skeleton Loader Component
const SkeletonLoader = () => (
  <View style={styles.skeletonContainer}>
    {[...Array(FETCH_LIMIT)].map((_, index) => (
      <View key={index} style={styles.skeletonItem}>
        <View style={styles.skeletonImage} />
        <View style={styles.skeletonTextContainer}>
          <View style={[styles.skeletonText, { width: "80%" }]} />
          <View style={[styles.skeletonText, { width: "95%" }]} />
          <View style={[styles.skeletonText, { width: "70%" }]} />
        </View>
      </View>
    ))}
  </View>
);

// --- Main Discover Component
const Discover = () => {
  const [columns, setColumns] = useState<IArticle[][]>([[], []]);
  const [activeChip, setActiveChip] = useState<string | null>(
    ALL_CATEGORIES[0].id
  );
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isLoadingInitial, setIsLoadingInitial] = useState(false);
  const [articleIds, setArticleIds] = useState(new Set<string>());
  const [userCategories, setUserCategories] = useState(
    ALL_CATEGORIES.slice(0, 5)
  );
  const [modalVisible, setModalVisible] = useState(false);
  const [error, setError] = useState<string | null>(null); // NEW: Error state
  const isFocused = useIsFocused();
  const scrollViewRef = useRef<ScrollView>(null);

  // NEW: Feedback state and animation
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const feedbackAnim = useRef(new Animated.Value(0)).current;

  const handleBookmarkFeedback = (isAdding: boolean) => {
    setFeedbackMessage(isAdding ? "Article Bookmarked!" : "Bookmark Removed.");
    setShowFeedback(true);
    Animated.timing(feedbackAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setTimeout(() => {
        Animated.timing(feedbackAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => setShowFeedback(false));
      }, 1500);
    });
  };

  const loadDataForRefresh = async () => {
    setError(null);
    const response = await fetchArticlesForCategory(
      userCategories.find((c) => c.id === activeChip)?.title || "For You",
      FETCH_LIMIT * 2
    );

    if (response.error) {
      setError(response.error);
      return;
    }

    const fetched = response.data || [];
    let newArticles = fetched.filter((article) => !articleIds.has(article.id));
    if (newArticles.length % 2 !== 0) {
      newArticles.pop();
    }

    if (newArticles.length > 0) {
      const newIds = newArticles.map((a) => a.id);
      setArticleIds((prev) => new Set([...prev, ...newIds]));
      const half = newArticles.length / 2;
      setColumns([
        [...newArticles.slice(0, half), ...columns[0]],
        [...newArticles.slice(half), ...columns[1]],
      ]);
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    }
  };

  const { isRefreshing, onRefresh } = useRefresh(loadDataForRefresh);

  function distributeEvenly(articles: IArticle[]) {
    let newArticles = articles.filter((article) => !articleIds.has(article.id));
    if (newArticles.length % 2 !== 0) {
      newArticles.pop();
    }

    if (newArticles.length > 0) {
      const newIds = newArticles.map((a) => a.id);
      setArticleIds((prev) => new Set([...prev, ...newIds]));
      const half = newArticles.length / 2;
      const updatedCol1 = [...columns[0], ...newArticles.slice(0, half)];
      const updatedCol2 = [...columns[1], ...newArticles.slice(half)];
      setColumns([updatedCol1, updatedCol2]);
    }
  }

  async function loadInitialData(query: string) {
    setIsLoadingInitial(true);
    setError(null); // Clear errors on new data load

    const response = await fetchArticlesForCategory(query, FETCH_LIMIT * 3);

    if (response.error) {
      setColumns([[], []]);
      setError(response.error);
      setIsLoadingInitial(false);
      return;
    }

    const fetched = response.data || [];
    let newArticles = fetched.filter((article) => !articleIds.has(article.id));
    if (newArticles.length % 2 !== 0) {
      newArticles.pop();
    }

    if (newArticles.length > 0) {
      const newIds = newArticles.map((a) => a.id);
      setArticleIds(new Set(newIds));
      const half = newArticles.length / 2;
      setColumns([newArticles.slice(0, half), newArticles.slice(half)]);
    } else {
      setColumns([[], []]);
      // Optional: set a "no results" error if desired
    }
    setIsLoadingInitial(false);
  }

  async function loadMoreData() {
    if (isLoadingMore) return;
    setIsLoadingMore(true);
    setError(null);

    const response = await fetchArticlesForCategory(
      userCategories.find((c) => c.id === activeChip)?.title || "For You",
      FETCH_LIMIT
    );

    if (response.error) {
      setError(response.error);
      setIsLoadingMore(false);
      return;
    }

    distributeEvenly(response.data || []);
    setIsLoadingMore(false);
  }

  const handleScroll = ({ nativeEvent }: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
    const isCloseToBottom =
      layoutMeasurement.height + contentOffset.y >= contentSize.height - 200;
    if (isCloseToBottom && !isLoadingMore && !isLoadingInitial && !error) {
      loadMoreData();
    }
  };

  const handleChipPress = (category: (typeof ALL_CATEGORIES)[0]) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveChip(category.id);
    loadInitialData(category.title);
  };

  const saveUserCategories = async (categories: typeof ALL_CATEGORIES) => {
    try {
      const forYouCategory = ALL_CATEGORIES.find((c) => c.title === "For You");
      const filteredCategories = categories.filter(
        (c) => c.title !== "For You"
      );
      const updatedCategories = forYouCategory
        ? [forYouCategory, ...filteredCategories]
        : filteredCategories;

      await AsyncStorage.setItem(
        CATEGORIES_STORAGE_KEY,
        JSON.stringify(updatedCategories)
      );
    } catch (e) {
      if (e instanceof Error) {
        console.error("Failed to save categories:", e.message);
      } else {
        console.error("Failed to save categories with unknown error:", e);
      }
    }
  };

  const loadUserCategories = async () => {
    try {
      const storedCategories = await AsyncStorage.getItem(
        CATEGORIES_STORAGE_KEY
      );
      if (storedCategories !== null) {
        let parsedCategories = JSON.parse(storedCategories);
        const forYouCategory = ALL_CATEGORIES.find(
          (c) => c.title === "For You"
        );
        if (forYouCategory && parsedCategories[0]?.title !== "For You") {
          parsedCategories = parsedCategories.filter(
            (c: any) => c.title !== "For You"
          );
          parsedCategories.unshift(forYouCategory);
        }
        setUserCategories(parsedCategories);
      } else {
        const defaultCategories = ALL_CATEGORIES.slice(0, 5);
        await saveUserCategories(defaultCategories);
        setUserCategories(defaultCategories);
      }
    } catch (e) {
      if (e instanceof Error) {
        console.error("Failed to load categories:", e.message);
      } else {
        console.error("Failed to load categories with unknown error:", e);
      }
    }
  };

  const toggleCategorySelection = (category: (typeof ALL_CATEGORIES)[0]) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const isAlreadySelected = userCategories.some((c) => c.id === category.id);
    if (category.title === "For You") {
      return;
    }
    if (isAlreadySelected) {
      if (userCategories.length <= 4) {
        return;
      }
      const updatedCategories = userCategories.filter(
        (c) => c.id !== category.id
      );
      setUserCategories(updatedCategories);
      saveUserCategories(updatedCategories);
    } else {
      const updatedCategories = [...userCategories, category];
      setUserCategories(updatedCategories);
      saveUserCategories(updatedCategories);
    }
  };

  useEffect(() => {
    loadUserCategories();
  }, []);

  useEffect(() => {
    if (isFocused && columns.flat().length === 0) {
      loadInitialData(userCategories[0]?.title || "For You");
    }
  }, [isFocused, userCategories]);

  return (
    <View style={{ flex: 1 }}>
      {/* Chiplist */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chiplistContainer}
      >
        {userCategories.map((category) => (
          <Pressable
            key={category.id}
            onPress={() => handleChipPress(category)}
            style={({ pressed }) => [
              styles.chip,
              activeChip === category.id && styles.activeChip,
              pressed && styles.pressedChip,
            ]}
          >
            <Text
              style={[
                styles.chipText,
                activeChip === category.id && styles.activeChipText,
              ]}
            >
              {category.title}
            </Text>
          </Pressable>
        ))}
        <Pressable
          style={({ pressed }) => [
            styles.chip,
            styles.addButton,
            pressed && styles.pressedChip,
          ]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setModalVisible(true);
          }}
        >
          <Ionicons name="add" size={24} color="black" />
        </Pressable>
      </ScrollView>

      {/* Modal for Categories */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(!modalVisible);
        }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Categories</Text>
            <ScrollView contentContainerStyle={styles.modalCategoriesContainer}>
              {ALL_CATEGORIES.map((category) => (
                <Pressable
                  key={category.id}
                  onPress={() => toggleCategorySelection(category)}
                  style={({ pressed }) => [
                    styles.modalChip,
                    userCategories.some((c) => c.id === category.id) &&
                      styles.modalChipSelected,
                    pressed && styles.pressedChip,
                    category.title === "For You" && styles.fixedChip,
                  ]}
                  disabled={
                    category.title === "For You" && userCategories.length === 1
                  }
                >
                  <Text
                    style={[
                      styles.modalChipText,
                      userCategories.some((c) => c.id === category.id) &&
                        styles.modalChipTextSelected,
                      category.title === "For You" && styles.fixedChipText,
                    ]}
                  >
                    {category.title}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
            <Pressable
              style={styles.closeButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setModalVisible(false);
              }}
            >
              <Text style={styles.closeButtonText}>Done</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <ScrollView
        ref={scrollViewRef}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
      >
        {/* NEW: Render error feedback */}
        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable
              onPress={() =>
                loadInitialData(userCategories[0]?.title || "For You")
              }
              style={styles.tryAgainButton}
            >
              <Text style={styles.tryAgainText}>Try Again</Text>
            </Pressable>
          </View>
        ) : isLoadingInitial ? (
          <SkeletonLoader />
        ) : (
          <View style={styles.container}>
            {columns.map((col, i) => (
              <View key={i} style={styles.column}>
                {col.map((article) => (
                  <ArticleItem
                    key={article.id}
                    article={article}
                    onBookmarkCallback={handleBookmarkFeedback}
                  />
                ))}
              </View>
            ))}
          </View>
        )}

        {isLoadingMore && (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="small" color="#007AFF" />
          </View>
        )}
      </ScrollView>

      {/* NEW: Bookmark feedback UI */}
      {showFeedback && (
        <Animated.View
          style={[
            styles.feedbackContainer,
            {
              transform: [
                {
                  translateY: feedbackAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [100, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <Text style={styles.feedbackText}>{feedbackMessage}</Text>
        </Animated.View>
      )}
    </View>
  );
};

export default Discover;

const styles = StyleSheet.create({
  // --- Existing styles...
  chiplistContainer: {
    flexDirection: "row",
    paddingHorizontal: 15,
    paddingVertical: 10,
    paddingRight: 50,
    gap: 8,
    height: 50,
  },
  chip: {
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingTop: 3,
    paddingBottom: 3,
    justifyContent: "center",
    alignItems: "center",
    minWidth: 68,
    borderWidth: 0.7,
    borderColor: "#d5d5d5",
  },
  addButton: {
    borderRadius: 50,
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  activeChip: {
    backgroundColor: "black",
    borderColor: "black",
  },
  pressedChip: {
    opacity: 0.75,
  },
  chipText: {
    fontSize: 12,
    color: "black",
    fontWeight: "bold",
    lineHeight: 25,
    padding: 0,
    paddingBottom: 4,
  },
  activeChipText: {
    color: "#fff",
  },
  container: {
    flexDirection: "row",
    paddingHorizontal: 5,
    marginVertical: 5,
  },
  column: {
    flex: 1,
    marginHorizontal: ITEM_MARGIN / 2,
  },
  article: {
    backgroundColor: "#fff",
    borderRadius: 15,
    overflow: "hidden",
    minHeight: 250,
    maxHeight: 290,
    display: "flex",
    flexDirection: "column",
  },
  cover: {
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
    padding: 6,
    maxHeight: 130,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 5,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    height: 40,
    marginTop: "auto",
  },
  iconButton: {
    padding: 5,
  },
  skeletonContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 10,
  },
  skeletonItem: {
    width: "48%",
    height: 250,
    backgroundColor: "#DADCE0",
    borderRadius: 15,
    marginBottom: ITEM_MARGIN,
    overflow: "hidden",
  },
  skeletonImage: {
    width: "100%",
    height: 120,
    backgroundColor: "#c9cacaff",
  },
  skeletonTextContainer: {
    padding: 10,
  },
  skeletonText: {
    height: 12,
    backgroundColor: "#c9cacaff",
    marginBottom: 8,
    borderRadius: 4,
  },
  loaderContainer: {
    padding: 15,
    alignItems: "center",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    width: "85%",
    maxHeight: "70%",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
  },
  modalCategoriesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  modalChip: {
    backgroundColor: "#f0f0f0",
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingTop: 3,
    paddingBottom: 3,
    margin: 5,
    borderWidth: 0.7,
    borderColor: "#d5d5d5",
  },
  modalChipSelected: {
    backgroundColor: "black",
  },
  modalChipText: {
    fontSize: 12,
    color: "black",
    fontWeight: "bold",
    lineHeight: 25,
  },
  modalChipTextSelected: {
    color: "#fff",
  },
  closeButton: {
    backgroundColor: "black",
    borderRadius: 17,
    padding: 10,
    marginTop: 30,
    minWidth: "100%",
    alignItems: "center",
  },
  closeButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  fixedChip: {
    opacity: 0.5,
  },
  fixedChipText: {
    fontWeight: "normal",
  },
  // NEW STYLES for error and feedback
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 300,
    padding: 15,
  },
  errorText: {
    fontSize: 16,
    textAlign: "center",
    color: "#e74c3c",
    marginBottom: 15,
  },
  tryAgainButton: {
    backgroundColor: "black",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
  },
  tryAgainText: {
    color: "white",
    fontWeight: "bold",
  },
  feedbackContainer: {
    position: "absolute",
    bottom: 15,
    alignSelf: "center",
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
  },
  feedbackText: {
    color: "white",
    fontWeight: "bold",
  },
});