import * as config from "./config";
import * as overlays from "./game-overlays";

/**
 * Stores the cards flipped in the current turn.
 */
export const FLIPPED_CARDS: HTMLButtonElement[] = [];

/**
 * Number of cards a player may flip per turn.
 */
export const MAX_FLIPPED_CARDS = 2;

/**
 * Time in milliseconds before two unmatched cards flip back.
 */
export const FLIP_BACK_DELAY = 800;

/**
 * Additional time in milliseconds before the turn passes to the other player.
 */
export const CHANGE_CURRENT_PLAYER_DELAY = 300;

/**
 * State class of a face-up card.
 */
export const FLIPPED_CLASS = "is-flipped";

/**
 * State class of a card that belongs to a found pair.
 */
export const MATCHED_CLASS = "is-matched";

/**
 * Blocks further clicks while two unmatched cards flip back.
 */
export let isBoardLocked = false;

/**
 * Stores the colour key of the player whose turn it is.
 */
export let currentPlayer = config.SELECTED_PLAYER;

/**
 * Applies the theme class of the selected theme to the page.
 */
export function applyThemeClass(): void {
  document.body.classList.add(`theme-${config.SELECTED_THEME}`);
}

/**
 * Builds the game board for the selected settings.
 */
export function setupGameBoard(): void {
  const gameBoard = document.querySelector(".game-board");
  if (!gameBoard) return;

  const cardNumbers = createCardNumbers(config.SELECTED_BOARD_SIZE);
  gameBoard.classList.add(config.COLUMN_CLASSES[config.SELECTED_BOARD_SIZE]);
  gameBoard.innerHTML = renderCards(cardNumbers);
  updateCurrentPlayerMarker(config.SELECTED_PLAYER);
  updateScoreMarkers();
  overlays.setupGameOverScreen();
}

/**
 * Returns the motif numbers of all cards in random order.
 * @param boardSize - The total number of cards.
 * @returns Every motif number twice, shuffled.
 */
export function createCardNumbers(boardSize: number): number[] {
  return shuffleCardNumbers(createCardPairs(boardSize));
}

/**
 * Returns every motif number twice in ascending order.
 * @param boardSize - The total number of cards.
 * @returns The motif numbers of all card pairs.
 */
export function createCardPairs(boardSize: number): number[] {
  const numbersArray: number[] = [];

  for (let i = 1; i <= boardSize; i++) {
    if (i % (boardSize / 2) === 0) {
      numbersArray.push(boardSize / 2);
    } else {
      numbersArray.push(i % (boardSize / 2));
    }
  }

  return numbersArray;
}

/**
 * Returns a shuffled copy of the motif numbers using the Fisher-Yates algorithm.
 * @param numbersArray - The motif numbers to shuffle.
 * @returns A new array with the motif numbers in random order.
 */
export function shuffleCardNumbers(numbersArray: number[]): number[] {
  const shuffledArray = [...numbersArray];

  for (let i = shuffledArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]];
  }

  return shuffledArray;
}

/**
 * Returns the markup of all cards on the board.
 * @param cardNumbers - The motif numbers of all cards in board order.
 * @returns The markup of every card as one string.
 */
export function renderCards(cardNumbers: number[]): string {
  let markup = "";

  for (const cardNumber of cardNumbers) {
    markup += gameCardTemplate(cardNumber);
  }

  return markup;
}

/**
 * Returns the HTML string of a single card.
 * @param cardNumber - The motif number of the card.
 * @returns The HTML string of the card.
 */
export function gameCardTemplate(cardNumber: number): string {
  const motifId = String(cardNumber).padStart(2, "0");

  return `
    <button type="button" class="game-card" aria-label="Memory card" data-card="${cardNumber}">
      <span class="game-card__inner">
        <img class="game-card__front" src="${config.ASSETS.cardPath}/card-${motifId}.png" alt="">
        <img class="game-card__back" src="${config.ASSETS.cardPath}/card-back.png" alt="">
      </span>
    </button>
  `;
}

/**
 * Shows the marker of the player whose turn it is.
 * @param player - The colour key of the player.
 */
