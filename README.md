# Owlbear ↔ Obsidian Bestiary

Run combat in [Owlbear Rodeo](https://www.owlbear.rodeo) without leaving the map,
using the creatures in your Obsidian vault.

Two parts work together:

- **Obsidian Bestiary**: an Owlbear Rodeo extension (in `src/extension`, published from `docs/`).
- **Owlbear Bestiary Bridge**: an Obsidian plugin (in `src/plugin`, built into `dist/`) that
  shares your [Fantasy Statblocks](https://github.com/javalent/fantasy-statblocks) bestiary
  with the extension over a local connection (`127.0.0.1`, port 27190).

## What it does (v0.1)

- **Link tokens to statblocks**: right-click one or more tokens → *Statblock & HP* →
  search your bestiary (pre-filled from the token name, so "Goblin 2" finds Goblin) → Enter.
  Every selected token gets its own HP from the statblock.
- **Track HP**: right-click linked tokens and type `7` (damage), `+5` (heal), `=20` (set)
  or `max 30`. It applies to every selected token, so AoE damage is one step. HP can go
  below 0, and healing stops at max.
- **GM-only HP labels** under linked tokens (green / amber when bloodied / red at 0 or below).
  Players never receive them; they only see token positions.
- **Creature pane follows your selection**: click a token in Owlbear and its statblock
  opens in Fantasy Statblocks' Creature pane in Obsidian. Spell `[[wikilinks]]` work as usual.
  Unlinked tokens whose name matches a creature open too.
- Keeps working if Obsidian disconnects: the extension saves a copy of the bestiary list.
  Only the Creature pane needs the live connection.

Planned next: turn order (parties, shared initiative per creature type, Next turn
highlights the token and opens its statblock), then loading encounters.

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

The toolbar icon opens a status panel (connection, bestiary sync, port).

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
`spike/` is the connection test used to choose the local-connection approach; it will be removed.
