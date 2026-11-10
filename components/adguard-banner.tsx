"use client";

import Image from "next/image";
import { X } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

const DISMISSED_STORAGE_KEY = "sceneflix:adguard-banner-dismissed";

type InstallLink = {
  href: string;
  label: string;
};

const INSTALL_LINKS = {
  android: {
    href: "https://play.google.com/store/apps/details?id=com.adguard.android.contentblocker&hl=en",
    label: "Get it on Google Play",
  },
  chrome: {
    href: "https://chromewebstore.google.com/detail/adguard-adblocker/bgnkhhnnamicmpeenaelnjfhikgbkllg",
    label: "Install for Chrome",
  },
  edge: {
    href: "https://adguard.com/en/adguard-browser-extension/edge/overview.html",
    label: "Install for Edge",
  },
  firefox: {
    href: "https://addons.mozilla.org/en-US/firefox/addon/adguard-adblocker/",
    label: "Install for Firefox",
  },
  ios: {
    href: "https://apps.apple.com/us/app/adguard-ad-blocker-for-safari/id1047223162",
    label: "Get it on the App Store",
  },
  mac: {
    href: "https://adguard.com/en/download.html?os=mac",
    label: "Download for Mac",
  },
  opera: {
    href: "https://addons.opera.com/en/extensions/details/adguard/",
    label: "Install for Opera",
  },
  windows: {
    href: "https://adguard.com/en/adguard-windows/overview.html",
    label: "Download for Windows",
  },
  default: {
    href: "https://adguard.com/en/download.html",
    label: "Choose your download",
  },
} satisfies Record<string, InstallLink>;

function getInstallLink(): InstallLink {
  const { userAgent, platform, maxTouchPoints } = navigator;

  // iPadOS can identify itself as macOS while still exposing touch support.
  const isAppleMobile =
    /iPad|iPhone|iPod/.test(userAgent) ||
    (platform === "MacIntel" && maxTouchPoints > 1);

  if (/Android/i.test(userAgent)) return INSTALL_LINKS.android;
  if (isAppleMobile) return INSTALL_LINKS.ios;
  if (/Edg\//i.test(userAgent)) return INSTALL_LINKS.edge;
  if (/Firefox\//i.test(userAgent)) return INSTALL_LINKS.firefox;
  if (/OPR\//i.test(userAgent) || /Opera/i.test(userAgent))
    return INSTALL_LINKS.opera;
  if (
    /Safari\//i.test(userAgent) &&
    !/Chrome|Chromium|Edg\//i.test(userAgent)
  ) {
    return INSTALL_LINKS.ios;
  }
  if (/Windows NT/i.test(userAgent)) return INSTALL_LINKS.windows;
  if (/Macintosh|Mac OS X/i.test(userAgent)) return INSTALL_LINKS.mac;
  if (/Chrome|Chromium|CrOS/i.test(userAgent)) return INSTALL_LINKS.chrome;

  return INSTALL_LINKS.default;
}

export function AdguardBanner() {
  const [isReady, setIsReady] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [installLink, setInstallLink] = useState<InstallLink>(
    INSTALL_LINKS.default,
  );
  const bannerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(DISMISSED_STORAGE_KEY) === "true");
    } catch {
      /* Ignore storage restrictions and keep the banner dismissible for this session. */
    }

    setInstallLink(getInstallLink());
    setIsReady(true);
  }, []);

  useLayoutEffect(() => {
    const root = document.documentElement;

    if (!isReady || dismissed || !bannerRef.current) {
      root.removeAttribute("data-adguard-banner-visible");
      root.style.removeProperty("--adguard-banner-height");
      return;
    }

    const syncBannerHeight = () => {
      const height = bannerRef.current?.offsetHeight ?? 0;
      const bannerHasScrolledAway = window.scrollY >= height;
      root.style.setProperty(
        "--adguard-banner-height",
        bannerHasScrolledAway ? "0px" : `${height}px`,
      );
      root.setAttribute("data-adguard-banner-visible", "");
    };

    syncBannerHeight();
    const resizeObserver = new ResizeObserver(syncBannerHeight);
    resizeObserver.observe(bannerRef.current);
    window.addEventListener("scroll", syncBannerHeight, { passive: true });

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("scroll", syncBannerHeight);
      root.removeAttribute("data-adguard-banner-visible");
      root.style.removeProperty("--adguard-banner-height");
    };
  }, [dismissed, isReady]);

  function dismiss() {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISSED_STORAGE_KEY, "true");
    } catch {
      /* Ignore storage restrictions. */
    }
  }

  if (!isReady || dismissed) return null;

  return (
    <>
      {/* <aside
        ref={bannerRef}
        aria-label="Ad blocker recommendation"
        className="relative z-[60] border-b border-emerald-300/25 bg-emerald-500/15 px-4 py-3 text-emerald-50 shadow-lg shadow-emerald-950/20"
      >
        <div className="mx-auto flex max-w-[1600px] items-center pr-10 md:px-4">
          <p className="min-w-0 flex-1 text-xs leading-relaxed sm:text-sm">
            Ads help keep Sceneflix running, so ads are expected. For a cleaner
            and safer experience, install{" "}
            <span className="inline-flex items-center gap-1 align-middle">
              <Image
                src="/adguard/adguard.png"
                alt=""
                width={200}
                height={200}
                className="size-5 rounded-md"
                priority
              />
              <a
                href={installLink.href}
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold underline decoration-emerald-200/70 underline-offset-2 transition-colors hover:text-white"
              >
                AdGuard
              </a>
            </span>
            <span className="hidden sm:inline">
              {" "}
              ({installLink.label.toLowerCase()})
            </span>
            .
          </p>
          <button
            type="button"
            onClick={dismiss}
            aria-label="Dismiss AdGuard recommendation"
            className="absolute right-3 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-full text-emerald-100/80 transition-colors hover:bg-emerald-300/15 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
      </aside> */}
    </>
  );
}
