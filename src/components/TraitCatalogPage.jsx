import { useMemo, useState } from 'react'
import { TRAIT_NAMES } from '../data/traitNames.js'
import { TRACKED_TRAIT_ICON_STEMS } from '../data/traitIcons.js'

/**
 * Gets all useful icon candidates for a catalog trait key.
 * @param {string} traitKey The CK3 trait key.
 * @returns {string[]} Icon stems without a file extension.
 */
function getCatalogIconCandidates(traitKey) {
  const trackedStem = TRACKED_TRAIT_ICON_STEMS[traitKey]
  if (trackedStem) {
    return [`${trackedStem}_1`, `${trackedStem}_2`, `${trackedStem}_3`, `${trackedStem}_base`, trackedStem]
  }

  const aliases = {
    lifestyle_traveler: ['traveler'],
    tourney_participant: ['tournament'],
    child_of_concubine_female: ['child_of_concubine'],
    child_of_concubine_male: ['child_of_concubine'],
    knight_errant: ['knight_of_the_lion', 'knight_of_the_swan', 'knight_of_the_tiger'],
  }

  return aliases[traitKey] || [traitKey]
}

/**
 * Determines whether a trait should be omitted from visible trait browsers.
 * @param {string} traitKey The CK3 trait key.
 * @returns {boolean} True when the trait can be shown to users.
 */
function isVisibleCatalogTrait(traitKey) {
  return !traitKey.startsWith('debug_')
}

/**
 * Gets education trait keys that belong to one display family.
 * @param {string} traitKey One numbered education trait key.
 * @returns {string|null} The education family stem.
 */
function getEducationStem(traitKey) {
  const match = /^(education_[a-z0-9_]+)_\d+$/.exec(traitKey)
  return match?.[1] || null
}

/**
 * Renders all bundled CK3 trait names and available icons.
 * @returns {JSX.Element} The searchable trait catalog.
 */
function TraitCatalogPage() {
  const [query, setQuery] = useState('')
  const traits = useMemo(
    () => {
      const catalog = new Map()

      for (const [key, name] of Object.entries(TRAIT_NAMES)) {
        if (!isVisibleCatalogTrait(key)) continue

        if (key === 'child_of_concubine_male') continue
        if (key === 'child_of_concubine_female') {
          catalog.set(key, {
            key,
            name,
            icons: getCatalogIconCandidates(key),
          })
          continue
        }

        if (key === 'knight_errant') {
          catalog.set(key, {
            key,
            name,
            icons: getCatalogIconCandidates(key),
          })
          continue
        }

        const educationStem = getEducationStem(key)
        if (educationStem) {
          const level = Number(key.slice(key.lastIndexOf('_') + 1))
          const existing = catalog.get(educationStem)
          if (existing) {
            existing.icons[level - 1] = key
            existing.levelNames[level - 1] = name
          } else {
            const icons = Array(5).fill(null)
            const levelNames = Array(5).fill(null)
            icons[level - 1] = key
            levelNames[level - 1] = name
            catalog.set(educationStem, {
              key: educationStem,
              name: `${educationStem.replace(/^education_/, '').replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())} Education`,
              icons,
              levelNames,
            })
          }
          continue
        }

        catalog.set(key, {
          key,
          name,
          icons: getCatalogIconCandidates(key),
        })
      }

      return [...catalog.values()]
        .map((trait) => ({
          ...trait,
          icons: trait.icons.filter(Boolean),
        }))
        .sort((left, right) => left.name.localeCompare(right.name))
    },
    [],
  )

  const normalizedQuery = query.trim().toLowerCase()
  const visibleTraits = normalizedQuery
    ? traits.filter((trait) =>
        trait.name.toLowerCase().includes(normalizedQuery)
        || trait.key.toLowerCase().includes(normalizedQuery),
      )
    : traits

  return (
    <section className="trait-catalog" aria-labelledby="trait-catalog-title">
      <header className="catalog-header">
        <p className="eyebrow">CK3 resource browser</p>
        <h2 id="trait-catalog-title">All traits</h2>
        <label className="trait-search">
          <span>Search traits</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Name or trait key"
          />
        </label>
        <p className="catalog-count" role="status">
          {visibleTraits.length} of {traits.length} traits
        </p>
      </header>

      <div className="trait-catalog-grid">
        {visibleTraits.map((trait) => (
          <article className="trait-catalog-card" key={trait.key}>
            <div className="trait-icon-row" aria-hidden="true">
              {trait.icons.map((iconKey) => (
                <img
                  key={iconKey}
                  src={`/resources/traits/${iconKey}.webp`}
                  alt=""
                  width="72"
                  height="72"
                  onError={(event) => {
                    event.currentTarget.remove()
                  }}
                />
              ))}
            </div>
            <h3>{trait.name}</h3>
            <code>{trait.key}</code>
          </article>
        ))}
      </div>
    </section>
  )
}

export default TraitCatalogPage
