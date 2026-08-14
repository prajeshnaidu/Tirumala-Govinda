# Desi Bar — Nostalgia Music

Next.js App Router + TypeScript + Tailwind CSS v4 single-page nostalgia music site.

## 1. Assets

The supplied Balaji Murthi image is included as `public/bg/scene-wide.png`.

Add your separately composed portrait artwork as:

`public/bg/scene-tall.png`

Do not crop the wide image to make the portrait version.

## 2. YouTube rights

The supplied song document contains 25 song titles. The project uses those titles only. It intentionally does **not** invent artist/film/year metadata or YouTube video IDs.

Before adding a `videoId`, make sure you have the right to use the track or that it is the rights holder's own YouTube upload with embedding enabled. Do not download/re-host YouTube thumbnails.

In `components/music-player.tsx`, each song is a one-line `makeTrack(...)` entry. Replace its metadata and `videoId` with your licensed/rightful source.

Example:

`makeTrack("my-id", "Song Title")`

The helper currently returns placeholder metadata. For production, change the helper call to a full object if you want exact metadata, e.g.:

`{ id: "my-id", title: "Song Title", artist: "Artist", film: "Film", year: 1998, duration: 0, videoId: "YOUR_RIGHTFUL_VIDEO_ID" }`

## 3. Install and run

```bash
npm install
npm run dev
```

Then open the local URL shown by Next.js.

## Notes

- `app/page.tsx` stays a server component.
- Interactive music logic lives in the module-scope `MusicPlayer` client component.
- YouTube IFrame API is loaded in the browser and the player remains visible.
- Playback state comes from `onStateChange`; `ENDED` advances; `onError` records `youtube_player_error` and skips.
- Seeking uses `onPointerDown` with `touch-action: none`.
- The play button is never gated on `canplay`.
