import { useEffect, useRef, useState } from 'react'
import PlayerCharacterRecap from './components/PlayerCharacterRecap.jsx'
import DynastyBrowserPage from './components/DynastyBrowserPage.jsx'
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
  const [fileSize, setFileSize] = useState(0)
  const [localSaves, setLocalSaves] = useState([])
  const [libraryLoaded, setLibraryLoaded] = useState(false)
  const [importProgress, setImportProgress] = useState({ percent: 0, label: '' })
  const [selectedCharacterId, setSelectedCharacterId] = useState(null)
  const [headerHidden, setHeaderHidden] = useState(false)
  const [page, setPage] = useState(
    window.location.hash === '#library'
      ? 'library'
      : window.location.hash === '#dynasty'
        ? 'dynasty'
        : 'profile',
  )

  useEffect(() => {
    /**
     * Updates the active in-app page when the URL hash changes.
     * @returns {void}
     */
    function handleHashChange() {
      if (window.location.hash === '#library') setPage('library')
      else if (window.location.hash === '#dynasty') setPage('dynasty')
      else setPage('profile')
    }

    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  useEffect(() => {
    /**
     * Hides the fixed title while scrolling down and restores it while scrolling up.
     * @returns {() => void} Cleanup for the scroll listener.
     */
    let previousScrollY = window.scrollY
    function handleScroll() {
      const currentScrollY = window.scrollY
      if (currentScrollY < 16) setHeaderHidden(false)
      else if (currentScrollY > previousScrollY + 4) setHeaderHidden(true)
      else if (currentScrollY < previousScrollY - 4) setHeaderHidden(false)
      previousScrollY = currentScrollY
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    /**
     * Loads the browser-local save list on application start.
     * @returns {Promise<void>}
     */
    async function loadLibrary() {
      try {
        const records = await listLocalSaves()
        setLocalSaves(records)
        const newestSave = records[0]
        if (newestSave?.profile) {
          setProfile(newestSave.profile)
          setSelectedCharacterId(newestSave.profile.characterId)
          setFileName(newestSave.name)
          setStatus('success')
        }
      } catch (caughtError) {
        setError(caughtError instanceof Error ? caughtError.message : 'The local save library is unavailable.')
      } finally {
        setLibraryLoaded(true)
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
    setFileSize(file.size)
    setStatus('loading')
    setError('')
    setProfile(null)
    setImportProgress({ percent: 0, label: 'Reading the selected save...' })

    try {
      const parsedProfile = await parseCk3Save(file, (progress) => {
        setImportProgress(progress)
      })
      setImportProgress({ percent: 98, label: 'Saving this profile in your browser library...' })
      const record = await saveLocalSave(file, parsedProfile)
      setProfile(parsedProfile)
      setSelectedCharacterId(parsedProfile.characterId)
      setLocalSaves((current) => [record, ...current])
      setImportProgress({ percent: 100, label: 'Save import complete.' })
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
    setSelectedCharacterId(record.profile?.characterId || null)
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
    setLocalSaves((current) => {
      const remaining = current.filter((record) => record.id !== id)
      if (current[0]?.id === id) {
        const nextSave = remaining[0]
        if (nextSave?.profile) {
          setProfile(nextSave.profile)
          setSelectedCharacterId(nextSave.profile.characterId)
          setFileName(nextSave.name)
          setStatus('success')
        } else {
          setProfile(null)
          setSelectedCharacterId(null)
          setFileName('')
          setStatus('idle')
        }
      }
      return remaining
    })
  }

  /**
   * Removes every save from browser-local storage.
   * @returns {Promise<void>}
   */
  async function removeAllStoredSaves() {
    await clearLocalSaves()
    setLocalSaves([])
    setProfile(null)
    setSelectedCharacterId(null)
    setFileName('')
    setStatus('idle')
    setError('')
  }

  /**
   * Opens a selected character in the profile page and its Traits tab.
   * @param {string} characterId Stable character ID.
   * @returns {void}
   */
  function openCharacter(characterId) {
    setSelectedCharacterId(characterId)
    setPage('profile')
    if (window.location.hash !== '#profile') {
      window.history.pushState(null, '', '#profile')
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' })
  }

  const hasLoadedSave = Boolean(profile)
  const hasSavedLibraryState = libraryLoaded && localSaves.length > 0

  return (
    <main className="app-shell">
      <div className="app-content">
        <header className={`app-header${headerHidden ? ' app-header-hidden' : ''}`}>
          <div className="app-header-title">
            <p className="eyebrow">Crusader Kings III companion</p>
            <h1>Dynasty Chronicle</h1>
          </div>

          <nav className="app-navigation" aria-label="Application pages">
            <div className="app-navigation-primary">
              <a href="#profile" aria-current={page === 'profile' ? 'page' : undefined}>
                Character
              </a>
              <a href="#dynasty" aria-current={page === 'dynasty' ? 'page' : undefined}>
                Dynasty
              </a>
            </div>
            <div className="app-navigation-secondary">
              <a href="#library" aria-current={page === 'library' ? 'page' : undefined}>
                Saves
              </a>
            </div>
          </nav>

          <input
            ref={fileInputRef}
            className="visually-hidden"
            type="file"
            accept=".ck3"
            onChange={handleFileChange}
            disabled={status === 'loading'}
          />

          {libraryLoaded && (
            <button
              className={`import-button ${hasLoadedSave || hasSavedLibraryState ? 'import-button-fixed' : 'import-button-empty'}`}
              type="button"
              onClick={chooseFile}
              disabled={status === 'loading'}
            >
              {status === 'loading'
                ? 'Reading save...'
                : hasLoadedSave || hasSavedLibraryState
                  ? 'Import save'
                  : 'Import .ck3 save'}
            </button>
          )}

          {profile && page === 'profile' && (
            <button
              className="character-view-actions"
              type="button"
              onClick={() => openCharacter(profile.characterId)}
            >
              Select player character
            </button>
          )}
        </header>

        {page === 'dynasty' ? (
          profile
            ? (
                <DynastyBrowserPage
                  profile={profile}
                  onSelect={openCharacter}
                />
              )
            : <p className="empty-value">Import a save to browse its dynasty.</p>
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

        {status === 'loading' && (
          <div className="import-progress" role="status" aria-live="polite">
            <div className="import-progress-copy">
              <strong>{importProgress.label}</strong>
              <span>{importProgress.percent}%</span>
            </div>
            <progress
              max="100"
              value={importProgress.percent}
              aria-label={importProgress.label}
            />
            <p className="status-message">
              {fileName} · {fileSize >= 1024 * 1024
                ? `${(fileSize / 1024 / 1024).toFixed(1)} MB`
                : `${Math.max(1, Math.ceil(fileSize / 1024))} KB`}
            </p>
          </div>
        )}

        {status === 'error' && (
          <p className="error-message" role="alert">{error}</p>
        )}

        {profile && (
          <div className="character-view">
            <PlayerCharacterRecap
              key={`${profile.characterId}:${selectedCharacterId || profile.characterId}`}
              profile={profile}
              selectedCharacterId={selectedCharacterId || profile.characterId}
              onSelect={openCharacter}
            />
          </div>
        )}
          </>
        )}
      </div>
    </main>
  )
}

export default App
