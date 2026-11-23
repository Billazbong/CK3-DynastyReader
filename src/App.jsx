import { useEffect, useRef, useState } from 'react'
import PlayerCharacterRecap from './components/PlayerCharacterRecap.jsx'
import TraitCatalogPage from './components/TraitCatalogPage.jsx'
import { parseCk3Save } from './services/ck3Save.js'
import {
  clearLocalSaves,
  deleteLocalSave,
  listLocalSaves,
  saveLocalSave,
} from './services/localSaveLibrary.js'

/**
 * Top-level application component for save import and player recap state.
 * @returns {JSX.Element} The Dynasty Chronicle application.
 */
function App() {
  const fileInputRef = useRef(null)
  const [profile, setProfile] = useState(null)
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')
  const [fileName, setFileName] = useState('')
  const [localSaves, setLocalSaves] = useState([])
  const [page, setPage] = useState(
    window.location.hash === '#traits'
      ? 'traits'
      : window.location.hash === '#library'
        ? 'library'
        : 'profile',
  )

  useEffect(() => {
    /**
     * Updates the active in-app page when the URL hash changes.
     * @returns {void}
     */
    function handleHashChange() {
      if (window.location.hash === '#traits') setPage('traits')
      else if (window.location.hash === '#library') setPage('library')
      else setPage('profile')
    }

    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  useEffect(() => {
    /**
     * Loads the browser-local save list on application start.
     * @returns {Promise<void>}
     */
    async function loadLibrary() {
      try {
        setLocalSaves(await listLocalSaves())
      } catch (caughtError) {
        setError(caughtError instanceof Error ? caughtError.message : 'The local save library is unavailable.')
      }
    }

    loadLibrary()
  }, [])

  /**
   * Reads the selected save and updates loading, error, or profile state.
   * @param {import('react').ChangeEvent<HTMLInputElement>} event The file input event.
   * @returns {Promise<void>}
   */
  async function handleFileChange(event) {
    const file = event.target.files?.[0]
    if (!file) return

    setFileName(file.name)
    setStatus('loading')
    setError('')
    setProfile(null)

    try {
      const parsedProfile = await parseCk3Save(file)
      const record = await saveLocalSave(file, parsedProfile)
      setProfile(parsedProfile)
      setLocalSaves((current) => [record, ...current])
      setStatus('success')
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'The save could not be imported.')
      setStatus('error')
    } finally {
      event.target.value = ''
    }
  }

  /**
   * Opens the hidden file picker through the visible import button.
   * @returns {void}
   */
  function chooseFile() {
    fileInputRef.current?.click()
  }

  /**
   * Reopens a profile already stored in the browser-local library.
   * @param {object} record Stored save record.
   * @returns {Promise<void>}
   */
  async function openStoredSave(record) {
    setProfile(record.profile)
    setFileName(record.name)
    setStatus('success')
    setError('')
    setPage('profile')
  }

  /**
   * Removes one save from browser-local storage.
   * @param {string} id Library record ID.
   * @returns {Promise<void>}
   */
  async function removeStoredSave(id) {
    await deleteLocalSave(id)
    setLocalSaves((current) => current.filter((record) => record.id !== id))
  }

  /**
   * Removes every save from browser-local storage.
   * @returns {Promise<void>}
   */
  async function removeAllStoredSaves() {
    await clearLocalSaves()
    setLocalSaves([])
  }

  return (
    <main className="app-shell">
      <div className="app-content">
        <header className="app-header">
          <p className="eyebrow">Crusader Kings III companion</p>
          <h1>Dynasty Chronicle</h1>
        </header>

        <nav className="app-navigation" aria-label="Application pages">
          <a href="#profile" aria-current={page === 'profile' ? 'page' : undefined}>
            Character
          </a>
          <a href="#library" aria-current={page === 'library' ? 'page' : undefined}>
            Saves
          </a>
          <a href="#traits" aria-current={page === 'traits' ? 'page' : undefined}>
            Traits
          </a>
        </nav>

        {page === 'traits' ? (
          <TraitCatalogPage />
        ) : page === 'library' ? (
          <section className="save-library" aria-labelledby="save-library-title">
            <header className="library-header">
              <p className="eyebrow">This browser only</p>
              <h2 id="save-library-title">Saved CK3 files</h2>
              <p className="library-note">
                Saves remain in IndexedDB on this device and browser. They are not uploaded.
              </p>
            </header>

            {localSaves.length === 0 ? (
              <p className="empty-value">No saves stored locally.</p>
            ) : (
              <>
                <div className="library-actions">
                  <button type="button" className="secondary-button" onClick={removeAllStoredSaves}>
                    Clear all saves
                  </button>
                </div>
                <ul className="save-library-list">
                  {localSaves.map((record) => (
                    <li key={record.id}>
                      <div>
                        <strong>{record.profile?.firstName || record.name}</strong>
                        <span>{record.name}</span>
                        <small>
                          {new Date(record.storedAt).toLocaleString()} · {Math.ceil(record.size / 1024 / 1024)} MB
                        </small>
                      </div>
                      <div className="library-item-actions">
                        <button type="button" onClick={() => openStoredSave(record)}>Open</button>
                        <button type="button" onClick={() => removeStoredSave(record.id)}>Delete</button>
                      </div>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </section>
        ) : (
          <>

        <input
          ref={fileInputRef}
          className="visually-hidden"
          type="file"
          accept=".ck3"
          onChange={handleFileChange}
          disabled={status === 'loading'}
        />

        <button
          className="import-button"
          type="button"
          onClick={chooseFile}
          disabled={status === 'loading'}
        >
          {status === 'loading' ? 'Reading save...' : profile ? 'Import another save' : 'Import .ck3 save'}
        </button>

        {status === 'loading' && (
          <p className="status-message" role="status">
            Decompressing {fileName} and resolving the player character...
          </p>
        )}

        {status === 'error' && (
          <p className="error-message" role="alert">{error}</p>
        )}

        {profile && <PlayerCharacterRecap profile={profile} />}
          </>
        )}
      </div>
    </main>
  )
}

export default App
