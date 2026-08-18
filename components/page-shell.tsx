import { Navbar } from '@/components/navbar'
import { SiteFooter } from '@/components/site-footer'

export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  )
}
