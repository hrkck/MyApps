// storage.js
import { get, readable, writable } from "svelte/store";
import { gun, user } from "./initGun";

export let contextMenu = writable({
  visible: false,
  x: 0,
  y: 0,
  screenX: 0,
  screenY: 0,
  originalTargetID: "none",
});

export let isDraggingSelect = writable(false);


// Helper function to initialize and manage local storage-backed Svelte stores
export function getLocalStorage(key, initialValue) {
  const storedValue = localStorage.getItem(key);
  const initial = storedValue ? JSON.parse(storedValue) : initialValue;

  const store = writable(initial, () => {
    const unsubscribe = store.subscribe((value) => {
      localStorage.setItem(key, JSON.stringify(value));
    });
    return () => unsubscribe();
  });

  return store;
}

// Define the main content store with windowListStore embedded within
export let contentProperties = getLocalStorage("mainContent", {
  uniqueID: "mainContent",
  name: "no-name-set",
  windowType: "content",
  boxShadow: false,
  hideOverflow: false,
  dragEventTarget: "window",
  useWindow: true,
  scalable: true,
  resizable: false,
  showGrabbers: false,
  hideHeaderResize: true,
  x: 0,
  y: 0,
  width: 300,
  height: 300,
  scale: 1,
  contentScale: 1,
  backgroundColor: "rgb(245, 245, 245)",
  isInsideFrameID: "",
  zIndex: 1,
  windowList: {},
  selectedWindows: [],
  isAWindowActive: false,
  activeWindow: "",
  mouseX: 0,
  mouseY: 0,
});

//will be added with gun db
contentProperties.update((data) => {
  data.windowList = {};
  return data;
});

// Function to add a window ID to the windowList
export function addWindowToContent(windowId) {
  contentProperties.update((content) => {
    const updatedWindowList = { ...content.windowList, [windowId]: true };
    return { ...content, windowList: updatedWindowList };
  });
}

// Function to remove a window ID from the windowList
export function removeWindowFromContent(windowId) {
  contentProperties.update((content) => {
    const updatedWindowList = { ...content.windowList };
    delete updatedWindowList[windowId];
    return { ...content, windowList: updatedWindowList };
  });
}

export function createStore(ref, isMap = false) {
  const store = writable(isMap ? [] : {});
  if (isMap) {
    const map = new Map();
    ref.map().on((data, key) => {
      if (data === null) {
        map.delete(key);
      } else {
        map.set(key, data);
      }
      store.set(Array.from(map.values()));
    });
  } else {
    ref.on((data) => {
      store.set(data); // replace entire object
    });
  }
  return store;
}

// Utility function to create a writable store for a window with default properties
export function createWindowStore(uniqueID, defaultProperties = {}) {
  const newWindowStoreRef = user.get("windows").get(uniqueID)
  const newWindowStore = createStore(newWindowStoreRef)
  newWindowStoreRef.put(defaultProperties)
  newWindowStore.set(defaultProperties)
  return newWindowStore;
}

// Maintains a JS object (map) of Svelte stores for individual windows
export const windowStores = writable({});
// windowStores['mainContent'] = contentProperties;

// Function to add a new window store to the windowStores map

export function addWindowStore(uniqueID, properties) {
  const current = get(windowStores);
  if (current[uniqueID]) return;
  const newStore = createWindowStore(uniqueID, properties);
  windowStores.set({
    ...current,
    [uniqueID]: newStore
  });
  addWindowToContent(uniqueID);
  // user.get("windows").map().once(data=>console.log(data))
}

// Function to remove a window store from the windowStores map
export function removeWindowStore(uniqueID) {
  if (get(windowStores)[uniqueID]) {
    delete get(windowStores)[uniqueID];
    removeWindowFromContent(uniqueID); // Also remove from the content's window list
    user.get("windows").get(uniqueID).put(null);
  }
}


// Function to reset localStorage
export function resetLocalStorage() {
  const confirmed = window.confirm("Are you sure you want to clear localStorage and gundb?");
  if (confirmed) {
    console.log("clearing localStorage AND gundb");
    sessionStorage.clear()
    localStorage.clear()
    caches.keys().then(keys => {
      keys.forEach(key => caches.delete(key))
    })
    indexedDB.databases().then(dbs => {
      dbs.forEach(db => indexedDB.deleteDatabase(db.name))
    })
    document.cookie = document.cookie.split(';').reduce((newCookie1, keyVal) => {
      var pair = keyVal.trim().split('=')
      if (pair[0]) {
        if (pair[0] !== 'path' && pair[0] !== 'expires') {
          newCookie1 += pair[0] + '=;'
        }
      }
      return newCookie1
    }, 'expires=Thu, 01 Jan 1970 00:00:00 UTC; path:/;')

    user.get("windows").put(null);
    user.put(null);
    window.alert("Close this tab to clear GUN DB storage and stop all servers.");
    location.reload(); // Reload the page
    // user.get("windowsStore").put(null)
    // user.get("workspaceStore").put(null)
  } else {
    console.log("Reset canceled.");
  }
}
