// src/js/db_service.js

// Import Gun library using ES module syntax
import Gun from 'gun/gun';
import 'gun/sea';

// Initialize Gun with your peer server
export const gun = Gun({
  peers: ['https://hakkisapps.labb.top/gun'], // Your GunDB peer server URL
  // Include other configuration options as needed
});

export function initializeDB(dbNameParam, storeNameParam) {
  return new Promise((resolve, reject) => {
    const dbName = dbNameParam;
    const dbVersion = 1;
    const storeName = storeNameParam;

    const request = indexedDB.open(dbName, dbVersion);
    let db;

    request.onupgradeneeded = (event) => {
      db = event.target.result;
      db.createObjectStore(storeName, { autoIncrement: true, keyPath: "id" });
    };

    request.onsuccess = (event) => {
      db = event.target.result;
      resolve(db);
    };

    request.onerror = (event) => {
      console.error("Error opening IndexedDB", event.target.error);
      reject(event.target.error);
    };
  });
}

export function saveImageToDB(imageUrl, key, db, storeName) {
  const transaction = db.transaction([storeName], "readwrite");
  const objectStore = transaction.objectStore(storeName);

  objectStore.add({ imageUrl, key });
}

export function clearDB(dbName) {
  const deleteRequest = indexedDB.deleteDatabase(dbName);

  deleteRequest.onsuccess = () => {
    console.log(`IndexedDB cleared successfully ${dbName}`);
  };

  deleteRequest.onerror = (event) => {
    console.error("Error clearing IndexedDB", event.target.error);
  };
}
