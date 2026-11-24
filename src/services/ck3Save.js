import JSZip from 'jszip'
import { TRAIT_NAMES } from '../data/traitNames.js'
import {
  LEGACY_TRACK_XP_TRAITS,
  TRACKED_TRAIT_ICON_STEMS,
} from '../data/traitIcons.js'
import { DISEASE_TRAITS, INJURY_TRAITS } from '../data/traitHealth.js'
import { FAME_LEVELS, PIETY_LEVELS } from '../data/currencyLevels.js'

/**
 * Finds a named brace-delimited block and returns its inner text.
 * @param {string} text The complete CK3 gamestate text.
 * @param {string} name The block name to locate.
 * @returns {string|null} The block content, or null when the block is absent.
 */
function findBlock(text, name) {
  const match = new RegExp(`(?:^|[\\s{])${name}=\\{`, 'm').exec(text)
  if (!match) return null

  const openingBrace = text.indexOf('{', match.index)
  let depth = 0

  for (let index = openingBrace; index < text.length; index += 1) {
    if (text[index] === '{') depth += 1
    if (text[index] === '}') {
      depth -= 1
      if (depth === 0) return text.slice(openingBrace + 1, index)
    }
  }

  throw new Error(`Could not find the end of the ${name} block`)
}

/**
 * Finds a numeric or named record inside a CK3 section.
 * @param {string} block The section or enclosing block to search.
 * @param {string|number} id The record ID.
 * @returns {string|null} The record content, or null when it is absent.
 */
function findRecord(block, id) {
  const escapedId = String(id).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const match = new RegExp(`(?:^|[\\s])${escapedId}=\\{`, 'm').exec(block)
  if (!match) return null

  const openingBrace = block.indexOf('{', match.index)
  let depth = 0

  for (let index = openingBrace; index < block.length; index += 1) {
    if (block[index] === '{') depth += 1
    if (block[index] === '}') {
      depth -= 1
      if (depth === 0) return block.slice(openingBrace + 1, index)
    }
  }

  return null
}

/**
 * Reads one scalar assignment from a block.
 * @param {string} block The CK3 block to search.
 * @param {string} key The assignment key.
 * @returns {string|null} The unquoted value or null when the key is absent.
 */
function readScalar(block, key) {
  const match = new RegExp(`(?:^|\\n)\\s*${key}=([^\\n\\r]+)`, 'm').exec(block)
  if (!match) return null

  const value = match[1].trim()
  if (value.startsWith('"') && value.endsWith('"')) {
    return value.slice(1, -1)
  }
  return value
}

/**
 * Reads a brace-delimited list of scalar values.
 * @param {string} block The CK3 block to search.
 * @param {string} key The list key.
 * @returns {string[]} Parsed list values.
 */
function readArray(block, key) {
  const match = new RegExp(`(?:^|\\n)\\s*${key}=\\{([^}]*)\\}`, 'm').exec(block)
  if (!match) return []

  return match[1].trim().split(/\s+/).filter(Boolean)
}

/**
 * Reads every repeated scalar assignment for a key in a CK3 block.
 * @param {string} block The CK3 block to search.
 * @param {string} key The repeated assignment key.
 * @returns {string[]} Every scalar value found.
 */
function readRepeated(block, key) {
  const values = []
  const pattern = new RegExp(`(?:^|\\n)\\s*${key}=([^\\n\\r]+)`, 'gm')
  let match
  while ((match = pattern.exec(block)) !== null) {
    const value = match[1].trim()
    if (value && value !== '{}') values.push(value)
  }
  return values
}

/**
 * Reads ID assignments that may be scalar repeats or brace-delimited lists.
 * @param {string} block The CK3 block to search.
 * @param {string} key The relationship key.
 * @returns {string[]} Unique numeric or named IDs in source order.
 */
