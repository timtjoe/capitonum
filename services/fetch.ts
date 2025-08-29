// @/services/fetch.ts

import { WIKIPEDIA_API_URL } from "@/constants";

export interface IArticle {
  id: string;
  title: string;
  body: string;
  imageUrl?: { uri: string };
  [key: string]: any;
}

// New Interface for Search Results
export interface ISearchResult {
  title: string;
  body: string;
  url: string;
}

const filterValidArticles = (articles: IArticle[]): IArticle[] => {
  return articles.filter(
    (article) =>
      article.title &&
      article.imageUrl?.uri &&
      article.body &&
      article.body.length > 50
  );
};

// **Existing Function for Discover Component**
export const fetchArticlesForCategory = async (
  query: string,
  limit: number
): Promise<{ data?: IArticle[]; error?: string }> => {
  const headers = {
    "User-Agent": "CapitonumApp/1.0 (Mobile App; capitonum@yonblee.com)",
  };

  try {
    let pages: any = null;

    if (query === "For You") {
      const randomResponse = await fetch(
        `${WIKIPEDIA_API_URL}?action=query&format=json&generator=random&grnnamespace=0&grnlimit=${
          limit * 2
        }&prop=pageimages|extracts&exintro=&explaintext=&pithumbsize=200&origin=*`,
        { headers }
      );

      if (!randomResponse.ok) {
        return {
          error: `Network error: Failed to fetch 'For You' articles. Status: ${randomResponse.status}`,
        };
      }

      const randomData = await randomResponse.json();
      pages = randomData?.query?.pages;

      if (!pages) {
        return { data: [] };
      }

      const fetchedArticles = Object.values(pages).map((page: any) => ({
        id: page.pageid.toString(),
        title: page.title,
        body: page.extract,
        imageUrl: page.thumbnail ? { uri: page.thumbnail.source } : undefined,
      }));

      const filteredArticles = filterValidArticles(fetchedArticles);

      if (filteredArticles.length === 0) {
        return {
          error: "No suitable articles found. Please try again or refresh.",
        };
      }

      return { data: filteredArticles };
    } else {
      const searchResponse = await fetch(
        `${WIKIPEDIA_API_URL}?action=query&format=json&list=search&srsearch=${query}&srlimit=${limit}&prop=pageimages|extracts&exintro=&explaintext=&pithumbsize=200&origin=*`,
        { headers }
      );

      if (!searchResponse.ok) {
        return {
          error: `Network error: Failed to load articles for '${query}'. Status: ${searchResponse.status}`,
        };
      }

      const searchData = await searchResponse.json();
      const searchResults = searchData?.query?.search;

      if (searchResults && searchResults.length > 0) {
        const pageIds = searchResults
          .map((result: any) => result.pageid)
          .join("|");
        const detailsResponse = await fetch(
          `${WIKIPEDIA_API_URL}?action=query&format=json&pageids=${pageIds}&prop=pageimages|extracts&exintro=&explaintext=&pithumbsize=200&origin=*`,
          { headers }
        );

        if (!detailsResponse.ok) {
          return {
            error: `Failed to get details for articles related to '${query}'. Status: ${detailsResponse.status}`,
          };
        }

        const detailsData = await detailsResponse.json();
        pages = detailsData?.query?.pages;
      }

      if (!pages) {
        return { data: [] };
      }

      const fetchedArticles = Object.values(pages).map((page: any) => ({
        id: page.pageid.toString(),
        title: page.title,
        body: page.extract,
        imageUrl: page.thumbnail ? { uri: page.thumbnail.source } : undefined,
      }));

      const filteredArticles = filterValidArticles(fetchedArticles);

      if (filteredArticles.length === 0) {
        return {
          error: `No suitable articles found for '${query}'. Try a different category.`,
        };
      }

      return { data: filteredArticles };
    }
  } catch (error) {
    console.error("Fetch failed:", error);
    return {
      error: `An unexpected network error occurred. Please check your connection. Error: ${error.message}`,
    };
  }
};

// **New Function for Search Component**
export const fetchSearchResults = async (
  query: string
): Promise<{ data?: ISearchResult[]; error?: string }> => {
  if (!query) {
    return { data: [] };
  }

  const headers = {
    "User-Agent": "CapitonumApp/1.0 (Mobile App; capitonum@yonblee.com)",
  };

  try {
    const searchResponse = await fetch(
      `${WIKIPEDIA_API_URL}?action=opensearch&search=${query}&limit=10&format=json&origin=*`,
      { headers }
    );

    if (!searchResponse.ok) {
      throw new Error(`HTTP error! status: ${searchResponse.status}`);
    }

    const searchData = await searchResponse.json();
    const titles = searchData[1] || [];
    const links = searchData[3] || [];

    if (titles.length === 0) {
      return { data: [] };
    }

    const titlesString = titles.join("|");
    const queryResponse = await fetch(
      `${WIKIPEDIA_API_URL}?action=query&prop=extracts&exlimit=10&exintro=1&explaintext=1&titles=${titlesString}&format=json&origin=*`,
      { headers }
    );

    if (!queryResponse.ok) {
      throw new Error(`HTTP error! status: ${queryResponse.status}`);
    }

    const queryData = await queryResponse.json();

    if (!queryData.query || !queryData.query.pages) {
      throw new Error("Invalid API response format.");
    }

    const pages = queryData.query.pages;

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
    return {
      error: "Failed to load data. Please check your network connection.",
    };
  }
};
