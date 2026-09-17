import * as config from "./config";

/**
 * Number of option groups that need a selection before the game can start.
 */
export const OPTION_GROUP_COUNT = 3;

/**
 * Stores the labels of the selected options until the progress bar is unlocked.
 */
export const PENDING_LABELS: Record<string, string> = {};

/**
 * Tracks whether the progress bar already shows the selected labels.
 */
export let isProgressUnlocked = false;

/**
 * Modifier class of the selected option.
 */
export const ACTIVE_CLASS = "settings-option__list-item--active";

/**
 * Modifier class of the option that is shown as chosen.
 */
export const HIGHLIGHT_CLASS = "settings-option__list-item--highlighted";

/**
 * Modifier class that plays the bounce animation of the progress bar.
 */
export const BOUNCE_CLASS = "settings-progress--bounce";

/**
 * Modifier class of the unlocked progress bar.
 */
export const UNLOCKED_CLASS = "settings-progress--unlocked";

/**
 * Modifier class of the progress bar once every group has a selection.
 */
export const READY_CLASS = "settings-progress--ready";

/**
 * Modifier class of the disabled start button.
 */
export const DISABLED_CLASS = "settings-progress__start-button--disabled";

/**
 * Modifier class of the visible start hint.
 */
export const HINT_VISIBLE_CLASS = "settings-progress__start-hint--visible";

/**
 * Time in milliseconds the start hint stays visible.
 */
export const HINT_VISIBLE_DURATION = 1500;

/**
 * Registers all event listeners required for the settings page.
 */
export function initSettingsListeners(): void {
  initSelectOptionListeners(document.getElementById("game-themes") as HTMLElement, true);
  initSelectOptionListeners(document.getElementById("choose-player") as HTMLElement, false);
  initSelectOptionListeners(document.getElementById("board-size") as HTMLElement, false);
  document.querySelector<HTMLElement>(".settings-progress")?.addEventListener("click", unlockProgressBar);
  document
    .querySelector<HTMLAnchorElement>(".settings-progress__start-button")
    ?.addEventListener("click", handleStartClick);
}

/**
 * Attaches the selection listeners to every option of a group.
 * Optionally adds a hover preview of the radio icons.
 * @param optionList - The list element holding the options.
 * @param withHoverPreview - True adds the hover preview behaviour.
 */
export function initSelectOptionListeners(
  optionList: HTMLElement,
  withHoverPreview: boolean
): void {
  const listItems = optionList.querySelectorAll<HTMLLIElement>(
    ".settings-option__list-item"
  );

  listItems.forEach((listItem) => {
    addSelectListeners(optionList, listItems, listItem);
    if (withHoverPreview) addHoverPreviewListeners(listItems, listItem);
  });
}

/**
 * Selects an option on click and on Enter or Space.
 * @param optionList - The list element holding the options.
 * @param listItems - All options of the group.
 * @param listItem - The option receiving the listeners.
 */
export function addSelectListeners(
  optionList: HTMLElement,
  listItems: NodeListOf<HTMLLIElement>,
  listItem: HTMLLIElement
): void {
  listItem.addEventListener("click", () =>
    selectOption(optionList, listItems, listItem)
  );
  listItem.addEventListener("keydown", handleOptionKeydown);
}

/**
 * Lets keyboard users select an option with Enter or Space.
 * Reuses the click logic of the option.
 * @param event - The keydown event on an option.
 */
export function handleOptionKeydown(event: KeyboardEvent): void {
  if (event.key !== "Enter" && event.key !== " ") return;

  event.preventDefault();
  (event.currentTarget as HTMLLIElement).click();
}

/**
 * Previews an option while it is hovered and restores the selection afterwards.
 * @param listItems - All options of the group.
 * @param listItem - The option receiving the listeners.
 */
export function addHoverPreviewListeners(
  listItems: NodeListOf<HTMLLIElement>,
  listItem: HTMLLIElement
): void {
  listItem.addEventListener("mouseenter", () =>
    previewOption(listItems, listItem)
  );
  listItem.addEventListener("mouseleave", () => restoreSelectedOption(listItems));
}

/**
 * Fills the pending labels with the options preselected in the markup.
 */
export function initPendingLabels(): void {
  const optionLists = [
    document.getElementById("game-themes") as HTMLElement,
    document.getElementById("choose-player") as HTMLElement,
    document.getElementById("board-size") as HTMLElement,
  ];

  optionLists.forEach((optionList) => {
    const activeItem = optionList.querySelector<HTMLLIElement>(`.${ACTIVE_CLASS}`);
    if (activeItem) {
      setOptionState(activeItem, true);
      rememberProgressLabel(optionList, activeItem);
    }
  });
}

/**
 * Previews the hovered option without changing the actual selection.
 * @param listItems - All options of the group.
 * @param hoveredItem - The option the user hovers.
 */
