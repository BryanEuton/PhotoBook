
function coordsChanged(a, b) {
  if (a && b && 
    (
    a.x !== b.x ||
    a.y !== b.y ||
    a.width !== b.width ||
    a.height !== b.height
    )) {
    return true;
  }
  return false;
}
function positionChanged(a, b) {
  if (a && b &&
  (
    a.x !== b.x ||
      a.y !== b.y 
  )) {
    return true;
  }
  return false;
}
function imageDetailsChanged(a, b) {
  if (a && b &&
  (
    a.ready !== b.ready ||
    a.width !== b.width ||
    a.height !== b.height ||
    a.position.top !== b.position.top ||
    a.position.left !== b.position.left ||
    a.diffWidth !== b.diffWidth ||
    a.diffHeight !== b.diffHeight 
  )) {
    return true;
  }
  return false;
}
function getCoords(a) {
  return { x: a.x, y: a.y, width: a.width, height: a.height };
}
function faceChange(a, b) {
  if (a && b) {
    if (a.tagId !== b.tagId ||
      a.name !== b.name) {
      return true;
    }
    if (coordsChanged(getCoords(a), getCoords(b))) {
      return true;
    }
  }
  return false;
}
export { coordsChanged, faceChange, getCoords, imageDetailsChanged, positionChanged }