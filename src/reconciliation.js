export class Reconciliation {
  constructor(regions) {
    this._regions = regions
  }

  getElementToFocus(startingRegion) {
    if (startingRegion == null) {
      return undefined
    }

    return this._fallIntoRegion(startingRegion) || null
  }

  // PRIVILEGED

  _fallIntoRegion(region, exploredRegions = []) {
    if (exploredRegions.includes(region)) {
      return this._fallBackToParentRegion(region, exploredRegions)
    }

    const updatedRegions = exploredRegions.concat([region])
    const $fallbacks = this._regions.getFallbacksForRegion(region)

    for (let $fallback of $fallbacks) {
      const regionForContainerFallback = this._regions.getRegionForContainer($fallback)

      if (regionForContainerFallback) {
        if (!updatedRegions.includes(regionForContainerFallback)) {
          const $focusable = this._fallIntoRegion(regionForContainerFallback, updatedRegions)
          if ($focusable != null) {
            return $focusable
          }
        }
      } else if (document.body.contains($fallback)) {
        return $fallback
      }
    }

    return this._fallBackToParentRegion(region, updatedRegions)
  }

  _fallBackToParentRegion(region, exploredRegions) {
    const parentRegion = this._regions.getParentRegion(region)
    if (parentRegion != null) {
      return this._fallIntoRegion(parentRegion, exploredRegions)
    }
  }
}
