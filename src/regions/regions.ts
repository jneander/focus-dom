import {Region, RegionOptions} from './region'

export interface RegionsConfig {
  onRegionBlur: (region: Region, $element: HTMLElement) => void
  onRegionFocus: (region: Region, $element: HTMLElement) => void
}

function noop() {
  // No behavior
}

export class Regions {
  private _config: RegionsConfig

  /**
   * This exists for testing purposes only.
   *
   * @type {Region[]}
   */
  _regionList: Region[]

  constructor(config: Partial<RegionsConfig> = {}) {
    this._config = {
      onRegionBlur: config.onRegionBlur || noop,
      onRegionFocus: config.onRegionFocus || noop,
    }

    this._regionList = []

    this._handleRegionBlur = this._handleRegionBlur.bind(this)
    this._handleRegionFocus = this._handleRegionFocus.bind(this)
  }

  get activeRegion(): Region | null {
    const {activeElement} = document
    let containingRegion: Region | null = null

    this._regionList.forEach(region => {
      if (
        region.containsElement(activeElement as HTMLElement) &&
        (containingRegion == null || containingRegion.containsRegion(region))
      ) {
        containingRegion = region
      }
    })

    return containingRegion
  }

  addRegion($container: HTMLElement, options?: RegionOptions): Region {
    let region = this.getRegionForContainer($container)

    if (region) {
      this.removeRegion(region)
    }

    region = new Region($container, options)

    region.blurHandler = (event: FocusEvent) => {
      this._handleRegionBlur(region, event.target as HTMLElement)
    }
    region.focusHandler = (event: FocusEvent) => {
      this._handleRegionFocus(region, event.target as HTMLElement)
    }

    $container.addEventListener('blur', region.blurHandler, true)
    $container.addEventListener('focus', region.focusHandler, true)

    this._regionList.push(region)

    return region
  }

  removeRegion(region: Region): void {
    region.$container.removeEventListener('blur', region.blurHandler, true)
    region.$container.removeEventListener('focus', region.focusHandler, true)

    this._regionList = this._regionList.filter(_region => _region !== region)
    this._regionList.forEach(_region => {
      _region.fallbacks.forEach(({$element, fallbackOrder}) => {
        if ($element === region.$container) {
          _region.setFallback(null, {fallbackOrder})
        }
      })
    })
  }

  includes(region: Region): boolean {
    return this._regionList.includes(region)
  }

  regionOwnsElement(region: Region, $element: HTMLElement): boolean {
    if (!region.containsElement($element)) {
      return false
    }

    return !this._regionList.some(
      _region =>
        _region !== region && !_region.containsRegion(region) && _region.containsElement($element),
    )
  }

  getRegionLineage(region: Region): Region[] {
    const containingRegions = this._regionList.filter(_region => _region.containsRegion(region))
    return containingRegions.sort((a, b) => (a.containsRegion(b) ? -1 : 1))
  }

  getParentRegion(region: Region): Region | null {
    const lineage = this.getRegionLineage(region)
    return lineage[lineage.length - 2] || null
  }

  getChildRegions(region: Region): Region[] {
    const childRegions = this._regionList.filter(
      _region => _region !== region && region.containsRegion(_region),
    )

    // Using the index, mark where a region is a confirmed grandchild.
    const ruledOutMap: {[key: number]: Region | boolean} = {}

    for (let candidateIndex = 0; candidateIndex < childRegions.length; candidateIndex++) {
      if (ruledOutMap[candidateIndex]) {
        continue
      }

      const candidateRegion = childRegions[candidateIndex]

      for (let childIndex = 0; childIndex < childRegions.length; childIndex++) {
        if (childIndex === candidateIndex || ruledOutMap[childIndex]) {
          continue
        }

        const childRegion = childRegions[childIndex]
        const isGrandChild = childRegion.containsRegion(candidateRegion)
        ruledOutMap[candidateIndex] = isGrandChild
        if (!isGrandChild) {
          ruledOutMap[childIndex] = candidateRegion.containsRegion(childRegion)
        }
      }
    }

    return childRegions.filter((_region, index) => !ruledOutMap[index])
  }

  getRegionForContainer($element: HTMLElement): Region | null {
    return this._regionList.find(region => region.$container === $element) || null
  }

  getRegionOwnerForElement($element: HTMLElement): Region | null {
    let containingRegion: Region | null = null

    this._regionList.forEach(region => {
      if (
        region.containsElement($element) &&
        (containingRegion == null || containingRegion.containsRegion(region))
      ) {
        containingRegion = region
      }
    })

    return containingRegion
  }

  getFallbacksForRegion(region: Region): HTMLElement[] {
    const fallbacks = [...region.fallbacks]

    this.getChildRegions(region).forEach(childRegion => {
      if (childRegion.$container != null && childRegion.isFallbackRegion) {
        fallbacks.push({
          $element: childRegion.$container,
          fallbackOrder: childRegion.fallbackOrder,
        })
      }
    })

    fallbacks.sort((a, b) => a.fallbackOrder - b.fallbackOrder)
    return fallbacks.map(fallback => fallback.$element)
  }

  _handleRegionBlur(region: Region, $element: HTMLElement): void {
    if ($element === document.activeElement) {
      /*
       * The element still has focus. Blur might have been the browser
       * window losing focus from the user tabbing away.
       */
      return
    }

    if (this.regionOwnsElement(region, $element)) {
      this._config.onRegionBlur(region, $element)
    }
  }

  _handleRegionFocus(region: Region, $element: HTMLElement): void {
    if (this.regionOwnsElement(region, $element)) {
      this._config.onRegionFocus(region, $element)
    }
  }
}
