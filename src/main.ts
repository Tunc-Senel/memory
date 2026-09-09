import '../src/styles/scss/style.scss';

type ThemePreview = {
  src: string;
  alt: string;
};

type GameResult = {
  intro: string;
  winner: string;
  winnerImg: string | null;
  icon: string;
};

const GAME_RESULTS: Record<string, GameResult> = {
  blue: {
    intro: "The winner is",
    winner: "Blue Player",
    winnerImg: null,
    icon: "./public/assets/img/result-icon-blue.png",
  },
  orange: {
    intro: "The winner is",
    winner: "Orange Player",
    winnerImg: null,
    icon: "./public/assets/img/result-icon-orange.png",
  },
  draw: {
    intro: "It's a",
    winner: "Draw",
    winnerImg: "./public/assets/img/draw-text.png",
    icon: "./public/assets/img/result-icon-draw.png",
  },
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
const START_BUTTON = document.querySelector(
  ".settings-progress__start-button"
) as HTMLAnchorElement | null;

const STORAGE_KEYS = {
  theme: "selectedTheme",
  player: "selectedPlayer",
  boardSize: "selectedBoardSize",
};

const DEFAULT_THEME = "code-vibes";
const DEFAULT_PLAYER = "blue";
const DEFAULT_BOARD_SIZE = 16;

const SELECTED_THEME =
  sessionStorage.getItem(STORAGE_KEYS.theme) ?? DEFAULT_THEME;
const SELECTED_PLAYER =
  sessionStorage.getItem(STORAGE_KEYS.player) ?? DEFAULT_PLAYER;
const SELECTED_BOARD_SIZE =
  Number(sessionStorage.getItem(STORAGE_KEYS.boardSize)) || DEFAULT_BOARD_SIZE;

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

const FLIPPED_CARDS: HTMLButtonElement[] = [];
const MAX_FLIPPED_CARDS = 2;
const FLIP_BACK_DELAY = 800;
const FLIPPED_CLASS = "is-flipped";
const MATCHED_CLASS = "is-matched";

let isBoardLocked = false;

let isProgressUnlocked = false;

let currentPlayer = SELECTED_PLAYER;
const CHANGE_CURRENT_PLAYER_DELAY = 300;

const PLAYER_BLUE_POINTS = document.getElementById("blue-player-points") as HTMLSpanElement;
const PLAYER_ORANGE_POINTS = document.getElementById("orange-player-points") as HTMLSpanElement;

const GAME_OVER = document.querySelector(".game-over") as HTMLElement;
const GAME_RESULT = document.querySelector(".game-result") as HTMLElement;
const GAME_SCORE = document.querySelector(".game-score") as HTMLElement;
const GAME_OVER_SCOREBOARD = document.querySelector(".game-over__scoreboard") as HTMLElement;
const GAME_OVER_DURATION = 1000;

const RESULT_INTRO = document.querySelector(
  ".game-result__intro"
) as HTMLParagraphElement | null;
const RESULT_WINNER = document.querySelector(
  ".game-result__winner"
) as HTMLParagraphElement | null;
const RESULT_WINNER_IMG = document.querySelector(
  ".game-result__winner-img"
) as HTMLImageElement | null;
const RESULT_ICON = document.querySelector(
  ".game-result__icon"
) as HTMLImageElement | null;

const GAME_RESULT_DELAY = 2500;


function init(): void {
  if (GAME_BOARD) {
    setupGameBoard();
    initBoardListener();
    revealOverlays();
    return;
  }

  initSelectOptionListeners(GAME_THEMES_LIST, true);
  initSelectOptionListeners(CHOOSE_PLAYER_LIST, false);
  initSelectOptionListeners(BOARD_SIZE_LIST, false);
  PROGRESS_LIST.addEventListener("click", unlockProgressBar);
  START_BUTTON?.addEventListener("click", saveSelectedSettings);
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
  const SETTINGS_PRGORESS_LIST = document.querySelectorAll<HTMLLIElement>(".settings-progress__step");
  SETTINGS_PRGORESS_LIST.forEach(setting => {
    setting.classList.add("settings-progress__step--option")
  })
}

/**
 * Writes all pending labels into their progress steps.
 */
function writePendingLabels(): void {
  if (PENDING_LABELS["step theme"] === "Code vibes theme") {
    PENDING_LABELS["step theme"] = "Code vibes theme"
  }
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
 * Saves the selected settings before leaving the page.
 */
function saveSelectedSettings(): void {
  sessionStorage.setItem(STORAGE_KEYS.theme, readSelectedValue(GAME_THEMES_LIST));
  sessionStorage.setItem(STORAGE_KEYS.player, readSelectedValue(CHOOSE_PLAYER_LIST));
  sessionStorage.setItem(STORAGE_KEYS.boardSize, readSelectedValue(BOARD_SIZE_LIST));
}

/**
 * Reads the data value of the active option of a group.
 * @param optionList - The list element holding the options.
 * @returns The value of the active option, or an empty string.
 */
function readSelectedValue(optionList: HTMLElement): string {
  const activeItem = optionList.querySelector<HTMLLIElement>(`.${ACTIVE_CLASS}`);
  return activeItem?.dataset.value ?? "";
}

/**
 * Builds the game board for the selected settings.
 */
function setupGameBoard(): void {
  if (!GAME_BOARD) return;

  const cardNumbers = createCardNumbers(SELECTED_BOARD_SIZE);
  GAME_BOARD.classList.add(COLUMN_CLASSES[SELECTED_BOARD_SIZE]);
  GAME_BOARD.innerHTML = renderCards(cardNumbers);
  updateCurrentPlayerMarker(SELECTED_PLAYER);
}

function createCardNumbers(boardSize: number) : number[] {
  const numbersArray: number[] = []

  for (let i = 1; i <= boardSize; i++) {
      if (i % (boardSize / 2) === 0) {
       numbersArray.push(boardSize / 2);
      } else {
       numbersArray.push(i % (boardSize / 2));
     }
  }

  const shuffledArray = [...numbersArray];
  
  for (let i = shuffledArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]];
  }

  return numbersArray
}

