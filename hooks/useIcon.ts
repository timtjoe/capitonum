/**
 * A central map for managing icon URLs.
 * Add new icons here for easy access throughout your application.
 */
const iconMap: Record<string, string> = {
  wikipedia:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Wikipedia-logo-v2-en.svg/48px-Wikipedia-logo-v2-en.svg.png",
  // You can add more icons here in the future
  // example: 'google': 'https://example.com/google-icon.png'
  // example: 'facebook': 'https://example.com/facebook-icon.png'
};

/**
 * Retrieves the URL for a specified icon name.
 * @param iconName The name of the icon to retrieve.
 * @returns The URL of the icon, or undefined if not found.
 */
export const getIconUrl = (iconName: string): string | undefined => {
  return iconMap[iconName];
};
