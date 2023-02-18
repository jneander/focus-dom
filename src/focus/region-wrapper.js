export class RegionWrapper {
  constructor(focus, region) {
    this._focus = focus
    this._region = region
  }

  get $container() {
    return this._region.$container
  }

  setContainer($element) {
    this._region.setContainer($element)
  }

  get $fallbacks() {
    return this._region.$fallbacks
  }

  setFallback($element, options) {
    this._region.setFallback($element, options)
  }

  borrowFocus($element) {
    this._focus.borrowFocus(this._region, $element)
  }

  releaseFocus() {
    this._focus.releaseFocus(this._region)
  }

  reconcile() {
    this._focus.reconcile()
  }

  remove() {
    this._focus.removeRegion(this._region)
  }

  // move to Regions?
  containsElement($element) {
    return this._region.containsElement($element)
  }

  // move to Regions?
  containsRegion(region) {
    return this._region.containsRegion(region)
  }
}
