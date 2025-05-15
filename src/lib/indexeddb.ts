import type { DrawResult } from '@/lib/types';

const DB_NAME = 'LotoStatsDB';
const DB_VERSION = 1;
const STORE_NAME = 'lotteryData';

let dbPromise: Promise<IDBDatabase> | null = null;

function getDb(): Promise<IDBDatabase> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error("IndexedDB cannot be accessed in this environment."));
  }
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('IndexedDB error:', request.error);
        reject(new Error('Failed to open IndexedDB.'));
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
          store.createIndex('drawNameDate', ['drawName', 'date'], { unique: true });
          store.createIndex('drawName', 'drawName', { unique: false });
        }
      };
    });
  }
  return dbPromise;
}

export async function addDrawResults(results: DrawResult[]): Promise<void> {
  if (!results || results.length === 0) return;
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    let completedOperations = 0;
    results.forEach(result => {
      // Check for existing record by drawName and date
      const index = store.index('drawNameDate');
      const getRequest = index.get([result.drawName, result.date]);

      getRequest.onsuccess = () => {
        if (!getRequest.result) { // Only add if it doesn't exist
          const addRequest = store.add(result);
          addRequest.onerror = () => {
            console.warn('Failed to add result (likely duplicate or error):', addRequest.error, result);
          };
          addRequest.onsuccess = () => {
            completedOperations++;
            if (completedOperations === results.length) {
              // This part might not be perfectly accurate due to async nature of checks
            }
          };
        } else {
          completedOperations++; // Count as "processed"
        }
        // This simplified approach might lead to resolve being called before all add ops are truly done
        // A more robust way would be Promise.all if each add operation was a promise
      };
       getRequest.onerror = () => {
         console.error('Error checking for existing result:', getRequest.error);
         // decide how to handle this, for now, we'll try to add
         const addRequest = store.add(result);
          addRequest.onerror = () => {
            console.warn('Failed to add result (likely duplicate or error):', addRequest.error, result);
          };
       }
    });

    transaction.oncomplete = () => {
      resolve();
    };

    transaction.onerror = () => {
      console.error('Transaction error:', transaction.error);
      reject(new Error('Transaction failed while adding draw results.'));
    };
  });
}


export async function getDrawResults(drawName: string): Promise<DrawResult[]> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('drawName');
    const request = index.getAll(drawName);

    request.onsuccess = () => {
      resolve(request.result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())); // Sort by date descending
    };

    request.onerror = () => {
      console.error('Error fetching results:', request.error);
      reject(new Error('Failed to fetch draw results.'));
    };
  });
}

export async function getLatestDrawDate(drawName: string): Promise<string | null> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('drawName');
    const request = index.openCursor(drawName, 'prev'); // Open cursor in reverse order for 'drawName'

    let latestDate: string | null = null;
    
    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
      if (cursor) {
        // Since there's no direct index on date within drawName, we iterate and find max.
        // This could be slow for very large datasets.
        // A better way is to sort after getAll, or rely on getAll already returning in some order
        // For now, this iterates. Simpler: get all and sort, then take first.
        // The 'prev' direction on drawName index doesn't guarantee date order.
        // The getDrawResults already sorts. We can reuse that.
         if (!latestDate || new Date(cursor.value.date) > new Date(latestDate)) {
          latestDate = cursor.value.date;
        }
        cursor.continue();
      } else {
         // If no cursor, means no records for that drawName, or iteration finished.
         // If using the simpler method (getAll and sort), this logic changes.
         // Let's use simpler method:
         getDrawResults(drawName).then(results => {
            if (results.length > 0) {
                resolve(results[0].date); // results are sorted descending by date
            } else {
                resolve(null);
            }
         }).catch(reject);
      }
    };
    request.onerror = () => {
      reject(new Error('Failed to get latest draw date.'));
    };
  });
}


export async function clearDrawData(drawName: string): Promise<void> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('drawName');
    const request = index.openCursor(IDBKeyRange.only(drawName));

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
      if (cursor) {
        store.delete(cursor.primaryKey);
        cursor.continue();
      } else {
        resolve(); // All matching entries deleted
      }
    };
    
    transaction.oncomplete = () => {
      resolve();
    };

    transaction.onerror = () => {
      console.error('Transaction error on clear:', transaction.error);
      reject(new Error('Failed to clear draw data.'));
    };
  });
}
