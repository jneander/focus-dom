import {findLastIndex} from './utils'

export default class FocusTracker {
  constructor(regions) {
    this._regions = regions

    this._rootFocus = null
    this._borrows = []
  }

  get currentRegion() {
    const {_currentFocus} = this
    return _currentFocus ? _currentFocus.region : null
  }

  get $currentElement() {
    const {_currentFocus} = this
    return _currentFocus ? _currentFocus.$element : null
  }

  /*
   * When an existing region receives focus, or a region is added and
   * inherits focus, ensure the current focus entry is present and has
   * the active element assigned to it.
   */
  updateCurrentFocus(region, $element) {
    const {_currentFocus} = this

    if (_currentFocus == null) {
      this._rootFocus = {
        $element,
        lineage: this._regions.getRegionLineage(region),
        region
      }
    } else {
      _currentFocus.$element = $element
      _currentFocus.region = region
    }
  }

  replaceRegion(previousRegion, nextRegion) {
    if (this._rootFocus && this._rootFocus.region === previousRegion) {
      this._rootFocus.region = nextRegion
      this._rootFocus.lineage = this._regions.getRegionLineage(nextRegion)
    }

    this._borrows.forEach(entry => {
      if (entry.region === previousRegion) {
        entry.region = nextRegion
        entry.lineage = this._regions.getRegionLineage(nextRegion)
      }
    })
  }

  removeRegion(region) {
    /*
     * TODO: what happens when removing the "root" focus region?
     * There might be some meaningful overlap between FocusTracker and
     * Reconciliation here.
     */
    const root = this._rootFocus
    if (root && root.region === region) {
      const lineage = root.lineage.slice(0, root.lineage.length - 1)
      root.region = lineage[lineage.length - 1] || null
      root.lineage = lineage
    }

    this._borrows = this._borrows.filter(entry => entry.region !== region)
  }

  addBorrow(region, $element) {
    this._borrows.push({$element, region})
  }

  removeLastBorrow(region) {
    const lastIndex = findLastIndex(this._borrows, entry => entry.region === region)

    /*
     * There should never be a case where the releasing region does not have
     * a corresponding focus stack entry. But it is better to protect against
     * unknown behavior than make that assumption.
     */
    if (lastIndex !== -1) {
      this._borrows.splice(lastIndex, 1)
    }
  }

  // PRIVILEGED

  get _currentFocus() {
    return this._borrows[this._borrows.length - 1] || this._rootFocus
  }
}