function readIdList(block, key) {
  const ids = new Set(readArray(block, key))

  for (const value of readRepeated(block, key)) {
    if (value.startsWith('{') && value.endsWith('}')) {
      for (const id of value.slice(1, -1).trim().split(/\s+/).filter(Boolean)) {
        ids.add(id)
      }
    } else if (/^[A-Za-z0-9_.-]+$/.test(value)) {
      ids.add(value)
    }
  }

  return [...ids]
}

/**
 * Finds direct top-level ID-keyed records in a landed-titles or similar block.
 * @param {string} block The parent block content.
 * @returns {{key: string, content: string}[]} Direct record keys and contents.
 */
function readTopLevelRecords(block) {
  const records = []
  const pattern = /^([A-Za-z0-9_.-]+)=\{/gm
  let match

  while ((match = pattern.exec(block)) !== null) {
    const key = match[1]
    const openingBrace = pattern.lastIndex - 1

    let recordDepth = 0
    let content
    for (let recordIndex = openingBrace; recordIndex < block.length; recordIndex += 1) {
      if (block[recordIndex] === '{') recordDepth += 1
      if (block[recordIndex] === '}') {
        recordDepth -= 1
        if (recordDepth === 0) {
          content = block.slice(openingBrace + 1, recordIndex)
          pattern.lastIndex = recordIndex + 1
          break
        }
      }
    }

    if (content !== undefined) records.push({ key, content })
  }

  return records
}

/**
 * Gets a localized title display name from title name metadata.
 * @param {string} titleBlock The landed-title record content.
 * @returns {string|null} The localized title name or null.
 */
function findTitleName(titleBlock) {
  const nameData = findBlock(titleBlock, 'title_name_data')
  return nameData ? readScalar(nameData, 'name') : null
}

/**
 * Converts a CK3 title key prefix into a display rank.
 * @param {string} key The CK3 title key.
 * @returns {string} A human-readable title rank.
 */
function getTitleRank(key) {
  if (key.startsWith('h_')) return 'Hegemony'
  if (key.startsWith('e_')) return 'Empire'
  if (key.startsWith('k_')) return 'Kingdom'
  if (key.startsWith('d_')) return 'Duchy'
  if (key.startsWith('c_')) return 'County'
  if (key.startsWith('b_')) return 'Barony'
  return 'Title'
}

/**
 * Removes CK3's numeric localization suffix from a character first name.
 * @param {string|null} firstName The raw first_name value from the save.
 * @returns {string|null} The display name without a trailing _N suffix.
 */
function normalizeFirstName(firstName) {
  if (!firstName) return null
  return firstName.replace(/_\d+$/, '').trim() || null
}

/**
 * Resolves numeric save trait IDs through traits_lookup and display names.
 * @param {string} gamestate The complete CK3 gamestate text.
 * @param {string[]} traitIds Numeric trait IDs from the character record.
 * @param {string[]} traitXpAmounts Legacy tracked-lifestyle XP values.
 * @returns {{id: string, key: string, name: string}[]} Normalized trait records.
 */
function normalizeTraits(gamestate, traitIds, traitXpAmounts) {
  const lookupMatch = /(?:^|\n)\s*traits_lookup=\{([^}]*)\}/m.exec(gamestate)
  const keys = lookupMatch ? lookupMatch[1].trim().split(/\s+/).filter(Boolean) : []

  return traitIds.map((id) => {
    const numericId = Number(id)
    const key = keys[numericId] || `trait_${id}`
    if (key.startsWith('debug_')) return null
    const levelMatch = /_(\d)$/.exec(key)
    let level = levelMatch ? Number(levelMatch[1]) : null
    let iconCandidates = []

    if (level !== null) {
      iconCandidates.push(`${key.replace(/_\d$/, '')}_${level}`, key)
    } else if (TRACKED_TRAIT_ICON_STEMS[key]) {
      const trackIndex = LEGACY_TRACK_XP_TRAITS.indexOf(key)
      const xp = trackIndex >= 0 ? Number(traitXpAmounts[trackIndex]) : 0

      if (trackIndex >= 0 && Number.isFinite(xp)) {
        level = xp >= 100 ? 3 : xp >= 66 ? 2 : xp >= 33 ? 1 : null
      }

      const iconStem = TRACKED_TRAIT_ICON_STEMS[key]
      if (level) iconCandidates.push(`${iconStem}_${level}`)
      iconCandidates.push(`${iconStem}_base`, iconStem, key)
    } else {
      const knownAliases = {
        lifestyle_traveler: ['traveler', 'lifestyle_traveler'],
        tourney_participant: ['tournament', 'tourney_participant'],
        pilgrim: ['pilgrim_1', 'pilgrim', 'pilgrim_base'],
        child_of_concubine_female: ['child_of_concubine'],
        child_of_concubine_male: ['child_of_concubine'],
        knight_errant: ['knight_of_the_lion', 'knight_of_the_swan', 'knight_of_the_tiger'],
      }
      iconCandidates = knownAliases[key] || [key]
    }

    iconCandidates = iconCandidates.filter((candidate, index, candidates) =>
      candidate && candidates.indexOf(candidate) === index,
    )

    return {
      id,
      key,
      name: TRAIT_NAMES[key] || key
        .replaceAll('_', ' ')
        .replace(/\b\w/g, (letter) => letter.toUpperCase()),
      level,
      iconCandidates,
      acquisitionDate: null,
      acquisitionEvent: null,
    }
  }).filter(Boolean)
}

