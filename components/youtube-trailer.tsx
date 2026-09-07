'use client'

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'

type YouTubePlayer = {
  mute: () => void
  unMute: () => void
  pauseVideo: () => void
  playVideo: () => void
  destroy: () => void
}

type YouTubePlayerOptions = {
  videoId: string
  width?: string
  height?: string
  playerVars?: Record<string, number>
  events?: {
    onReady?: (event: { target: YouTubePlayer }) => void
    onStateChange?: (event: { data: number }) => void
  }
}

type YouTubeApi = {
  Player: new (element: HTMLElement, options: YouTubePlayerOptions) => YouTubePlayer
}

type YouTubeWindow = Window & {
  YT?: YouTubeApi
  onYouTubeIframeAPIReady?: () => void
}

let youtubeApiPromise: Promise<YouTubeApi> | null = null

function loadYouTubeApi(): Promise<YouTubeApi> {
  const browserWindow = window as YouTubeWindow
  if (browserWindow.YT?.Player) return Promise.resolve(browserWindow.YT)
  if (youtubeApiPromise) return youtubeApiPromise

  youtubeApiPromise = new Promise<YouTubeApi>((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>('script[src="https://www.youtube.com/iframe_api"]')
    const previousReady = browserWindow.onYouTubeIframeAPIReady

    browserWindow.onYouTubeIframeAPIReady = () => {
      previousReady?.()
      if (browserWindow.YT?.Player) resolve(browserWindow.YT)
      else reject(new Error('YouTube player API did not initialize'))
    }

    if (!existingScript) {
      const script = document.createElement('script')
      script.src = 'https://www.youtube.com/iframe_api'
      script.async = true
      script.onerror = () => reject(new Error('Unable to load YouTube player API'))
      document.head.appendChild(script)
    }
  })

  return youtubeApiPromise
}

export type YouTubeTrailerHandle = {
  toggleMute: () => void
  togglePlayback: () => void
}

export const YouTubeTrailer = forwardRef<
  YouTubeTrailerHandle,
  {
    videoKey: string
    playing: boolean
    muted: boolean
    onEnded: () => void
    onPlaybackChange: (playing: boolean) => void
    onMuteChange: (muted: boolean) => void
    onReadyChange: (ready: boolean) => void
  }
>(function YouTubeTrailer(
  { videoKey, playing, muted, onEnded, onPlaybackChange, onMuteChange, onReadyChange },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<YouTubePlayer | null>(null)
  const endedRef = useRef(onEnded)
  const [playerReady, setPlayerReady] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)

  endedRef.current = onEnded

  const updatePlayback = (nextPlaying: boolean) => {
    setIsPlaying(nextPlaying)
    onPlaybackChange(nextPlaying)
  }

  useImperativeHandle(
    ref,
    () => ({
      toggleMute: () => {
        const player = playerRef.current
        if (!player || !playerReady) return

        if (muted) {
          player.unMute()
          onMuteChange(false)
        } else {
          player.mute()
          onMuteChange(true)
        }
      },
      togglePlayback: () => {
        const player = playerRef.current
        if (!player || !playerReady) return

        if (isPlaying) {
          player.pauseVideo()
          updatePlayback(false)
        } else {
          player.playVideo()
          updatePlayback(true)
        }
      },
    }),
    [isPlaying, muted, onMuteChange, onPlaybackChange, playerReady],
  )

  useEffect(() => {
    let cancelled = false
    setPlayerReady(false)
    onReadyChange(false)

    void loadYouTubeApi()
      .then((api) => {
        if (cancelled || !containerRef.current) return

        const player = new api.Player(containerRef.current, {
          videoId: videoKey,
          width: '100%',
          height: '100%',
          playerVars: {
            autoplay: 0,
            autohide: 1,
            cc_load_policy: 0,
            controls: 0,
            disablekb: 1,
            fs: 0,
            iv_load_policy: 3,
            modestbranding: 1,
            playsinline: 1,
            rel: 0,
            showinfo: 0,
          },
          events: {
            onReady: ({ target }) => {
              const iframe = containerRef.current?.querySelector('iframe')
              if (iframe) {
                iframe.style.width = '100%'
                iframe.style.height = '100%'
                iframe.style.position = 'absolute'
                iframe.style.inset = '0'
              }
              setPlayerReady(true)
              onReadyChange(true)
              if (playing) {
                target.playVideo()
                updatePlayback(true)
              }
            },
            onStateChange: ({ data }) => {
              if (data === 1) updatePlayback(true)
              if (data === 2 || data === 0) updatePlayback(false)
              if (data === 0) endedRef.current()
            },
          },
        })

        playerRef.current = player
      })
      .catch(() => {
        // The thumbnail remains visible if the player API cannot load.
      })

    return () => {
      cancelled = true
      playerRef.current?.destroy()
      playerRef.current = null
    }
  }, [onReadyChange, videoKey])

  useEffect(() => {
    const player = playerRef.current
    if (!player || !playerReady) return

    if (playing) {
      player.playVideo()
      updatePlayback(true)
    } else {
      player.pauseVideo()
      updatePlayback(false)
    }
  }, [playerReady, playing])

  useEffect(() => {
    const player = playerRef.current
    if (!player || !playerReady) return

    if (muted) player.mute()
    else player.unMute()
  }, [muted, playerReady])

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden bg-black [&>iframe]:pointer-events-none [&>iframe]:absolute [&>iframe]:inset-0 [&>iframe]:block [&>iframe]:h-full [&>iframe]:w-full [&>iframe]:max-w-none [&>iframe]:border-0 [&>iframe]:origin-center [&>iframe]:scale-[1.18]"
      aria-hidden="true"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-16 bg-black" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-16 bg-black" />
    </div>
  )
})

YouTubeTrailer.displayName = 'YouTubeTrailer'
