import { createPopup } from 'https://unpkg.com/@picmo/popup-picker@latest/dist/index.js?module';

const emoji_btn = document.querySelector('#emoji-btn');
const input = document.querySelector('#my_input');

const picker = createPopup(
  {},
  {
    referenceElement: document.querySelector("#emoji-picker-container"),
    triggerElement: emoji_btn,
    position: "bottom-start",
    showCloseButton: false
  }
);

emoji_btn.addEventListener("click", () => {
  picker.toggle();
});

picker.addEventListener("emoji:select", (selection) => {
  input.value += selection.emoji;
  console.log('Emoji selected:', selection.emoji);
});