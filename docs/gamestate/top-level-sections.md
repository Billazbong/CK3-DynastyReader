# Top-level gamestate sections

This index is derived from the representative 1.18.3 save. Section presence and internal schemas can vary by game version or enabled DLC.

## Core

| Section | Purpose |
|---|---|
| `meta_data` | Save version, date, player name/title/house metadata, and achievements |
| `random_seed` | Random-generation state |
| `random_count` | Random-number counter state |
| `speed` | Saved game speed |
| `date` | Current game date |
| `bookmark_date` | Bookmark date |
| `first_start` | Initial campaign marker |
| `variables` | Global save variables |
| `traits_lookup` | Numeric trait-ID-to-key lookup |

## World records

| Section | Purpose |
|---|---|
| `provinces` | Province, barony, county, holding, and territory state |
| `landed_titles` | Landed title records, holders, history, claims, and names |
| `dynasties` | Dynasty, house, prestige, unity, coats of arms, and dynasty records |
| `character_lookup` | Character lookup/index records |
| `living` | Living character data |
| `dead_unprunable` | Historical/dead character data retained in the save |
| `characters` | Character manager metadata and character collections |
| `ruler_designer_characters` | Ruler-designer character records |
| `deleted_characters` | Deleted character tracking |

## Player and military

| Section | Purpose |
|---|---|
| `played_character` | Account-controlled character and UI/play-state settings |
| `currently_played_characters` | Currently selected playable characters |
| `units` | Army and regiment units |
| `armies` | Army grouping/gathering state |
| `fleets` | Fleet state when present |
| `mercenary_company_manager` | Mercenary companies |
| `holy_orders` | Holy orders |
| `war` / `wars` | War state |
| `sieges` | Siege state |
| `combat` / `combats` | Combat records |

## Characters and relationships

| Section | Purpose |
|---|---|
| `opinions` | Opinion records |
| `relations` | Character relationships and relations |
| `secrets` | Secrets, targets, and owners |
| `schemes` | Schemes |
| `stories` | Story cycles |
| `pending_character_interactions` | Pending interaction state |
| `character_memory_manager` | Character memories |
| `court_positions` | Court-position assignments |
| `council_task_manager` | Council-task state |
| `family and house state` | House relations and dynasty information |

## Realm and economy

| Section | Purpose |
|---|---|
| `holdings` | Holding and construction state |
| `county_manager` | County-level state |
| `vassal_contracts` | Vassal contracts |
| `succession` | Succession state |
| `tax_slot_manager` | Tax slot state |
| `great_projects` | Great projects |
| `title_and_vassal_change_manager` | Title and vassal-change queue/state |
| `barter_missions` | Barter-mission state |

## Religion and culture

| Section | Purpose |
|---|---|
| `religion` | Faith, religious-head, and related state |
| `culture_manager` | Culture state |
| `struggle_manager` | Regional struggle state |
| `diarchies` | Shared/diarchy rule state |

## Activities and managers

| Section | Purpose |
|---|---|
| `activity_manager` | Activities and tournaments |
| `triggered_event` | Triggered event records; repeated many times |
| `important_action_manager` | Important-action state |
| `faction_manager` | Factions |
| `travel_plans` | Travel plans |
| `accolades` | Accolades |
| `inspirations_manager` | Inspiration state |
| `epidemics` | Epidemic and disease state |
| `legends` | Legends |
| `domiciles` | Domiciles |
| `task_contracts` | Task contracts |
| `situation_manager` | Situations |
| `situation_sub_region_manager` | Situation sub-regions |
| `situation_participant_group_manager` | Situation participant groups |
| `migration_manager` | Migrations |
| `confederation_manager` | Confederations |
| `house_relations` | House-to-house relation state |

## Meta and automation

| Section | Purpose |
|---|---|
| `game_rules` | Enabled rules |
| `ironman_manager` | Ironman state |
| `coat_of_arms` | Shared coat-of-arms records |
| `next_player_event_id` | Next event ID |
| `artifacts` | Artifact records |
| `raid` | Raid state |
| `ai` | AI state |

## Repeated keys

Top-level `triggered_event` is a repeated key, not a single block. A parser must collect all matching top-level records into an array.
