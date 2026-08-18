const COLUMNS = [
  { title: 'Watch', links: ['Movies', 'TV Shows', 'Anime', 'Live TV', 'New & Popular'] },
  { title: 'Company', links: ['About Webflix', 'Jobs', 'Press', 'Investors', 'Newsroom'] },
  { title: 'Support', links: ['Help Center', 'Account', 'Devices', 'Redeem Gift Cards', 'Contact Us'] },
  { title: 'Legal', links: ['Terms of Use', 'Privacy', 'Cookie Preferences', 'Corporate Info'] },
]

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-white/5 bg-black/40 px-4 py-12 md:px-8">
      <div className="mx-auto max-w-[1600px]">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h3 className="mb-3 font-display text-sm font-semibold text-foreground">{col.title}</h3>
              <ul className="space-y-2">
                {col.links.map((link) => (
                  <li key={link}>
                    <a href="#" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 flex flex-col items-start justify-between gap-4 border-t border-white/5 pt-6 md:flex-row md:items-center">
          <span className="font-display text-xl font-extrabold text-primary">
            WEB<span className="text-foreground">FLIX</span>
          </span>
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Webflix. A demo streaming experience. All artwork is AI-generated and fictional.
          </p>
        </div>
      </div>
    </footer>
  )
}
