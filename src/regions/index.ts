// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import {Region} from './region'

function noop() {
  // No behavior
}

export class Regions {
  constructor(config) {
    this._config = {
      onRegionBlur: config.onRegionBlur || noop,
      onRegionFocus: config.onRegionFocus || noop,
    }

    this._regionList = []

    this._handleRegionBlur = this._handleRegionBlur.bind(this)
    this._handleRegionFocus = this._handleRegionFocus.bind(this)
  }

  get activeRegion() {
    const {activeElement} = document
    let containingRegion = null

    this._regionList.forEach(region => {
      if (
        region.containsElement(activeElement) &&
        (containingRegion == null || containingRegion.containsRegion(region))
      ) {
        containingRegion = region
      }
    })

    return containingRegion
  }

  addRegion($container, options) {
    let region = this.getRegionForContainer($container)

    if (region) {
      this.removeRegion(region)
    }

    region = new Region($container, options)

    region.blurHandler = event => {
      this._handleRegionBlur(region, event.target)
    }
    region.focusHandler = event => {
      this._handleRegionFocus(region, event.target)
    }

    $container.addEventListener('blur', region.blurHandler, true)
    $container.addEventListener('focus', region.focusHandler, true)

    this._regionList.push(region)

    return region
  }

  removeRegion(region) {
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

  includes(region) {
    return this._regionList.includes(region)
  }

  regionOwnsElement(region, $element) {
    if (!region.containsElement($element)) {
      return false
    }

    return !this._regionList.some(
      _region =>
        _region !== region && !_region.containsRegion(region) && _region.containsElement($element),
    )
  }

  getRegionLineage(region) {
    const containingRegions = this._regionList.filter(_region => _region.containsRegion(region))
    return containingRegions.sort((a, b) => (a.containsRegion(b) ? -1 : 1))
  }

  getParentRegion(region) {
    const lineage = this.getRegionLineage(region)
    return lineage[lineage.length - 2] || null
  }

  getChildRegions(region) {
    const childRegions = this._regionList.filter(
      _region => _region !== region && region.containsRegion(_region),
    )

    // Using the index, mark where a region is a confirmed grandchild.
    const ruledOutMap = {}

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

  getRegionForContainer($element) {
    return this._regionList.find(region => region.$container === $element) || null
  }

  getRegionOwnerForElement($element) {
    let containingRegion = null

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

  getFallbacksForRegion(region) {
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

  _handleRegionBlur(region, $element) {
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

  _handleRegionFocus(region, $element) {
    if (this.regionOwnsElement(region, $element)) {
      this._config.onRegionFocus(region, $element)
    }
  }
}
