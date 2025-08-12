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
  "Paradox",
  "Philosophy",
  "Problem",
  "Algorithm",
  "Methodology",
  "Strategy",
  "Principle",
  "Science",
  "Technology",
  "History",
  "Mathematics",
  "Physics",
  "Biology",
  "Psychology",
  "Sociology",
  "Economics",
  "Logic",
  "Engineering",
];

const WIKIPEDIA_API_URL = "https://en.wikipedia.org/w/api.php";

// --- Fetching data from Wikipedia
const FetchResults = async (query: string) => {
  if (!query) return { data: [] };

  try {
    // Step 1: Use opensearch to get a list of titles and URLs.
    const searchResponse = await fetch(
      `${WIKIPEDIA_API_URL}?action=opensearch&search=${query}&limit=10&format=json&origin=*`
    );

    // ERROR HANDLING: Explicitly check for non-200 status codes.
    if (!searchResponse.ok) {
      throw new Error(`HTTP error! status: ${searchResponse.status}`);
    }

    const searchData = await searchResponse.json();
    const titles = searchData[1] || [];
    const links = searchData[3] || [];

    if (titles.length === 0) {
      return { data: [] };
    }

    // Step 2: Use the titles to get the introductory text for each page.
    const titlesString = titles.join("|");
    const queryResponse = await fetch(
      `${WIKIPEDIA_API_URL}?action=query&prop=extracts&exlimit=10&exintro=1&explaintext=1&titles=${titlesString}&format=json&origin=*`
    );

    // ERROR HANDLING: Explicitly check for non-200 status codes.
    if (!queryResponse.ok) {
      throw new Error(`HTTP error! status: ${queryResponse.status}`);
    }

    const queryData = await queryResponse.json();

    // ERROR HANDLING: Check for a valid data structure.
    if (!queryData.query || !queryData.query.pages) {
      throw new Error("Invalid API response format.");
    }

    const pages = queryData.query.pages;

    // Step 3: Combine the results from both API calls.
    const results = Object.values(pages).map((page: any) => {
      const pageIndex = titles.indexOf(page.title);
      const url = pageIndex !== -1 ? links[pageIndex] : null;

      return {
        title: page.title,
        body: page.extract || "No introductory text available.",
        url: url,
      };
    });

    return { data: results };
  } catch (error) {
    console.error("Failed to fetch Wikipedia data:", error);
    // Return a specific error message for UI display.
    return {
      error: "Failed to load data. Please check your network connection.",
    };
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
  // NEW STATE: Store error messages here.
  const [error, setError] = useState<string | null>(null);
  const searchInputRef = useRef<TextInput>(null);

  const performSearch = useCallback(async (query: string) => {
    setIsLoading(true);
    setError(null); // Clear any previous errors
    const response = await FetchResults(query);

    if (response.error) {
      setResults([]);
      setError(response.error);
    } else {
      setResults(response.data);
    }
    setIsLoading(false);
  }, []);

  const debouncedSearch = useRef(
    useCallback(
      (query: string) => {
        if (query.length > 2) {
          setIsSearching(true);
          performSearch(query);
        } else {
          setResults([]);
          setIsLoading(false);
          setIsSearching(false);
          setError(null);
        }
      },
      [performSearch]
    )
  ).current;

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    debouncedSearch(text);
  };

  const handleSearchSubmit = useCallback(
    async (query: string) => {
      Keyboard.dismiss();
      setIsSearching(false);
      performSearch(query);
    },
    [performSearch]
  );

  const handleItemPress = (item: string) => {
    setSearchQuery(item);
    handleSearchSubmit(item);
  };

  const handleLinkPress = useCallback((url: string) => {
    openInAppBrowser(url);
  }, []);

  // RENDER FUNCTION: Now includes logic for the error state.
  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="black" />
        </View>
      );
    }

    // NEW LOGIC: Show error message and a "Try Again" button.
    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable
            onPress={() => handleSearchSubmit(searchQuery)}
            style={styles.tryAgainButton}
          >
            <Text style={styles.tryAgainText}>Try Again</Text>
          </Pressable>
        </View>
      );
    }

    if (isSearching && results.length > 0) {
      return (
        <>
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
            <Text style={styles.searchPrompt}>Showing results for: </Text>"
            {searchQuery}"
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

    // NEW LOGIC: More user-friendly "no results" message.
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
          <Ionicons name="search" size={22} color="black" />
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
    flex: 1,
    backgroundColor: "#e6e7e7ff",
  },
  searchFormContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 50,
    margin: 10,
    paddingRight: 15,
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "transparent",
    padding: 15,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "black",
    fontWeight: "bold",
  },
  searchButton: {
    backgroundColor: "transparent",
    borderRadius: 35,
    height: 48,
    width: 48,
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
    marginVertical: 15,
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
  // NEW STYLES: For the error message container and button
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 200,
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    textAlign: "center",
    color: "red",
    marginBottom: 15,
  },
  tryAgainButton: {
    backgroundColor: "black",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  tryAgainText: {
    color: "white",
    fontWeight: "bold",
  },
});
