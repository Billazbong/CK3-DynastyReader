/**
 * Renders an empty-aware list of string or title items.
 * @param {{items: Array<string|object>, emptyText: string}} props Component props.
 * @returns {JSX.Element} A list or empty-state message.
 */
function FieldList({ items, emptyText }) {
  if (!items.length) return <p className="empty-value">{emptyText}</p>

  return (
    <ul className="data-list">
      {items.map((item) => (
        <li key={item.id || item}>
          {typeof item === 'string'
            ? item
            : (
                <>
                  <div>
                    <strong>{item.name}</strong>
                    {item.acquisitionDate && (
                      <small>
                        Acquired {item.acquisitionDate}
                        {item.acquisitionCause ? ` — ${item.acquisitionCause}` : ' — Cause unavailable'}
                      </small>
                    )}
                  </div>
                  <span>{item.rank}</span>
                </>
              )}
        </li>
      ))}
    </ul>
  )
}

/**
 * Renders CK3 traits with their display names and browser-ready icons.
 * @param {{traits: Array<{id: string, key: string, name: string, iconCandidates: string[]}>}} props Trait records.
 * @returns {JSX.Element} A list of traits.
 */
function TraitList({ traits }) {
  if (!Array.isArray(traits) || !traits.length) {
    return <p className="empty-value">No traits found.</p>
  }

  return (
    <ul className="trait-list">
      {traits.map((trait) => (
        <li key={trait.id}>
          <img
            src={`/resources/traits/${trait.iconCandidates[0]}.webp`}
            alt=""
            width="48"
            height="48"
            data-icon-index="0"
            onError={(event) => {
              const image = event.currentTarget
              const iconIndex = Number(image.dataset.iconIndex || 0) + 1
              if (iconIndex < trait.iconCandidates.length) {
                image.dataset.iconIndex = String(iconIndex)
                image.src = `/resources/traits/${trait.iconCandidates[iconIndex]}.webp`
              } else {
                image.style.display = 'none'
              }
            }}
          />
          <span>{trait.name}</span>
        </li>
      ))}
    </ul>
  )
}

/**
 * Renders a health trait section with optional acquisition metadata.
 * @param {{traits: Array<object>, emptyText: string}} props Health records and empty state.
 * @returns {JSX.Element} A health trait list.
 */
function HealthList({ traits, emptyText }) {
  if (!Array.isArray(traits) || !traits.length) {
    return <p className="empty-value">{emptyText}</p>
  }

  return (
    <ul className="trait-list">
      {traits.map((trait) => (
        <li key={trait.id}>
          <img
            src={`/resources/traits/${trait.iconCandidates[0]}.webp`}
            alt=""
            width="48"
            height="48"
            data-icon-index="0"
            onError={(event) => {
              const image = event.currentTarget
              const iconIndex = Number(image.dataset.iconIndex || 0) + 1
              if (iconIndex < trait.iconCandidates.length) {
                image.dataset.iconIndex = String(iconIndex)
                image.src = `/resources/traits/${trait.iconCandidates[iconIndex]}.webp`
              } else {
                image.style.display = 'none'
              }
            }}
          />
          <div>
            <span>{trait.name}</span>
            <small>
              {trait.acquisitionDate
                ? `Acquired ${trait.acquisitionDate}`
                : 'Acquisition date unavailable'}
            </small>
          </div>
        </li>
      ))}
    </ul>
  )
}

/**
 * Renders the current player character's identity and recap fields.
 * @param {{profile: object}} props Normalized player profile data.
 * @returns {JSX.Element} The player character recap card.
 */
function PlayerCharacterRecap({ profile }) {
  return (
    <article className="recap-card">
      <header className="recap-header">
        <p className="eyebrow">Current player character</p>
        <h2>{profile.firstName}</h2>
        {profile.nicknameText && <p className="nickname">&ldquo;{profile.nicknameText}&rdquo;</p>}
      </header>

      <dl className="identity-grid">
        <div>
          <dt>House</dt>
          <dd>{profile.houseName || 'Unknown house'}</dd>
        </div>
        <div>
          <dt>Dynasty</dt>
          <dd>{profile.dynastyName || 'Unknown dynasty'}</dd>
        </div>
      </dl>

      <section className="recap-section" aria-labelledby="titles-heading">
        <h3 id="titles-heading">Titles</h3>
        <FieldList items={profile.heldTitles} emptyText="No held titles found." />
      </section>

      <section className="recap-section" aria-labelledby="holdings-heading">
        <h3 id="holdings-heading">Holdings</h3>
        <FieldList items={profile.holdings} emptyText="No county or barony holdings found." />
      </section>

      <section className="recap-section" aria-labelledby="traits-heading">
        <h3 id="traits-heading">Traits</h3>
        <TraitList traits={profile.traits} />
      </section>

      <section className="recap-section" aria-labelledby="diseases-heading">
        <h3 id="diseases-heading">Diseases</h3>
        <HealthList traits={profile.diseaseTraits} emptyText="No diseases found." />
      </section>

      <section className="recap-section" aria-labelledby="injuries-heading">
        <h3 id="injuries-heading">Injuries</h3>
        <HealthList traits={profile.injuryTraits} emptyText="No injuries found." />
      </section>

      <section className="recap-section" aria-labelledby="status-heading">
        <h3 id="status-heading">Fame and Piety</h3>
        <dl className="identity-grid">
          <div>
            <dt>Prestige / Fame</dt>
            <dd>
              {profile.fame
                ? `${profile.fame.level || 'Unknown level'}`
                : 'Fame unavailable'}
            </dd>
          </div>
          <div>
            <dt>Piety</dt>
            <dd>
              {profile.piety
                ? `${profile.piety.level || 'Unknown level'}`
                : 'Piety unavailable'}
            </dd>
          </div>
        </dl>
      </section>
    </article>
  )
}

export default PlayerCharacterRecap
