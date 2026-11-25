import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Removes duplicate relationship IDs and IDs already present on this branch.
 * @param {string[]} characterIds Relationship IDs from the save.
 * @param {Set<string>} excludedIds IDs that would duplicate or cycle this branch.
 * @returns {string[]} Unique IDs that can be rendered on this branch.
 */
function getVisibleCharacterIds(characterIds = [], excludedIds = new Set()) {
  return [...new Set(characterIds)].filter((characterId) => (
    characterId && !excludedIds.has(characterId)
  ))
}

/**
 * Resolves siblings from saved shared-parent IDs across available character records.
 * @param {object} character Character whose siblings are requested.
 * @param {Map<string, object>} membersById Available character directory.
 * @returns {string[]} Saved or shared-parent sibling IDs.
 */
function getSiblingCharacterIds(character, membersById) {
  const parentIds = new Set(character.parentIds || [])
  const directorySiblings = [...membersById.values()]
    .filter((relative) => (
      relative.characterId !== character.characterId
      && (relative.parentIds || []).some((parentId) => parentIds.has(parentId))
    ))
    .map((relative) => relative.characterId)
  return [...new Set([...(character.siblingIds || []), ...directorySiblings])]
}

/**
 * Preserves the primary spouse when older profiles lack a complete spouse list.
 * @param {object} character Character whose spouse IDs are requested.
 * @returns {string[]} Unique saved spouse IDs, with the primary spouse first.
 */
function getSpouseCharacterIds(character) {
  return getVisibleCharacterIds([
    character.primarySpouseId,
    ...(character.spouseIds || []),
  ])
}

/**
 * Sorts characters by saved birth date, placing unknown dates last.
 * @param {string[]} characterIds Character IDs to order.
 * @param {Map<string, object>} membersById Available character directory.
 * @returns {string[]} Character IDs ordered from oldest to youngest.
 */
function sortCharacterIdsByBirth(characterIds, membersById) {
  return [...new Set(characterIds)].sort((leftId, rightId) => {
    const left = membersById.get(leftId)
    const right = membersById.get(rightId)
    const leftDate = left?.birth?.match(/^\s*(-?\d+)[./-](\d+)[./-](\d+)/)
    const rightDate = right?.birth?.match(/^\s*(-?\d+)[./-](\d+)[./-](\d+)/)

    if (leftDate && rightDate) {
      for (let index = 1; index < 4; index += 1) {
        const difference = Number(leftDate[index]) - Number(rightDate[index])
        if (difference) return difference
      }
    } else if (leftDate) return -1
    else if (rightDate) return 1

    const nameOrder = (left?.firstName || '').localeCompare(right?.firstName || '')
    return nameOrder || leftId.localeCompare(rightId)
  })
}

/**
 * Chooses the single saved parent who carries the character's dynasty line.
 * @param {object} character Character whose dynasty parent is requested.
 * @param {Map<string, object>} membersById Available character directory.
 * @returns {string|null} The best matching parent ID, or null when none is saved.
 */
function getDynastyParentId(character, membersById) {
  const parentIds = getVisibleCharacterIds(character.parentIds || [])
  if (!parentIds.length) return null

  const sameDynastyParents = parentIds.filter((parentId) => (
    character.dynastyId
    && membersById.get(parentId)?.dynastyId === character.dynastyId
  ))
  let dynastyParents = sameDynastyParents
  if (!dynastyParents.length) {
    dynastyParents = parentIds.filter((parentId) => (
      membersById.get(parentId)?.isDynastyMember === true
    ))
  }
  if (!dynastyParents.length) return null

  const fatherId = dynastyParents.find((parentId) => (
    membersById.get(parentId)?.sex === 'Male'
  ))
  if (fatherId) return fatherId
  return dynastyParents[0] || parentIds[0]
}

