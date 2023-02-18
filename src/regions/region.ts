import type {FallbackOptions} from '../types'

export interface RegionOptions {
  fallbackOrder?: number
  fallbackRegion?: boolean
}

type RegionFallback = {
  $element: HTMLElement
  fallbackOrder: number
}

type FocusEventHandler = (event: FocusEvent) => void

export class Region {
  public fallbackOrder: number
  public isFallbackRegion: boolean

  public blurHandler?: FocusEventHandler
  public focusHandler?: FocusEventHandler

  private _fallbacks: RegionFallback[]
  private _$container: HTMLElement

  constructor(
    $container: HTMLElement,
    {fallbackOrder = 0, fallbackRegion = true}: RegionOptions = {},
  ) {
    this.setContainer($container)
    this._fallbacks = []
    this.fallbackOrder = fallbackOrder
    this.isFallbackRegion = fallbackRegion
  }

  get $container(): HTMLElement {
    return this._$container
  }

  setContainer($element: HTMLElement): void {
    this._$container = $element
  }

  get fallbacks(): RegionFallback[] {
    return this._fallbacks
  }

  get $fallbacks(): HTMLElement[] {
    return this._fallbacks.map(fallback => fallback.$element)
  }

  setFallback($element: HTMLElement, {fallbackOrder = 0}: FallbackOptions = {}): void {
    this._fallbacks = this._fallbacks.filter(fallback => fallback.fallbackOrder != fallbackOrder)

    if ($element != null) {
      this._fallbacks.push({fallbackOrder, $element})
      this._fallbacks.sort((a, b) => a.fallbackOrder - b.fallbackOrder)
    }
  }

  // move to Regions?
  containsElement($element: HTMLElement): boolean {
    return this.$container ? this.$container.contains($element) : false
  }

  // move to Regions?
  containsRegion(region: Region): boolean {
    return this.containsElement(region.$container)
  }
}
