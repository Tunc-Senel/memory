/**
 * Describes the preview image of a theme on the settings page.
 */
type ThemePreview = {
  src: string;
  alt: string;
};

/**
 * Describes the image paths a theme uses on the game page.
 */
type ThemeAssets = {
  cardPath: string;
  markerBlue: string;
  markerOrange: string;
  currentMarker: string;
};

/**
 * Describes the texts and icons of a game result in both themes.
 */
export type GameResult = {
  winner: string;
  iconCodeVibes: string;
  iconDaProjects: string;
  codeVibesButtonText: string;
  daProjectsButtonText: string;
};

/**
 * Session storage keys of the selected settings.
 */
export const STORAGE_KEYS = {
  theme: "selectedTheme",
  player: "selectedPlayer",
  boardSize: "selectedBoardSize",
};

/**
 * Theme used when no theme was selected.
 */
const DEFAULT_THEME = "code-vibes";

/**
 * Starting player used when no player was selected.
 */
const DEFAULT_PLAYER = "blue";

/**
 * Board size used when no board size was selected.
 */
const DEFAULT_BOARD_SIZE = 16;

/**
 * Theme chosen on the settings page.
 */
export const SELECTED_THEME =
  sessionStorage.getItem(STORAGE_KEYS.theme) ?? DEFAULT_THEME;

/**
 * Starting player chosen on the settings page.
 */
export const SELECTED_PLAYER =
  sessionStorage.getItem(STORAGE_KEYS.player) ?? DEFAULT_PLAYER;

/**
 * Number of cards chosen on the settings page.
 */
export const SELECTED_BOARD_SIZE =
  Number(sessionStorage.getItem(STORAGE_KEYS.boardSize)) || DEFAULT_BOARD_SIZE;

/**
 * Preview images of all themes on the settings page.
 */
export const THEME_PREVIEWS: Record<string, ThemePreview> = {
  "code-vibes": {
    src: "./assets/img/theme-preview-code-vibes.png",
    alt: "Preview of the Code vibes theme with code and Git icons",
  },
  "da-projects": {
    src: "./assets/img/theme-preview-da-projects.png",
    alt: "Preview of the DA Projects theme with code and wave icons",
  },
};

/**
 * Image paths of all themes on the game page.
 */
const THEME_ASSETS: Record<string, ThemeAssets> = {
  "code-vibes": {
    cardPath: "./assets/img/cards/code-vibes",
    markerBlue: "./assets/img/player-marker-blue.png",
    markerOrange: "./assets/img/player-marker-orange.png",
    currentMarker: "",
  },
  "da-projects": {
    cardPath: "./assets/img/cards/da-projects",
    markerBlue: "./assets/img/pawn-blue.png",
    markerOrange: "./assets/img/pawn-orange.png",
    currentMarker: "./assets/img/pawn-white.png",
  },
};

/**
 * Image paths of the selected theme, falling back to the default theme.
 */
export const ASSETS = THEME_ASSETS[SELECTED_THEME] ?? THEME_ASSETS[DEFAULT_THEME];

/**
 * Grid modifier class of the game board per board size.
 */
export const COLUMN_CLASSES: Record<number, string> = {
  16: "game-board--4-columns",
  24: "game-board--6-columns",
  36: "game-board--6-columns",
};

/**
 * Readable names of the players, used as alt text of the current player marker.
 */
export const PLAYER_LABELS: Record<string, string> = {
  blue: "Blue",
  orange: "Orange",
};

/**
 * Texts and icons of every possible game result.
 */
export const GAME_RESULTS: Record<string, GameResult> = {
  blue: {
    winner: "Blue Player",
    iconCodeVibes: "./assets/img/result-icon-blue.png",
    iconDaProjects: "./assets/img/result-icon-blue-da-projects.png",
    codeVibesButtonText: "Back to start",
    daProjectsButtonText: "Home",
  },
  orange: {
    winner: "Orange Player",
    iconCodeVibes: "./assets/img/result-icon-orange.png",
    iconDaProjects: "./assets/img/result-icon-orange-da-projects.png",
    codeVibesButtonText: "Back to start",
    daProjectsButtonText: "Home",
  },
  draw: {
    winner: "Draw",
    iconCodeVibes: "./assets/img/result-icon-draw.png",
    iconDaProjects: "./assets/img/result-icon-draw-da-projects.png",
    codeVibesButtonText: "Back to start",
    daProjectsButtonText: "Home",
  },
};

/**
 * Utility class that hides an element.
 */
export const HIDDEN_CLASS = "d-none";