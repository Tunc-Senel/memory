import '../src/styles/scss/style.scss';

type ThemePreview = {
  src: string;
  alt: string;
};

const GAME_THEMES_LIST = document.getElementById("game-themes") as HTMLElement;
const CHOOSE_PLAYER_LIST = document.getElementById("choose-player") as HTMLElement;
const BOARD_SIZE_LIST = document.getElementById("board-size") as HTMLElement;
const THEME_IMG = document.getElementById("theme-img") as HTMLImageElement;
const PROGRESS_LIST = document.querySelector(".settings-progress") as HTMLElement;
const GAME_BOARD = document.querySelector(".game-board") as HTMLElement | null;
const CURRENT_PLAYER_MARKER = document.querySelector(
  ".game-header__current-player-marker"
) as HTMLImageElement | null;

const SELECTED_THEME = "code-vibes";
const SELECTED_PLAYER = "blue";
const SELECTED_BOARD_SIZE = 16;

const CARD_PATH = `./public/assets/img/cards/${SELECTED_THEME}`;

const COLUMN_CLASSES: Record<number, string> = {
  16: "game-board--4-columns",
  24: "game-board--6-columns",
  36: "game-board--6-columns",
};

const PLAYER_LABELS: Record<string, string> = {
  blue: "Blau",
  orange: "Orange",
};

const THEME_PREVIEWS: Record<string, ThemePreview> = {
  "code-vibes": {
    src: "./public/assets/img/theme-preview-code-vibes.png",
    alt: "Vorschau des Themes Code vibes mit Code- und Git-Symbol",
  },
  "da-projects": {
    src: "./public/assets/img/theme-preview-da-projects.png",
    alt: "Vorschau des Themes DA Projects mit Code- und Wellen-Symbol",
  },
};

const PENDING_LABELS: Record<string, string> = {};

const HIDDEN_CLASS = "d-none";
const ACTIVE_CLASS = "settings-option__list-item--active";
const HIGHLIGHT_CLASS = "settings-option__list-item--highlighted";
const BOUNCE_CLASS = "settings-progress--bounce";
const UNLOCKED_CLASS = "settings-progress--unlocked";

let isProgressUnlocked = false;

function init(): void {
  if (GAME_BOARD) {
    setupGameBoard();
    return;
  }

  initSelectOptionListeners(GAME_THEMES_LIST, true);
  initSelectOptionListeners(CHOOSE_PLAYER_LIST, false);
  initSelectOptionListeners(BOARD_SIZE_LIST, false);
  PROGRESS_LIST.addEventListener("click", unlockProgressBar);
}

/**
 * Attaches click listeners to every option of a group.
 * Optionally adds a hover preview of the radio icons.
 * @param optionList - The list element holding the options.
 * @param withHoverPreview - True adds the hover preview behaviour.
 */
function initSelectOptionListeners(
  optionList: HTMLElement,
  withHoverPreview: boolean
): void {
  const listItems = optionList.querySelectorAll<HTMLLIElement>(
    ".settings-option__list-item"
  );

  listItems.forEach((listItem) => {
    listItem.addEventListener("click", () =>
      selectOption(optionList, listItems, listItem)
    );

    if (withHoverPreview) {
      addHoverPreviewListeners(listItems, listItem);
    }
  });
}

/**
 * Adds the hover preview listeners to a single option.
 * @param listItems - All options of the group.
 * @param listItem - The option receiving the listeners.
 */
function addHoverPreviewListeners(
  listItems: NodeListOf<HTMLLIElement>,
  listItem: HTMLLIElement
): void {
  listItem.addEventListener("mouseenter", () =>
    previewOption(listItems, listItem)
  );
  listItem.addEventListener("mouseleave", () => restoreSelectedOption(listItems));
}

/**
 * Previews the hovered option without changing the actual selection.
 * @param listItems - All options of the group.
 * @param hoveredItem - The option the user hovers.
 */
function previewOption(
  listItems: NodeListOf<HTMLLIElement>,
  hoveredItem: HTMLLIElement
): void {
  listItems.forEach((listItem) => {
    setOptionState(listItem, listItem === hoveredItem);
  });
  updateThemeImg(hoveredItem);
}

/**
 * Restores the radio icons based on the currently selected option.
 * @param listItems - All options of the group.
 */
function restoreSelectedOption(listItems: NodeListOf<HTMLLIElement>): void {
  listItems.forEach((listItem) => {
    const isActive = listItem.classList.contains(ACTIVE_CLASS);
    setOptionState(listItem, isActive);
    if (isActive) updateThemeImg(listItem);
  });
}

/**
 * Selects the clicked option and resets all other options in the group.
 * @param optionList - The list element holding the options.
 * @param listItems - All options of the group.
 * @param selectedItem - The option the user clicked.
 */
function selectOption(
  optionList: HTMLElement,
  listItems: NodeListOf<HTMLLIElement>,
  selectedItem: HTMLLIElement
): void {
  listItems.forEach((listItem) => {
    const isSelected = listItem === selectedItem;
    listItem.classList.toggle(ACTIVE_CLASS, isSelected);
    setOptionState(listItem, isSelected);
  });
  rememberProgressLabel(optionList, selectedItem);
}

/**
 * Stores the label of the selected option.
 * Writes it through directly once the progress bar is unlocked.
 * @param optionList - The list element holding the options.
 * @param selectedItem - The option the user clicked.
 */
