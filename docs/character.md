# Character: In the Game

Version 0.1, draft for review. Covers FR-24 and FR-25 and answers open question 3 of the specification. Items marked "Assumption" need confirmation.

## 1. Goals

- Every registered player has a character that is theirs, shown wherever their name appears
- A flat blob creature drawn in SVG in the project colours. It is not a meeple and not a pixel figure
- Start simple and let achievements add visible upgrades (FR-25)
- Perks are cosmetic only. They never change ratings, statistics or what the app allows

## 2. Parts

A character is a choice of one item in each group. Free items are open from the first day.

| Group | Free items | Earned items |
|---|---|---|
| Body shape | Round, Squircle, Tall, Wobbly, Droplet | none |
| Body colour | 10 colours from the project palette | none |
| Eyes | Dots, Wide, Sleepy, Happy, Wink | none |
| Mouth | Smile, Grin, Flat, Open, Tongue | none |
| Background | 8 solid colours and patterns: dots, stripes, rings, plain | 4 patterns unlocked by achievements |
| Badge | none | Any earned achievement can be worn as a small badge on the character |
| Accessory | none | 10 accessories, see section 3 |

A character can wear one accessory and one badge at a time. Guests and players who have not chosen anything see a default blob in their own colour, with the first letter of the name on it.

## 3. Accessories and their perks

Every accessory is unlocked by one achievement from docs/achievements.md. A locked accessory shows the achievement that unlocks it (US-F2). Every accessory also has one cosmetic perk.

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
- `profiles.character`: one JSON column with the chosen item codes, for example `{"body":"round","color":"pink","eyes":"wide","mouth":"smile","background":"dots","accessory":"party-hat","badge":"first-win"}`. Null means the default blob
- Item codes are defined in code (`src/lib/character/items.js`) together with the achievement that unlocks each accessory, so adding an item needs no migration
- Row Level Security: achievements readable by every logged-in user. `user_achievements` readable like a profile, written by the server only. `profiles.character` is written by its owner through the existing profile update rules

## 7. Open points

1. Are 10 accessories and 5 free options per group enough for the pilot? (Assumption: yes)
2. Should other players see locked accessories on someone's profile? (Assumption: no, only worn items are shown)
3. Later phases can add items that cost nothing in the database: new codes in `items.js`