export function previewOption(
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
export function restoreSelectedOption(listItems: NodeListOf<HTMLLIElement>): void {
  listItems.forEach((listItem) => {
    const isActive = listItem.classList.contains(ACTIVE_CLASS);
    setOptionState(listItem, isActive);
    if (isActive) updateThemeImg(listItem);
  });
}

/**
 * Updates the preview image according to the theme of an option.
 * @param listItem - The option holding the theme key.
 */
export function updateThemeImg(listItem: HTMLElement): void {
  const themeImg = document.getElementById("theme-img") as HTMLImageElement;
  const themeKey = listItem.dataset.value;
  if (!themeKey) return;

  const preview = config.THEME_PREVIEWS[themeKey];
  if (!preview) return;

  themeImg.src = preview.src;
  themeImg.alt = preview.alt;
}

/**
 * Selects the clicked option and resets all other options in the group.
 * @param optionList - The list element holding the options.
 * @param listItems - All options of the group.
 * @param selectedItem - The option the user clicked.
 */
export function selectOption(
  optionList: HTMLElement,
  listItems: NodeListOf<HTMLLIElement>,
  selectedItem: HTMLLIElement
): void {
  listItems.forEach((listItem) => {
    const isSelected = listItem === selectedItem;
    listItem.classList.toggle(ACTIVE_CLASS, isSelected);
    listItem.setAttribute("aria-checked", String(isSelected));
    setOptionState(listItem, isSelected);
  });
  rememberProgressLabel(optionList, selectedItem);
}

/**
 * Applies the visual state of a single option.
 * Swaps the radio icons and toggles the highlight styling.
 * @param listItem - The option whose appearance is updated.
 * @param isHighlighted - True shows the option as chosen.
 */
export function setOptionState(listItem: HTMLLIElement, isHighlighted: boolean): void {
  listItem
    .querySelector(".settings-option__radio--checked")
    ?.classList.toggle(config.HIDDEN_CLASS, !isHighlighted);
  listItem
    .querySelector(".settings-option__radio--unchecked")
    ?.classList.toggle(config.HIDDEN_CLASS, isHighlighted);
  listItem.classList.toggle(HIGHLIGHT_CLASS, isHighlighted);
}

/**
 * Stores the label of the selected option.
 * Writes it through directly once the progress bar is unlocked.
 * @param optionList - The list element holding the options.
 * @param selectedItem - The option the user clicked.
 */
export function rememberProgressLabel(
  optionList: HTMLElement,
  selectedItem: HTMLLIElement
): void {
  const stepId = optionList.dataset.step;
  const label = selectedItem.dataset.label;
  if (!stepId || !label) return;

  PENDING_LABELS[stepId] = label;
  markProgressReady();
  if (isProgressUnlocked) writeProgressLabel(stepId, label);
}

/**
 * Marks the progress bar as clickable once every group has a selection.
 * Enables the start button at the same time.
 */
export function markProgressReady(): void {
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
export function unlockProgressBar(event: MouseEvent): void {
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
export function writePendingLabels(): void {
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
export function writeProgressLabel(stepId: string, label: string): void {
  const step = document.getElementById(stepId);
  if (step) step.textContent = label;
}

/**
 * Restarts the bounce animation of the progress bar.
 */
export function restartBounce(): void {
  const progressList = document.querySelector(".settings-progress") as HTMLElement;

  progressList.classList.remove(BOUNCE_CLASS);
  requestAnimationFrame(() => {
    requestAnimationFrame(() => progressList.classList.add(BOUNCE_CLASS));
  });
}

/**
 * Shows the bent dividers instead of the default ones.
 */
export function swapProgressDividers(): void {
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
export function markProgressSteps(): void {
  document
    .querySelectorAll(".settings-progress__step")
    .forEach((step) => step.classList.add("settings-progress__step--option"));
}

/**
 * Blocks the navigation while options are missing, saves them otherwise.
 * @param event - The click event on the start button.
 */
export function handleStartClick(event: MouseEvent): void {
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
export function flashStartHint(): void {
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
export function saveSelectedSettings(): void {
  sessionStorage.setItem(config.STORAGE_KEYS.theme, readSelectedValue(document.getElementById("game-themes") as HTMLElement));
  sessionStorage.setItem(config.STORAGE_KEYS.player, readSelectedValue(document.getElementById("choose-player") as HTMLElement));
  sessionStorage.setItem(config.STORAGE_KEYS.boardSize, readSelectedValue(document.getElementById("board-size") as HTMLElement));
}

/**
 * Reads the data value of the active option of a group.
 * @param optionList - The list element holding the options.
 * @returns The value of the active option, or an empty string.
 */
export function readSelectedValue(optionList: HTMLElement): string {
  const activeItem = optionList.querySelector<HTMLLIElement>(`.${ACTIVE_CLASS}`);
  return activeItem?.dataset.value ?? "";
}