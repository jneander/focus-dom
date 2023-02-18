// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

export class Region {
  constructor($container, {fallbackOrder = 0, fallbackRegion = true} = {}) {
    this.setContainer($container)
    this._fallbacks = []
    this.fallbackOrder = fallbackOrder
    this.isFallbackRegion = fallbackRegion
  }

  get $container() {
    return this._$container
  }

  setContainer($element) {
    this._$container = $element
  }

  get fallbacks() {
    return this._fallbacks
  }

  get $fallbacks() {
    return this._fallbacks.map(fallback => fallback.$element)
  }

  setFallback($element, {fallbackOrder = 0} = {}) {
    this._fallbacks = this._fallbacks.filter(fallback => fallback.fallbackOrder != fallbackOrder)

    if ($element != null) {
      this._fallbacks.push({fallbackOrder, $element})
      this._fallbacks.sort((a, b) => a.fallbackOrder - b.fallbackOrder)
    }
  }

  // move to Regions?
  containsElement($element) {
    return this.$container ? this.$container.contains($element) : false
  }

  // move to Regions?
  containsRegion(region) {
    return this.containsElement(region.$container)
  }
}
