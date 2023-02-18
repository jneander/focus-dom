import {FocusTracker} from '../focus-tracker'
import {Reconciliation} from '../reconciliation'
import {Regions} from '../regions'
import type {Region, RegionOptions} from '../regions/region'
import {RegionWrapper} from './region-wrapper'

export class Focus {
  public regions: Regions
  public reconciliation: Reconciliation
  public focusTracker: FocusTracker

  constructor() {
    this.regions = new Regions({
      onRegionFocus: this._onRegionFocus.bind(this),
    })
    this.reconciliation = new Reconciliation(this.regions)
    this.focusTracker = new FocusTracker(this.regions)
  }

  addRegion($container: HTMLElement, options?: RegionOptions): RegionWrapper {
    const previousRegion = this.regions.getRegionForContainer($container)
    const region = this.regions.addRegion($container, options)

    if (previousRegion != null) {
      this.focusTracker.replaceRegion(previousRegion, region)
    }

    if (region.containsElement(document.activeElement as HTMLElement)) {
      this.focusTracker.updateCurrentFocus(
        this.regions.activeRegion,
        document.activeElement as HTMLElement,
      )
    }

    return new RegionWrapper(this, region)
  }

  removeRegion(region: Region): void {
    this.regions.removeRegion(region)
    this.focusTracker.removeRegion(region)
  }

  borrowFocus(region: Region, $element: HTMLElement): void {
    this.focusTracker.addBorrow(region, $element)
    $element.focus()
  }

  releaseFocus(region: Region): void {
    this.focusTracker.removeLastBorrow(region)

    const {$currentElement, currentRegion} = this.focusTracker

    if (document.body.contains($currentElement)) {
      $currentElement.focus()
    } else {
      /*
       * TODO: Under what circumstances will the focus stack be empty at this point?
       * The lender was removed, I think.
       *
       * At this point, the focus stack is empty. The focus path must be used to
       * trace a fallback path
       */
      const startingRegion = currentRegion || this.regions.getParentRegion(region)
      const $nextElement = this.reconciliation.getElementToFocus(startingRegion)
      if ($nextElement != null) {
        $nextElement.focus()
      }
    }
  }

  reconcile(): undefined | null {
    if (document.activeElement !== document.body) {
      return null
    }

    const $element = this.reconciliation.getElementToFocus(this.focusTracker.currentRegion)
    if ($element != null) {
      $element.focus()
    }
  }

  // PRIVILEGED

  _onRegionFocus(region: Region, $element: HTMLElement): void {
    this.focusTracker.updateCurrentFocus(region, $element)
  }
}