/**
 * Formats the saved lifespan and explicit living status for a graph node.
 * @param {object|null|undefined} member Character directory record.
 * @returns {string} A lifespan summary that does not infer living status.
 */
function getCharacterSummary(member) {
  if (!member) return ''

  let summary = member.birth || 'Birth unknown'
  if (member.death) summary += ` — ${member.death}`
  else if (member.isAlive === true) summary += ' — Living'
  else if (member.isAlive === false) summary += ' — Deceased'
  else summary += ' — Status unavailable'
  return summary
}

/**
 * Renders a compact spouse card that can open a profile but cannot expand.
 * @param {{characterId: string, membersById: Map<string, object>, onOpenProfile: function}} props Spouse record and profile action.
 * @returns {JSX.Element} A non-expandable spouse node.
 */
function FamilyTreeSpouse({ characterId, membersById, onOpenProfile }) {
  const member = membersById.get(characterId)
  const memberName = member?.firstName || `Character ${characterId}`
  let summary = getCharacterSummary(member)
  if (!member) summary = `ID ${characterId}`
  let className = 'family-tree-spouse-card'
  if (member?.isAlive === true) className += ' family-tree-card-living'
  if (member?.isAlive === false) className += ' family-tree-card-deceased'

  return (
    <article className={className}>
      <span className="family-tree-node-role">Spouse</span>
      <strong>{memberName}</strong>
      <small>{summary}</small>
      {member && (
        <button type="button" onClick={() => onOpenProfile(characterId)}>
          Open profile
        </button>
      )}
      {!member && <small>Not available in this save.</small>}
    </article>
  )
}

/**
 * Renders one character node and any relationship branch the user expanded.
 * @param {{characterId: string, relation: string, label: string, membersById: Map<string, object>, activeCharacterId: string, expandedCharacterIds: Set<string>, ancestorIds: Set<string>, selectedNodeRef?: object, onToggle: function, onOpenProfile: function}} props Node data and graph actions.
 * @returns {JSX.Element} A family tree node and its expanded branch.
 */
