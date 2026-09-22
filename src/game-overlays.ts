import * as config from "./config";

/**
 * Time in milliseconds the game over screen stays before the result screen follows.
 */
const GAME_OVER_DURATION = 2000;

/**
 * Modifier class that slides the game over screen into view.
 */
const GAME_OVER_VISIBLE_CLASS = "game-over--visible";

/**
 * Modifier class that slides the result screen into view.
 */
const GAME_RESULT_VISIBLE_CLASS = "game-result--visible";

/**
 * Modifier class that slides the exit dialog into view.
 */
const DIALOG_OPEN_CLASS = "exit-dialog--open";

/**
 * Time in milliseconds of the dialog slide animation, matching the SCSS transition.
 */
const DIALOG_SLIDE_DURATION = 400;

/**
 * Shows the game over variant of the selected theme.
 *
 * Code vibes uses the game over image, DA Projects uses the game over text.
 */
export function setupGameOverScreen(): void {
  const gameOverScreen = document.getElementById("game-over-screen");
  const gameOverMessage = document.getElementById("game-over-message");
  if (config.SELECTED_THEME === "code-vibes") {
    gameOverScreen?.classList.remove(config.HIDDEN_CLASS);
    gameOverMessage?.classList.add(config.HIDDEN_CLASS);
  } else if (config.SELECTED_THEME === "da-projects") {
    gameOverMessage?.classList.remove(config.HIDDEN_CLASS);
    gameOverScreen?.classList.add(config.HIDDEN_CLASS);
  }
}

/**
 * Removes the initial hiding class once the layout is painted.
 * Keeps the overlays out of sight until their transition can apply.
 */
export function revealOverlays(): void {
  requestAnimationFrame(() => {
    document.querySelector(".game-over")?.classList.remove(config.HIDDEN_CLASS);
    document.querySelector(".game-result")?.classList.remove(config.HIDDEN_CLASS);
  });
}

/**
 * Opens the exit dialog and lets it slide in from the top.
 */
export function openExitDialog(): void {
  const exitDialog = document.querySelector<HTMLDialogElement>(".exit-dialog");
  if (!exitDialog) return;

  exitDialog.showModal();
  requestAnimationFrame(() => {
    exitDialog.classList.add(DIALOG_OPEN_CLASS);
  });
}

/**
 * Closes the exit dialog when the click hits the backdrop, not the content.
 * @param event - The click event on the dialog.
 */
export function handleDialogBackdropClick(event: MouseEvent): void {
  if (event.target !== document.querySelector(".exit-dialog")) return;

  slideOutExitDialog();
}

/**
 * Lets the exit dialog slide back up before closing it.
 */
export function slideOutExitDialog(): void {
  const exitDialog = document.querySelector<HTMLDialogElement>(".exit-dialog");
  if (!exitDialog) return;

  exitDialog.classList.remove(DIALOG_OPEN_CLASS);
  setTimeout(() => exitDialog.close(), DIALOG_SLIDE_DURATION);
}

/**
 * Shows the game over screen once every pair on the board is found.
 * Copies the current score into the screen and shows the result screen afterwards.
 */
export function showGameOverScreen(): void {
  const blueScore = readScore("blue-player-points");
  const orangeScore = readScore("orange-player-points");
  const totalPairs = config.SELECTED_BOARD_SIZE / 2;

  if (blueScore + orangeScore === totalPairs) {
    (document.querySelector(".game-over__scoreboard") as HTMLElement).appendChild(
      (document.querySelector(".game-score") as HTMLElement).cloneNode(true)
    );
    (document.querySelector(".game-over") as HTMLElement).classList.add(GAME_OVER_VISIBLE_CLASS);
    setTimeout(showGameResultScreen, GAME_OVER_DURATION);
  }
}

/**
 * Swaps the game over screen for the result screen.
 */
function showGameResultScreen(): void {
  const blueScore = readScore("blue-player-points");
  const orangeScore = readScore("orange-player-points");

  applyGameResult(getResultKey(blueScore, orangeScore));
  document.querySelector(".game-result")?.classList.add(GAME_RESULT_VISIBLE_CLASS);
}

/**
 * Reads the current points of a player from the score display.
 * @param pointsId - The id of the points display.
 * @returns The points of the player.
 */
