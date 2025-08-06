import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Pressable,
  ScrollView,
  Keyboard,
  ActivityIndicator,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import { openInAppBrowser } from "@/components/Browser";

// --- Constants
const CATEGORIES = [
  "Science",
  "Technology",
  "Art",
  "History",
  "Nature",
  "Sports",
  "Politics",
  "Culture",
];

const WIKIPEDIA_API_URL = "https://en.wikipedia.org/w/api.php";
const SEARCH_DEBOUNCE_DELAY = 300;

// --- Fetching data from Wikipedia
const fetchWikiSearchResults = async (query: string) => {
  if (!query) return [];
  const response = await fetch(
    `${WIKIPEDIA_API_URL}?action=opensearch&search=${query}&limit=10&format=json&origin=*`
  );
  const data = await response.json();
  const titles = data[1] || [];
  const descriptions = data[2] || [];
  const links = data[3] || [];

  return titles.map((title: string, index: number) => ({
    title,
    body: descriptions[index] || "No description available.",
    url: links[index],
  }));
};

// --- Article Result Component
const ArticleResult = React.memo(
  ({
    article,
    onLinkPress,
  }: {
    article: any;
    onLinkPress: (url: string) => void;
  }) => {
    const displayBody =
      article.body && article.body.length > 200
        ? `${article.body.slice(0, 200)}...`
        : article.body;

    return (
      <Pressable
        onPress={() => onLinkPress(article.url)}
        style={styles.articleContainer}
      >
        <Text style={styles.articleTitle}>{article.title}</Text>
        <Text style={styles.articleBody}>{displayBody}</Text>
      </Pressable>
    );
  }
);

// --- Main Search Component
export default function Search() {
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false); // New state to differentiate
  const searchInputRef = useRef<TextInput>(null);

  // Debounced search function to reduce API calls
  const debouncedSearch = useRef(
    useCallback((query: string) => {
      if (query.length > 2) {
        setIsLoading(true);
        fetchWikiSearchResults(query).then((data) => {
          setResults(data);
          setIsLoading(false);
        });
      } else {
        setResults([]);
        setIsLoading(false);
      }
    }, [])
  ).current;

  // Handles text input change
  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    setIsSearching(true);
    debouncedSearch(text);
  };

  // Handles search submission (e.g., from button or 'Enter')
  const handleSearchSubmit = useCallback(async (query: string) => {
    Keyboard.dismiss();
    setIsLoading(true);
    setIsSearching(false);
    const data = await fetchWikiSearchResults(query);
    setResults(data);
    setIsLoading(false);
  }, []);

  // Handles category or suggestion press
  const handleItemPress = (item: string) => {
    setSearchQuery(item);
    handleSearchSubmit(item);
  };

  const handleLinkPress = useCallback((url: string) => {
    openInAppBrowser(url);
  }, []);

  // Render content based on state
  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      );
    }

    if (isSearching && results.length > 0) {
      return (
        <>
          <Text style={styles.listHeader}>Suggestions</Text>
          {results.map((item, index) => (
            <Pressable
              key={index}
              style={styles.suggestionItem}
              onPress={() => handleItemPress(item.title)}
            >
              <Text style={styles.suggestionText}>{item.title}</Text>
            </Pressable>
          ))}
        </>
      );
    }

    if (results.length > 0) {
      return (
        <>
          <Text style={styles.listHeader}>Search Results</Text>
          {results.map((article, index) => (
            <ArticleResult
              key={index}
              article={article}
              onLinkPress={handleLinkPress}
            />
          ))}
        </>
      );
    }

    if (searchQuery.length > 2 && !isLoading && !isSearching) {
      return (
        <Text style={styles.noResultsText}>
          No results found for "{searchQuery}".
        </Text>
      );
    }

    return (
      <>
        <Text style={styles.listHeader}>Categories</Text>
        <View>
          {CATEGORIES.map((category, index) => (
            <Pressable
              key={index}
              style={styles.categoryItem}
              onPress={() => handleItemPress(category)}
            >
              <Text style={styles.categoryText}>{category}</Text>
            </Pressable>
          ))}
        </View>
      </>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.searchFormContainer}>
        <View style={styles.searchInputWrapper}>
          <Ionicons
            name="search"
            size={20}
            color="#888"
            style={styles.searchIcon}
          />
          <TextInput
            ref={searchInputRef}
            style={styles.searchInput}
            placeholder="Search Wikipedia"
            placeholderTextColor="#888"
            value={searchQuery}
            onChangeText={handleSearchChange}
            onSubmitEditing={() => handleSearchSubmit(searchQuery)}
            clearButtonMode="while-editing"
          />
        </View>
        <Pressable
          style={styles.searchButton}
          onPress={() => handleSearchSubmit(searchQuery)}
        >
          <Ionicons name="send-outline" size={20} color="#fff" />
        </Pressable>
      </View>

      <ScrollView
        style={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        {renderContent()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  searchFormContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    borderRadius: 25,
    paddingHorizontal: 15,
    marginRight: 10,
    height: 50,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },
  searchButton: {
    backgroundColor: "#007AFF",
    borderRadius: 25,
    height: 50,
    width: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  contentContainer: {
    flex: 1,
    padding: 10,
  },
  listHeader: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginTop: 10,
    marginBottom: 5,
    paddingHorizontal: 5,
  },
  categoryItem: {
    padding: 15,
    backgroundColor: "#e8e8e8",
    borderRadius: 10,
    marginBottom: 10,
  },
  categoryText: {
    fontSize: 16,
    color: "#333",
  },
  suggestionItem: {
    paddingVertical: 15,
    paddingHorizontal: 5,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  suggestionText: {
    fontSize: 16,
    color: "#333",
  },
  articleContainer: {
    padding: 15,
    backgroundColor: "#fff",
    borderRadius: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 10,
  },
  articleTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 5,
  },
  articleBody: {
    fontSize: 14,
    lineHeight: 20,
    color: "#555",
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 200,
  },
  noResultsText: {
    fontSize: 16,
    textAlign: "center",
    marginTop: 20,
    color: "#888",
  },
});