/**
 * Sorts held titles from the highest to lowest CK3 title tier.
 * @param {{rank: string}[]} titles Title records to sort.
 * @returns {{rank: string}[]} A new array ordered from best to worst.
 */
function sortTitlesByRank(titles) {
  const rankOrder = {
    Title: 0,
    Hegemony: 1,
    Empire: 2,
    Kingdom: 3,
    Duchy: 4,
    County: 5,
    Barony: 6,
  }

  return [...titles].sort((left, right) =>
    (rankOrder[left.rank] ?? 7) - (rankOrder[right.rank] ?? 7),
  )
}

/**
 * Maps CK3 title history types to readable acquisition labels.
 * @param {string} type CK3 history type.
 * @returns {string} Readable cause label.
 */
function formatTitleCause(type) {
  const causes = {
    granted: 'Granted',
    conquest_claim: 'Conquest claim',
    created: 'Created',
    inherited: 'Inherited',
    succession: 'Succession',
    conquered: 'Conquered',
    usurped: 'Usurped',
    revoked: 'Revoked',
    leased_out: 'Leased',
    lease_revoked: 'Lease revoked',
  }
  return causes[type] || type.replaceAll('_', ' ')
}

/**
 * Reads the latest acquisition event for a character from title history.
 * @param {string} titleBlock The landed-title record content.
 * @param {string} characterId Numeric player character ID.
 * @param {string|null} fallbackDate Current holder date.
 * @returns {{date: string|null, cause: string|null, holderId: string|null}} Acquisition metadata.
 */
function getTitleAcquisition(titleBlock, characterId, fallbackDate) {
  const history = findBlock(titleBlock, 'history')
  if (!history) {
    return { date: fallbackDate, cause: null, holderId: fallbackDate ? characterId : null }
  }

  const eventPattern = /([0-9]+\.[0-9]+\.[0-9]+)=\{([^}]*)\}/g
  const matchingEvents = []
  let match

  while ((match = eventPattern.exec(history)) !== null) {
    const holder = readScalar(match[2], 'holder')
    const type = readScalar(match[2], 'type')
    if (holder === characterId) {
      matchingEvents.push({ date: match[1], cause: type ? formatTitleCause(type) : null, holderId: holder })
    }
  }

  matchingEvents.sort((left, right) => right.date.localeCompare(left.date))
  return matchingEvents[0] || {
    date: fallbackDate,
    cause: null,
    holderId: fallbackDate ? characterId : null,
  }
}