export function updateCurrentPlayerMarker(player: string): void {
  const marker = document.querySelector<HTMLImageElement>(".game-header__current-player-marker");
  if (!marker) return;

  marker.src = config.ASSETS.currentMarker || getMarkerPath(player);
  marker.alt = config.PLAYER_LABELS[player] ?? "";
  marker.dataset.player = player;
}

/**
 * Returns the marker image path of a player.
 * @param player - The colour key of the player.
 * @returns The path to the marker image.
 */
export function getMarkerPath(player: string): string {
  return player === "blue" ? config.ASSETS.markerBlue : config.ASSETS.markerOrange;
}

/**
 * Sets the marker images of both players in the score display.
 */
export function updateScoreMarkers(): void {
  document.querySelectorAll<HTMLImageElement>(".game-score__marker").forEach((marker, index) => {
    marker.src = index === 0 ? config.ASSETS.markerBlue : config.ASSETS.markerOrange;
  });
}

/**
 * Registers all event listeners required for the game page.
 */
export function initGameListeners(): void {
  initBoardListener();
  initExitDialogListeners();
}

/**
 * Attaches the delegated click listener to the game board.
 */
export function initBoardListener(): void {
  document.querySelector<HTMLElement>(".game-board")?.addEventListener("click", handleBoardClick);
}

/**
 * Opens the exit dialog from the header and closes it via its back button or the backdrop.
 */
export function initExitDialogListeners(): void {
  document.querySelector<HTMLElement>(".game-header__exit")?.addEventListener("click", overlays.openExitDialog);
  document
    .querySelector<HTMLElement>(".exit-dialog__button--back")
    ?.addEventListener("click", overlays.slideOutExitDialog);
  document.querySelector<HTMLElement>(".exit-dialog")?.addEventListener("click", overlays.handleDialogBackdropClick);
}

/**
 * Flips the clicked card and starts the comparison on the second card.
 * @param event - The click event on the board.
 */
export function handleBoardClick(event: MouseEvent): void {
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
export function isCardSelectable(card: HTMLButtonElement): boolean {
  if (isBoardLocked) return false;
  return !card.classList.contains(FLIPPED_CLASS);
}

/**
 * Compares the two flipped cards and resolves the turn.
 *
 * A pair scores a point and keeps the turn, otherwise the cards flip back and the turn passes on.
 */
export function checkFlippedCards(): void {
  const [firstCard, secondCard] = FLIPPED_CARDS;

  if (firstCard.dataset.card === secondCard.dataset.card) {
    keepMatchedCards(firstCard, secondCard);
    addPointsToScore();
    setTimeout(() => {
      overlays.showGameOverScreen();
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
export function keepMatchedCards(
  firstCard: HTMLButtonElement,
  secondCard: HTMLButtonElement
): void {
  firstCard.classList.add(MATCHED_CLASS);
  secondCard.classList.add(MATCHED_CLASS);
  FLIPPED_CARDS.length = 0;
}

/**
 * Adds one point to the player whose turn it is.
 */
export function addPointsToScore(): void {
  const pointsId = currentPlayer === "blue" ? "blue-player-points" : "orange-player-points";

  incrementPoints(document.getElementById(pointsId) as HTMLSpanElement);
}

/**
 * Raises the points of a score display by one.
 * @param pointsElement - The points display of a player.
 */
export function incrementPoints(pointsElement: HTMLSpanElement): void {
  const pointsBeforeMatch = pointsElement.dataset.value;
  if (!pointsBeforeMatch) return;

  const currentPoints = Number(pointsBeforeMatch) + 1;
  pointsElement.dataset.value = currentPoints.toString();
  pointsElement.textContent = currentPoints.toString();
}

/**
 * Flips two cards back after a short delay and unlocks the board.
 * @param firstCard - The first flipped card.
 * @param secondCard - The second flipped card.
 */
export function hideUnmatchedCards(
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
export function changePlayer(): void {
  if (currentPlayer === "blue") {
    currentPlayer = "orange";
  } else {
    currentPlayer = "blue";
  }
  updateCurrentPlayerMarker(currentPlayer);
}