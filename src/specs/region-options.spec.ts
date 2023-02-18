import {createContainer, renderString} from '@jneander/spec-utils-dom'

import {Focus, RegionWrapper} from '../focus'

describe('Region options', () => {
  let $container: HTMLElement
  let focus: Focus
  let regionMap: Record<string, RegionWrapper>

  beforeEach(() => {
    $container = createContainer()
    focus = new Focus()
    regionMap = {}
  })

  afterEach(() => {
    $container.remove()
  })

  function get(elementId: string) {
    return document.getElementById(elementId)
  }

  function render(htmlString: string) {
    renderString(htmlString, $container)
  }

  function reconcileAllRegions() {
    Object.values(regionMap).forEach(region => region.reconcile())
  }

  function getFocusedElementId() {
    if (document.activeElement === document.body) {
      return 'document.body'
    }
    return document.activeElement.id
  }

  // the fallbackOrder on containers matters only when falling forward into them
  // - not when falling back while within one of them
  // - e.g. B1 falls onto B2 before falling back to A

  describe('region fallback order', () => {
    beforeEach(() => {
      render(`
        <div id="parent-container">
          <button id="other">Other</button>

          <div id="child-container-a">
            <button id="child-fallback-a1">Child Fallback B1</button>
            <button id="child-fallback-a2">Child Fallback B2</button>
          </div>

          <div id="child-container-b">
            <button id="child-fallback-b1">Child Fallback B1</button>
            <button id="child-fallback-b2">Child Fallback B2</button>
          </div>
        </div>
      `)

      regionMap.parent = focus.addRegion(get('parent-container'))
      regionMap.childA = focus.addRegion(get('child-container-a'), {fallbackOrder: 2})
      regionMap.childB = focus.addRegion(get('child-container-b'), {fallbackOrder: 1})
    })

    it('falls forward to the lowest-order container', () => {
      regionMap.childA.setFallback(get('child-fallback-a1'), {fallbackOrder: 1})
      regionMap.childA.setFallback(get('child-fallback-a2'), {fallbackOrder: 2})
      regionMap.childB.setFallback(get('child-fallback-b1'), {fallbackOrder: 11})
      regionMap.childB.setFallback(get('child-fallback-b2'), {fallbackOrder: 12})

      get('other').focus()
      get('other').remove()
      reconcileAllRegions()

      expect(getFocusedElementId()).to.equal('child-fallback-b1')
    })
  })
})