function FamilyTreeNode({
  characterId,
  relation,
  label,
  membersById,
  activeCharacterId,
  expandedCharacterIds,
  ancestorIds,
  selectedNodeRef,
  onToggle,
  onOpenProfile,
}) {
  const member = membersById.get(characterId)
  const isExpanded = expandedCharacterIds.has(characterId)
  const isSelected = relation === 'selected'
  const isActive = activeCharacterId === characterId && !isSelected
  const canExpand = Boolean(member)
    && ['parent', 'child', 'sibling'].includes(relation)
  const memberName = member?.firstName || `Character ${characterId}`
  const nextAncestorIds = new Set([...ancestorIds, characterId])
  let selectedCardRef
  let nodeClassName = `family-tree-cohort-item family-tree-node-${relation}`
  let cardClassName = 'family-tree-card'
  let expansionLabel = 'Expand ancestors'
  let expansionHint = 'Show branch'
  if (isSelected) nodeClassName += ' family-tree-node-selected'
  if (isActive) nodeClassName += ' family-tree-node-active'
  if (member?.isAlive === true) cardClassName += ' family-tree-card-living'
  else if (member?.isAlive === false) cardClassName += ' family-tree-card-deceased'
  if (member?.isDynastyMember) cardClassName += ' family-tree-card-dynasty'
  if (relation !== 'parent') expansionLabel = 'Expand descendants'
  if (isExpanded) {
    expansionLabel = 'Collapse'
    expansionHint = 'Hide branch'
  }
  if (isSelected) selectedCardRef = selectedNodeRef

  let sectionsAboveNode = []
  let sectionsBelowNode = []
  let parentSiblingSections = []
  if (member && isExpanded && canExpand) {
    if (relation === 'parent') {
      sectionsAboveNode = [
        {
          title: `Parents of ${memberName}`,
          relation: 'parent',
          ids: [getDynastyParentId(member, membersById)].filter(Boolean),
        },
      ]
      parentSiblingSections = [
        {
          title: `Siblings of ${memberName}`,
          relation: 'sibling',
          ids: getSiblingCharacterIds(member, membersById),
        },
      ]
    } else {
      sectionsBelowNode = [
        { title: `Children of ${memberName}`, relation: 'child', ids: member.childIds || [] },
      ]
    }
  }

  let spouseIds = []
  if (member && ['selected', 'child', 'sibling'].includes(relation)) {
    spouseIds = getVisibleCharacterIds(getSpouseCharacterIds(member || {}), nextAncestorIds)
  }

  /**
   * Renders relationship cohorts above or below this character node.
   * @param {Array<{title: string, relation: string, ids: string[]}>} sections Relationship sections to render.
   * @param {string} className Positioning class for the sections.
   * @returns {JSX.Element|null} The requested branch sections, when present.
   */
  function renderRelationshipSections(sections, className) {
    if (!sections.length) return null

    return (
      <div className={className}>
        {sections.map((section) => {
          let visibleIds = getVisibleCharacterIds(section.ids, nextAncestorIds)
          if (section.relation === 'sibling' || section.relation === 'child') {
            visibleIds = sortCharacterIdsByBirth(visibleIds, membersById)
          }

          return (
            <section key={section.title} className="family-tree-expanded-group">
              <h4>{section.title}</h4>
              {visibleIds.length > 0 && (
                <ul className="family-tree-cohort family-tree-branch-cohort">
                  {visibleIds.map((relativeId) => {
                    let nodeLabel = section.relation
                    if (section.relation === 'parent') nodeLabel = 'Parent'

                    return (
                      <FamilyTreeNode
                        key={`${section.relation}-${relativeId}`}
                        characterId={relativeId}
                        relation={section.relation}
                        label={nodeLabel}
                        membersById={membersById}
                        activeCharacterId={activeCharacterId}
                        expandedCharacterIds={expandedCharacterIds}
                        ancestorIds={nextAncestorIds}
                        onToggle={onToggle}
                        onOpenProfile={onOpenProfile}
                      />
                    )
                  })}
                </ul>
              )}
              {!visibleIds.length && (
                <p className="family-tree-empty">No {section.title.toLowerCase()} recorded.</p>
              )}
            </section>
          )
        })}
      </div>
    )
  }

  const personCard = (
    <article ref={selectedCardRef} className={cardClassName}>
      <span className="family-tree-node-role">{label}</span>
      {canExpand && (
        <button
          type="button"
          className="family-tree-expand"
          aria-expanded={isExpanded}
          aria-label={`${expansionLabel} for ${memberName}`}
          onClick={() => onToggle(characterId)}
        >
          <strong>{memberName}</strong>
          <small>{getCharacterSummary(member)}</small>
          <span className="family-tree-expand-hint">{expansionHint}</span>
        </button>
      )}
      {!canExpand && (
        <div className="family-tree-person">
          <strong>{memberName}</strong>
          <small>
            {member && getCharacterSummary(member)}
            {!member && `ID ${characterId}`}
          </small>
        </div>
      )}
      {member && (
        <button
          type="button"
          className="family-tree-profile-action"
          onClick={() => onOpenProfile(characterId)}
        >
          Open profile
        </button>
      )}
      {!member && (
        <small className="family-tree-unavailable">
          This relationship is not available in the character directory.
        </small>
      )}
    </article>
  )

  let inlineSpouses = null
  if (spouseIds.length > 0) {
    inlineSpouses = (
      <div className="family-tree-inline-spouses" aria-label="Spouses">
        {spouseIds.map((spouseId) => (
          <FamilyTreeSpouse
            key={spouseId}
            characterId={spouseId}
            membersById={membersById}
            onOpenProfile={onOpenProfile}
          />
        ))}
      </div>
    )
  }
  const personGroup = (
    <div className="family-tree-person-group">
      {personCard}
      {inlineSpouses}
    </div>
  )

  let nodeBodyClassName = 'family-tree-node-body'
  if (spouseIds.length > 0) nodeBodyClassName += ' family-tree-node-body-has-spouses'

  let nodeBody
  if (parentSiblingSections.length > 0) {
    nodeBody = (
      <div className="family-tree-parent-node-body">
        <div className="family-tree-parent-node-main">
          {renderRelationshipSections(sectionsAboveNode, 'family-tree-ancestor-branch')}
          {personCard}
        </div>
        {renderRelationshipSections(parentSiblingSections, 'family-tree-parent-sibling-branch')}
      </div>
    )
  } else {
    nodeBody = (
      <div className={nodeBodyClassName}>
        {renderRelationshipSections(sectionsAboveNode, 'family-tree-ancestor-branch')}
        {personGroup}
        {renderRelationshipSections(sectionsBelowNode, 'family-tree-expanded-branch')}
        {relation === 'selected' && (
          <section className="family-tree-direct-children" aria-labelledby="family-tree-children-heading">
            <h4 id="family-tree-children-heading">Children</h4>
            {member?.childIds?.length > 0 && (
              <ul className="family-tree-cohort family-tree-branch-cohort">
                {sortCharacterIdsByBirth(member.childIds, membersById).map((childId) => (
                  <FamilyTreeNode
                    key={`child-${childId}`}
                    characterId={childId}
                    relation="child"
                    label="Child"
                    membersById={membersById}
                    activeCharacterId={activeCharacterId}
                    expandedCharacterIds={expandedCharacterIds}
                    ancestorIds={nextAncestorIds}
                    onToggle={onToggle}
                    onOpenProfile={onOpenProfile}
                  />
                ))}
              </ul>
            )}
            {!member?.childIds?.length && (
              <p className="family-tree-empty">No children recorded.</p>
            )}
          </section>
        )}
      </div>
    )
  }

  return (
    <li
      className={nodeClassName}
    >
      {nodeBody}
    </li>
  )
}