/**
 * Parses a nested prestige or piety block and derives its accumulated level.
 * @param {string} characterBlock Character record content.
 * @param {'prestige'|'piety'} currencyKey Currency block key.
 * @param {{threshold: number, name: string}[]} levels CK3 level thresholds.
 * @returns {{current: string|null, accumulated: string|null, level: string|null}|null} Currency profile.
 */
function normalizeCurrency(characterBlock, currencyKey, levels) {
  const currencyBlock = findBlock(characterBlock, currencyKey)
  if (!currencyBlock) return null

  const current = readScalar(currencyBlock, 'currency')
  const accumulated = readScalar(currencyBlock, 'accumulated')
  const accumulatedNumber = Number(accumulated)
  let level = null

  if (accumulated !== null && Number.isFinite(accumulatedNumber)) {
    for (const candidate of levels) {
      if (accumulatedNumber >= candidate.threshold) level = candidate.name
    }
  }

  return {
    current,
    accumulated,
    level,
  }
}

/**
 * Builds a holder-indexed cache of titles and holdings for character normalization.
 * @param {string} gamestate The complete CK3 gamestate text.
 * @returns {Map<string, {heldTitles: object[], holdings: object[]}>} Titles grouped by holder ID.
 */
function buildTitleCache(gamestate) {
  const cache = new Map()
  const landedTitles = findBlock(gamestate, 'landed_titles')
  if (!landedTitles) return cache

  for (const record of readTopLevelRecords(landedTitles)) {
    const holder = readScalar(record.content, 'holder')
    if (!holder) continue

    const titleKey = readScalar(record.content, 'key') || record.key
    const titleName = findTitleName(record.content) || titleKey
    const holderDate = readScalar(record.content, 'date')
    const acquisition = getTitleAcquisition(record.content, holder, holderDate)
    const title = {
      id: titleKey,
      name: titleName,
      rank: getTitleRank(titleKey),
      acquisitionDate: acquisition.date,
      acquisitionCause: acquisition.cause,
      acquisitionHolderId: acquisition.holderId,
    }

    if (!cache.has(holder)) cache.set(holder, { heldTitles: [], holdings: [] })
    const holderTitles = cache.get(holder)
    if (titleKey.startsWith('c_') || titleKey.startsWith('b_')) {
      holderTitles.holdings.push(title)
    } else {
      holderTitles.heldTitles.push(title)
    }
  }

  for (const holderTitles of cache.values()) {
    holderTitles.heldTitles = sortTitlesByRank(holderTitles.heldTitles)
    holderTitles.holdings = sortTitlesByRank(holderTitles.holdings)
  }
  return cache
}

/**
 * Finds all character records available in the save's live and dead collections.
 * @param {string} gamestate The complete CK3 gamestate text.
 * @returns {Map<string, string>} Character IDs mapped to their record contents.
 */
function findCharacterRecords(gamestate) {
  const records = new Map()
  const collectionNames = ['characters', 'living', 'dead_unprunable', 'dead_prunable']

  for (const collectionName of collectionNames) {
    const collection = findBlock(gamestate, collectionName)
    if (!collection) continue
    for (const record of readTopLevelRecords(collection)) {
      if (!records.has(record.key)) records.set(record.key, record.content)
    }
  }

  return records
}

/**
 * Builds explicit living and dead character-ID sets from save collections.
 * @param {string} gamestate The complete CK3 gamestate text.
 * @returns {{livingIds: Set<string>, deadIds: Set<string>}} Character status sets.
 */
function findCharacterStatusSets(gamestate) {
  const livingIds = new Set()
  const deadIds = new Set()

  for (const collectionName of ['living']) {
    const collection = findBlock(gamestate, collectionName)
    if (!collection) continue
    for (const record of readTopLevelRecords(collection)) livingIds.add(record.key)
  }

  for (const collectionName of ['dead_unprunable', 'dead_prunable']) {
    const collection = findBlock(gamestate, collectionName)
    if (!collection) continue
    for (const record of readTopLevelRecords(collection)) deadIds.add(record.key)
  }

  return { livingIds, deadIds }
}

