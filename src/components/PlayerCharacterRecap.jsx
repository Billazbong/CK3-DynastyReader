import { useState } from 'react'

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
 * Renders title or holding history with acquisition and loss dates.
 * @param {{items: Array<object>, emptyText: string}} props Historical title records.
 * @returns {JSX.Element} An empty-aware title history list.
 */
function FieldHistoryList({ items, emptyText }) {
  if (!Array.isArray(items) || !items.length) {
    return <p className="empty-value">{emptyText}</p>
  }

  return (
    <ul className="data-list">
      {items.map((item) => (
          <li key={`${item.titleId}-${item.acquisitionDate}-${item.lossDate || 'current'}`}>
            <div>
              <strong>{item.name}</strong>
              <small>
                Acquired {item.acquisitionDate || 'date unavailable'}
                {item.acquisitionCause ? ` — ${item.acquisitionCause}` : ' — Cause unavailable'}
              </small>
              {item.isCurrent ? (
                <small>Currently held</small>
              ) : (
                <small>
                  Lost {item.lossDate || 'date unavailable'}
                  {item.lossCause ? ` — ${item.lossCause}` : ' — Cause unavailable'}
                </small>
              )}
            </div>
            <span>{item.rank}</span>
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
 * Renders a character relationship as a keyboard-accessible profile link.
 * @param {{character: object|null, characterId: string, fallbackName?: string, onSelect: function}} props Relationship link data.
 * @returns {JSX.Element} A character link or unavailable value.
 */
function CharacterLink({ character, characterId, fallbackName, onSelect }) {
  if (!character) {
    return <p className="empty-value">{fallbackName || `Character ${characterId} unavailable in this save.`}</p>
  }

  return (
    <button
      type="button"
      className="character-link"
      onClick={() => onSelect(character.characterId)}
    >
      <strong>{character.firstName}</strong>
      {character.isPlayer && <small>Current player character</small>}
      {character.birth && <small>{character.birth}{character.death ? ` — ${character.death}` : ''}</small>}
    </button>
  )
}

/**
 * Renders a named list of direct character relationships.
 * @param {{title: string, characterIds: string[], membersById: Map<string, object>, onSelect: function}} props Relationship section data.
 * @returns {JSX.Element} A labeled relationship list.
 */
function RelationshipSection({ title, characterIds, membersById, onSelect }) {
  return (
    <section className="recap-section">
      <h3>{title}</h3>
      {characterIds.length ? (
        <div className="relationship-grid">
          {characterIds.map((characterId) => (
            <CharacterLink
              key={characterId}
              character={membersById.get(characterId)}
              characterId={characterId}
              onSelect={onSelect}
            />
          ))}
        </div>
      ) : (
        <p className="empty-value">No {title.toLowerCase()} recorded.</p>
      )}
    </section>
  )
}

/**
 * Renders the current player character's identity and recap fields.
 * @param {{profile: object, selectedCharacterId?: string, onSelect?: function}} props Normalized profile and optional selection callback.
 * @returns {JSX.Element} The tabbed character recap card.
 */
function PlayerCharacterRecap({ profile, selectedCharacterId: requestedCharacterId, onSelect }) {
  const [activeTab, setActiveTab] = useState('traits')
  const [selectedCharacterId, setSelectedCharacterId] = useState(
    requestedCharacterId || profile.characterId,
  )
  const dynastyMembers = Array.isArray(profile.dynastyMembers) ? profile.dynastyMembers : [profile]
  const characterDirectory = Array.isArray(profile.characterDirectory)
    ? profile.characterDirectory
    : dynastyMembers
  const membersById = new Map(characterDirectory.map((member) => [member.characterId, member]))
  const selected = membersById.get(selectedCharacterId) || profile

  /**
   * Switches the displayed character and keeps the family tabs useful.
   * @param {string} characterId The character ID to display.
   * @returns {void}
   */
  function selectCharacter(characterId) {
    setSelectedCharacterId(characterId)
    setActiveTab('traits')
    onSelect?.(characterId)
  }

  return (
    <article className="recap-card">
      <header className="recap-header">
        <p className="eyebrow">
          {selected.isPlayer
            ? 'Current player character'
            : selected.isDynastyMember
              ? 'Dynasty member'
              : 'Marriage / family relation'}
        </p>
        <h2>{selected.firstName}</h2>
        {selected.nicknameText && <p className="nickname">&ldquo;{selected.nicknameText}&rdquo;</p>}
      </header>

      <dl className="identity-grid">
        <div>
          <dt>House</dt>
          <dd>{selected.houseName || 'Unknown house'}</dd>
        </div>
        <div>
          <dt>Dynasty</dt>
          <dd>{selected.dynastyName || 'Unknown dynasty'}</dd>
        </div>
        <div>
          <dt>Lifespan</dt>
          <dd>{selected.birth || 'Birth unknown'}{selected.death ? ` — ${selected.death}` : ' — Living'}</dd>
        </div>
        <div>
          <dt>Sex</dt>
          <dd>{selected.sex || 'Unknown'}</dd>
        </div>
      </dl>

      <div className="profile-tabs" role="tablist" aria-label="Character details">
        {[
          ['traits', 'Traits'],
          ['titles', 'Titles & holdings'],
          ['family', 'Family'],
        ].map(([tabId, label]) => (
          <button
            key={tabId}
            type="button"
            role="tab"
            aria-selected={activeTab === tabId}
            onClick={() => setActiveTab(tabId)}
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'traits' && (
        <div role="tabpanel">
          <section className="recap-section" aria-labelledby="traits-heading">
            <h3 id="traits-heading">Traits</h3>
            <TraitList traits={selected.traits} />
          </section>
          <section className="recap-section" aria-labelledby="diseases-heading">
            <h3 id="diseases-heading">Diseases</h3>
            <HealthList traits={selected.diseaseTraits} emptyText="No diseases found." />
          </section>
          <section className="recap-section" aria-labelledby="injuries-heading">
            <h3 id="injuries-heading">Injuries</h3>
            <HealthList traits={selected.injuryTraits} emptyText="No injuries found." />
          </section>
          <section className="recap-section" aria-labelledby="status-heading">
            <h3 id="status-heading">Fame and Piety</h3>
            <dl className="identity-grid">
              <div>
                <dt>Prestige / Fame</dt>
                <dd>{selected.fame ? `${selected.fame.level || 'Unknown level'}` : 'Fame unavailable'}</dd>
              </div>
              <div>
                <dt>Piety</dt>
                <dd>{selected.piety ? `${selected.piety.level || 'Unknown level'}` : 'Piety unavailable'}</dd>
              </div>
            </dl>
          </section>
        </div>
      )}

      {activeTab === 'titles' && (
        <div role="tabpanel">
          <section className="recap-section" aria-labelledby="titles-heading">
            <h3 id="titles-heading">Current titles</h3>
            <FieldList items={selected.heldTitles || []} emptyText="No currently held titles." />
          </section>
          <section className="recap-section" aria-labelledby="holdings-heading">
            <h3 id="holdings-heading">Current holdings</h3>
            <FieldList items={selected.holdings || []} emptyText="No currently held county or barony holdings." />
          </section>
          <section className="recap-section" aria-labelledby="title-history-heading">
            <h3 id="title-history-heading">Title history</h3>
            <FieldHistoryList
              items={selected.titleHistory || []}
              emptyText="No title history found."
            />
          </section>
          <section className="recap-section" aria-labelledby="holding-history-heading">
            <h3 id="holding-history-heading">Holding history</h3>
            <FieldHistoryList
              items={selected.holdingHistory || []}
              emptyText="No county or barony history found."
            />
          </section>
        </div>
      )}

      {activeTab === 'family' && (
        <div role="tabpanel">
          <RelationshipSection
            title="Parents"
            characterIds={selected.parentIds || []}
            membersById={membersById}
            onSelect={selectCharacter}
          />
          <RelationshipSection
            title="Siblings"
            characterIds={selected.siblingIds || []}
            membersById={membersById}
            onSelect={selectCharacter}
          />
          <RelationshipSection
            title="Spouses"
            characterIds={selected.primarySpouseId
              ? [...new Set([selected.primarySpouseId, ...(selected.spouseIds || [])])]
              : (selected.spouseIds || [])}
            membersById={membersById}
            onSelect={selectCharacter}
          />
          <RelationshipSection
            title="Children"
            characterIds={selected.childIds || []}
            membersById={membersById}
            onSelect={selectCharacter}
          />
        </div>
      )}

    </article>
  )
}

export default PlayerCharacterRecap
