export const CROWDING_PREVIEW_ORIGIN =
  'https://dev-shuttle-crowdedness.hybus-genesis.pages.dev'

const PRODUCTION_API_BASE = 'https://api.hybus.app/v1/crowding'
const PREVIEW_HOST_SUFFIX = '.hybus-genesis.pages.dev'

export const isCrowdingLocalOrigin = (origin: string): boolean => {
  try {
    const url = new URL(origin)
    return (
      (url.protocol === 'http:' || url.protocol === 'https:') &&
      ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
    )
  } catch {
    return false
  }
}

export const isCrowdingFieldTestOrigin = (origin: string): boolean =>
  origin === CROWDING_PREVIEW_ORIGIN || isCrowdingLocalOrigin(origin)

export const getCrowdingApiBase = (pageOrigin?: string): string => {
  if (pageOrigin !== undefined) {
    const page = new URL(pageOrigin)
    if (
      page.hostname.endsWith(PREVIEW_HOST_SUFFIX) ||
      isCrowdingLocalOrigin(pageOrigin)
    ) {
      // Every Preview stays on its own origin; unsupported aliases must never
      // fall back to submitting development signals to the production API.
      // Loopback testing also requires a local API/proxy and never uses production.
      return `${page.origin}/v1/crowding`
    }
  }

  return PRODUCTION_API_BASE
}
