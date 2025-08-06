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
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useIsFocused } from "@react-navigation/native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";

import Chiplist from "@/components/Chiplist";
import { useRefresh } from "@/hooks/useRefresh";
import { useBookmark } from "@/hooks/useBookmark";
import { getIconUrl } from "@/hooks/useIcon";
import { openInAppBrowser } from "@/components/Browser";

// --- Constants
const NUM_COLUMNS = 2;
const FETCH_LIMIT = NUM_COLUMNS * 5;
const ITEM_MARGIN = 10;
const WIKIPEDIA_ICON_URL = getIconUrl("wikipedia");

export interface IArticle {
  id: string;
  title: string;
  body: string;
  imageUrl?: { uri: string };
  [key: string]: any;
}

// --- Fetch Wikipedia articles
const fetchWikiArticles = async (limit: number): Promise<IArticle[]> => {
  try {
    const response = await fetch(
      `https://en.wikipedia.org/w/api.php?action=query&format=json&generator=random&grnlimit=${limit}&prop=pageimages%7Cextracts&exintro=&explaintext=&pithumbsize=200&origin=*`
    );
    const data = await response.json();
    const pages = data?.query?.pages;
    if (!pages) return [];

    return Object.values(pages).map((page: any) => ({
      id: page.pageid.toString(),
      title: page.title,
      body: page.extract,
      imageUrl: page.thumbnail ? { uri: page.thumbnail.source } : undefined,
    }));
  } catch (error) {
    console.error("Fetch failed:", error);
    return [];
  }
};

// --- Single Article Item (SAI)
const ArticleItem = ({ article }: { article: IArticle }) => {
  const router = useRouter();
  const { isBookmarked, handleBookmarkToggle } = useBookmark(article);

  const formattedTitle = article.title?.replace(/ /g, "_") || "";
  const wikipediaUrl = `https://en.wikipedia.org/wiki/${formattedTitle}`;

  // const openWiki = () => Linking.openURL(wikipediaUrl);
  const openWiki = () => openInAppBrowser(wikipediaUrl);
  const openReader = () =>
    router.push({ pathname: "/reader", params: { id: article.id } });

  return (
    <Pressable
      onPress={openReader}
      style={({ pressed }) => [
        styles.item,
        { opacity: pressed ? 0.8 : 1, marginBottom: ITEM_MARGIN },
      ]}
    >
      {article.imageUrl && (
        <View style={styles.imageContainer}>
          <Image
            source={article.imageUrl}
            style={{ width: "100%", height: 150 }}
            resizeMode="cover"
          />
        </View>
      )}
      <Text style={styles.body} numberOfLines={6} ellipsizeMode="tail">
        {article.body}
      </Text>

      <View style={styles.footerContainer}>
        <Pressable onPress={openWiki} style={styles.wikipediaLinkContainer}>
          <Image
            source={{ uri: WIKIPEDIA_ICON_URL }}
            style={styles.wikipediaIcon}
          />
          <Text style={styles.wikipediaLink} numberOfLines={1}>
            wiki/{formattedTitle}
          </Text>
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

// --- Main Discover Component
const Discover = () => {
  const [columns, setColumns] = useState<IArticle[][]>([[], []]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const isFocused = useIsFocused();
  const scrollViewRef = useRef<ScrollView>(null);
  const { isRefreshing, onRefresh } = useRefresh(loadDataForRefresh);

  function distributeEvenly(articles: IArticle[]) {
    const half = Math.ceil(articles.length / 2);
    const updated = [
      [...columns[0], ...articles.slice(0, half)],
      [...columns[1], ...articles.slice(half)],
    ];
    setColumns(updated);
  }

  async function loadInitialData() {
    const fetched = await fetchWikiArticles(FETCH_LIMIT * 3);
    const half = Math.ceil(fetched.length / 2);
    setColumns([fetched.slice(0, half), fetched.slice(half)]);
  }

  async function loadMoreData() {
    if (isLoadingMore) return;
    setIsLoadingMore(true);
    const fetched = await fetchWikiArticles(FETCH_LIMIT);
    distributeEvenly(fetched);
    setIsLoadingMore(false);
  }

  async function loadDataForRefresh() {
    const fetched = await fetchWikiArticles(FETCH_LIMIT);
    const half = Math.ceil(fetched.length / 2);
    setColumns([
      [...fetched.slice(0, half), ...columns[0]],
      [...fetched.slice(half), ...columns[1]],
    ]);
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
  }

  const handleScroll = ({ nativeEvent }: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
    const isCloseToBottom =
      layoutMeasurement.height + contentOffset.y >= contentSize.height - 200;
    if (isCloseToBottom) loadMoreData();
  };

  useEffect(() => {
    if (isFocused && columns.flat().length === 0) {
      loadInitialData();
    }
  }, [isFocused]);

  return (
    <>
      <Chiplist />
      <ScrollView
        ref={scrollViewRef}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.container}>
          {columns.map((col, i) => (
            <View key={i} style={styles.column}>
              {col.map((article) => (
                <ArticleItem key={article.id} article={article} />
              ))}
            </View>
          ))}
        </View>

        {isLoadingMore && (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="small" color="#007AFF" />
          </View>
        )}
      </ScrollView>
    </>
  );
};

export default Discover;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    paddingHorizontal: 5,
    marginVertical: 5,
  },
  column: {
    flex: 1,
    marginHorizontal: ITEM_MARGIN / 2,
  },
  item: {
    backgroundColor: "#fff",
    borderRadius: 15,
    overflow: "hidden",
  },
  imageContainer: {
    width: "100%",
    maxHeight: 120,
    overflow: "hidden",
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
    padding: 5,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  wikipediaLinkContainer: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 1,
  },
  wikipediaIcon: {
    width: 18,
    height: 18,
    marginRight: 5,
  },
  wikipediaLink: {
    fontSize: 12,
    color: "#007AFF",
    flexShrink: 1,
  },
  bookmarkButton: {
    padding: 5,
  },
  loaderContainer: {
    padding: 15,
    alignItems: "center",
  },
});
