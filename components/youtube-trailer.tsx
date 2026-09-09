'use client'

import { forwardRef, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from 'react'

const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect

type YouTubePlayer = {
  mute: () => void
  unMute: () => void
  pauseVideo: () => void
  playVideo: () => void
  getCurrentTime: () => number
  destroy: () => void
}

type YouTubePlayerOptions = {
  videoId: string
  width?: string
  height?: string
  playerVars?: Record<string, number>
  events?: {
    onReady?: (event: { target: YouTubePlayer }) => void
    onStateChange?: (event: { data: number; target: YouTubePlayer }) => void
    onError?: (event: { data: number }) => void
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
    onTimeUpdate?: (currentTime: number) => void
    onError?: () => void
    visible?: boolean
  }
>(function YouTubeTrailer(
  { videoKey, playing, muted, onEnded, onPlaybackChange, onMuteChange, onReadyChange, onTimeUpdate, onError, visible = true },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<YouTubePlayer | null>(null)
  const endedRef = useRef(onEnded)
  const latestRef = useRef({ playing, muted, onPlaybackChange, onReadyChange, onTimeUpdate, onError })
  const readyRef = useRef(false)
  const [playerReady, setPlayerReady] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)

  endedRef.current = onEnded
  latestRef.current = { playing, muted, onPlaybackChange, onReadyChange, onTimeUpdate, onError }

  const updatePlayback = (nextPlaying: boolean) => {
    setIsPlaying(nextPlaying)
    onPlaybackChange(nextPlaying)
  }

  useImperativeHandle(
    ref,
    () => ({
      toggleMute: () => {
        const player = playerRef.current
        if (!player || !readyRef.current) return

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
        if (!player || !readyRef.current) return

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

  useIsomorphicLayoutEffect(() => {
    let cancelled = false
    const container = containerRef.current
    if (!container) return
    let ownedPlayer: YouTubePlayer | null = null
    readyRef.current = false
    setPlayerReady(false)
    setIsPlaying(false)
    latestRef.current.onReadyChange(false)

    // YouTube replaces its target. Only give it an imperative child, never
    // a node React owns. React leaves this empty host's children alone.
    const mount = document.createElement('div')
    container.appendChild(mount)

    void loadYouTubeApi()
      .then((api) => {
        if (cancelled || !container.isConnected) return

        const player = new api.Player(mount, {
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
              if (cancelled || !container.isConnected) return
              const iframe = containerRef.current?.querySelector('iframe')
              if (iframe) {
                iframe.style.width = '100%'
                iframe.style.height = '100%'
                iframe.style.position = 'absolute'
                iframe.style.inset = '0'
              }
              readyRef.current = true
              setPlayerReady(true)
              latestRef.current.onReadyChange(true)
              latestRef.current.onTimeUpdate?.(target.getCurrentTime())
              if (latestRef.current.muted) target.mute()
              else target.unMute()
              if (latestRef.current.playing) {
                target.playVideo()
              }
            },
            onStateChange: ({ data, target }) => {
              if (cancelled || !readyRef.current || !container.isConnected) return
              latestRef.current.onTimeUpdate?.(target.getCurrentTime())
              if (data === 1 || data === 2 || data === 0) {
                setIsPlaying(data === 1)
                latestRef.current.onPlaybackChange(data === 1)
              }
              if (data === 0) endedRef.current()
            },
            onError: () => {
              if (cancelled) return
              readyRef.current = false
              setPlayerReady(false)
              latestRef.current.onReadyChange(false)
              latestRef.current.onPlaybackChange(false)
              latestRef.current.onError?.()
            },
          },
        })

        ownedPlayer = player
        playerRef.current = player
      })
      .catch(() => {
        if (cancelled) return
        latestRef.current.onReadyChange(false)
        latestRef.current.onError?.()
      })

    return () => {
      cancelled = true
      readyRef.current = false
      playerRef.current = null
      try {
        ownedPlayer?.destroy()
      } finally {
        container.replaceChildren()
      }
    }
  }, [videoKey])

  useEffect(() => {
    const player = playerRef.current
    if (!player || !playerReady || !readyRef.current) return

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
    if (!player || !playerReady || !readyRef.current) return

    if (muted) player.mute()
    else player.unMute()
  }, [muted, playerReady])

  useEffect(() => {
    const player = playerRef.current
    if (!player || !playerReady || !readyRef.current || !onTimeUpdate) return

    const updateTime = () => {
      if (!readyRef.current) return
      const currentTime = player.getCurrentTime()
      if (Number.isFinite(currentTime)) latestRef.current.onTimeUpdate?.(currentTime)
    }
    updateTime()
    const interval = window.setInterval(updateTime, 350)
    return () => window.clearInterval(interval)
  }, [onTimeUpdate, playerReady, videoKey])

  return (
    <div
      className={`absolute inset-0 overflow-hidden bg-black transition-opacity duration-300 ${visible ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
      aria-hidden="true"
    >
      <div
        ref={containerRef}
        className="absolute inset-0 [&>iframe]:pointer-events-none [&>iframe]:absolute [&>iframe]:inset-0 [&>iframe]:block [&>iframe]:h-full [&>iframe]:w-full [&>iframe]:max-w-none [&>iframe]:border-0"
      />
    </div>
  )
})

YouTubeTrailer.displayName = 'YouTubeTrailer'
