const DATABASE_NAME = 'ck3-dynasty-reader'
const DATABASE_VERSION = 1
const STORE_NAME = 'saves'

/**
 * Opens or creates the browser-local save library database.
 * @returns {Promise<IDBDatabase>} The IndexedDB database handle.
 */
function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION)

    request.onupgradeneeded = () => {
      const database = request.result
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        const store = database.createObjectStore(STORE_NAME, { keyPath: 'id' })
        store.createIndex('storedAt', 'storedAt')
        store.createIndex('name', 'name')
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error || new Error('Could not open the local save library.'))
  })
}

/**
 * Runs a read/write transaction and resolves with its requested result.
 * @param {'readonly'|'readwrite'} mode Transaction mode.
 * @param {(store: IDBObjectStore) => IDBRequest} operation Store operation.
 * @returns {Promise<unknown>} IndexedDB operation result.
 */
async function runStoreOperation(mode, operation) {
  const database = await openDatabase()

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, mode)
    const store = transaction.objectStore(STORE_NAME)
    const request = operation(store)

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error || new Error('The local save library operation failed.'))
    transaction.oncomplete = () => database.close()
    transaction.onerror = () => database.close()
  })
}

/**
 * Stores an original CK3 Blob and its normalized player profile locally.
 * @param {File} file The selected CK3 file.
 * @param {object} profile The normalized character profile.
 * @returns {Promise<object>} The saved library record.
 */
export async function saveLocalSave(file, profile) {
  const record = {
    id: `${Date.now()}-${crypto.randomUUID()}`,
    name: file.name,
    size: file.size,
    type: file.type,
    file,
    profile,
    storedAt: new Date().toISOString(),
  }

  await runStoreOperation('readwrite', (store) => store.put(record))
  return record
}

/**
 * Lists locally stored save records from newest to oldest.
 * @returns {Promise<object[]>} Stored save metadata and profiles.
 */
export async function listLocalSaves() {
  const records = await runStoreOperation('readonly', (store) => store.getAll())
  return records
    .filter((record) => record?.file)
    .sort((left, right) => String(right.storedAt).localeCompare(String(left.storedAt)))
}

/**
 * Gets one locally stored save record.
 * @param {string} id Library record ID.
 * @returns {Promise<object|undefined>} The stored record or undefined.
 */
export async function getLocalSave(id) {
  return runStoreOperation('readonly', (store) => store.get(id))
}

/**
 * Deletes one locally stored save.
 * @param {string} id Library record ID.
 * @returns {Promise<unknown>} IndexedDB deletion result.
 */
export async function deleteLocalSave(id) {
  return runStoreOperation('readwrite', (store) => store.delete(id))
}

/**
 * Deletes every save in the browser-local library.
 * @returns {Promise<unknown>} IndexedDB clear result.
 */
export async function clearLocalSaves() {
  return runStoreOperation('readwrite', (store) => store.clear())
}
