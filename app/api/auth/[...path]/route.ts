import { proxyToBackend } from '@/lib/backend-proxy'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

async function proxy(request: Request) {
  return proxyToBackend(request, new URL(request.url).pathname)
}

export const GET = proxy
export const POST = proxy
