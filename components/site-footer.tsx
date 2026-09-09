'use client'

import Image from 'next/image'
import * as Switch from '@radix-ui/react-switch'
import { Gauge } from 'lucide-react'
import { useEffects } from '@/components/providers'

const COLUMNS = [
  { title: 'Home', links: [{name:'Movies', link: "movies"},{name:'TV Shows', link: "tvshows"},{name:'Discord', link: "discord"},{name:'Telegram', link: "telegram"}] },
  //{ title: 'Company', links: ['About Sceneflix', 'Jobs', 'Press', 'Investors', 'Newsroom'] },
  //{ title: 'Support', links: ['Help Center', 'Account', 'Devices', 'Redeem Gift Cards', 'Contact Us'] },
  //{ title: 'Legal', links: ['Terms of Use', 'Privacy', 'Cookie Preferences', 'Corporate Info'] },
]

export function SiteFooter() {
  const { reducedEffects, setReducedEffects } = useEffects()

  return (
    <footer className="mt-16 border-t border-white/5 bg-black/40 px-4 py-12 md:px-8">
      <div className="mx-auto max-w-[1600px]">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h3 className="mb-3 font-display text-sm font-semibold text-foreground">{col.title}</h3>
              <ul className="space-y-2">
                {col.links.map((item) => (
                  <li key={item.link}>
                    <a href="#" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                      {item.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 flex flex-col items-start justify-between gap-4 border-t border-white/5 pt-6 md:flex-row md:items-center">
          <Image
            src="/sceneflix/sceneflix-long-logo.png"
            alt="Sceneflix"
            width={2172}
            height={724}
            className="h-auto w-40"
          />
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3 rounded-lg  bg-secondary/40 px-3 py-2">
              <Gauge className="size-4 shrink-0 text-primary" aria-hidden="true" />
              <label htmlFor="performance-mode" className="cursor-pointer">
                <span className="block text-xs font-semibold text-foreground">Performance mode</span>
                <span className="block text-[10px] text-muted-foreground">
                  Disables animations and glows
                </span>
              </label>
              <Switch.Root
                id="performance-mode"
                checked={reducedEffects}
                onCheckedChange={setReducedEffects}
                aria-label="Toggle performance mode"
                className="relative h-6 w-11 shrink-0 rounded-full bg-white/15 outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 data-[state=checked]:bg-primary"
              >
                <Switch.Thumb className="block size-4.5 translate-x-0.5 rounded-full bg-white transition-transform duration-200 data-[state=checked]:translate-x-[22px]" />
              </Switch.Root>
            </div>
            <p className="text-xs text-muted-foreground">
              {new Date().getFullYear()} Sceneflix
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
