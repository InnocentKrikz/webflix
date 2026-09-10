import { NextResponse } from 'next/server'
import { splitSetCookieHeader } from 'better-auth/cookies/utils'

const BACKEND_URL = (
  process.env.BACKEND_URL ??
  process.env.NEXT_PUBLIC_BACKEND_URL ??
  'http://localhost:3005'
).replace(/\/$/, '')

const HOP_BY_HOP_HEADERS = [
  'connection',
  'content-length',
  'host',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
]

function forwardedHeaders(request: Request) {
  const headers = new Headers(request.headers)
  const requestUrl = new URL(request.url)

  HOP_BY_HOP_HEADERS.forEach((header) => headers.delete(header))
  // Node fetch decodes compression; request identity encoding across the local hop.
  headers.set('accept-encoding', 'identity')
  headers.set('x-forwarded-host', requestUrl.host)
  headers.set('x-forwarded-proto', requestUrl.protocol.slice(0, -1))

  return headers
}

function responseHeaders(response: Response) {
  const headers = new Headers(response.headers)
  const upstreamHeaders = response.headers as Headers & {
    getSetCookie?: () => string[]
  }
  const cookies = upstreamHeaders.getSetCookie?.() ?? splitSetCookieHeader(response.headers.get('set-cookie') ?? '')

  headers.delete('content-encoding')
  headers.delete('content-length')
  headers.delete('transfer-encoding')
  headers.delete('set-cookie')
  cookies.forEach((cookie) => headers.append('set-cookie', cookie))
  return headers
}

export async function proxyToBackend(request: Request, backendPath: string) {
  const requestUrl = new URL(request.url)
  const method = request.method.toUpperCase()
  const body = method === 'GET' || method === 'HEAD' ? undefined : await request.arrayBuffer()
  const response = await fetch(`${BACKEND_URL}${backendPath}${requestUrl.search}`, {
    method,
    headers: forwardedHeaders(request),
    ...(body && body.byteLength ? { body } : {}),
    cache: 'no-store',
    redirect: 'manual',
  })

  return new NextResponse(response.body, {
    status: response.status,
    headers: responseHeaders(response),
  })
}
