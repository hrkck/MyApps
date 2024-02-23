import { get } from "svelte/store";
import { windowPropertyStores, windowsStore } from "../store";

// for selected windows to a set:
// $workspaceStore.selectedWindows = [...new Set($workspaceStore.selectedWindows)];

export const nowStr = () => new Date().getTime();

// Additional function to check if the device is mobile
function isMobile() {
  return window.innerWidth <= 768; // Adjust this breakpoint as needed
}

export function addWindow(app, x = 0, y = 0) {
  const newApp = {
    windowId: nowStr(),
    id: -1,
    name: "App Name",
    title: "App Title",
    content: "",
    windowIconUrl: "",
    // windowIconSrc: "",
    x: x,
    y: y,
    width: 320,
    height: 240,
    isFullscreen: false,
    contentXBeforeMaximize: 0,
    contentYBeforeMaximize: 0,
    xBeforeMaximize: 0,
    yBeforeMaximize: 0,
    isInsideFrameId: 0,
    isActiveApp: false,
    ...app,
  };
  windowsStore.update((w) => [...w, newApp]);
  return newApp.windowId;
}

export function addWindowGroup(
  appGroup,
  startX = 0,
  startY = 0,
  spacing = 120
) {
  let currentX = startX;
  let currentY = startY;

  // add a frame
  let frameId = addWindow({
    id: 1,
    x: startX,
    y: startY,
  });
  appGroup.contents.forEach((content) => {
    // Add window with adjusted x position
    setTimeout(() => {
      addWindow({
        ...content,
        x: currentX,
        y: currentY,
        isInsideFrameId: frameId,
      });
      // Increment currentX for next window
      currentX += spacing;
    }, 1); // our app is so fast so wait 1 ms
  });
}

//Close Window Functionality
export function closeWindow(windowId) {
  windowsStore.update((currentWindows) => {
    return currentWindows.filter((window) => window.windowId !== windowId);
  });
  for (let key in localStorage) {
    if (key.includes(windowId)) {
      // if windowID is in key
      localStorage.removeItem(key);
    }
  }
  console.log(windowPropertyStores.forEach(store=>console.log(get(store))));
}

export function updateWindowStore(windowId, updateCallback) {
  // get the store object from that windowId
  const windowPropertyStoreIndex = windowPropertyStores.findIndex(
    (windowStore) => get(windowStore).windowId == windowId
  );

  if (windowPropertyStoreIndex !== -1) {
    const windowStore = windowPropertyStores[windowPropertyStoreIndex];
    windowStore.update(updateCallback);
  }
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
