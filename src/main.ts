import '../src/styles/scss/style.scss';

const GAME_THEMES_LIST = document.getElementById("game-themes") as HTMLElement;
const CHOOSE_PLAYER_LIST = document.getElementById("choose-player") as HTMLElement;
const BOARD_SIZE_LIST = document.getElementById("board-size") as HTMLElement;

const HIDDEN_CLASS = "d-none";
const ACTIVE_CLASS = "settings-option__list-item--active";

function init(): void {
  initGameThemeListeners();
  initChoosePlayerListeners();
  initChooseBoardSizeListeners();
}

/**
 * Attaches hover and click listeners to every game theme option.
 */
function initGameThemeListeners(): void {
  const listItems = GAME_THEMES_LIST.querySelectorAll<HTMLLIElement>(
    ".settings-option__list-item"
  );

  listItems.forEach((listItem) => {
    listItem.addEventListener("mouseenter", () => previewRadioIcon(listItem, true));
    listItem.addEventListener("mouseleave", () => previewRadioIcon(listItem, false));
    listItem.addEventListener("click", () => selectOption(listItems, listItem));
  });
}

/**
 * Attaches click listeners to the two Player options.
 */
function initChoosePlayerListeners(): void {
  const listItems = CHOOSE_PLAYER_LIST.querySelectorAll<HTMLLIElement>(
    ".settings-option__list-item"
  );

  listItems.forEach((listItem) => {
    listItem.addEventListener("click", () => selectOption(listItems, listItem));
  });
}

/**
 * Attaches click listeners to every board size option.
 */
function initChooseBoardSizeListeners(): void {
  const listItems = BOARD_SIZE_LIST.querySelectorAll<HTMLLIElement>(
    ".settings-option__list-item"
  );

  listItems.forEach((listItem) => {
    listItem.addEventListener("click", () => selectOption(listItems, listItem));
  });
}

/**
 * Previews the checked icon on hover.
 * Does nothing if the option is already selected.
 * @param listItem - The hovered option.
 * @param isHovered - True on mouse enter, false on mouse leave.
 */
function previewRadioIcon(listItem: HTMLLIElement, isHovered: boolean): void {
  if (listItem.classList.contains(ACTIVE_CLASS)) return;
  setRadioIcon(listItem, isHovered);
}

/**
 * Selects the clicked option and resets all other options in the group.
 * @param listItems - All options of the game theme group.
 * @param selectedItem - The option the user clicked.
 */
function selectOption(
  listItems: NodeListOf<HTMLLIElement>,
  selectedItem: HTMLLIElement
): void {
  listItems.forEach((listItem) => {
    const isSelected = listItem === selectedItem;
    listItem.classList.toggle(ACTIVE_CLASS, isSelected);
    setRadioIcon(listItem, isSelected);
  });
}

/**
 * Swaps the checked and unchecked radio icons of a single option.
 * @param listItem - The option whose icons are updated.
 * @param isChecked - True shows the checked icon, false the unchecked one.
 */
function setRadioIcon(listItem: HTMLLIElement, isChecked: boolean): void {
  const checkedIcon = listItem.querySelector<HTMLImageElement>(
    ".settings-option__radio--checked"
  );
  const uncheckedIcon = listItem.querySelector<HTMLImageElement>(
    ".settings-option__radio--unchecked"
  );

  checkedIcon?.classList.toggle(HIDDEN_CLASS, !isChecked);
  uncheckedIcon?.classList.toggle(HIDDEN_CLASS, isChecked);
}

window.onload = init;