/**
 * Finds every house ID linked to one dynasty ID.
 * @param {string} gamestate The complete CK3 gamestate text.
 * @param {string} dynastyId The stable dynasty ID.
 * @returns {Set<string>} House IDs belonging to the dynasty.
 */
function findHouseIdsForDynasty(gamestate, dynastyId) {
  const houseIds = new Set()
  const dynasties = findBlock(gamestate, 'dynasties')
  if (!dynasties) return houseIds

  for (const record of readTopLevelRecords(dynasties)) {
    const recordDynastyId = readScalar(record.content, 'dynasty')
    if (recordDynastyId === dynastyId) houseIds.add(record.key)
  }
  return houseIds
}

/**
 * Reads explicit and reverse-parent family links from one character record.
 * @param {string} characterRecord Character record content.
 * @returns {{parentIds: string[], childIds: string[], spouseIds: string[]}} Direct family links.
 */
function readDirectFamilyLinks(characterRecord) {
  const family = findBlock(characterRecord, 'family_data')
  const parentIds = []
  const childIds = family
    ? readIdList(family, 'child')
    : readIdList(characterRecord, 'child')
  const spouseIds = family
    ? [...new Set([
        ...readIdList(family, 'spouse'),
        ...readIdList(family, 'former_spouses'),
      ])]
    : readIdList(characterRecord, 'spouse')

  for (const key of ['father', 'mother', 'real_father', 'real_mother', 'parent']) {
    const value = (family ? readScalar(family, key) : null) || readScalar(characterRecord, key)
    if (value && !parentIds.includes(value)) parentIds.push(value)
  }
  if (family) {
    for (const key of ['father', 'mother', 'real_father', 'real_mother']) {
      for (const value of readIdList(family, key)) {
        if (!parentIds.includes(value)) parentIds.push(value)
      }
    }
  }

  const primarySpouseId = (family ? readScalar(family, 'primary_spouse') : null)
    || readScalar(characterRecord, 'primary_spouse')
  if (primarySpouseId && !spouseIds.includes(primarySpouseId)) {
    spouseIds.unshift(primarySpouseId)
  }

  return { parentIds, childIds, spouseIds }
}

/**
 * Yields control to the browser event loop so progress updates can paint.
 * @returns {Promise<void>} A promise that resolves on the next timer turn.
 */
function yieldToBrowser() {
  return new Promise((resolve) => {
    window.setTimeout(resolve, 0)
  })
}

/**
 * Resolves a character's house and dynasty IDs and display names.
 * @param {string} gamestate The complete CK3 gamestate text.
 * @param {string|null} dynastyHouseId The character's house ID.
 * @param {Map<string|null, object>} [houseCache] Optional resolved house metadata cache.
 * @returns {{dynastyHouseId: string|null, houseName: string|null, dynastyId: string|null, dynastyName: string|null}} House and dynasty metadata.
 */
function resolveHouseAndDynasty(gamestate, dynastyHouseId, houseCache) {
  if (houseCache?.has(dynastyHouseId)) return houseCache.get(dynastyHouseId)
  if (!dynastyHouseId) {
    const result = { dynastyHouseId: null, houseName: null, dynastyId: null, dynastyName: null }
    houseCache?.set(dynastyHouseId, result)
    return result
  }

  let house = null
  const dynasties = findBlock(gamestate, 'dynasties')
  if (dynasties) house = findRecord(dynasties, dynastyHouseId)
  if (!house) house = findRecord(gamestate, dynastyHouseId)

  if (!house) {
    const result = { dynastyHouseId, houseName: null, dynastyId: null, dynastyName: null }
    houseCache?.set(dynastyHouseId, result)
    return result
  }

  const houseName = readScalar(house, 'localized_name') || readScalar(house, 'name')
  const dynastyId = readScalar(house, 'dynasty')
  let dynastyName = null

  if (dynastyId) {
    let dynasty = dynasties ? findRecord(dynasties, dynastyId) : null
    if (!dynasty) dynasty = findRecord(gamestate, dynastyId)
    if (dynasty) {
      dynastyName = readScalar(dynasty, 'localized_name')
        || readScalar(dynasty, 'name')?.replace(/^dynn_/, '')
        || null
    }
  }

  const result = { dynastyHouseId, houseName, dynastyId, dynastyName }
  houseCache?.set(dynastyHouseId, result)
  return result
}

