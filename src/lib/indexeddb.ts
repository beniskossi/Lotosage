
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
        dbPromise = null; 
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
  return new Promise<void>((resolve, reject) => { 
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
        if (!getRequest.result) { 
          const addRequest = store.add(result);
          addRequest.onerror = () => {
            console.warn('Failed to add result:', addRequest.error, result);
            operationsPending--;
            if (operationsPending === 0) transaction.commit(); 
          };
          addRequest.onsuccess = () => {
            operationsPending--;
            if (operationsPending === 0) transaction.commit();
          };
        } else {
          operationsPending--; 
          if (operationsPending === 0) transaction.commit();
        }
      };
      getRequest.onerror = (event) => {
         console.error('Error checking for existing result:', (event.target as IDBRequest).error);
         operationsPending--;
         if (operationsPending === 0) transaction.commit(); 
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
      resolve(request.result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())); 
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
    
    const index = store.index('drawNameDate');
    const getRequest = index.get([result.drawName, result.date]);

    getRequest.onsuccess = () => {
        if (getRequest.result && getRequest.result.id !== result.id) {
            reject(new Error('Another draw result with the same name and date already exists.'));
            return;
        }

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
      let specificErrorHandled = false;
      if (transaction.error) {
          const errorMessage = (transaction.error as IDBRequest['error'])?.message || '';
          if (errorMessage.includes('Another draw result')) { 
              specificErrorHandled = true;
          }
      }
      if (!specificErrorHandled) {
         reject(new Error('Transaction failed while updating draw result. Raison: ' + ((transaction.error as IDBRequest['error'])?.message || 'Inconnue')));
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
  try {
    const results = await getDrawResults(drawName);
    if (results.length > 0) {
      return results[0].date; 
    }
    return null;
  } catch (error) {
    console.error("Error in getLatestDrawDate:", error);
    return null; 
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

export async function addSingleDrawResult(result: Omit<DrawResult, 'id'>): Promise<number> {
  const db = await getDb();
  return new Promise<number>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('drawNameDate');

    const checkRequest = index.get([result.drawName, result.date]);
    checkRequest.onsuccess = () => {
      if (checkRequest.result) {
        reject(new Error(`Un tirage pour "${result.drawName}" à la date ${result.date} existe déjà.`));
        return;
      }

      const addRequest = store.add(result);
      addRequest.onsuccess = () => {
        resolve(addRequest.result as number); 
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
        console.error('Transaction error during single add:', transaction.error);
        let specificErrorHandled = false;
        if (transaction.error) { // Check if transaction.error exists
            const errorMessage = (transaction.error as IDBRequest['error'])?.message || ''; // Safely access message
            if (errorMessage.includes('existe déjà') || errorMessage.includes('Échec de l\'ajout')) {
                specificErrorHandled = true;
            }
        }
        if (!specificErrorHandled) {
            reject(new Error('La transaction a échoué lors de l\'ajout du tirage. Raison: ' + ((transaction.error as IDBRequest['error'])?.message || 'Inconnue')));
        }
    };
  });
}