/**
 * Renders a relationship-rooted family tree with navigable generations.
 * @param {{character: object, membersById: Map<string, object>, onOpenProfile: function}} props Selected character and directory actions.
 * @returns {JSX.Element} A full-width family tree.
 */
function FamilyTree({ character, membersById, onOpenProfile }) {
  const viewportRef = useRef(null)
  const selectedNodeRef = useRef(null)
  const dragStateRef = useRef(null)
  const suppressClickRef = useRef(false)
  const [activeCharacterId, setActiveCharacterId] = useState(character.characterId)
  const [expandedCharacterIds, setExpandedCharacterIds] = useState(() => new Set())
  const rootIds = new Set([character.characterId])
  const siblingIds = getVisibleCharacterIds(
    getSiblingCharacterIds(character, membersById),
    rootIds,
  )
  const cohortIds = sortCharacterIdsByBirth(
    [...siblingIds, character.characterId],
    membersById,
  )
  const childIds = getVisibleCharacterIds(character.childIds || [], rootIds)
  const spouseIds = getVisibleCharacterIds(getSpouseCharacterIds(character), rootIds)
  const dynastyParentId = getDynastyParentId(character, membersById)
  const dynastyParent = membersById.get(dynastyParentId)
  let dynastyParentLabel = 'Dynasty parent'
  if (dynastyParent?.sex === 'Male') dynastyParentLabel = 'Father'
  else if (dynastyParent?.sex === 'Female') dynastyParentLabel = 'Mother'
  const cohortWidth = cohortIds.length * 190 + spouseIds.length * 124 + 80
  const childrenWidth = childIds.length * 190 + 80
  const minimumCanvasWidth = Math.max(960, cohortWidth, childrenWidth)

  /**
   * Highlights a character and toggles their contextual relationship branch.
   * @param {string} characterId The character whose branch is toggled.
   * @returns {void}
   */
  function toggleCharacter(characterId) {
    setActiveCharacterId(characterId)
    setExpandedCharacterIds((currentIds) => {
      const nextIds = new Set(currentIds)
      if (nextIds.has(characterId)) nextIds.delete(characterId)
      else nextIds.add(characterId)
      return nextIds
    })
  }

  /**
   * Scrolls the family canvas horizontally by most of its visible width.
   * @param {number} direction -1 scrolls left and 1 scrolls right.
   * @returns {void}
   */
  function scrollFamilyTree(direction) {
    const viewport = viewportRef.current
    if (!viewport) return
    viewport.scrollBy({
      left: direction * viewport.clientWidth * 0.8,
      behavior: 'smooth',
    })
  }

  /**
   * Starts a mouse or pen drag without interfering with native touch scrolling.
   * @param {PointerEvent} event Pointer press inside the graph viewport.
   * @returns {void}
   */
  function handlePointerDown(event) {
    if (!event.isPrimary || event.button !== 0 || event.pointerType === 'touch') return
    if (event.target.closest?.('input, textarea, select, [contenteditable="true"]')) return

    const viewport = viewportRef.current
    if (!viewport) return
    suppressClickRef.current = false
    dragStateRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      scrollLeft: viewport.scrollLeft,
      scrollTop: viewport.scrollTop,
      isDragging: false,
    }
  }

  /**
   * Scrolls both graph axes after the pointer crosses the drag threshold.
   * @param {PointerEvent} event Pointer movement inside or captured by the viewport.
   * @returns {void}
   */
  function handlePointerMove(event) {
    const dragState = dragStateRef.current
    const viewport = viewportRef.current
    if (!dragState || !viewport || event.pointerId !== dragState.pointerId) return

    const deltaX = event.clientX - dragState.startX
    const deltaY = event.clientY - dragState.startY
    if (!dragState.isDragging && Math.hypot(deltaX, deltaY) < 5) return
    if (!dragState.isDragging) {
      dragState.isDragging = true
      viewport.classList.add('family-tree-dragging')
      viewport.setPointerCapture(event.pointerId)
    }

    viewport.scrollLeft = dragState.scrollLeft - deltaX
    viewport.scrollTop = dragState.scrollTop - deltaY
    event.preventDefault()
  }

  /**
   * Ends a graph drag and suppresses the click generated by a completed drag.
   * @param {PointerEvent} event Pointer release, cancellation, or capture loss.
   * @returns {void}
   */
  function handlePointerEnd(event) {
    const dragState = dragStateRef.current
    const viewport = viewportRef.current
    if (!dragState || !viewport || event.pointerId !== dragState.pointerId) return

    dragStateRef.current = null
    viewport.classList.remove('family-tree-dragging')
    if (viewport.hasPointerCapture(event.pointerId)) {
      viewport.releasePointerCapture(event.pointerId)
    }
    if (dragState.isDragging) {
      suppressClickRef.current = true
      setTimeout(() => {
        suppressClickRef.current = false
      }, 100)
    }
  }

  /**
   * Prevents a drag-release click from activating a family node.
   * @param {MouseEvent} event Click bubbling through the graph viewport.
   * @returns {void}
   */
  function handleClickCapture(event) {
    if (!suppressClickRef.current) return
    suppressClickRef.current = false
    event.preventDefault()
    event.stopPropagation()
  }

  /**
   * Centers the selected character in the horizontally navigable canvas.
   * @returns {void}
   */
  const centerSelectedCharacter = useCallback(() => {
    const viewport = viewportRef.current
    const selectedNode = selectedNodeRef.current
    if (!viewport || !selectedNode) return

    const viewportBounds = viewport.getBoundingClientRect()
    const selectedBounds = selectedNode.getBoundingClientRect()
    const selectedCenter = selectedBounds.left - viewportBounds.left
      + viewport.scrollLeft
      + (selectedBounds.width / 2)
    viewport.scrollLeft = Math.max(0, selectedCenter - (viewport.clientWidth / 2))
  }, [])

  useEffect(() => {
    centerSelectedCharacter()
  }, [centerSelectedCharacter, character.characterId])

  return (
    <section className="family-tree" aria-labelledby="family-tree-title">
      <header className="family-tree-header">
        <div>
          <h3 id="family-tree-title">Family tree</h3>
          <p>Relatives are ordered by birth date. Click and drag, or scroll and swipe, to explore the graph.</p>
        </div>
        <ul className="family-tree-legend" aria-label="Family tree legend">
          <li><span className="family-tree-legend-mark family-tree-legend-selected" /> Selected</li>
          <li><span className="family-tree-legend-mark family-tree-legend-expanded" /> Expanded</li>
          <li><span className="family-tree-legend-mark family-tree-legend-living" /> Living</li>
          <li><span className="family-tree-legend-mark family-tree-legend-deceased" /> Deceased</li>
          <li><span className="family-tree-legend-mark family-tree-legend-spouse" /> Spouse</li>
        </ul>
      </header>

      <nav className="family-tree-navigation" aria-label="Family tree navigation">
        <button type="button" onClick={() => scrollFamilyTree(-1)} aria-label="Scroll family tree left">
          Previous relatives
        </button>
        <button type="button" onClick={centerSelectedCharacter}>Center selected character</button>
        <button type="button" onClick={() => scrollFamilyTree(1)} aria-label="Scroll family tree right">
          More relatives
        </button>
      </nav>

      <div
        ref={viewportRef}
        className="family-tree-viewport"
        role="region"
        aria-label={`Scrollable family tree for ${character.firstName}`}
        tabIndex={0}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        onLostPointerCapture={handlePointerEnd}
        onClickCapture={handleClickCapture}
      >
        <div
          className="family-tree-canvas"
          style={{ '--family-tree-min-width': `${minimumCanvasWidth}px` }}
        >
          <section className="family-tree-generation family-tree-parent-generation" aria-labelledby="family-tree-parents-heading">
            <h4 id="family-tree-parents-heading">Parents</h4>
            <ul className="family-tree-parent-pair family-tree-parent-pair-single">
              {dynastyParentId && (
                <FamilyTreeNode
                  characterId={dynastyParentId}
                  relation="parent"
                  label={dynastyParentLabel}
                  membersById={membersById}
                  activeCharacterId={activeCharacterId}
                  expandedCharacterIds={expandedCharacterIds}
                  ancestorIds={rootIds}
                  onToggle={toggleCharacter}
                  onOpenProfile={onOpenProfile}
                />
              )}
              {!dynastyParentId && (
                <li className="family-tree-parent-empty">Dynasty parent not recorded</li>
              )}
            </ul>
          </section>

          <section className="family-tree-generation family-tree-sibling-generation" aria-labelledby="family-tree-siblings-heading">
            <h4 id="family-tree-siblings-heading">Siblings and selected character</h4>
            <ul className="family-tree-cohort family-tree-main-cohort">
              {cohortIds.map((cohortId) => {
                let relation = 'sibling'
                let label = 'Sibling'
                if (cohortId === character.characterId) {
                  relation = 'selected'
                  label = 'Selected character'
                }

                return (
                  <FamilyTreeNode
                    key={cohortId}
                    characterId={cohortId}
                    relation={relation}
                    label={label}
                    membersById={membersById}
                    activeCharacterId={activeCharacterId}
                    expandedCharacterIds={expandedCharacterIds}
                    ancestorIds={rootIds}
                    selectedNodeRef={selectedNodeRef}
                    onToggle={toggleCharacter}
                    onOpenProfile={onOpenProfile}
                  />
                )
              })}
            </ul>
          </section>
        </div>
      </div>
    </section>
  )
}

export default FamilyTree
