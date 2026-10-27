# Character: In the Game

Version 0.1, draft for review. Covers FR-24 and FR-25 and answers open question 3 of the specification. Items marked "Assumption" need confirmation.

## 1. Goals

- Every registered player has a character that is theirs, shown wherever their name appears
- A fantasy figure from layered art: a body per race, with hair and beards on top. Flat cel-shaded style, not a meeple and not a pixel figure
- Start simple and let achievements add visible upgrades (FR-25)
- Perks are cosmetic only. They never change ratings, statistics or what the app allows

## 2. Parts

A character is a choice of one item in each group. Free items are open from the first day.

| Group | Free items | Earned items |
|---|---|---|
| Race | Human, Elf, Dwarf, Orc, Tiefling | none |
| Skin tone | 10 tones, natural and fantasy | none |
| Hair | Bald, Short, Long, Topknot, Braids, Mohawk | none |
| Hair colour | 10 colours | none |
| Beard | None, Short, Long, Braided, Goatee, Moustache | none |
| Eye colour | 8 colours | none |
| Outfit colour | 8 colours for the basic tunic and trousers everyone wears | none |
| Background | 8 free: 5 plain colours, Dots, Stripes, Rings | 4 patterns: Confetti (Winner's Circle), Zigzag (Globetrotter), Stars (Centurion), Checker (Weekly Habit) |
| Badge | none | Any earned achievement can be worn as a small badge on the character |
| Accessory | none | 10 accessories, see section 3 |

A character can wear one accessory and one badge at a time. Guests and players who have not chosen anything see a disc in their own colour with the first letter of the name. Lists show a round portrait of the head; the profile can open the full figure.

## 3. Accessories and their perks

Every accessory is unlocked by one achievement from docs/achievements.md. The accessories are not drawn on the new figures yet: their art is a later step, and until then an accessory gives only its perk. A locked accessory shows the achievement that unlocks it (US-F2). Every accessory also has one cosmetic perk.

| Accessory | Unlocked by | Perk (cosmetic) |
|---|---|---|
| Party Hat | Regular | Confetti burst when the profile opens |
| Round Glasses | Explorer | A shine sweeps across the lenses now and then |
| Bow Tie | Not Alone | The character does a small bounce on hover |
| Headband | Hot Hand | A soft warm glow around the character |
| Headphones | Marathon | The character sways gently |
| Laurel Wreath | Champion | A gold ring around the avatar on leaderboards |
| Cape | Giant Slayer | A trailing swoosh when the profile opens |
| Captain Hat | Team Champion | The name gets a gradient on the profile |
| Star Crown | Dynasty | Sparkles around the character |
| Monocle | Elite | A slow gleam on the monocle and a gold name tag |

Perks are shown where the character is large (profile, Home). Small avatars in lists show the accessory only, so lists stay calm and fast.

## 4. Where the character appears

Everywhere a registered player's letter disc appears today: profile, Home, leaderboards, session rows, history, team pages and the log flow. Guests keep the letter disc.

## 5. Customizer

On the profile, a "Customize" screen with a large live preview and one row of options per group. Locked items are shown dimmed with the achievement that unlocks them. Saving checks on the server that every chosen item is free or earned.

## 6. Storage (proposal)

- `achievements`: the catalog of the 30 achievements, filled by a migration. Columns: id, code, name, description, tier, sort order
- `user_achievements`: who earned what and when. Columns: profile id, achievement id, earned at. One row per pair
- `profiles.character`: one JSON column with the chosen item codes, for example `{"race":"elf","skin":"olive","hair":"long","hairColor":"platinum","beard":"none","eyeColor":"green","outfitColor":"forest","background":"dots","accessory":"party-hat","badge":"first-win"}`. Null means no character yet. A saved choice from the first blob version keeps its background, accessory and badge, and the rest falls back to the defaults
- Item codes are defined in code (`src/lib/character/items.js`) together with the achievement that unlocks each accessory, so adding an item needs no migration
- Row Level Security: achievements readable by every logged-in user. `user_achievements` readable like a profile, written by the server only. `profiles.character` is written by its owner through the existing profile update rules

## 7. Decisions

1. 10 accessories and 5 free options per group are enough for the pilot. Mass content creation comes after the MVP
2. Other players see only the items a player wears, never the locked ones
3. New items later are new codes in `items.js`, with no migration

## 7. Art pipeline

All layers share one 1024 x 1536 canvas, so a choice is a matter of stacking images.

1. `art/character-bases/{race}.png`: one bare body per race, drawn on flat magenta with a green placeholder below the waist. `scripts/key_character_bases.py` cuts them out. The bare human is what hair is drawn on
2. `art/character-outfits/outfit-basic-{race}.png`: each race dressed by the AI, with the clothes in pure blue. The AI redraws the figure a little when it adds clothes, so each dressed image becomes that race's figure: `scripts/key_character_outfits.py` splits it into a skin layer and an outfit layer that always line up
3. `art/character-hair/{name}.png`: the bare human with one hairstyle or beard added in pure blue. `scripts/key_character_hair.py` lifts the blue out as grey and measures how to fit it to each dressed race's head
4. `scripts/build_character_web.py` writes the light WebP layers to `public/character/` and the measures to `src/lib/character/art.json`
5. Skin, hair and clothes are grey in the art and tinted in the browser, so colours need no new art. `src/lib/character/render.js` turns a choice into the list of layers
