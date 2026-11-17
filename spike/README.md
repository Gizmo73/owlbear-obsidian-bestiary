# Connection test (throwaway)

This answers one question before the real build: **how can an Owlbear Rodeo
extension, running inside Obsidian's web viewer, talk to an Obsidian plugin?**

It tries three routes and reports which work:

| Route | How | Notes |
| --- | --- | --- |
| **A1 / A2** | Extension calls the plugin's local server on `127.0.0.1:27190` (HTTP and WebSocket) | Cleanest, but recent Chromium blocks pages on the public web from reaching `127.0.0.1` |
| **B** | Plugin reaches into the web viewer showing Owlbear and relays messages to and from the extension | Doesn't use the network at all; relies on Obsidian's web viewer internals |
| **C** | Extension opens an `obsidian://creature-pane?creature=…` link (Fantasy Statblocks' own handler) | One-way only (Owlbear → Obsidian) |

As a bonus, selecting a token in Owlbear asks Obsidian to show the matching
creature in Fantasy Statblocks' **Creature pane** (token "Goblin 2" → Goblin).

## One-time setup

1. **Turn on GitHub Pages** for this repo: Settings → Pages → *Deploy from a
   branch* → branch `claude/owlbear-obsidian-plugin-uh9ydf`, folder `/docs` →
   Save. After a minute,
   `https://gizmo73.github.io/owlbear-obsidian-bestiary/spike/manifest.json`
   should load.
2. **Install the test plugin**: copy both files from
   [`spike/dist/owlbear-bridge-spike/`](dist/owlbear-bridge-spike/) (`main.js`,
   `manifest.json`) into `<your vault>/.obsidian/plugins/owlbear-bridge-spike/`,
   then enable **Owlbear Bridge Test** under Settings → Community plugins.
   You should see the notice *"Owlbear bridge test listening on
   127.0.0.1:27190"*, and the status bar should read `Owlbear test: A … · B …`.
3. **Add the extension to Owlbear** (inside the web viewer): Profile →
   Extensions → *Add Custom Extension*. Add both copies:
   - `https://gizmo73.github.io/owlbear-obsidian-bestiary/spike/manifest.json`
   - `http://127.0.0.1:27190/ext/manifest.json` (served by the plugin)

   Then enable them in a test room (room menu → Extensions).

## Running the test

1. Open the room in the web viewer and click the extension's link icon in the
   top-left toolbar. A status panel opens.
2. Wait about 20 seconds. Each row shows ✔ or ✖.
3. Select a token named after a creature (e.g. "Goblin" or "Goblin 2"). Does
   the Creature pane switch to it?
4. With that token still selected, press **Try C: obsidian:// link**. Does the
   Creature pane change? (Select a different creature first so you can tell.)
5. Send back:
   - the **Results** box from each extension panel (copy or screenshot);
   - the Obsidian log: command palette → *Owlbear Bridge Test: Show connection
     test log* → Copy.
   - If route B shows ✖, first run *Owlbear Bridge Test: Diagnose web viewer*,
     then copy the log.

When you're done, disable the plugin and remove the two test extensions.

## For development

```
cd spike
npm install
npm run build      # docs/spike/ and spike/dist/owlbear-bridge-spike/
npm run typecheck
node test/e2e.mjs  # local checks in headless Chromium with a stand-in Owlbear page
```
