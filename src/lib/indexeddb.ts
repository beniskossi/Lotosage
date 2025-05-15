import type { DrawResult } from '@/lib/types';

const DB_NAME = 'LotoStatsDB';
const DB_VERSION = 1; // Keep version 1 if schema change (optional machine) is compatible
const STORE_NAME = 'lotteryData';

let dbPromise: Promise<IDBDatabase> | null = null;

function getDb(): Promise<IDBDatabase> {
  if (typeof window === 'undefined') {
    // This case should ideally not be hit in client-side logic but is a safeguard.
    return Promise.reject(new Error("IndexedDB cannot be accessed in this environment."));
  }
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('IndexedDB error:', request.error);
        reject(new Error('Failed to open IndexedDB.'));
        dbPromise = null; // Reset promise on error
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
          // Index for ensuring uniqueness of drawName + date combination
          store.createIndex('drawNameDate', ['drawName', 'date'], { unique: true });
          // Index for fetching all results for a specific drawName
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
  return new Promise<void>((resolve, reject) => { // Explicitly type Promise
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    let operationsPending = results.length;
    if (operationsPending === 0) {
      resolve();
      return;
    }

    results.forEach(result => {
      const index = store.index('drawNameDate');
      const getRequest = index.get([result.drawName, result.date]);

      getRequest.onsuccess = () => {
        if (!getRequest.result) { // Only add if it doesn't exist
          const addRequest = store.add(result);
          addRequest.onerror = () => {
            console.warn('Failed to add result:', addRequest.error, result);
            operationsPending--;
            if (operationsPending === 0) transaction.commit(); // Or handle error more gracefully
          };
          addRequest.onsuccess = () => {
            operationsPending--;
            if (operationsPending === 0) transaction.commit();
          };
        } else {
          operationsPending--; // Record exists, count as processed
          if (operationsPending === 0) transaction.commit();
        }
      };
      getRequest.onerror = (event) => {
         console.error('Error checking for existing result:', (event.target as IDBRequest).error);
         operationsPending--;
         if (operationsPending === 0) transaction.commit(); // Or handle error
      };
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

export async function getAllDraws(): Promise<DrawResult[]> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      resolve(request.result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    };
    request.onerror = () => {
      console.error('Error fetching all results:', request.error);
      reject(new Error('Failed to fetch all draw results.'));
    };
  });
}


export async function getDrawResultById(id: number): Promise<DrawResult | undefined> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);

    request.onsuccess = () => {
      resolve(request.result);
    };
    request.onerror = () => {
      console.error('Error fetching result by ID:', request.error);
      reject(new Error('Failed to fetch draw result by ID.'));
    };
  });
}

export async function updateDrawResult(result: DrawResult): Promise<void> {
  if (!result.id) return Promise.reject(new Error("Result ID is required for update."));
  const db = await getDb();
  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    // Check for potential duplicate drawName+date combination if those fields are being changed
    const index = store.index('drawNameDate');
    const getRequest = index.get([result.drawName, result.date]);

    getRequest.onsuccess = () => {
        // If a different record exists with the new drawName+date, prevent update
        if (getRequest.result && getRequest.result.id !== result.id) {
            reject(new Error('Another draw result with the same name and date already exists.'));
            return;
        }

        // Proceed with update
        const putRequest = store.put(result);
        putRequest.onerror = () => {
            console.error('Failed to update result:', putRequest.error);
            reject(new Error('Failed to update draw result.'));
        };
        putRequest.onsuccess = () => {
            // Operation successful
        };
    };
    getRequest.onerror = () => {
        console.error('Error checking for existing result during update:', getRequest.error);
        reject(new Error('Error while checking for duplicates during update.'));
    };
    
    transaction.oncomplete = () => {
      resolve();
    };
    transaction.onerror = () => {
      console.error('Transaction error on update:', transaction.error);
      // Don't reject here if individual putRequest.onerror handled it already
      // but if transaction itself fails for other reasons.
      if (!transaction.error?.message.includes('Another draw result')) { // Avoid double rejection
         reject(new Error('Transaction failed while updating draw result.'));
      }
    };
  });
}

export async function deleteDrawResult(id: number): Promise<void> {
  const db = await getDb();
  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onerror = () => {
      console.error('Failed to delete result:', request.error);
      reject(new Error('Failed to delete draw result.'));
    };
    // No onsuccess needed for delete specifically, transaction.oncomplete handles success
    
    transaction.oncomplete = () => {
      resolve();
    };
    transaction.onerror = () => {
      console.error('Transaction error on delete:', transaction.error);
      reject(new Error('Transaction failed while deleting draw result.'));
    };
  });
}


export async function getLatestDrawDate(drawName: string): Promise<string | null> {
  // Re-using getDrawResults which sorts by date descending
  try {
    const results = await getDrawResults(drawName);
    if (results.length > 0) {
      return results[0].date; // The first result is the latest
    }
    return null;
  } catch (error) {
    console.error("Error in getLatestDrawDate:", error);
    return null; // Or rethrow, depending on desired error handling
  }
}


export async function clearDrawData(drawName: string): Promise<void> {
  const db = await getDb();
  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('drawName');
    const request = index.openCursor(IDBKeyRange.only(drawName));

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
      if (cursor) {
        store.delete(cursor.primaryKey);
        cursor.continue();
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

// Helper function to add a single draw (used by Admin)
// This will respect the unique constraint on 'drawName' and 'date'
export async function addSingleDrawResult(result: Omit<DrawResult, 'id'>): Promise<number> {
  const db = await getDb();
  return new Promise<number>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('drawNameDate');

    // Check if a result with the same drawName and date already exists
    const checkRequest = index.get([result.drawName, result.date]);
    checkRequest.onsuccess = () => {
      if (checkRequest.result) {
        // A result with this drawName and date already exists.
        reject(new Error(`Un tirage pour "${result.drawName}" à la date ${result.date} existe déjà.`));
        return;
      }

      // No duplicate found, proceed to add
      const addRequest = store.add(result);
      addRequest.onsuccess = () => {
        resolve(addRequest.result as number); // Returns the ID of the added record
      };
      addRequest.onerror = () => {
        console.error('Failed to add single result:', addRequest.error);
        reject(new Error('Échec de l\'ajout du tirage.'));
      };
    };
    checkRequest.onerror = () => {
      console.error('Error checking for existing result during single add:', checkRequest.error);
      reject(new Error('Erreur lors de la vérification des doublons.'));
    };

    transaction.onerror = () => {
      // This error might be redundant if addRequest.onerror or checkRequest.onerror already rejected
      // console.error('Transaction error during single add:', transaction.error);
      // Avoid double rejection if specific errors handled above
      if (!transaction.error?.message.includes('existe déjà') && !transaction.error?.message.includes('Échec de l\'ajout')) {
        reject(new Error('La transaction a échoué lors de l\'ajout du tirage.'));
      }
    };
  });
}
