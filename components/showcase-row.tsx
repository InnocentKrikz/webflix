"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useModal } from "@/components/providers";
import { TrailerAmbientGlow, useTrailerAmbient } from "@/components/trailer-ambient";
import { YouTubeTrailer, type YouTubeTrailerHandle } from "@/components/youtube-trailer";
import type { Row, Title } from "@/lib/types";

function ShowcaseTitle({
  title,
  addLogo,
  addText,
}: {
  title: Title;
  addLogo: boolean;
  addText: boolean;
}) {
  if (addLogo && title.logo) {
    return (
      <div className="relative h-16 w-80 max-w-[88%] sm:h-24 sm:w-[34rem]">
        <Image
          src={title.logo}
          alt={title.title}
          fill
          sizes="544px"
          className="object-contain object-left"
        />
      </div>
    );
  }

  return addText ? (
    <p className="line-clamp-2 text-lg font-bold">{title.title}</p>
  ) : null;
}

function releaseLabel(title: Title): string {
  if (!title.releaseDate) return "Release date TBD";

  const day = title.releaseDate.slice(0, 10);
  const date = new Date(`${day}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return "Release date TBD";

  return `Releases on ${new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date)}`;
}

const revealOnHover = {
  rest: { height: 0, opacity: 0, y: -6 },
  hover: {
    height: "auto",
    opacity: 1,
    y: 0,
    transition: { duration: 0.25, ease: "easeOut" as const },
  },
};

function SideCard({
  title,
  direction,
}: {
  title: Title;
  direction: "left" | "right";
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 0.78 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className="group absolute inset-0 overflow-hidden rounded-xl bg-card text-left ring-1 ring-white/10"
    >
      <Image
        src={title.poster || title.backdrop || "/placeholder.svg"}
        alt={title.title}
        fill
        sizes="220px"
        className="object-cover transition-transform duration-500 group-hover:scale-105"
      />
      {/* <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent" /> */}
      {/* <span className="absolute inset-x-3 bottom-3 line-clamp-2 text-xs font-semibold sm:text-sm">
        {title.title}
      </span> */}
    </motion.div>
  );
}

function CenterCard({
  title,
  playing,
  muted,
  trailerLoaded,
  onEnded,
  onMuteChange,
  onReadyChange,
  onSelect,
  onTimeUpdate,
  addLogo,
  addText,
}: {
  title: Title;
  playing: boolean;
  muted: boolean;
  trailerLoaded: boolean;
  onEnded: () => void;
  onMuteChange: (muted: boolean) => void;
  onReadyChange: (ready: boolean) => void;
  onSelect: () => void;
  onTimeUpdate: (currentTime: number) => void;
  addLogo: boolean;
  addText: boolean;
}) {
  const trailer =
    title.trailers.find((item) => item.videoKey) ?? title.trailers[0];
  const playerRef = useRef<YouTubeTrailerHandle>(null);
  const [isPlaying, setIsPlaying] = useState(playing);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    setIsPlaying(playing);
  }, [playing, title.id]);

  return (
    <motion.div
      key={title.id}
      initial={{ opacity: 0}}
      animate={{ opacity: 1}}
      exit={{ opacity: 0 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      transition={{ duration: 0.5, ease: "easeInOut" }}
      className="absolute inset-0 overflow-hidden rounded-xl"
    >
      <div className="relative z-10 h-full w-full overflow-hidden rounded-xl bg-black shadow-2xl shadow-black/40 ring-1 ring-white/10">
        <Image
          src={trailer?.thumbnail || title.backdrop || "/placeholder.svg"}
          alt={title.title}
          fill
          sizes="(max-width: 768px) 65vw, 720px"
          className={`object-cover transition-opacity duration-300 ${trailerLoaded ? "opacity-0" : "opacity-100"}`}
          priority
        />
        {trailer?.videoKey && (
          <YouTubeTrailer
            ref={playerRef}
            videoKey={trailer.videoKey}
            playing={playing}
            muted={muted}
            onEnded={onEnded}
            onPlaybackChange={setIsPlaying}
            onMuteChange={onMuteChange}
            onReadyChange={onReadyChange}
            onTimeUpdate={onTimeUpdate}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/20 to-transparent" />
        <button
          type="button"
          onClick={onSelect}
          className="absolute inset-0 z-20 text-left"
          aria-label={`Open details for ${title.title}`}
        >
          <span className="absolute inset-x-5 bottom-5 flex flex-col gap-2 sm:inset-x-7 sm:bottom-7">
            <ShowcaseTitle title={title} addLogo={addLogo} addText={addText} />
            <motion.span
              variants={revealOnHover}
              initial="rest"
              animate={isHovered ? "hover" : "rest"}
              className="flex items-center gap-2 overflow-hidden text-xs text-white/75 sm:text-sm"
            >
              {releaseLabel(title)}
              <span>•</span>
              {title.type === "tv" ? "TV Show" : "Movie"}
            </motion.span>
          </span>
        </button>
        {trailer?.videoKey && (
          <motion.div
            variants={revealOnHover}
            initial="rest"
            animate={isHovered ? "hover" : "rest"}
            className="absolute right-4 top-4 z-20 overflow-hidden max-md:!h-auto max-md:!opacity-100"
          >
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  playerRef.current?.toggleMute();
                }}
                className="grid size-9 place-items-center rounded-full bg-black/60 text-white backdrop-blur transition hover:bg-black/80"
                aria-label={muted ? "Unmute trailer" : "Mute trailer"}
              >
                {muted ? (
                  <VolumeX className="size-4" />
                ) : (
                  <Volume2 className="size-4" />
                )}
              </button>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  playerRef.current?.togglePlayback();
                }}
                className="grid size-9 place-items-center rounded-full bg-black/60 text-white backdrop-blur transition hover:bg-black/80"
                aria-label={isPlaying ? "Pause trailer" : "Play trailer"}
              >
                {isPlaying ? (
                  <Pause className="size-4 fill-current" />
                ) : (
                  <Play className="size-4 fill-current" />
                )}
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

export function ShowcaseRow({ row }: { row: Row }) {
  const { open } = useModal();
  const sectionRef = useRef<HTMLElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [inView, setInView] = useState(false);
  const [muted, setMuted] = useState(true);
  const [loadedTrailerId, setLoadedTrailerId] = useState<Title["id"] | null>(null);
  const titles = row.titles;
  const active = titles.length > 0 ? titles[activeIndex % titles.length] : undefined;
  const activeTrailer = active?.trailers.find((item) => item.videoKey) ?? active?.trailers[0];
  const { sample: ambientSample, onTimeUpdate } = useTrailerAmbient(activeTrailer?.timeline);
  const trailerLoaded = active !== undefined && loadedTrailerId === active.id;
  const activeId = active?.id;

  const handleTrailerReadyChange = useCallback((ready: boolean) => {
    if (activeId === undefined) return;
    setLoadedTrailerId((current) =>
      ready ? activeId : current === activeId ? null : current,
    );
  }, [activeId]);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const observer = new IntersectionObserver(
      ([entry]) =>
        setInView(entry.isIntersecting && entry.intersectionRatio >= 0.9),
      { threshold: [0, 0.9, 1] },
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    setActiveIndex((current) =>
      titles.length > 0 ? current % titles.length : 0,
    );
  }, [titles.length]);

  if (!active) return null;

  const previous = titles[(activeIndex - 1 + titles.length) % titles.length];
  const next = titles[(activeIndex + 1) % titles.length];
  const select = (index: number) =>
    setActiveIndex((index + titles.length) % titles.length);

  return (
    <section ref={sectionRef} className="group/showcase relative overflow-visible py-4 md:max-2xl:py-3">
      <div className="relative z-10 mb-2 flex items-center gap-2 px-4 md:px-12 md:max-2xl:mb-1 md:max-2xl:px-8">
        <span className="h-5 w-1 rounded-full bg-primary" />
        <h2 className="font-heading text-lg font-bold md:text-xl">
          {row.title}
        </h2>
      </div>

      <div className="no-scrollbar relative isolate mx-4 overflow-visible md:mx-12 md:max-2xl:mx-8">
        <TrailerAmbientGlow
          sample={ambientSample}
          visible={trailerLoaded}
          className="trailer-showcase-ambient z-0"
        />
        <div className="relative z-10 mx-auto grid h-[260px] max-w-[1800px] grid-cols-1 items-stretch gap-2 py-2 sm:h-[360px] sm:gap-3 md:grid-cols-[19fr_62fr_19fr] lg:h-[min(68vh,40vw)] lg:max-h-[640px] md:max-2xl:h-[min(58vh,36vw)] md:max-2xl:gap-2 md:max-2xl:py-1">
          <div className="relative hidden h-full min-h-0 overflow-hidden rounded-xl md:block">
            <AnimatePresence initial={false}>
              <SideCard
                key={`previous-${previous.id}-${activeIndex}`}
                title={previous}
                direction="left"
              />
            </AnimatePresence>
          </div>
          <div className="relative z-10 h-full min-h-0 overflow-hidden rounded-xl">
            <AnimatePresence initial={false}>
              <CenterCard
                key={`active-${active.id}-${activeIndex}`}
                title={active}
                playing={inView}
                muted={muted}
                trailerLoaded={trailerLoaded}
                onEnded={() => inView && select(activeIndex + 1)}
                onMuteChange={setMuted}
                onReadyChange={handleTrailerReadyChange}
                onSelect={() => open(active.id)}
                onTimeUpdate={onTimeUpdate}
                addLogo={row.addLogo ?? false}
                addText={row.addText ?? true}
              />
            </AnimatePresence>
          </div>
          <div className="relative hidden h-full min-h-0 overflow-hidden rounded-xl md:block">
            <AnimatePresence initial={false}>
              <SideCard
                key={`next-${next.id}-${activeIndex}`}
                title={next}
                direction="right"
              />
            </AnimatePresence>
          </div>
        </div>

        {titles.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => select(activeIndex - 1)}
              aria-label="Previous trailer"
              className="absolute left-2 top-1/2 z-20 grid size-9 -translate-y-1/2 place-items-center rounded-full bg-black/65 text-white opacity-100 transition-opacity md:opacity-0 md:group-hover/showcase:opacity-100"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              type="button"
              onClick={() => select(activeIndex + 1)}
              aria-label="Next trailer"
              className="absolute right-2 top-1/2 z-20 grid size-9 -translate-y-1/2 place-items-center rounded-full bg-black/65 text-white opacity-100 transition-opacity md:opacity-0 md:group-hover/showcase:opacity-100"
            >
              <ChevronRight className="size-5" />
            </button>
          </>
        )}
      </div>
    </section>
  );
}
