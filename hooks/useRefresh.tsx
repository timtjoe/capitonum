import { useState, useCallback } from "react";

export const useRefresh = (onRefreshCallback: () => Promise<void>) => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await onRefreshCallback();
    } catch (error) {
      console.error("Refresh failed:", error);
    } finally {
      setIsRefreshing(false);
    }
  }, [onRefreshCallback]);

  return { isRefreshing, onRefresh };
};
