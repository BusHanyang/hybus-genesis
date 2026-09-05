import { CROWDING_PREVIEW_ORIGIN } from './crowdingEndpoints.ts'

export type CrowdingService = {
  fetch: (request: Request) => Promise<Response>
}

const methodsByPath = new Map<string, ReadonlyArray<string>>([
  ['/v1/crowding/presence', ['POST', 'OPTIONS']],
  ['/v1/crowding/aggregates', ['GET', 'OPTIONS']],
  ['/v1/crowding/health', ['GET']],
])

const errorResponse = (
  status: number,
  code: string,
  headers?: Record<string, string>,
): Response =>
  Response.json(
    { error: { code, message: code } },
    { status, headers: { 'Cache-Control': 'no-store', ...headers } },
  )

export const proxyCrowdingRequest = async (
  request: Request,
  service?: CrowdingService,
): Promise<Response> => {
  const url = new URL(request.url)
  if (url.origin !== CROWDING_PREVIEW_ORIGIN) {
    return errorResponse(403, 'preview_origin_not_allowed')
  }

  const methods = methodsByPath.get(url.pathname)
  if (methods === undefined) return errorResponse(404, 'not_found')
  if (!methods.includes(request.method)) {
    return errorResponse(405, 'method_not_allowed', {
      Allow: methods.join(', '),
    })
  }

  const origin = request.headers.get('Origin')
  if (
    (origin !== null && origin !== CROWDING_PREVIEW_ORIGIN) ||
    (origin === null && request.method !== 'GET')
  ) {
    return errorResponse(403, 'origin_not_allowed')
  }
  if (service === undefined || typeof service.fetch !== 'function') {
    return errorResponse(503, 'development_api_not_configured')
  }

  const headers = new Headers(request.headers)
  // Same-origin GET requests normally omit Origin. Derive it only after the
  // request URL and any supplied Origin have passed the exact branch check.
  if (origin === null) headers.set('Origin', CROWDING_PREVIEW_ORIGIN)

  try {
    const response = await service.fetch(
      new Request(request, { headers, redirect: 'manual' }),
    )
    if (response.status >= 300 && response.status < 400) {
      return errorResponse(502, 'unexpected_upstream_redirect')
    }
    // Preserve Set-Cookie, Retry-After, status and response body from the
    // development Worker. No public-network or production fallback exists.
    return response
  } catch {
    return errorResponse(502, 'development_api_unavailable')
  }
}
