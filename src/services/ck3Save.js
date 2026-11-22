import JSZip from 'jszip'

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
  if (key.startsWith('e_')) return 'Empire'
  if (key.startsWith('k_')) return 'Kingdom'
  if (key.startsWith('d_')) return 'Duchy'
  if (key.startsWith('c_')) return 'County'
  if (key.startsWith('b_')) return 'Barony'
  return 'Title'
}

/**
 * Decompresses a .ck3 archive, extracts gamestate, and creates a player recap.
 * @param {File} file The local CK3 save file selected by the user.
 * @returns {Promise<object>} Normalized player, dynasty, trait, title, and holding data.
 * @throws {Error} When the file, archive, gamestate, player, or character is unavailable.
 */
export async function parseCk3Save(file) {
  if (!file || typeof file.name !== 'string' || !file.name.toLowerCase().endsWith('.ck3')) {
    throw new Error('Please select a Crusader Kings III .ck3 save file.')
  }

  let zip
  try {
    zip = await JSZip.loadAsync(await file.arrayBuffer())
  } catch {
    throw new Error('This file is not a readable CK3 archive.')
  }

  const gamestateEntry = zip.file('gamestate')
  if (!gamestateEntry) {
    throw new Error('The archive does not contain a gamestate file.')
  }

  let text
  try {
    text = await gamestateEntry.async('string')
  } catch {
    throw new Error('The gamestate file could not be decompressed.')
  }

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

  const firstName = readScalar(character, 'first_name')
  const nicknameText = readScalar(character, 'nickname_text')
  const nickname = readScalar(character, 'nickname')
  const dynastyHouseId = readScalar(character, 'dynasty_house')
  const traitIds = readArray(character, 'traits')

  let houseName = null
  let dynastyId = null
  if (dynastyHouseId) {
    const houses = findBlock(text, 'dynasty_house')
    const house = houses ? findRecord(houses, dynastyHouseId) : null
    if (house) {
      houseName = readScalar(house, 'localized_name')
      dynastyId = readScalar(house, 'dynasty')
    }
  }

  let dynastyName = null
  if (dynastyId) {
    const dynasties = findBlock(text, 'dynasties')
    const dynasty = dynasties ? findRecord(dynasties, dynastyId) : null
    if (dynasty) {
      dynastyName = readScalar(dynasty, 'name')?.replace(/^dynn_/, '') || null
    }
  }

  const landedTitles = findBlock(text, 'landed_titles')
  const heldTitles = []
  const holdings = []

  if (landedTitles) {
    for (const record of readTopLevelRecords(landedTitles)) {
      const holder = readScalar(record.content, 'holder')
      if (holder !== characterId) continue

      const titleKey = readScalar(record.content, 'key') || record.key
      const titleName = findTitleName(record.content) || titleKey
      const title = {
        id: titleKey,
        name: titleName,
        rank: getTitleRank(titleKey),
      }

      heldTitles.push(title)
      if (titleKey.startsWith('c_') || titleKey.startsWith('b_')) {
        holdings.push(title)
      }
    }
  }

  return {
    characterId,
    firstName: firstName || 'Unknown character',
    nicknameText: nicknameText || null,
    nickname: nickname || null,
    houseName,
    dynastyName,
    traitIds,
    heldTitles,
    holdings,
  }
}
