/// <reference types="vite-plugin-svgr/client" />
/// <reference types="vite/client" />

interface HTMLGeolocationElement extends HTMLElement {
  autolocate: boolean
  readonly error: GeolocationPositionError | null
  readonly invalidReason: string
  readonly isValid: boolean
  readonly position: GeolocationPosition | null
  watch: boolean
}

interface HTMLGeolocationElementEventMap extends HTMLElementEventMap {
  location: Event
  promptaction: Event
  validationstatuschange: Event
}

interface HTMLElementTagNameMap {
  geolocation: HTMLGeolocationElement
}

declare namespace React.JSX {
  interface IntrinsicElements {
    geolocation: React.DetailedHTMLProps<
      React.HTMLAttributes<HTMLGeolocationElement>,
      HTMLGeolocationElement
    > & {
      accuracymode?: 'approximate' | 'precise'
    }
  }
}
