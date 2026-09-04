import '../src/styles/scss/style.scss';

const GAME_THEMES_LIST = document.getElementById("game-themes") as HTMLElement;
const CHOOSE_PLAYER_LIST = document.getElementById("choose-player") as HTMLElement;
const BOARD_SIZE_LIST = document.getElementById("board-size") as HTMLElement;

const HIDDEN_CLASS = "d-none";
const ACTIVE_CLASS = "settings-option__list-item--active";
const HIGHLIGHT_CLASS = "settings-option__list-item--highlighted";

function init(): void {
  initSelectOptionListeners(GAME_THEMES_LIST, true);
  initSelectOptionListeners(CHOOSE_PLAYER_LIST, false);
  initSelectOptionListeners(BOARD_SIZE_LIST, false);
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
    listItem.addEventListener("click", () => selectOption(listItems, listItem));

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
}

/**
 * Restores the radio icons based on the currently selected option.
 * @param listItems - All options of the group.
 */
function restoreSelectedOption(listItems: NodeListOf<HTMLLIElement>): void {
  listItems.forEach((listItem) => {
    setOptionState(listItem, listItem.classList.contains(ACTIVE_CLASS));
  });
}

/**
 * Selects the clicked option and resets all other options in the group.
 * @param listItems - All options of the group.
 * @param selectedItem - The option the user clicked.
 */
function selectOption(
  listItems: NodeListOf<HTMLLIElement>,
  selectedItem: HTMLLIElement
): void {
  listItems.forEach((listItem) => {
    const isSelected = listItem === selectedItem;
    listItem.classList.toggle(ACTIVE_CLASS, isSelected);
      setOptionState(listItem, isSelected);
  });
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

window.onload = init;