function readScore(pointsId: string): number {
  return Number((document.getElementById(pointsId) as HTMLElement).dataset.value);
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
 * Fills the result screen for the selected theme and marks it with the result.
 * @param resultKey - The result key: blue, orange or draw.
 */
function applyGameResult(resultKey: string): void {
  const result = config.GAME_RESULTS[resultKey];
  if (!result) return;
  const hasWinner = resultKey !== "draw";

  if (config.SELECTED_THEME === "code-vibes") {
    applyCodeVibesResult(result, hasWinner);
  } else if (config.SELECTED_THEME === "da-projects") {
    applyDaProjectsResult(result, hasWinner);
  }

  document.querySelector(".game-result")?.classList.add(`game-result--${resultKey}`);
}

/**
 * Fills the result screen of the Code vibes theme.
 *
 * A draw shows the draw image instead of the draw text.
 * @param result - The texts and icons of the result.
 * @param hasWinner - True when one player has won.
 */
function applyCodeVibesResult(result: config.GameResult, hasWinner: boolean): void {
  if (hasWinner) {
    setupGameResultScreen(result.iconCodeVibes, result.codeVibesButtonText, hasWinner, result.winner);
    return;
  }
  setupGameResultScreen(result.iconCodeVibes, result.daProjectsButtonText, hasWinner, result.winner, "", config.HIDDEN_CLASS);
}

/**
 * Fills the result screen of the DA Projects theme.
 *
 * A draw shows the draw text instead of the draw image.
 * @param result - The texts and icons of the result.
 * @param hasWinner - True when one player has won.
 */
function applyDaProjectsResult(result: config.GameResult, hasWinner: boolean): void {
  if (hasWinner) {
    setupGameResultScreen(result.iconDaProjects, result.daProjectsButtonText, hasWinner, result.winner);
    return;
  }
  setupGameResultScreen(result.iconDaProjects, result.daProjectsButtonText, hasWinner, result.winner, config.HIDDEN_CLASS, "");
}

/**
 * Inserts the winner or draw markup into the result screen.
 * @param icon - The path of the result icon.
 * @param buttonText - The label of the button back to the start page.
 * @param hasWinner - True renders the winner markup, false the draw markup.
 * @param winner - The name of the winner.
 * @param displayImage - The class that hides or shows the draw image.
 * @param displayText - The class that hides or shows the draw text.
 */
function setupGameResultScreen(
  icon: string,
  buttonText: string,
  hasWinner: boolean,
  winner?: string,
  displayImage?: string,
  displayText?: string
): void {
  const gameResult = document.querySelector(".game-result");

  if (hasWinner) {
    gameResult?.insertAdjacentHTML("beforeend", gameResultTemplate(icon, buttonText, winner));
  } else {
    gameResult?.insertAdjacentHTML("beforeend", gameResultDrawTemplate(icon, buttonText, displayImage, displayText));
  }
}

/**
 * Returns the HTML string of the result screen when one player has won.
 * @param icon - The path of the result icon.
 * @param buttonText - The label of the button back to the start page.
 * @param winner - The name of the winner.
 * @returns The HTML string of the winner result.
 */
function gameResultTemplate(icon: string, buttonText: string, winner?: string): string {
  return `
            <p class="game-result__intro">
                The winner is
            </p>
            <p class="game-result__winner">
                ${winner}
            </p>
            ${resultIconTemplate(icon)}
            ${resultButtonTemplate(buttonText)}
  `;
}

/**
 * Returns the HTML string of the result screen when the game ends in a draw.
 * @param icon - The path of the result icon.
 * @param buttonText - The label of the button back to the start page.
 * @param displayImage - The class that hides or shows the draw image.
 * @param displayText - The class that hides or shows the draw text.
 * @returns The HTML string of the draw result.
 */
function gameResultDrawTemplate(
  icon: string,
  buttonText: string,
  displayImage?: string,
  displayText?: string
): string {
  return `
            <p class="game-result__intro">
                It's a
            </p>
            ${drawTemplate(displayImage, displayText)}
            ${resultIconTemplate(icon)}
            ${resultButtonTemplate(buttonText)}
  `;
}

/**
 * Returns the HTML string of the draw image and the draw text.
 * @param displayImage - The class that hides or shows the draw image.
 * @param displayText - The class that hides or shows the draw text.
 * @returns The HTML string of both draw variants.
 */
function drawTemplate(displayImage?: string, displayText?: string): string {
  return `
            <img
                src="./assets/img/draw-text.png"
                class="game-result__winner-img ${displayImage}"
                alt="Draw"
            >
            <p class="game-result__winner ${displayText}">
                Draw
            </p>
  `;
}

/**
 * Returns the HTML string of the result icon.
 * @param icon - The path of the result icon.
 * @returns The HTML string of the icon.
 */
function resultIconTemplate(icon: string): string {
  return `
            <img
                src="${icon}"
                class="game-result__icon"
                alt=""
            >
  `;
}

/**
 * Returns the HTML string of the button back to the start page.
 * @param buttonText - The label of the button.
 * @returns The HTML string of the button.
 */
function resultButtonTemplate(buttonText: string): string {
  return `
            <a href="./index.html" class="game-result__button">
                ${buttonText}
            </a>
  `;
}