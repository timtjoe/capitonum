import * as WebBrowser from "expo-web-browser";

export const openInAppBrowser = async (url: string) => {
  const result = await WebBrowser.openBrowserAsync(url, {
    dismissButtonStyle: "close", // Works only on iOS, harmless on Android
    controlsColor: "#007AFF", // Android toolbar color
    enableBarCollapsing: true, // Android Chrome Custom Tabs collapsible
    showInRecents: true, // Adds tab to recents (Android only)
  });

  if (result.type === "cancel") {
    console.log("User dismissed the browser.");
  }
};
