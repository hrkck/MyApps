//  store.js  -->

import { writable } from "svelte/store";
import { gun } from "./js/db_service";

const user = gun.user();

console.log("Will try to open last user");
// Attempt to recall any existing user session
user.recall({ sessionStorage: true }, (ack) => {
  if (ack.err) {
    // Handle any errors (e.g., session data corrupted or other issues)
    console.error("Session recall failed:", ack.err);
    message = "Error recalling session. Please log in again.";
  } else if (user.is) {
    // User is successfully recalled
    console.log("Session recalled successfully:", user.is);
    message = "Welcome back!";
    // Optionally, update `username` with the recalled user's alias
    username = user.is.alias;
  }
});



// Workspace store
export const workspaceStore = getGunSvelteStore("workspaceStore", {
  scale: 1,
  backgroundScale: 1,
  contentX: 0,
  contentY: 0,
  backgroundX: 0,
  backgroundY: 0,
  contentWidth: 0,
  contentHeight: 0,
  selectedWindows: [],
  isAWindowActivated: false,
  // workspaceScaleBeforeMaximize: 1,
});

// Windows store
export const windowsStore = getGunSvelteStore("windowsStore", []);

export function getLocalSvelteStore(key, initialValue) {
  // Load workspace state from localStorage
  const storedValue = localStorage.getItem(key);
  const initial = storedValue ? JSON.parse(storedValue) : initialValue;

  const store = writable(initial, () => {
    const unsubscribe = store.subscribe((value) => {
      localStorage.setItem(key, JSON.stringify(value));
    });
    return unsubscribe;
  });

  return store;
}

export function getGunSvelteStore(key, initialValue) {
  if (!gun.user().is) {
    console.error("User not authenticated");
    return writable(initialValue);
  }

  const store = writable(initialValue);
  const gunRef = gun.user().get(key);

  // Listen to changes on the gun reference
  gunRef.on(async (encryptedData, key) => {
    // Check if the data is encrypted (SEA encrypted data is typically an object with certain properties)
    if (encryptedData && encryptedData.hasOwnProperty('ct')) {
      // Attempt to decrypt the data
      try {
        const decryptedData = await SEA.decrypt(encryptedData, gun.user()._.sea);
        if (decryptedData !== undefined) {
          store.set(decryptedData);
        } else {
          console.error('Failed to decrypt data:', key);
        }
      } catch (error) {
        console.error('Decryption error:', error);
      }
    } else {
      // If data is not encrypted or doesn't appear to be, set it directly
      store.set(encryptedData);
    }
  });

  // Subscribe function to update GunDB when Svelte store changes
  const updateGun = (value) => {
    SEA.encrypt(value, gun.user()._.sea).then(encryptedValue => {
      gunRef.put(encryptedValue);
    }).catch(error => console.error('Encryption error:', error));
  };

  // Subscribe to the Svelte store's changes and update GunDB
  const unsubscribe = store.subscribe(updateGun);

  return {
    subscribe: store.subscribe,
    set: (value) => {
      SEA.encrypt(value, gun.user()._.sea).then(encryptedValue => {
        gunRef.put(encryptedValue);
        store.set(value);
      }).catch(error => console.error('Encryption error:', error));
    },
    update: (callback) => {
      store.update(currentValue => {
        const updatedValue = callback(currentValue);
        SEA.encrypt(updatedValue, gun.user()._.sea).then(encryptedValue => {
          gunRef.put(encryptedValue);
        }).catch(error => console.error('Encryption error:', error));
        return updatedValue;
      });
    },
    unsubscribe: () => unsubscribe()
  };
}



export let windowPropertyStores = [];

export function windowLocalStore(key) {
  const savedWindows = JSON.parse(localStorage.getItem("windowsStore"));
  let windowData = savedWindows.find((app) => app.windowId === key);

  let appData;
  let initial;

  appData = JSON.parse(localStorage.getItem(key));

  // const { newX, newY } = calculateNewWindowPosition(savedWindows);
  initial = appData ? { ...appData } : { ...windowData };

  const store = writable(initial, () => {
    const unsubscribe = store.subscribe((value) => {
      localStorage.setItem(key, JSON.stringify(value));
    });
    return unsubscribe;
  });

  return store;
}


// Function to reset localStorage
export function resetLocalStorage() {
  console.log(localStorage);
  for (let key in localStorage) {
    // Check if the key matches the pattern of window-specific entries (e.g., long number sequence)
    // if (/^\d+$/.test(key)) {
    localStorage.removeItem(key);
    // }
  }
  localStorage.removeItem("windowsStore");
  localStorage.removeItem("workspaceStore");
  // Reload the page to clear and reset the state
  location.reload();
}
