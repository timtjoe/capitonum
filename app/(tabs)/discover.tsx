import React, { useEffect, useRef, useState } from "react";
import {
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
import { useRefresh } from "@/hooks/useRefresh";
import { useBookmark } from "@/hooks/useBookmark";
import { openInAppBrowser } from "@/components/Browser";
import { ALL_CATEGORIES, CATEGORIES_STORAGE_KEY, FETCH_LIMIT, ICON_SIZE, ITEM_MARGIN } from "@/constants";
// --- Import the new fetch service
import { fetchArticlesForCategory, IArticle } from "@/services/fetch";
import { DiscoverStyles } from "@/styles";

// --- Constants

// --- Single Article Item (SAI)
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
  const [error, setError] = useState<string | null>(null);
  const isFocused = useIsFocused();
  const scrollViewRef = useRef<ScrollView>(null);

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
    setError(null);

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
      const updatedCategories = forYouCategory
        ? [forYouCategory, ...categories.filter((c) => c.title !== "For You")]
        : categories;

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

const styles = DiscoverStyles
