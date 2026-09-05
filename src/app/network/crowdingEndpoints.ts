export const CROWDING_PREVIEW_ORIGIN =
  'https://dev-shuttle-crowdedness.hybus-genesis.pages.dev'

const PRODUCTION_API_BASE = 'https://api.hybus.app/v1/crowding'
const PREVIEW_HOST_SUFFIX = '.hybus-genesis.pages.dev'

export const getCrowdingApiBase = (pageOrigin?: string): string => {
  if (pageOrigin !== undefined) {
    const page = new URL(pageOrigin)
    if (page.hostname.endsWith(PREVIEW_HOST_SUFFIX)) {
      // Every Preview stays on its own origin; unsupported aliases must never
      // fall back to submitting development signals to the production API.
      return `${page.origin}/v1/crowding`
    }
  }

  return PRODUCTION_API_BASE
}