/**
 * Normalizes one character record for profile and dynasty-directory use.
 * @param {string} gamestate The complete CK3 gamestate text.
 * @param {string} characterId The stable character ID.
 * @param {string} character The character record content.
 * @param {string|null} playerCharacterId The currently controlled character ID.
 * @param {Map<string, {heldTitles: object[], holdings: object[]}>} titleCache Holder-indexed title cache.
 * @param {Map<string|null, object>} houseCache Resolved house metadata cache.
 * @param {{livingIds: Set<string>, deadIds: Set<string>}|null} statusSets Explicit character status sets.
 * @returns {object} Normalized character profile.
 */
function normalizeCharacter(gamestate, characterId, character, playerCharacterId, titleCache, houseCache, statusSets = null) {
  const firstName = readScalar(character, 'first_name')
  const nicknameText = readScalar(character, 'nickname_text')
  const nickname = readScalar(character, 'nickname')
  const dynastyHouseId = readScalar(character, 'dynasty_house')
  const traitIds = readArray(character, 'traits')
  const traitXpAmounts = readArray(character, 'trait_xp_amounts')
  const traits = normalizeTraits(gamestate, traitIds, traitXpAmounts)
  const fame = normalizeCurrency(character, 'prestige', FAME_LEVELS)
  const piety = normalizeCurrency(character, 'piety', PIETY_LEVELS)
  const diseaseTraits = traits.filter((trait) => DISEASE_TRAITS[trait.key]).map((trait) => ({
    ...trait,
    name: DISEASE_TRAITS[trait.key],
  }))
  const injuryTraits = traits.filter((trait) => INJURY_TRAITS[trait.key]).map((trait) => ({
    ...trait,
    name: INJURY_TRAITS[trait.key],
  }))
  const ordinaryTraits = traits.filter((trait) =>
    !DISEASE_TRAITS[trait.key] && !INJURY_TRAITS[trait.key],
  )
  let house = resolveHouseAndDynasty(gamestate, dynastyHouseId, houseCache)
  const directDynastyId = readScalar(character, 'dynasty')
  if (directDynastyId && house.dynastyHouseId) {
    console.warn(
      `[CK3] Character ${characterId} has direct dynasty=${directDynastyId}; house ${house.dynastyHouseId} resolved dynasty=${house.dynastyId || 'unresolved'}`,
    )
  }
  if (!house.dynastyId && directDynastyId) {
    house = { ...house, dynastyId: directDynastyId }
  }
  const familyLinks = readDirectFamilyLinks(character)
  const primarySpouseId = familyLinks.spouseIds[0] || null
  const spouseIds = familyLinks.spouseIds
  const childIds = familyLinks.childIds
  const parentIds = familyLinks.parentIds

  const characterTitles = titleCache.get(characterId) || { heldTitles: [], holdings: [] }
  const deadData = findBlock(character, 'dead_data')
  const death = readScalar(character, 'death')
    || (deadData
      ? readScalar(deadData, 'date') || readScalar(deadData, 'death')
      : null)
  const isAlive = statusSets
    ? (statusSets.livingIds.has(characterId)
      || (!statusSets.deadIds.has(characterId) && !deadData && !death))
    : (!deadData && !death)

  return {
    characterId,
    isPlayer: characterId === playerCharacterId,
    isAlive,
    firstName: normalizeFirstName(firstName) || 'Unknown character',
    birth: readScalar(character, 'birth'),
    death,
    sex: readScalar(character, 'female') === 'yes' ? 'Female' : 'Male',
    nicknameText: nicknameText || null,
    nickname: nickname || null,
    ...house,
    traitIds,
    traits: ordinaryTraits,
    diseaseTraits,
    injuryTraits,
    fame,
    piety,
    heldTitles: characterTitles.heldTitles,
    holdings: characterTitles.holdings,
    primarySpouseId,
    spouseIds,
    childIds,
    parentIds,
  }
}

