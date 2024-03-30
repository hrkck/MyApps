// utils.js
import { get } from "svelte/store";
import { user } from "./gun";
import { addWindowStore, contentProperties, windowStores } from "./storage";

export function addWindow(app, x = 0, y = 0) {
  const uid = app.name + "-" + nowStr();
  const newAppProperties = {
    uniqueID: uid,
    x: x,
    y: y,
    width: 320,
    height: 240,
    ...app,
    component: "left-blank-for-gundb-storage",
  };
  addWindowStore(uid, newAppProperties);
  return newAppProperties;
}

// export function addWindowGroup(
//   appGroup,
//   startX = 0,
//   startY = 0,
//   spacing = 120
// ) {
//   let currentX = startX;
//   let currentY = startY;

//   // add a frame
//   let frameId = addWindow({
//     id: 1,
//     x: startX,
//     y: startY,
//   });
//   appGroup.contents.forEach((content) => {
//     // Add window with adjusted x position
//     setTimeout(() => {
//       addWindow({
//         ...content,
//         x: currentX,
//         y: currentY,
//         isInsideFrameId: frameId,
//       });
//       // Increment currentX for next window
//       currentX += spacing;
//     }, 1); // our app is so fast so wait 1 ms
//   });
// }

export const nowStr = () => new Date().getTime();

// Additional function to check if the device is mobile
function isMobile() {
  return window.innerWidth <= 768; // Adjust this breakpoint as needed
}

// Usage
// const debouncedUpdateText = debounce(updateText, 500);
export function debounce(func, wait, options) {
  let timeout;

  return function () {
    const context = this;
    const args = arguments;

    const later = function () {
      timeout = null;
      func.apply(context, args);
    };

    const callNow = options.leading && !timeout;

    clearTimeout(timeout);
    timeout = setTimeout(later, wait);

    if (callNow) {
      func.apply(context, args);
    }
  };
}

// used in addWindowGroup
// because our app can create two new app windows in less than 1 ms
function delay(time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

export function generateRandomString(length = 8) {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

export function generateRandomUsername() {
  return `user_${generateRandomString(8)}`;
}

export function generateRandomPassword() {
  return generateRandomString(12); // Adjust length as needed for security
}

export function getAppIDsInAFrame(frameID) {
  if (frameID == "mainContent") {
    return Object.keys(windowStores).filter((id) => id !== "mainContent");
  } else {
    return Object.keys(windowStores).filter(
      (id) => !id.startsWith("frame-") && get(windowStores[id]).isInsideFrameID === frameID
    ); // notice !
  }
}

export function getContainingRectangle(appIDs, padding = 50) {
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  let appStore;
  for (const appID of appIDs) {
    appStore = windowStores[appID];
    const appElem = document.getElementById(appID);
    if (appElem) {
      minX = Math.min(minX, get(appStore).x);
      minY = Math.min(minY, get(appStore).y);
      maxX = Math.max(maxX, get(appStore).x + get(appStore).width);
      maxY = Math.max(maxY, get(appStore).y + get(appStore).height);
    }
  }
  return {
    left: minX - padding,
    top: minY - padding,
    right: maxX + padding,
    bottom: maxY + padding,
  };
}

// Dynamic updating of Boundaries
// this function updates x,y,width,height of
// any html container binded to a svelte store
// defines by paratemeters.
export function checkBoundaries(targetFrameID) {
  if (targetFrameID == "" || targetFrameID == undefined) return;
  let targetStore = windowStores[targetFrameID];
  if (targetStore == undefined) return;
  let appIDs = getAppIDsInAFrame(targetFrameID);
  const containingRect = getContainingRectangle(appIDs);

  const minWidth = 320;
  const minHeight = 240;
  if (
    containingRect.left == Infinity &&
    containingRect.top == Infinity &&
    containingRect.right == -Infinity &&
    containingRect.bottom == -Infinity
  ) {
    // if frame empty, give min width & height
    targetStore.update((data) => {
      data.width = minWidth;
      data.height = minHeight;
      return data;
    });
    user.get("windows").get(targetFrameID).put({ width: minWidth, height: minHeight });
  } else {
    targetStore.update((data) => {
      data.x = containingRect.left;
      data.y = containingRect.top;
      data.width = containingRect.right - containingRect.left;
      data.height = containingRect.bottom - containingRect.top;
      return data;
    });
    user
      .get("windows")
      .get(targetFrameID)
      .put({
        x: containingRect.left,
        y: containingRect.top,
        width: containingRect.right - containingRect.left,
        height: containingRect.bottom - containingRect.top,
      });
  }
}

export function checkContainerBoundaries(parentID) {
  // this function is under construction.
  ///
  ///
  ///
  let targetStore = windowStores[parentID];
  var parent = document.getElementById(parentID);
  var parentRect = parent.getBoundingClientRect();

  let appIDs = getAppIDsInAFrame(parentID);
  const containingRect = getContainingRectangle(appIDs);

  const deltaX = parentRect.left - containingRect.left;
  const deltaY = parentRect.top - containingRect.top;
  targetStore.update((data) => {
    data.x = containingRect.left;
    data.y = containingRect.top;
    data.width = (containingRect.right - parentRect.left) / get(contentProperties).scale;
    data.height = (containingRect.bottom - parentRect.top) / get(contentProperties).scale;
  });

  // following code literally updates every frame and app
  // specifically. In the future we want this to be compherensive
  // of any parent draggable with its children.
  let appStore;
  for (const appID of appIDs) {
    appStore = windowStores[appID];
    appStore.update((appData) => {
      appData.x += deltaX / get(contentProperties).scale;
      appData.y += deltaY / get(contentProperties).scale;
      return appData;
    });
  }
}
