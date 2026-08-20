# CS2 Stream Stats Overlay

A static OBS Browser Source overlay for CS2 Premier and Faceit stats from the
[Leetify public API](https://api-public-docs.cs-prod.leetify.com/).

## Features

- Current Premier rating and Faceit level
- Average kills, ADR, and Leetify aim rating
- Configurable Premier and Faceit match history
- Detailed rank results or a compact W/L/D row
- A customizer that previews the overlay and generates an OBS URL
- Optional Leetify API key support for faster refreshes

Only Premier (`matchmaking`) and Faceit matches are included. Competitive
matchmaking, Wingman, and other modes are excluded.

## Using the overlay

1. Open the customizer.
2. Enter your 17-digit SteamID64.
3. Choose the platforms, statistics, history style, and refresh interval.
4. Optionally add a Leetify API key from
   [leetify.com/app/developer](https://leetify.com/app/developer).
5. Select **Generate widget URL**, then copy the result.
6. In OBS, add a **Browser** source and paste the widget URL.
7. Set the source width and height to the customizer's recommended canvas size.

OBS requests updated stats directly from Leetify at the selected interval. The
customizer does not need to stay open.

## Run it locally

If you prefer not to use or trust a deployed copy, you can run the entire
project on your own computer. Requires
[Node.js 22 or newer](https://nodejs.org/).

```bash
git clone https://github.com/dbarker0002/cs2-obs-overlay.git
cd cs2-obs-overlay
npm install
npm run dev
```

Open the local URL printed in the terminal, usually
`http://localhost:5173/`, and use the customizer normally. Keep the development
server running while OBS uses the generated local widget URL.

To verify the project:

```bash
npm test
npm run build
```

## Leetify API keys

An API key is optional. Without one, the widget enforces a five-minute minimum
refresh interval. Supplying your own key enables one- and two-minute intervals.

The key is placed in the generated URL fragment and saved in OBS's local
storage. It is sent to Leetify, not to the static web host. However, the
original URL stored in your OBS scene still contains the key. Do not share,
publish, stream, or screenshot a widget URL containing one. Rotate the key in
Leetify if it is exposed.

## Privacy

- No analytics or tracking scripts are included.
- No shared API key is bundled with the project.
- Your SteamID64 appears in the widget URL and is sent to Leetify to retrieve
  your public profile.

## Rank images/artworks

Faceit level icons and Premier rating frames were sourced from
[itzarty/csgo-rank-icons](https://github.com/itzarty/csgo-rank-icons) and served
locally from `assets/`. The assets in that repo were in turn sourced from extracting
from Faceit's assets and from extracting CS game data. The “Data provided by Leetify”
badge is also served locally and was obtained from their developer guidelines page.
All assets are property of their respective owners.

## License

Source code is licensed under the MIT License. Third-party logos, rank icons,
and other assets in `assets/` are excluded from that license and remain the
property of their respective owners.

## Acknowledgment

This was inspired by
[LevanisART/cs2-premier-stats-widget](https://github.com/LevanisART/cs2-premier-stats-widget),
which is no longer maintained and is not compatible with Leetify's updated API.
I also had alternative styling/features in mind which weren't supported by that project.
