import { useMemo, useState } from 'react'

/**
 * Builds a searchable filter of dynasty members.
 * @param {{profile: object, onSelect: function}} props Dynasty profile and character-selection callback.
 * @returns {JSX.Element} A standalone dynasty search page.
 */
function DynastyBrowserPage({ profile, onSelect }) {
  const [query, setQuery] = useState('')
  const [house, setHouse] = useState('all')
  const [status, setStatus] = useState('all')
  const [sex, setSex] = useState('all')
  const members = useMemo(
    () => (Array.isArray(profile?.dynastyMembers) ? profile.dynastyMembers : []),
    [profile],
  )
  const houses = useMemo(
    () => [...new Set(members.map((member) => member.houseName).filter(Boolean))].sort(),
    [members],
  )

  const filteredMembers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    return members.filter((member) => {
      const matchesQuery = !normalizedQuery
        || member.firstName?.toLowerCase().includes(normalizedQuery)
        || member.nicknameText?.toLowerCase().includes(normalizedQuery)
      const matchesHouse = house === 'all' || member.houseName === house
      const matchesStatus = status === 'all'
        || (status === 'living' && member.isAlive !== false)
        || (status === 'dead' && member.isAlive === false)
      const matchesSex = sex === 'all' || member.sex === sex
      return matchesQuery && matchesHouse && matchesStatus && matchesSex
    })
  }, [house, members, query, sex, status])

  /**
   * Opens a dynasty member in the character profile's Traits tab.
   * @param {string} characterId Stable character ID.
   * @returns {void}
   */
  function selectMember(characterId) {
    onSelect(characterId)
  }

  return (
    <section className="dynasty-browser" aria-labelledby="dynasty-browser-title">
      <header className="catalog-header">
        <p className="eyebrow">Player dynasty</p>
        <h2 id="dynasty-browser-title">{profile?.dynastyName || 'Dynasty'}</h2>
      </header>

      <div className="dynasty-filter-grid" role="search">
        <label className="dynasty-filter">
          <span>Search</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Name or nickname"
          />
        </label>
        <label className="dynasty-filter">
          <span>House</span>
          <select value={house} onChange={(event) => setHouse(event.target.value)}>
            <option value="all">All houses</option>
            {houses.map((houseName) => (
              <option key={houseName} value={houseName}>{houseName}</option>
            ))}
          </select>
        </label>
        <label className="dynasty-filter">
          <span>Status</span>
          <select value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="all">Living and dead</option>
            <option value="living">Living</option>
            <option value="dead">Dead</option>
          </select>
        </label>
        <label className="dynasty-filter">
          <span>Sex</span>
          <select value={sex} onChange={(event) => setSex(event.target.value)}>
            <option value="all">All sexes</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
        </label>
      </div>

      <p className="dynasty-count">
        {filteredMembers.length} of {members.length} dynasty members
      </p>
      <div className="relationship-grid">
        {filteredMembers.map((member) => (
          <button
            key={member.characterId}
            type="button"
            className="character-link"
            onClick={() => selectMember(member.characterId)}
          >
            <strong>{member.firstName}</strong>
            {member.isPlayer && <small>Current player character</small>}
            {member.houseName && <small>{member.houseName}</small>}
            {member.birth && (
              <small>
                {member.birth}
                {member.death ? ` — ${member.death}` : ' — Living'}
              </small>
            )}
          </button>
        ))}
      </div>
      {!filteredMembers.length && (
        <p className="empty-value">No dynasty members match the selected filters.</p>
      )}
    </section>
  )
}

export default DynastyBrowserPage
