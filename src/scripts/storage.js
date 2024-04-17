// storage.js
import { writable } from "svelte/store";
import { user } from "./gun";

export let contextMenu = writable({
  visible: false,
  x: 0,
  y: 0,
  screenX: 0,
  screenY: 0,
  originalTargetID: 'none'
});
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
  backgroundColor: "rgb(248, 255, 243)",
  isInsideFrameID: "",
  zIndex: 1,
  windowList: {},
  selectedWindows: [],
  isAWindowActive: false,
  activeWindow: "",
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

// Utility function to create a writable store for a window with default properties
export function createWindowStore(uniqueID, defaultProperties = {}) {
  return writable({
    uniqueID,
    ...defaultProperties,
  });
}

// Maintains a JS object (map) of Svelte stores for individual windows
export let windowStores = {};
// windowStores['mainContent'] = contentProperties;

// Function to add a new window store to the windowStores map
export function addWindowStore(uniqueID, properties) {
  const newStore = createWindowStore(uniqueID, properties);
  windowStores[uniqueID] = newStore;
  windowStores = { ...windowStores };
  addWindowToContent(uniqueID); // Also add to the content's window list
  user
    .get("windows")
    .get(uniqueID)
    .put({ ...properties });
}

// Function to remove a window store from the windowStores map
export function removeWindowStore(uniqueID) {
  if (windowStores[uniqueID]) {
    delete windowStores[uniqueID];
    removeWindowFromContent(uniqueID); // Also remove from the content's window list
    user.get("windows").get(uniqueID).put(null);
  }
}

// Function to reset localStorage
export function resetLocalStorage() {
  console.log("cleaing localstorage AND gundb");
  localStorage.clear();
  user.get("windows").put(null);
  user.put(null);
  window.alert("Close this tab to clear GUN DB storage and stop all servers.");
  location.reload(); // Reload the page
  // user.get("windowsStore").put(null)
  // user.get("workspaceStore").put(null)
}
