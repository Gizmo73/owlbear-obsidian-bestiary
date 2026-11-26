# Owlbear ↔ Obsidian Bestiary

Run combat in [Owlbear Rodeo](https://www.owlbear.rodeo) without leaving the map,
using the creatures in your Obsidian vault.

Two parts work together:

- **Obsidian Bestiary**: an Owlbear Rodeo extension (in `src/extension`, published from `docs/`).
- **Owlbear Bestiary Bridge**: an Obsidian plugin (in `src/plugin`, built into `dist/`) that
  shares your [Fantasy Statblocks](https://github.com/javalent/fantasy-statblocks) bestiary
  with the extension over a local connection (`127.0.0.1`, port 27190).

## What it does

**Tokens, statblocks and HP**
- **Link tokens to statblocks**: right-click one or more tokens → *Statblock & HP* →
  search your bestiary (pre-filled from the token name, so "Goblin 2" finds Goblin) → Enter.
  Every selected token gets its own HP from the statblock. Party PCs show up in the same
  search, so PC tokens can be linked too (initiative only, no HP).
- **Track HP**: right-click linked tokens and type `7` (damage), `+5` (heal), `=20` (set)
  or `max 30`. It applies to every selected token, so AoE damage is one step. HP can go
  below 0, and healing stops at max.
- **Numbered tokens**: several of the same creature become Goblin 1, Goblin 2, … (copy-pasted
  tokens get the next free number). The GM-only HP text shows the number too: `#2 5/7`.
- **GM-only HP text** above linked tokens (green / amber when bloodied / red at 0 or below).
- **Creature pane follows your selection**: click a token in Owlbear and its statblock
  opens in Fantasy Statblocks' Creature pane in Obsidian. Spell `[[wikilinks]]` work as usual.

**Turn order** (toolbar icon → panel)
- Pick a party: Initiative Tracker's parties are listed, and you can make new ones in the
  panel (saved in the bridge plugin's settings). The last party is remembered.
- *Insert party* puts the party's tokens on the map in a row at the centre of your view,
  already linked. The first time, Owlbear's asset picker opens: tick your PC tokens and they're
  matched to PCs by name ("Berald" or "Berald Barclay" → Berald). The link from PC to image is
  saved in your vault, so after that it's one click. PCs already on the map are skipped (a token
  just named after a PC gets linked instead). *Re-pick tokens* chooses the images again.
  PC tokens already on the map are remembered too, so dragging the party in from your library
  once is another way to set it up.
- Every token has its own row and turn, but *Roll* gives each creature type one shared roll
  (d20 + Dex), so Goblin 1, 2 and 3 act back to back. A goblin added mid-fight joins their roll.
  Type the PCs' rolls; any number can be edited. Ties go to monsters.
- Click a monster's HP in the panel to damage or heal it: `7`, `+5`, `=20` or `max 30`.
- *Start* / *Next* / *Previous*: the active token gets a gold ring (only you see it), are
  selected so you can move them straight away, and their statblock opens in the Creature pane.
  Rounds are counted. Clicking a row's name selects its token too.
- The eye button on a monster hides or reveals its token for players, and it works the other way
  too: hide a token on the map and the panel greys it out. Hidden monsters haven't joined the
  fight: they're skipped and left out of the players' list. On a PC, the eye just holds them
  back. Monsters at 0 HP or below are greyed out and skipped.
- **Players** see the same panel as a plain list: names and whose turn it is, never HP.
  Held, downed and hidden-on-the-map monsters are left out.

Players otherwise only see token positions: HP text and turn rings are local to your browser.
The extension keeps a copy of the bestiary and parties, so linking, HP and turns keep working
if Obsidian disconnects; only the Creature pane needs the live connection.

Planned next: loading encounters (saved Initiative Tracker encounters and `encounter` blocks).

## Install

Requires Obsidian desktop with Fantasy Statblocks, and Owlbear Rodeo open in Obsidian's
web viewer (tested with Obsidian 1.13.7).

1. **Obsidian plugin**, with [BRAT](https://github.com/TfTHacker/obsidian42-brat):
   BRAT → *Add beta plugin* → `Gizmo73/owlbear-obsidian-bestiary` → latest version, then
   enable *Owlbear Bestiary Bridge* in Settings → Community plugins. BRAT keeps it updated
   from this repo's releases. (Manual alternative: copy `main.js` and `manifest.json` from the
   latest release into `<vault>/.obsidian/plugins/owlbear-bestiary-bridge/`.)
   The status bar shows `Owlbear: waiting`, then `Owlbear: connected`.
2. **Owlbear extension**: Profile → Extensions → *Add Custom Extension* →
   `https://gizmo73.github.io/owlbear-obsidian-bestiary/manifest.json`, then enable it
   in your room.

The toolbar icon opens the turn-order panel; connection details are at the bottom of it.

## Development

```
npm install
npm run build       # docs/ (extension) and dist/owlbear-bestiary-bridge/ (plugin)
npm run typecheck
npm test            # unit checks + end-to-end run against a fake Owlbear host in headless Chromium
```

**Releasing the plugin**: bump `version` in `package.json`, run `npm run build`, commit, then
either push a bare version tag (`git tag 0.1.2 && git push origin 0.1.2`) or create the release
on GitHub (Releases → *Draft a new release* → new tag `0.1.2` on the branch → *Publish*). The
*Release Obsidian plugin* workflow builds it and attaches `main.js` and `manifest.json`, which is
what BRAT installs. Tags with a suffix (`0.2.0-beta.1`) become pre-releases. The Owlbear
extension updates separately: GitHub Pages serves whatever is in `docs/` on the Pages branch.

`Fantasy Statblocks/` and `Initiative Tracker/` hold copies of those plugins for reference.
