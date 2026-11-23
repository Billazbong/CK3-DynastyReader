import { useEffect, useRef, useState } from 'react'
import PlayerCharacterRecap from './components/PlayerCharacterRecap.jsx'
import TraitCatalogPage from './components/TraitCatalogPage.jsx'
import { parseCk3Save } from './services/ck3Save.js'

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
  const [page, setPage] = useState(window.location.hash === '#traits' ? 'traits' : 'profile')

  useEffect(() => {
    /**
     * Updates the active in-app page when the URL hash changes.
     * @returns {void}
     */
    function handleHashChange() {
      setPage(window.location.hash === '#traits' ? 'traits' : 'profile')
    }

    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
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
      setProfile(parsedProfile)
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
          <a href="#traits" aria-current={page === 'traits' ? 'page' : undefined}>
            Traits
          </a>
        </nav>

        {page === 'traits' ? (
          <TraitCatalogPage />
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