/**
 * Decompresses a .ck3 archive, extracts gamestate, and creates a player recap.
 * @param {File} file The local CK3 save file selected by the user.
 * @param {(progress: {percent: number, label: string})=>void} [onProgress] Optional import progress callback.
 * @returns {Promise<object>} Normalized player, dynasty, trait, title, and holding data.
 * @throws {Error} When the file, archive, gamestate, player, or character is unavailable.
 */
export async function parseCk3Save(file, onProgress) {
  if (!file || typeof file.name !== 'string' || !file.name.toLowerCase().endsWith('.ck3')) {
    throw new Error('Please select a Crusader Kings III .ck3 save file.')
  }

  /**
   * Reports one named stage of save parsing.
   * @param {number} percent Completion percentage.
   * @param {string} label User-facing current operation.
   * @returns {void}
   */
  function reportProgress(percent, label) {
    onProgress?.({ percent: Math.max(0, Math.min(100, percent)), label })
  }

  reportProgress(5, 'Reading the selected save...')

  let zip
  try {
    zip = await JSZip.loadAsync(await file.arrayBuffer(), {
      onUpdate(metadata) {
        reportProgress(
          Math.round(5 + (metadata.percent * 0.25)),
          'Decompressing the save archive...',
        )
      },
    })
  } catch {
    throw new Error('This file is not a readable CK3 archive.')
  }

  const gamestateEntry = zip.file('gamestate')
  if (!gamestateEntry) {
    throw new Error('The archive does not contain a gamestate file.')
  }

  reportProgress(32, 'Extracting gamestate data...')

  let text
  try {
    text = await gamestateEntry.async('string', (metadata) => {
      reportProgress(
        Math.round(32 + (metadata.percent * 0.18)),
        'Reading character and dynasty records...',
      )
    })
  } catch {
    throw new Error('The gamestate file could not be decompressed.')
  }

  reportProgress(52, 'Resolving the player character...')

  const playedCharacter = findBlock(text, 'played_character')
  const playerId = playedCharacter
    ? readScalar(playedCharacter, 'character')
    : null
  const playerBlock = findBlock(text, 'player')
  const fallbackPlayerId = playerBlock ? readScalar(playerBlock, 'owner') : null
  const characterId = playerId || fallbackPlayerId

  if (!characterId) {
    throw new Error('No player-controlled character could be found in this save.')
  }

  const characters = findBlock(text, 'characters')
  const living = findBlock(text, 'living')
  let character = characters ? findRecord(characters, characterId) : null
  if (!character && living) character = findRecord(living, characterId)
  if (!character) {
    throw new Error(`The player character record ${characterId} was not found.`)
  }

  reportProgress(55, 'Normalizing the player character...')
  const titleCache = buildTitleCache(text)
  const houseCache = new Map()
  const statusSets = findCharacterStatusSets(text)
  const playerProfile = normalizeCharacter(
    text,
    characterId,
    character,
    characterId,
    titleCache,
    houseCache,
    statusSets,
  )
  console.log('[CK3] Player dynasty resolution', {
    characterId,
    houseId: playerProfile.dynastyHouseId,
    dynastyId: playerProfile.dynastyId,
    houseName: playerProfile.houseName,
    dynastyName: playerProfile.dynastyName,
  })
  const characterRecords = findCharacterRecords(text)
  if (!characterRecords.has(characterId)) characterRecords.set(characterId, character)
  const dynastyProfilesById = new Map()
  const houseIds = playerProfile.dynastyId
    ? findHouseIdsForDynasty(text, playerProfile.dynastyId)
    : new Set([playerProfile.dynastyHouseId].filter(Boolean))
  if (playerProfile.dynastyHouseId) houseIds.add(playerProfile.dynastyHouseId)

  reportProgress(60, 'Finding characters from the player dynasty...')
  const characterEntries = [...characterRecords.entries()]
  for (let startIndex = 0; startIndex < characterEntries.length; startIndex += 250) {
    const characterChunk = characterEntries.slice(startIndex, startIndex + 250)
    for (const [recordId, recordContent] of characterChunk) {
      const dynastyHouseId = readScalar(recordContent, 'dynasty_house')
      const directDynastyId = readScalar(recordContent, 'dynasty')
      const belongsToDynasty = houseIds.has(dynastyHouseId)
        || (playerProfile.dynastyId && directDynastyId === playerProfile.dynastyId)

      if (!belongsToDynasty) continue

      const normalizedCharacter = recordId === characterId
        ? playerProfile
        : normalizeCharacter(
            text,
            recordId,
            recordContent,
            characterId,
            titleCache,
            houseCache,
            statusSets,
          )
      const links = readDirectFamilyLinks(recordContent)
      normalizedCharacter.parentIds = links.parentIds
      normalizedCharacter.childIds = links.childIds
      normalizedCharacter.spouseIds = links.spouseIds
      normalizedCharacter.primarySpouseId = links.spouseIds[0] || null
      normalizedCharacter.isDynastyMember = true
      dynastyProfilesById.set(recordId, normalizedCharacter)

      console.log(
        `[CK3] Dynasty character ${recordId}: ${normalizedCharacter.firstName}`,
        {
          houseId: normalizedCharacter.dynastyHouseId,
          dynastyId: normalizedCharacter.dynastyId,
          parents: normalizedCharacter.parentIds,
          children: normalizedCharacter.childIds,
          spouses: normalizedCharacter.spouseIds,
        },
      )
    }
    await yieldToBrowser()
  }

  reportProgress(82, 'Resolving direct spouses...')
  const characterDirectoryById = new Map(dynastyProfilesById)
  for (const member of dynastyProfilesById.values()) {
    for (const spouseId of member.spouseIds) {
      if (characterDirectoryById.has(spouseId)) continue
      const spouseRecord = characterRecords.get(spouseId)
      if (!spouseRecord) continue

      const spouseProfile = normalizeCharacter(
        text,
        spouseId,
        spouseRecord,
        characterId,
        titleCache,
        houseCache,
        statusSets,
      )
      spouseProfile.isDynastyMember = false
      characterDirectoryById.set(spouseId, spouseProfile)
      console.log(`[CK3] Direct spouse ${spouseId}: ${spouseProfile.firstName}`)
    }
  }

  const dynastyProfiles = [...dynastyProfilesById.values()]
  for (const candidate of dynastyProfiles) {
    for (const relative of dynastyProfiles) {
      if (relative.characterId === candidate.characterId) continue
      if (relative.childIds.includes(candidate.characterId)
        && !candidate.parentIds.includes(relative.characterId)) {
        candidate.parentIds.push(relative.characterId)
      }
    }
  }

  for (const candidate of dynastyProfiles) {
    const siblingIds = dynastyProfiles
      .filter((relative) => {
        if (relative.characterId === candidate.characterId) return false
        return candidate.parentIds.some((parentId) => relative.parentIds.includes(parentId))
      })
      .map((relative) => relative.characterId)
    candidate.siblingIds = siblingIds
  }

  reportProgress(95, 'Preparing the character profile...')
  const result = {
    ...playerProfile,
    dynastyId: playerProfile.dynastyId,
    characterDirectory: [...characterDirectoryById.values()],
    dynastyMembers: dynastyProfiles
      .sort((left, right) => left.firstName.localeCompare(right.firstName)),
  }
  reportProgress(100, 'Save import complete.')

  return result
}
