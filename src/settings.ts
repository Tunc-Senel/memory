import * as config from "./config";

/**
 * Number of option groups that need a selection before the game can start.
 */
const OPTION_GROUP_COUNT = 3;

/**
 * Tracks whether every group has a selection and the progress bar has played its animation.
 */
let isProgressComplete = false;

/**
 * Modifier class that plays the bounce animation of the progress bar.
 */
const BOUNCE_CLASS = "settings-progress--bounce";

/**
 * Modifier class of the disabled start button.
 */
const DISABLED_CLASS = "settings-progress__start-button--disabled";

/**
 * Modifier class of the visible start hint.
 */
const HINT_VISIBLE_CLASS = "settings-progress__start-hint--visible";

/**
 * Time in milliseconds the start hint stays visible.
 */
const HINT_VISIBLE_DURATION = 1500;

/**
 * Registers all event listeners required for the settings page.
 */
export function initSettingsListeners(): void {
  document.querySelector(".settings-page__options")?.addEventListener("change", handleOptionChange);
  initThemePreviewListeners();
  document
    .querySelector<HTMLAnchorElement>(".settings-progress__start-button")
    ?.addEventListener("click", handleStartClick);
}

/**
 * Shows the label of a newly selected option in the progress bar.
 * Updates the preview image when the theme changes.
 * @param event - The change event of a radio button.
 */
function handleOptionChange(event: Event): void {
  const radio = event.target as HTMLInputElement;

  showProgressLabel(radio);
  if (radio.name === "theme") updateThemeImg(radio.value);
}

/**
 * Previews a theme while its option is hovered and restores the selection afterwards.
 */
function initThemePreviewListeners(): void {
  const choices = document.querySelectorAll<HTMLLabelElement>(
    ".settings-option--preview .settings-option__choice"
  );

  choices.forEach((choice) => {
    const radio = choice.querySelector<HTMLInputElement>(".settings-option__radio");
    choice.addEventListener("mouseenter", () => updateThemeImg(radio?.value ?? ""));
    choice.addEventListener("mouseleave", restoreThemeImg);
  });
}

/**
 * Shows the preview image of the selected theme again.
 */
function restoreThemeImg(): void {
  updateThemeImg(readSelectedValue("theme"));
}

/**
 * Shows the labels of the options preselected in the markup in the progress bar.
 */
export function initProgressLabels(): void {
  document
    .querySelectorAll<HTMLInputElement>(".settings-option__radio:checked")
    .forEach((radio) => showProgressLabel(radio));
}

/**
 * Updates the preview image according to a theme.
 * @param themeKey - The value of the theme option.
 */
function updateThemeImg(themeKey: string): void {
  const themeImg = document.getElementById("theme-img") as HTMLImageElement;
  const preview = config.THEME_PREVIEWS[themeKey];
  if (!preview) return;

  themeImg.src = preview.src;
  themeImg.alt = preview.alt;
}

/**
 * Writes the label of a selected option into its progress step.
 * Completes the progress bar once every group has a selection.
 * @param radio - The selected radio button.
 */
function showProgressLabel(radio: HTMLInputElement): void {
  const stepId = radio.closest<HTMLElement>(".settings-option")?.dataset.step;
  const label = radio.dataset.label;
  if (!stepId || !label) return;

  writeProgressLabel(stepId, label);
  completeProgress();
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
 * Enables the start button and plays the progress animation once every group has a selection.
 * Runs only once, later changes only update the labels.
 */
function completeProgress(): void {
  if (isProgressComplete || countSelectedGroups() < OPTION_GROUP_COUNT) return;

  isProgressComplete = true;
  enableStartButton();
  swapProgressDividers();
  restartBounce();
}

/**
 * Counts the option groups that already have a selection.
 * @returns The number of checked radio buttons.
 */
function countSelectedGroups(): number {
  return document.querySelectorAll(".settings-option__radio:checked").length;
}

/**
 * Enables the start button for mouse, keyboard and screen reader users.
 */
function enableStartButton(): void {
  const startButton = document.querySelector(".settings-progress__start-button");

  startButton?.classList.remove(DISABLED_CLASS);
  startButton?.setAttribute("aria-disabled", "false");
  startButton?.removeAttribute("aria-describedby");
}

/**
 * Restarts the bounce animation of the progress bar.
 */
function restartBounce(): void {
  const progressList = document.querySelector(".settings-progress") as HTMLElement;

  progressList.classList.remove(BOUNCE_CLASS);
  requestAnimationFrame(() => {
    requestAnimationFrame(() => progressList.classList.add(BOUNCE_CLASS));
  });
}

/**
 * Shows the bent dividers instead of the default ones.
 */
function swapProgressDividers(): void {
  document
    .querySelectorAll(".settings-progress__divider-default")
    .forEach((img) => img.classList.add(config.HIDDEN_CLASS));
  document
    .querySelectorAll(".settings-progress__divider-applied")
    .forEach((img) => img.classList.remove(config.HIDDEN_CLASS));
}

/**
 * Blocks the navigation while options are missing, saves them otherwise.
 * @param event - The click event on the start button.
 */
function handleStartClick(event: MouseEvent): void {
  const startButton = document.querySelector(".settings-progress__start-button");

  if (startButton?.classList.contains(DISABLED_CLASS)) {
    event.preventDefault();
    flashStartHint();
    return;
  }
  saveSelectedSettings();
}

/**
 * Shows the hint for a short moment and restarts it on every click.
 */
function flashStartHint(): void {
  const startHint = document.querySelector(".settings-progress__start-hint");
  if (!startHint) return;

  startHint.classList.remove(HINT_VISIBLE_CLASS);
  requestAnimationFrame(() => {
    startHint.classList.add(HINT_VISIBLE_CLASS);
  });

  setTimeout(() => startHint.classList.remove(HINT_VISIBLE_CLASS), HINT_VISIBLE_DURATION);
}

/**
 * Saves the selected settings before leaving the page.
 */
function saveSelectedSettings(): void {
  sessionStorage.setItem(config.STORAGE_KEYS.theme, readSelectedValue("theme"));
  sessionStorage.setItem(config.STORAGE_KEYS.player, readSelectedValue("player"));
  sessionStorage.setItem(config.STORAGE_KEYS.boardSize, readSelectedValue("board-size"));
}

/**
 * Reads the value of the checked radio button of a group.
 * @param groupName - The name attribute of the radio group.
 * @returns The value of the checked option, or an empty string.
 */
function readSelectedValue(groupName: string): string {
  const checkedRadio = document.querySelector<HTMLInputElement>(
    `.settings-option__radio[name="${groupName}"]:checked`
  );
  return checkedRadio?.value ?? "";
}