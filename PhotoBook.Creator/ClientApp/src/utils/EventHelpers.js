
function stopEvent(e) {
  if (e) {
    if (e.bubbles) {
      e.cancelBubble = true;
    }
    e.stopPropagation();
    if (e.type === "click" || e.type === "contextmenu") {
      e.preventDefault();
    }
    if (e.nativeEvent) {
      e.nativeEvent.stopImmediatePropagation();
    }
  }
}
function ignore() {

}
function isMobile() {
  return document.body.clientWidth <= 768;
}
export { ignore, stopEvent, isMobile };