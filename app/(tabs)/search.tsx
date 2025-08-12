import React, { useState, useRef, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Pressable,
  ScrollView,
  Keyboard,
  ActivityIndicator,
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
const FetchResults = async (query: string) => {
  if (!query) return [];

  try {
    // Step 1: Use opensearch to get a list of titles and URLs.
    const searchResponse = await fetch(
      `${WIKIPEDIA_API_URL}?action=opensearch&search=${query}&limit=10&format=json&origin=*`
    );
    const searchData = await searchResponse.json();
    const titles = searchData[1] || [];
    const links = searchData[3] || [];

    if (titles.length === 0) {
      return [];
    }

    // Step 2: Use the titles to get the introductory text for each page.
    // We join the titles with '|' for a single API call.
    const titlesString = titles.join("|");
    const queryResponse = await fetch(
      `${WIKIPEDIA_API_URL}?action=query&prop=extracts&exlimit=10&exintro=1&explaintext=1&titles=${titlesString}&format=json&origin=*`
    );
    const queryData = await queryResponse.json();
    const pages = queryData.query.pages;

    // Step 3: Combine the results from both API calls.
    const results = Object.values(pages).map((page: any, index: number) => {
      // Find the corresponding URL from the opensearch results using the title
      const pageIndex = titles.indexOf(page.title);
      const url = pageIndex !== -1 ? links[pageIndex] : null;

      return {
        title: page.title,
        // The introductory text is in the 'extract' property
        body: page.extract || "No introductory text available.",
        url: url,
      };
    });

    return results;
  } catch (error) {
    console.error("Failed to fetch Wikipedia data:", error);
    return [];
  }
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
  const [isSearching, setIsSearching] = useState(false);
  const searchInputRef = useRef<TextInput>(null);

  const debouncedSearch = useRef(
    useCallback((query: string) => {
      if (query.length > 2) {
        setIsLoading(true);
        FetchResults(query).then((data) => {
          setResults(data);
          setIsLoading(false);
        });
      } else {
        setResults([]);
        setIsLoading(false);
      }
    }, [])
  ).current;

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    setIsSearching(true);
    debouncedSearch(text);
  };

  const handleSearchSubmit = useCallback(async (query: string) => {
    Keyboard.dismiss();
    setIsLoading(true);
    setIsSearching(false);
    const data = await FetchResults(query);
    setResults(data);
    setIsLoading(false);
  }, []);

  const handleItemPress = (item: string) => {
    setSearchQuery(item);
    handleSearchSubmit(item);
  };

  const handleLinkPress = useCallback((url: string) => {
    openInAppBrowser(url);
  }, []);

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
          <Text style={styles.listHeader}>
            <Text style={styles.searchPrompt}>Showing results for: </Text>
            {searchQuery}
          </Text>
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
    <View style={styles.container}>
      <View style={styles.searchFormContainer}>
        <View style={styles.searchInputWrapper}>
          <TextInput
            ref={searchInputRef}
            style={styles.searchInput}
            placeholder="What do you want to know?"
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
          <Ionicons name="search" size={20} color="#888" />
        </Pressable>
      </View>

      <ScrollView
        style={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        {renderContent()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "blue"
  },
  searchFormContainer: {
    flexDirection: "column",
    alignItems: "flex-end",
    backgroundColor: "white",
    height: 100,
    borderRadius: 12,
    fontSize: 12,
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "transparent",
    height: 100,
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    color: "black",
    marginLeft: 10,
    height: 100,
  },
  searchButton: {
    backgroundColor: "transparent",
    borderRadius: 35,
    height: 38,
    width: 38,
    justifyContent: "center",
    alignItems: "center",
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 15,
  },
  listHeader: {
    fontSize: 16,
    fontWeight: "bold",
    color: "black",
    marginTop: 10,
    marginBottom: 5,
  },
  searchPrompt: {
    color: "#888",
  },
  categoryItem: {
    backgroundColor: "transparent",
    marginVertical: 8,
  },
  categoryText: {
    fontSize: 12,
    color: "black",
  },
  suggestionItem: {
    borderBottomColor: "#eee",
    paddingVertical: 8,
  },
  suggestionText: {
    fontSize: 12,
    color: "black",
  },
  articleContainer: {
    padding: 10,
    backgroundColor: "#fff",
    marginBottom: 8,
    borderRadius: 8,
  },
  articleTitle: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 5,
  },
  articleBody: {
    fontSize: 12,
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
