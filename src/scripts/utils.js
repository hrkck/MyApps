// utils.js
import { get } from "svelte/store";
import { user } from "./initGun";
import { addWindowStore, contentProperties, windowStores } from "./storage";
import { applications } from "./applicationsList";

export function addWindow(app, x = 0, y = 0) {
  let uid = app.name + "-" + nowStr();
  let additional_identifier = 0;
  while (`${uid}_${additional_identifier}` in get(contentProperties).windowList) {
    additional_identifier += 1;
  }
  uid = `${uid}_${additional_identifier}`;
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

export function addWindowGroup(appGroup, startX = 0, startY = 0, spacing = 120) {
  let currentX = startX;
  let currentY = startY;

  // add a frame
  let frameProperties = addWindow({
    ...applications[0],
    x: startX,
    y: startY,
  });
  appGroup.contents.forEach((content) => {
    // Add window with adjusted x position
    let createdAppProperties = addWindow({
      ...content,
      x: currentX,
      y: currentY,
      isInsideFrameID: frameProperties.uniqueID,
    });
    // console.log(createdAppProperties.isInsideFrameID);
    // Increment currentX for next window
    currentX += spacing;
  });
  checkBoundaries(frameProperties.uniqueID);
}

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

export function throttle(fn, limit) {
  let lastFunc;
  let lastRan;

  function throttled(...args) {
    const context = this;
    if (!lastRan) {
      fn.apply(context, args);
      lastRan = Date.now();
    } else {
      clearTimeout(lastFunc);
      lastFunc = setTimeout(function () {
        if (Date.now() - lastRan >= limit) {
          fn.apply(context, args);
          lastRan = Date.now();
        }
      }, limit - (Date.now() - lastRan));
    }
  }

  throttled.cancel = () => {
    clearTimeout(lastFunc);
    lastFunc = null;
  };

  return throttled;
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
    return Object.keys(get(windowStores)).filter((id) => id !== "mainContent");
  } else {
    return Object.keys(get(windowStores)).filter(
      (id) => !id.startsWith("frame-") && get(get(windowStores)[id]).isInsideFrameID === frameID); // notice !
  }
}



// Util: Read image as Data URL
export function readImageAsDataURL(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.readAsDataURL(file);
  });
}

// Util: Get image dimensions from Data URL
export function getImageDimensions(dataUrl) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight,
        dataUrl,
      });
    };
    img.src = dataUrl;
  });
}


function calculateBoundingBox(items, getPositionFn, padding = 50) {
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;

  for (const item of items) {
    const pos = getPositionFn(item);
    if (!pos) continue;

    minX = Math.min(minX, pos.x);
    minY = Math.min(minY, pos.y);
    maxX = Math.max(maxX, pos.x + pos.width);
    maxY = Math.max(maxY, pos.y + pos.height);
  }

  return {
    left: minX - padding,
    top: minY - padding,
    right: maxX + padding,
    bottom: maxY + padding,
  };
}

export function getContainingRectangleOfApps(appIDs, padding = 50) {
  return calculateBoundingBox(appIDs, (appID) => {
    const appStore = get(windowStores)[appID];
    const appElem = document.getElementById(appID);
    return appElem ? get(appStore) : null;
  }, padding);
}

export function getContainingRectangleOfImages(imagePositions, padding = 50) {
  return calculateBoundingBox(imagePositions, (pos) => pos, padding);
}

export function frameApps(appIDs) {
  const rect = getContainingRectangleOfApps(appIDs, 50); // Assuming padding is 50

  if (rect.left === Infinity || rect.top === Infinity) {
    contentProperties.update(d => {
      d.scale = scale;
      d.x = window.innerWidth / 2;
      d.y = window.innerHeight / 2;
      return d;
    })
    return;
  }

  rect.width = rect.right - rect.left;
  rect.height = rect.bottom - rect.top;

  // Calculate the scale factor to fit the entire rectangle in the view
  const scaleX = window.innerWidth / rect.width;
  const scaleY = window.innerHeight / rect.height;
  const scale = Math.min(scaleX, scaleY);

  // Calculate the center of the containing rectangle
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  // Calculate the new content position to center the view on the containing rectangle
  contentProperties.update(d => {
    d.scale = scale;
    d.x = window.innerWidth / 2 - centerX * scale;
    d.y = window.innerHeight / 2 - centerY * scale;
    return d
  })
}

// This function does not work as intended, although it is kinda useful
// I think it is not taking into account the current zoom from contentProperties.
export function containViewToImages(imagePositions, store, draggableAreaRect, padding = 50) {
  const rect = getContainingRectangleOfImages(imagePositions, 50); // Assuming padding is 50

  if (rect.left === Infinity || rect.top === Infinity) {
    store.update(d => {
      d.scale = scale;
      d.x = window.innerWidth / 2;
      d.y = window.innerHeight / 2;
      return d
    })
    return;
  }

  rect.width = rect.right - rect.left;
  rect.height = rect.bottom - rect.top;

  draggableAreaRect.width = draggableAreaRect.right - draggableAreaRect.left;
  draggableAreaRect.height = draggableAreaRect.bottom - draggableAreaRect.top;


  // Calculate the scale factor to fit the entire rectangle in the view
  const scaleX = window.innerWidth / (rect.width - 100);
  const scaleY = window.innerHeight / (rect.height - 100);
  console.log(rect);
  const scale = Math.min(scaleX, scaleY);

  // Calculate the center of the containing rectangle
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  // Calculate the new content position to center the view on the containing rectangle
  store.update(d => {
    d.scale = scale;
    d.x = window.innerWidth / 2 - centerX * scale;
    d.y = window.innerHeight / 2 - centerY * scale;
    return d
  })
}



