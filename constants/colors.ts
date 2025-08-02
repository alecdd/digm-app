const tintColorLight = '#0066FF';

const colors = {
  light: {
    text: '#ffffff',
    background: '#121212',
    tint: tintColorLight,
    tabIconDefault: '#666666',
    tabIconSelected: tintColorLight,
  },
  primary: "#0066FF", // Rapid blue as primary accent
  primaryLight: "#3385FF",
  primaryDark: "#0052CC",
  accent: "#ff6b6b",
  background: "#121212", // Dark background
  card: "#1e1e1e",
  cardLight: "#2a2a2a",
  text: "#ffffff",
  textSecondary: "#b0b0b0",
  border: "#333333",
  success: "#4caf50",
  warning: "#ff9800",
  error: "#f44336",
  inactive: "#666666",
  progressBar: "#0066FF", // Rapid blue for progress
  progressBackground: "#333333",
  quoteBg: "rgba(0, 102, 255, 0.3)", // Darker blue tint for better contrast with text
  taskCheckbox: "#0066FF", // Rapid blue for checkboxes
  taskCheckboxBg: "#333333",
  flame: "#ff6b6b",
  folder: "#3385FF",
  xpColor: "#0066FF", // Rapid blue for XP
};

export default colors;

// Level configuration
export const LEVEL_CONFIG = [
  { level: 1, minXP: 0, maxXP: 50 },
  { level: 2, minXP: 51, maxXP: 100 },
  { level: 3, minXP: 101, maxXP: 250 },
  { level: 4, minXP: 251, maxXP: 500 },
  { level: 5, minXP: 501, maxXP: 750 },
  { level: 6, minXP: 751, maxXP: 1000 },
  { level: 7, minXP: 1001, maxXP: 1500 },
  { level: 8, minXP: 1501, maxXP: 2000 },
  { level: 9, minXP: 2001, maxXP: 3000 },
  { level: 10, minXP: 3001, maxXP: 5000 },
];

export const getLevelInfo = (xp: number) => {
  for (const config of LEVEL_CONFIG) {
    if (xp >= config.minXP && xp <= config.maxXP) {
      return config;
    }
  }
  // If XP exceeds max level, return the highest level
  return LEVEL_CONFIG[LEVEL_CONFIG.length - 1];
};

export const getNextLevelInfo = (currentLevel: number) => {
  const nextLevel = currentLevel + 1;
  return LEVEL_CONFIG.find(config => config.level === nextLevel) || LEVEL_CONFIG[LEVEL_CONFIG.length - 1];
};