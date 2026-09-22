import "../src/styles/scss/style.scss";
import * as game from "./game";
import * as overlays from "./game-overlays";
import * as settings from "./settings";

/**
 * Starts the page logic once the page is loaded.
 *
 * Only the game page and the settings page have interactive elements, so the start page is skipped.
 */
function init(): void {
  if (document.querySelector(".game-board")) {
    initGamePage();
  } else if (document.querySelector(".settings-page")) {
    initSettingsPage();
  }
}

/**
 * Prepares the game page by applying the theme, building the board, and wiring its listeners.
 */
function initGamePage(): void {
  game.applyThemeClass();
  game.setupGameBoard();
  overlays.revealOverlays();
  game.initGameListeners();
}

/**
 * Prepares the settings page by wiring its listeners and showing the preselected options.
 */
function initSettingsPage(): void {
  settings.initSettingsListeners();
  settings.initProgressLabels();
}

window.onload = init;