// Dynamic updating of Boundaries
// this function updates x,y,width,height of
// any html container binded to a svelte store
// defines by paratemeters.
export function checkBoundaries(targetFrameID) {
  if (targetFrameID == "" || targetFrameID == undefined) return;
  let targetStore = get(windowStores)[targetFrameID];
  if (targetStore == undefined) return;
  let appIDs = getAppIDsInAFrame(targetFrameID);
  const containingRect = getContainingRectangleOfApps(appIDs);

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
  let targetStore = get(windowStores)[parentID];
  var parent = document.getElementById(parentID);
  var parentRect = parent.getBoundingClientRect();

  let appIDs = getAppIDsInAFrame(parentID);
  const containingRect = getContainingRectangleOfApps(appIDs);

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
    appStore = get(windowStores)[appID];
    appStore.update((appData) => {
      appData.x += deltaX / get(contentProperties).scale;
      appData.y += deltaY / get(contentProperties).scale;
      return appData;
    });
  }
}

export function getTooltipScreenPosition(event, store, containerEl, parentStore = null) {
  if (!containerEl) {
    return { x: (event.clientX - get(contentProperties).x) / get(contentProperties).scale, y: (event.clientY - get(contentProperties).y) / get(contentProperties).scale }
  }
  const rect = containerEl.getBoundingClientRect();
  const originX = ((event.clientX - rect.left - window.scrollX) / get(contentProperties).scale - parentStore.x) /
    parentStore.scale;

  const originY = ((event.clientY - rect.top - window.scrollY) / get(contentProperties).scale - parentStore.y) /
    parentStore.scale;

  return { x: originX, y: originY };
}




export function activateWindow(windowID) {
  if (windowID == "") return;
  let activeAppStore = get(windowStores)[windowID];
  activeAppStore.update((data) => {
    data.isActive = true;
    return data;
  });
  user.get("windows").get(windowID).put({ isActive: true });
  contentProperties.update((data) => {
    data.isAWindowActive = true;
    data.activeWindow = windowID;
    data.backgroundColor = "rgb(180, 180, 180)"
    return data;
  });
}

export function deactivateWindow(windowID) {
  if (windowID == "") {
    return;
  };
  let activeAppStore = get(windowStores)[windowID];
  activeAppStore.update((data) => {
    data.isActive = false;
    return data;
  });
  user.get("windows").get(windowID).put({ isActive: false });
  contentProperties.update((data) => {
    data.isAWindowActive = false;
    data.activeWindow = "";
    data.backgroundColor = "rgb(245, 245, 245)";
    return data;
  });
  document.activeElement.blur();
}


export const arrayToObject = (array) => {
  return array.reduce((obj, item, index) => {
    obj[index] = item;
    return obj;
  }, {});
};

export const objectToArray = (object) => {
  return Object.keys(object).map((key) => object[key]);
};

function resolvePath(pathArray) {
  return pathArray.reduce((acc, key) => acc.get(key), user);
}

export function cleanGunData(obj) {
  if (Array.isArray(obj)) {
    return obj.map(cleanGunData);
  } else if (typeof obj === 'object' && obj !== null) {
    const cleanedObj = {};
    for (const key in obj) {
      if (key !== '_' && key !== '#') {
        cleanedObj[key] = cleanGunData(obj[key]);
      }
    }
    return cleanedObj;
  }
  return obj;
}


export function flattenEditorJSData(block) {
  let flattenedData = {};

  // Preserve the timestamp
  // const timestamp = editorData.time;

  // Iterate through each block and flatten accordingly
  if (block.type === 'paragraph') {
    // For text blocks, create an object with a 'text' attribute
    flattenedData = { id: block.id, text: block.data.text, textStoreID: block.textStoreID, order: block.order };
  } else if (block.type === 'image') {
    // For image blocks, create an object with a 'imageUrl' attribute
    flattenedData = { id: block.id, imageUrl: block.data.file.url, caption: block.data.caption, textStoreID: block.textStoreID, order: block.order };
  }

  return flattenedData
  // return { timestamp, flattenedData };
}


export function unflattenToEditorJSData(flattened) {
  const blocks = [];

  flattened.forEach(item => {
    if (item.text) {
      // If it's a text object, create a paragraph block
      blocks.push({
        id: item.id,
        type: 'paragraph',
        data: {
          text: item.text
        },
        textStoreID: item.textStoreID,
        order: item.order
      });
    } else if (item.imageUrl) {
      // If it's an image object, create an image block
      blocks.push({
        id: item.id,
        type: 'image',
        data: {
          file: {
            url: item.imageUrl
          },
          caption: item.caption || ''  // Handle empty caption if needed
        },
        textStoreID: item.textStoreID,
        order: item.order
      });
    }
  });

  return blocks;
}

// Utility function to convert the list of blocks to an object
export function listToObject(blocks) {
  const objectBlocks = {};

  blocks.forEach((block, index) => {
    // Flatten the block before adding it to the object
    objectBlocks[index] = flattenEditorJSData(block);
  });

  return objectBlocks;
}

// Utility function to convert the object back to a list of blocks
export function objectToList(objectBlocks) {
  const blocks = [];

  Object.values(objectBlocks).forEach((flattenedBlock) => {
    // Unflatten the block and add to the list
    blocks.push(...unflattenToEditorJSData([flattenedBlock]));
  });

  return blocks;
}
