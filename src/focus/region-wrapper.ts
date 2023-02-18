import type {Region} from '../regions/region'
import {FallbackOptions} from '../types'
import type {Focus} from './focus'

export class RegionWrapper {
  private _focus: Focus
  private _region: Region

  constructor(focus: Focus, region: Region) {
    this._focus = focus
    this._region = region
  }

  get $container(): HTMLElement {
    return this._region.$container
  }

  setContainer($element: HTMLElement): void {
    this._region.setContainer($element)
  }

  get $fallbacks(): HTMLElement[] {
    return this._region.$fallbacks
  }

  setFallback($element: HTMLElement, options?: FallbackOptions): void {
    this._region.setFallback($element, options)
  }

  borrowFocus($element: HTMLElement): void {
    this._focus.borrowFocus(this._region, $element)
  }

  releaseFocus(): void {
    this._focus.releaseFocus(this._region)
  }

  reconcile(): void {
    this._focus.reconcile()
  }

  remove(): void {
    this._focus.removeRegion(this._region)
  }

  // move to Regions?
  containsElement($element: HTMLElement): boolean {
    return this._region.containsElement($element)
  }

  // move to Regions?
  containsRegion(region: Region): boolean {
    return this._region.containsRegion(region)
  }
}
