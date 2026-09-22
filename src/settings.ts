import * as config from "./config";

/**
 * Number of option groups that need a selection before the game can start.
 */
const OPTION_GROUP_COUNT = 3;

/**
 * Stores the labels of the selected options until the progress bar is unlocked.
 */
const PENDING_LABELS: Record<string, string> = {};

/**
 * Tracks whether the progress bar already shows the selected labels.
 */
let isProgressUnlocked = false;

/**
 * Modifier class that plays the bounce animation of the progress bar.
 */
const BOUNCE_CLASS = "settings-progress--bounce";

/**
 * Modifier class of the unlocked progress bar.
 */
const UNLOCKED_CLASS = "settings-progress--unlocked";

/**
 * Modifier class of the progress bar once every group has a selection.
 */
const READY_CLASS = "settings-progress--ready";

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
  document.querySelector<HTMLElement>(".settings-progress")?.addEventListener("click", unlockProgressBar);
  document
    .querySelector<HTMLAnchorElement>(".settings-progress__start-button")
    ?.addEventListener("click", handleStartClick);
}

/**
 * Stores the label of a newly selected option.
 * Updates the preview image when the theme changes.
 * @param event - The change event of a radio button.
 */
function handleOptionChange(event: Event): void {
  const radio = event.target as HTMLInputElement;

  rememberProgressLabel(radio);
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
 * Fills the pending labels with the options preselected in the markup.
 */
export function initPendingLabels(): void {
  document
    .querySelectorAll<HTMLInputElement>(".settings-option__radio:checked")
    .forEach((radio) => rememberProgressLabel(radio));
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
 * Stores the label of a selected option.
 * Writes it through directly once the progress bar is unlocked.
 * @param radio - The selected radio button.
 */
function rememberProgressLabel(radio: HTMLInputElement): void {
  const stepId = radio.closest<HTMLElement>(".settings-option")?.dataset.step;
  const label = radio.dataset.label;
  if (!stepId || !label) return;

  PENDING_LABELS[stepId] = label;
  markProgressReady();
  if (isProgressUnlocked) writeProgressLabel(stepId, label);
}

/**
 * Marks the progress bar as clickable once every group has a selection.
 * Enables the start button at the same time.
 */
function markProgressReady(): void {
  const startButton = document.querySelector(".settings-progress__start-button");
  if (Object.keys(PENDING_LABELS).length < OPTION_GROUP_COUNT) return;

  document.querySelector(".settings-progress")?.classList.add(READY_CLASS);
  startButton?.classList.remove(DISABLED_CLASS);
  startButton?.setAttribute("aria-disabled", "false");
  startButton?.removeAttribute("aria-describedby");
}

/**
 * Unlocks the progress bar on a click once every group has a selection.
 * Ignores clicks on the start button and every later click.
 * @param event - The click event on the progress bar.
 */
function unlockProgressBar(event: MouseEvent): void {
  if (isProgressUnlocked) return;
  if (Object.keys(PENDING_LABELS).length < OPTION_GROUP_COUNT) return;

  const target = event.target as HTMLElement;
  if (target.closest(".settings-progress__start-button")) return;

  isProgressUnlocked = true;
  document.querySelector(".settings-progress")?.classList.add(UNLOCKED_CLASS);
  writePendingLabels();
  swapProgressDividers();
  markProgressSteps();
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
 * Gives every progress step the width reserved for its label.
 */
function markProgressSteps(): void {
  document
    .querySelectorAll(".settings-progress__step")
    .forEach((step) => step.classList.add("settings-progress__step--option"));
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