import { proxyToBackend } from '@/lib/backend-proxy'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

async function proxy(request: Request) {
  const requestUrl = new URL(request.url)
  const backendPath = requestUrl.pathname.replace(/^\/api\/backend/, '') || '/'
  return proxyToBackend(request, backendPath)
}

export const GET = proxy
export const POST = proxy
export const PUT = proxy