/**
 * Returns the markup of all cards on the board.
 * @param boardSize - The total number of cards.
 * @returns The markup of every card as one string.
 */
function renderCards(cardNumbers: number[]): string {
  let markup = "";
  
  for (const cardNumber of cardNumbers) {
    markup += gameCardTemplate(cardNumber);
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

/**
 * Attaches the delegated click listener to the game board.
 */
function initBoardListener(): void {
  GAME_BOARD?.addEventListener("click", handleBoardClick);
}

/**
 * Flips the clicked card and starts the comparison on the second card.
 * @param event - The click event on the board.
 */
function handleBoardClick(event: MouseEvent): void {
  const target = event.target as HTMLElement;
  const card = target.closest<HTMLButtonElement>(".game-card");
  if (!card || !isCardSelectable(card)) return;

  card.classList.add(FLIPPED_CLASS);
  FLIPPED_CARDS.push(card);

  if (FLIPPED_CARDS.length === MAX_FLIPPED_CARDS) checkFlippedCards();
}

/**
 * Checks whether the clicked card may be flipped right now.
 * @param card - The clicked card.
 * @returns True when the card is still face down and the board is free.
 */
function isCardSelectable(card: HTMLButtonElement): boolean {
  if (isBoardLocked) return false;
  return !card.classList.contains(FLIPPED_CLASS);
}

/**
 * Compares the two flipped cards and resolves the turn.
 */
function checkFlippedCards(): void {
  const [firstCard, secondCard] = FLIPPED_CARDS;

  if (firstCard.dataset.card === secondCard.dataset.card) {
    keepMatchedCards(firstCard, secondCard);
    addPointsToScore();
    setTimeout(() => {
      showGameOverScreen();
    }, 300);
    return;
  }
  hideUnmatchedCards(firstCard, secondCard);
  setTimeout(() => {
     changePlayer();
  }, FLIP_BACK_DELAY + CHANGE_CURRENT_PLAYER_DELAY);
}

/**
 * Marks a found pair so both cards stay face up.
 * @param firstCard - The first flipped card.
 * @param secondCard - The second flipped card.
 */
function keepMatchedCards(
  firstCard: HTMLButtonElement,
  secondCard: HTMLButtonElement
): void {
  firstCard.classList.add(MATCHED_CLASS);
  secondCard.classList.add(MATCHED_CLASS);
  FLIPPED_CARDS.length = 0;
}

/**
 * Flips two cards back after a short delay and unlocks the board.
 * @param firstCard - The first flipped card.
 * @param secondCard - The second flipped card.
 */
function hideUnmatchedCards(
  firstCard: HTMLButtonElement,
  secondCard: HTMLButtonElement
): void {
  isBoardLocked = true;

  setTimeout(() => {
    firstCard.classList.remove(FLIPPED_CLASS);
    secondCard.classList.remove(FLIPPED_CLASS);
    FLIPPED_CARDS.length = 0;
    isBoardLocked = false;
  }, FLIP_BACK_DELAY);
}

/**
 * Hands the turn over to the other player.
 */
function changePlayer(): void {
  if (currentPlayer === "blue") {
    currentPlayer = "orange";
  } else {
    currentPlayer = "blue";
  }
  updateCurrentPlayerMarker(currentPlayer);
}

function addPointsToScore(): void {
  if(currentPlayer === "blue") {
    let bluePointsBeforeMatch = PLAYER_BLUE_POINTS.dataset.value;
    if (!bluePointsBeforeMatch) return;
    let currentPointsBlue = Number(bluePointsBeforeMatch) + 1;
    PLAYER_BLUE_POINTS.dataset.value = currentPointsBlue.toString();
    PLAYER_BLUE_POINTS.textContent = currentPointsBlue.toString();
  } else {
    let orangePointsBeforeMatch = PLAYER_ORANGE_POINTS.dataset.value;
    if (!orangePointsBeforeMatch) return;
    let currentPointsOrange = Number(orangePointsBeforeMatch) + 1;
    PLAYER_ORANGE_POINTS.dataset.value = currentPointsOrange.toString();
    PLAYER_ORANGE_POINTS.textContent = currentPointsOrange.toString();
  }
}

/**
 * Removes the initial hiding class once the layout is painted.
 * Keeps the overlays out of sight until their transition can apply.
 */
function revealOverlays(): void {
  requestAnimationFrame(() => {
    GAME_OVER?.classList.remove(HIDDEN_CLASS);
    GAME_RESULT?.classList.remove(HIDDEN_CLASS);
  });
}

function showGameOverScreen(): void {
  const PLAYER_BLUE_SCORE = Number(PLAYER_BLUE_POINTS.dataset.value);
  const PLAYER_ORANGE_SCORE = Number(PLAYER_ORANGE_POINTS.dataset.value);
  
  if (SELECTED_BOARD_SIZE / 2 === PLAYER_BLUE_SCORE + PLAYER_ORANGE_SCORE) {
    GAME_OVER_SCOREBOARD.appendChild(GAME_SCORE.cloneNode(true));
    GAME_OVER.classList.add("game-over--visible");
    setTimeout(showGameResultScreen, GAME_OVER_DURATION);
  }
}

/**
 * Returns the key of the game result.
 * @param blueScore - The final score of the blue player.
 * @param orangeScore - The final score of the orange player.
 * @returns The result key: blue, orange or draw.
 */
function getResultKey(blueScore: number, orangeScore: number): string {
  if (blueScore > orangeScore) return "blue";
  if (orangeScore > blueScore) return "orange";
  return "draw";
}

/**
 * Writes the texts and the icon of a game result.
 * @param resultKey - The result key: blue, orange or draw.
 */
function applyGameResult(resultKey: string): void {
  const result = GAME_RESULTS[resultKey];
  if (!result || !RESULT_INTRO || !RESULT_ICON) return;

  RESULT_INTRO.textContent = result.intro;
  RESULT_ICON.src = result.icon;
  applyWinnerLabel(result);
  GAME_RESULT?.classList.add(`game-result--${resultKey}`);
}

/**
 * Shows the winner either as text or as an image.
 * @param result - The result entry holding both variants.
 */
function applyWinnerLabel(result: GameResult): void {
  if (!RESULT_WINNER || !RESULT_WINNER_IMG) return;

  const hasImage = Boolean(result.winnerImg);
  RESULT_WINNER.classList.toggle(HIDDEN_CLASS, hasImage);
  RESULT_WINNER_IMG.classList.toggle(HIDDEN_CLASS, !hasImage);

  if (result.winnerImg) RESULT_WINNER_IMG.src = result.winnerImg;
  RESULT_WINNER.textContent = result.winner;
}

/**
 * Swaps the game over screen for the result screen.
 */
function showGameResultScreen(): void {
  const blueScore = Number(PLAYER_BLUE_POINTS.dataset.value);
  const orangeScore = Number(PLAYER_ORANGE_POINTS.dataset.value);

  applyGameResult(getResultKey(blueScore, orangeScore));
  GAME_RESULT?.classList.add("game-result--visible");
}

window.onload = init;