import MusicPlayer from "../components/music-player";
import TopBar from "../components/top-bar";

export default function Page() {
  return (
    <main className="relative flex min-h-dvh flex-1 flex-col items-center justify-between overflow-hidden">

      {/* =====================================================
          MAIN FULL-SCREEN BACKGROUND
          
          The music-player.tsx automatically changes the
          background-image of this element whenever the song
          changes.
      ===================================================== */}

      <div
        aria-hidden="true"
        className="
          hero-bg
          fixed
          inset-0
          -z-20
          bg-cover
          bg-center
          bg-no-repeat
          transition-[background-image]
          duration-700
        "
      />

      {/* Dark overlay */}
      <div
        aria-hidden="true"
        className="
          fixed
          inset-0
          -z-20
          bg-gradient-to-b
          from-black/35
          via-transparent
          to-black/80
        "
      />

      {/* Grain / texture overlay */}
      <div
        aria-hidden="true"
        className="
          fixed
          inset-0
          -z-10
          opacity-30
          mix-blend-overlay
        "
      >
        <svg
          className="h-full w-full"
          xmlns="http://www.w3.org/2000/svg"
        >
          <filter
            id="grain"
          >
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.78"
              numOctaves="4"
              stitchTiles="stitch"
            />
          </filter>

          <rect
            width="100%"
            height="100%"
            filter="url(#grain)"
          />
        </svg>
      </div>

      {/* =====================================================
          TOP BAR
      ===================================================== */}

      <TopBar />

      {/* =====================================================
          MUSIC PLAYER
          
          IMPORTANT:
          Do NOT pass onTrackChange here.
          
          music-player.tsx now handles:
          - Cover image
          - Main background image
          - Next
          - Previous
          - Auto play
          - Background ambience
          - Background music
      ===================================================== */}

      <div
        className="
          pointer-events-none
          fixed
          inset-x-0
          bottom-[max(1rem,env(safe-area-inset-bottom))]
          z-10
          flex
          justify-center
          px-4
          sm:px-6
        "
      >
        <div
          className="
            pointer-events-auto
            w-full
            max-w-xl
          "
        >
          <MusicPlayer />
        </div>
      </div>

    </main>
  );
}