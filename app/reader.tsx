import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  ActivityIndicator,
  Pressable,
  Share,
} from "react-native";
import { useLocalSearchParams, Stack, useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import Fontisto from "@expo/vector-icons/Fontisto";
import * as Haptics from "expo-haptics";

import { openInAppBrowser } from "@/components/Browser";
import { useBookmark, IArticle } from "@/hooks/useBookmark";

const WIKIPEDIA_API_URL = "https://en.wikipedia.org/w/api.php";
const ICON_SIZE = 24;

// Helper function to fetch a single article by ID
const fetchArticleById = async (id: string): Promise<IArticle | null> => {
  try {
    const response = await fetch(
      `${WIKIPEDIA_API_URL}?action=query&format=json&pageids=${id}&prop=pageimages%7Cextracts&exintro=&explaintext=&pithumbsize=600&origin=*`
    );
    const data = await response.json();
    const page = data?.query?.pages?.[id];

    if (!page) return null;

    return {
      id: page.pageid.toString(),
      title: page.title,
      body: page.extract,
      imageUrl: page.thumbnail ? { uri: page.thumbnail.source } : undefined,
    };
  } catch (error) {
    if (error instanceof Error) {
      console.error("Fetch article failed:", error.message);
    } else {
      console.error("Fetch article failed with unknown error:", error);
    }
    return null;
  }
};

const Reader = () => {
  const { id } = useLocalSearchParams() || "12345678";
  const router = useRouter();
  const [article, setArticle] = useState<IArticle | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Use the bookmark hook for the current article
  const { isBookmarked, handleBookmarkToggle } = useBookmark(article);

  useEffect(() => {
    const loadArticle = async () => {
      // Check if id is a non-empty string before fetching
      if (id && typeof id === "string") {
        const fetchedArticle = await fetchArticleById(id);
        setArticle(fetchedArticle);
      }
      setIsLoading(false);
    };
    loadArticle();
  }, [id]);

  const onBookmarkPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    handleBookmarkToggle();
  };

  const onShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!article) return;
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

  const onOpenWikipedia = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!article) return;
    const formattedTitle = article.title?.replace(/ /g, "_") || "";
    const wikipediaUrl = `https://en.wikipedia.org/wiki/${formattedTitle}`;
    openInAppBrowser(wikipediaUrl);
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Header for the reader screen */}
      <Stack.Screen
        options={{
          headerTitle: article?.title || "Article",
          headerLeft: () => (
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.back();
              }}
              style={{ marginRight: 10 }}
            >
              <Ionicons name="arrow-back" size={24} color="black" />
            </Pressable>
          ),
          headerRight: () => (
            <View style={{ flexDirection: "row", gap: 10 }}>
              <Pressable onPress={onBookmarkPress}>
                <Ionicons
                  name={isBookmarked ? "bookmark" : "bookmark-outline"}
                  size={ICON_SIZE}
                  color={isBookmarked ? "black" : "#666"}
                />
              </Pressable>
              <Pressable onPress={onOpenWikipedia}>
                <Ionicons name="link" size={ICON_SIZE} color="black" />
              </Pressable>
              <Pressable onPress={onShare}>
                <Fontisto name="share-a" size={ICON_SIZE} color="black" />
              </Pressable>
            </View>
          ),
        }}
      />

      {isLoading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : article ? (
        <ScrollView contentContainerStyle={styles.contentContainer}>
          <Text style={styles.articleBody}>{article.body}</Text>
          {article.imageUrl && (
            <Image source={article.imageUrl} style={styles.articleImage} />
          )}
        </ScrollView>
      ) : (
        <View style={styles.loaderContainer}>
          <Text>Article not found.</Text>
        </View>
      )}
    </View>
  );
};

export default Reader;

const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  contentContainer: {
    padding: 20,
    backgroundColor: "#fff",
  },
  articleBody: {
    fontSize: 16,
    lineHeight: 24,
    color: "#333",
  },
  articleImage: {
    width: "100%",
    height: 300,
    borderRadius: 10,
    marginTop: 20,
    resizeMode: "cover",
  },
});
