'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { Bell, ChevronDown, Menu, Search, User, X } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'TV Shows', href: '/tv-shows' },
  { label: 'Movies', href: '/movies' },
  { label: 'Anime', href: '/browse?genre=Animation' },
  { label: 'Live TV', href: '/browse?tab=live' },
  { label: 'My List', href: '/my-list' },
  { label: 'Browse', href: '/browse' },
]

export function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const [scrolled, setScrolled] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [mobileOpen, setMobileOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (searchOpen) inputRef.current?.focus()
  }, [searchOpen])

  function submitSearch(e: React.FormEvent) {
    e.preventDefault()
    if (query.trim()) router.push(`/search?q=${encodeURIComponent(query.trim())}`)
  }

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 transition-colors duration-500',
        scrolled
          ? 'bg-background/85 backdrop-blur-xl border-b border-white/5'
          : 'bg-gradient-to-b from-black/80 via-black/40 to-transparent',
      )}
    >
      <nav className="mx-auto flex h-16 max-w-[1600px] items-center gap-2 px-4 md:h-[72px] md:gap-6 md:px-8">
        {/* Logo */}
        <Link href="/" className="group flex shrink-0 items-center">
          <span className="font-display text-2xl font-extrabold tracking-tight text-primary md:text-[28px]">
            WEB<span className="text-foreground">FLIX</span>
          </span>
        </Link>

        {/* Desktop links */}
        <ul className="ml-2 hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((link) => {
            const active =
              link.href === '/'
                ? pathname === '/'
                : pathname.startsWith(link.href.split('?')[0]) && link.href !== '/'
            return (
              <li key={link.label}>
                <Link
                  href={link.href}
                  className={cn(
                    'relative rounded-full px-3 py-2 text-sm font-medium transition-colors',
                    active
                      ? 'text-foreground'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {link.label}
                  {active && (
                    <motion.span
                      layoutId="nav-active"
                      className="absolute inset-x-3 -bottom-0.5 h-0.5 rounded-full bg-primary"
                      transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                    />
                  )}
                </Link>
              </li>
            )
          })}
        </ul>

        <div className="ml-auto flex items-center gap-1 md:gap-2">
          {/* Search */}
          <form onSubmit={submitSearch} className="flex items-center">
            <AnimatePresence initial={false}>
              {searchOpen && (
                <motion.input
                  ref={inputRef}
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 200, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ duration: 0.28, ease: 'easeOut' }}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onBlur={() => !query && setSearchOpen(false)}
                  placeholder="Titles, people, genres"
                  className="mr-1 h-9 rounded-full border border-white/15 bg-black/60 px-4 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary"
                />
              )}
            </AnimatePresence>
            <button
              type={searchOpen ? 'submit' : 'button'}
              onClick={() => !searchOpen && setSearchOpen(true)}
              aria-label="Search"
              className="grid size-9 place-items-center rounded-full text-foreground transition-colors hover:bg-white/10"
            >
              <Search className="size-5" />
            </button>
          </form>

          <button
            aria-label="Notifications"
            className="relative hidden size-9 place-items-center rounded-full text-foreground transition-colors hover:bg-white/10 sm:grid"
          >
            <Bell className="size-5" />
            <span className="absolute right-2 top-2 size-2 rounded-full bg-primary ring-2 ring-background" />
          </button>

          {/* Profile */}
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button className="flex items-center gap-1 rounded-full p-1 outline-none transition-colors hover:bg-white/10">
                <span className="grid size-8 place-items-center rounded-md bg-gradient-to-br from-primary to-red-800 text-sm font-bold text-primary-foreground">
                  W
                </span>
                <ChevronDown className="hidden size-4 text-muted-foreground sm:block" />
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content
                sideOffset={12}
                align="end"
                className="z-[60] w-56 rounded-xl border border-white/10 bg-popover/95 p-1.5 shadow-2xl backdrop-blur-xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
              >
                <div className="flex items-center gap-3 px-2 py-2">
                  <span className="grid size-9 place-items-center rounded-md bg-gradient-to-br from-primary to-red-800 font-bold text-primary-foreground">
                    W
                  </span>
                  <div className="leading-tight">
                    <p className="text-sm font-semibold">Webflix User</p>
                    <p className="text-xs text-muted-foreground">Premium 4K</p>
                  </div>
                </div>
                <DropdownMenu.Separator className="my-1 h-px bg-white/10" />
                {['Manage Profiles', 'Account', 'Help Center'].map((item) => (
                  <DropdownMenu.Item
                    key={item}
                    className="cursor-pointer rounded-lg px-2 py-2 text-sm outline-none transition-colors data-[highlighted]:bg-white/10"
                  >
                    {item}
                  </DropdownMenu.Item>
                ))}
                <DropdownMenu.Separator className="my-1 h-px bg-white/10" />
                <DropdownMenu.Item className="cursor-pointer rounded-lg px-2 py-2 text-sm text-primary outline-none transition-colors data-[highlighted]:bg-primary/10">
                  Sign out of Webflix
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>

          {/* Mobile menu button */}
          <button
            aria-label="Menu"
            onClick={() => setMobileOpen(true)}
            className="grid size-9 place-items-center rounded-full text-foreground transition-colors hover:bg-white/10 lg:hidden"
          >
            <Menu className="size-5" />
          </button>
        </div>
      </nav>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="fixed inset-0 z-[70] lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
            <motion.div
              className="absolute right-0 top-0 flex h-full w-72 flex-col gap-1 border-l border-white/10 bg-background p-6"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 34 }}
            >
              <div className="mb-4 flex items-center justify-between">
                <span className="font-display text-xl font-extrabold text-primary">
                  WEB<span className="text-foreground">FLIX</span>
                </span>
                <button onClick={() => setMobileOpen(false)} aria-label="Close" className="grid size-9 place-items-center rounded-full hover:bg-white/10">
                  <X className="size-5" />
                </button>
              </div>
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg px-3 py-3 text-base font-medium text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
                >
                  {link.label}
                </Link>
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
