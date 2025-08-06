import React, { useState } from "react";
import {
  StyleSheet,
  ScrollView,
  Text,
  Pressable, // Using Pressable for a more robust touch target
} from "react-native";

// Types
interface Category {
  id: string;
  title: string;
}

export interface ChiplistProps {
  onChipPress?: (category: Category) => void;
}

// Mock data for the categories
const CATEGORIES: Category[] = [
  { id: "0", title: "For You" },
  { id: "1", title: "Science" },
  { id: "2", title: "Geography" },
  { id: "3", title: "Civic" },
  { id: "4", title: "Technology" },
  { id: "5", title: "World" },
  { id: "6", title: "Politics" },
];

const Chiplist = ({ onChipPress }: ChiplistProps) => {
  const [activeChip, setActiveChip] = useState<string | null>(CATEGORIES[0].id);

  const handleChipPress = (category: Category) => {
    setActiveChip(category.id);
    if (onChipPress) {
      onChipPress(category);
    }
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {CATEGORIES.map((category) => (
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
    </ScrollView>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    paddingHorizontal: 15,
    paddingVertical: 10,
    gap: 8,
    maxHeight: 100
  },
  chip: {
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingTop: 3,
    paddingBottom: 3,
    justifyContent: "center",
    alignItems: "center",
    minWidth: 68,
    borderWidth: 0.7,
    borderColor: "#d5d5d5",
  },
  activeChip: {
    backgroundColor: "black",
    borderColor: "black",
  },
  pressedChip: {
    opacity: 0.75,
  },
  chipText: {
    fontSize: 12,
    color: "black",
    fontWeight: "bold",
    lineHeight: 25,
    padding: 0,
    paddingBottom: 4,
  },
  activeChipText: {
    color: "#fff",
  },
});

export default Chiplist;