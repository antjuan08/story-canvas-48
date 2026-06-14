export const STORY_CATEGORIES = [
  "Family",
  "Friendship",
  "Business",
  "Hard Times",
  "Love",
  "Travel",
  "Childhood",
  "Faith",
  "Other",
] as const;

export type StoryCategory = typeof STORY_CATEGORIES[number];