function rememberProgressLabel(
  optionList: HTMLElement,
  selectedItem: HTMLLIElement
): void {
  const stepId = optionList.dataset.step;
  const label = selectedItem.dataset.label;
  if (!stepId || !label) return;

  PENDING_LABELS[stepId] = label;
  if (isProgressUnlocked) writeProgressLabel(stepId, label);
}

/**
 * Unlocks the progress bar on the first click.
 * Ignores clicks on the start button and every later click.
 * @param event - The click event on the progress bar.
 */
function unlockProgressBar(event: MouseEvent): void {
  if (isProgressUnlocked) return;

  const target = event.target as HTMLElement;
  if (target.closest(".settings-progress__start-button")) return;

  isProgressUnlocked = true;
  PROGRESS_LIST.classList.add(UNLOCKED_CLASS);
  writePendingLabels();
  swapProgressDividers();
}

/**
 * Writes all pending labels into their progress steps.
 */
function writePendingLabels(): void {
  Object.entries(PENDING_LABELS).forEach(([stepId, label]) => {
    writeProgressLabel(stepId, label);
  });
  restartBounce();
}

/**
 * Writes a single label into its progress step.
 * @param stepId - The id of the progress step.
 * @param label - The text to display.
 */
function writeProgressLabel(stepId: string, label: string): void {
  const step = document.getElementById(stepId);
  if (step) step.textContent = label;
}

/**
 * Restarts the bounce animation of the progress bar.
 */
function restartBounce(): void {
  PROGRESS_LIST.classList.remove(BOUNCE_CLASS);
  requestAnimationFrame(() => {
    requestAnimationFrame(() => PROGRESS_LIST.classList.add(BOUNCE_CLASS));
  });
}

/**
 * Shows the bent dividers instead of the default ones.
 */
function swapProgressDividers(): void {
  const defaults = PROGRESS_LIST.querySelectorAll<HTMLImageElement>(
    ".settings-progress__divider-default"
  );
  const applied = PROGRESS_LIST.querySelectorAll<HTMLImageElement>(
    ".settings-progress__divider-applied"
  );

  defaults.forEach((img) => img.classList.add(HIDDEN_CLASS));
  applied.forEach((img) => img.classList.remove(HIDDEN_CLASS));
}

/**
 * Updates the preview image according to the theme of an option.
 * @param listItem - The option holding the theme key.
 */
function updateThemeImg(listItem: HTMLElement): void {
  const themeKey = listItem.dataset.value;
  if (!themeKey) return;

  const preview = THEME_PREVIEWS[themeKey];
  if (!preview) return;

  THEME_IMG.src = preview.src;
  THEME_IMG.alt = preview.alt;
}

/**
 * Applies the visual state of a single option.
 * Swaps the radio icons and toggles the highlight styling.
 * @param listItem - The option whose appearance is updated.
 * @param isHighlighted - True shows the option as chosen.
 */
function setOptionState(listItem: HTMLLIElement, isHighlighted: boolean): void {
  const checkedIcon = listItem.querySelector<HTMLImageElement>(
    ".settings-option__radio--checked"
  );
  const uncheckedIcon = listItem.querySelector<HTMLImageElement>(
    ".settings-option__radio--unchecked"
  );

  checkedIcon?.classList.toggle(HIDDEN_CLASS, !isHighlighted);
  uncheckedIcon?.classList.toggle(HIDDEN_CLASS, isHighlighted);
  listItem.classList.toggle(HIGHLIGHT_CLASS, isHighlighted);
}

/**
 * Builds the game board for the selected settings.
 */
function setupGameBoard(): void {
  if (!GAME_BOARD) return;

  GAME_BOARD.classList.add(COLUMN_CLASSES[SELECTED_BOARD_SIZE]);
  GAME_BOARD.innerHTML = renderCards(SELECTED_BOARD_SIZE);
  updateCurrentPlayerMarker(SELECTED_PLAYER);
}

/**
 * Returns the markup of all cards on the board.
 * @param boardSize - The total number of cards.
 * @returns The markup of every card as one string.
 */
function renderCards(boardSize: number): string {
  let markup = "";

  for (let i = 1; i <= boardSize; i++) {
    markup += gameCardTemplate(i);
  }
  return markup;
}

/**
 * Returns the markup of a single card.
 * @param cardNumber - The motif number of the card.
 * @returns The card markup as a string.
 */
function gameCardTemplate(cardNumber: number): string {
  const motifId = String(cardNumber).padStart(2, "0");

  return `
    <button class="game-card" data-card="${cardNumber}">
      <span class="game-card__inner">
        <img class="game-card__front" src="${CARD_PATH}/card-${motifId}.png" alt="">
        <img class="game-card__back" src="${CARD_PATH}/card-back.png" alt="">
      </span>
    </button>
  `;
}

/**
 * Shows the marker of the player who starts the game.
 * @param player - The colour key of the player.
 */
function updateCurrentPlayerMarker(player: string): void {
  if (!CURRENT_PLAYER_MARKER) return;

  CURRENT_PLAYER_MARKER.src = `./public/assets/img/player-marker-${player}.png`;
  CURRENT_PLAYER_MARKER.alt = PLAYER_LABELS[player] ?? "";
}

window.onload = init;