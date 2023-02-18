import {createContainer, renderString} from '@jneander/spec-utils-dom'

import {Focus, RegionWrapper} from '../focus'

describe('Multiple fallbacks', () => {
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

  context('with one level of regions', () => {
    beforeEach(() => {
      render(`
        <div id="container">
          <button id="fallback-2">Fallback 2</button>
          <button id="fallback-1">Fallback 1</button>
          <button id="other">Other</button>
        </div>
      `)

      regionMap.container = focus.addRegion(get('container'))
    })

    it('moves focus to the lowest-order fallback', () => {
      regionMap.container.setFallback(get('fallback-1'), {fallbackOrder: 1})
      regionMap.container.setFallback(get('fallback-2'), {fallbackOrder: 2})

      get('other').focus()
      get('other').remove()
      reconcileAllRegions()

      expect(getFocusedElementId()).to.equal('fallback-1')
    })

    it('uses the next-lowest fallback when the lowest has been removed', () => {
      regionMap.container.setFallback(get('fallback-1'), {fallbackOrder: 1})
      regionMap.container.setFallback(get('fallback-2'), {fallbackOrder: 2})

      get('other').focus()
      get('other').remove()
      get('fallback-1').remove()
      reconcileAllRegions()

      expect(getFocusedElementId()).to.equal('fallback-2')
    })

    it('ignores the order in which fallbacks were added', () => {
      regionMap.container.setFallback(get('fallback-2'), {fallbackOrder: 2})
      regionMap.container.setFallback(get('fallback-1'), {fallbackOrder: 1})

      get('other').focus()
      get('other').remove()
      reconcileAllRegions()

      expect(getFocusedElementId()).to.equal('fallback-1')
    })

    it('loses focus to the document body when all fallback elements have been removed', () => {
      regionMap.container.setFallback(get('fallback-1'), {fallbackOrder: 1})
      regionMap.container.setFallback(get('fallback-2'), {fallbackOrder: 2})

      get('other').focus()
      get('other').remove()
      get('fallback-1').remove()
      get('fallback-2').remove()
      reconcileAllRegions()

      expect(getFocusedElementId()).to.equal('document.body')
    })
  })

  context('with two levels of regions', () => {
    beforeEach(() => {
      render(`
        <div id="parent-container">
          <button id="parent-fallback-1">Parent Fallback 1</button>
          <button id="parent-fallback-2">Parent Fallback 2</button>
          <button id="parent-other">Parent Other</button>

          <div id="child-container">
            <button id="child-fallback-1">Child Fallback 1</button>
            <button id="child-fallback-2">Child Fallback 2</button>
            <button id="child-other">Child Other</button>
          </div>
        </div>
      `)

      regionMap.parent = focus.addRegion(get('parent-container'))
      regionMap.child = focus.addRegion(get('child-container'))
    })

    context('when a focused element in the child region is removed', () => {
      it('moves focus to the first fallback of the child', () => {
        regionMap.parent.setFallback(get('parent-fallback-1'), {fallbackOrder: 1})
        regionMap.parent.setFallback(get('parent-fallback-2'), {fallbackOrder: 2})
        regionMap.child.setFallback(get('child-fallback-1'), {fallbackOrder: 1})
        regionMap.child.setFallback(get('child-fallback-2'), {fallbackOrder: 2})

        get('child-other').focus()
        get('child-other').remove()
        reconcileAllRegions()

        expect(getFocusedElementId()).to.equal('child-fallback-1')
      })

      it('uses the next child fallback when the first has been removed', () => {
        regionMap.parent.setFallback(get('parent-fallback-1'), {fallbackOrder: 1})
        regionMap.parent.setFallback(get('parent-fallback-2'), {fallbackOrder: 2})
        regionMap.child.setFallback(get('child-fallback-1'), {fallbackOrder: 1})
        regionMap.child.setFallback(get('child-fallback-2'), {fallbackOrder: 2})

        get('child-other').focus()
        get('child-other').remove()
        get('child-fallback-1').remove()
        reconcileAllRegions()

        expect(getFocusedElementId()).to.equal('child-fallback-2')
      })

      it('uses the first parent fallback when the child fallbacks have been removed', () => {
        regionMap.parent.setFallback(get('parent-fallback-1'), {fallbackOrder: 1})
        regionMap.parent.setFallback(get('parent-fallback-2'), {fallbackOrder: 2})
        regionMap.child.setFallback(get('child-fallback-1'), {fallbackOrder: 1})
        regionMap.child.setFallback(get('child-fallback-2'), {fallbackOrder: 2})

        get('child-other').focus()
        get('child-other').remove()
        get('child-fallback-1').remove()
        get('child-fallback-2').remove()
        reconcileAllRegions()

        expect(getFocusedElementId()).to.equal('parent-fallback-1')
      })

      it('uses the second parent fallback when the first have been removed', () => {
        regionMap.parent.setFallback(get('parent-fallback-1'), {fallbackOrder: 1})
        regionMap.parent.setFallback(get('parent-fallback-2'), {fallbackOrder: 2})
        regionMap.child.setFallback(get('child-fallback-1'), {fallbackOrder: 1})
        regionMap.child.setFallback(get('child-fallback-2'), {fallbackOrder: 2})

        get('child-other').focus()
        get('child-other').remove()
        get('child-fallback-1').remove()
        get('child-fallback-2').remove()
        get('parent-fallback-1').remove()
        reconcileAllRegions()

        expect(getFocusedElementId()).to.equal('parent-fallback-2')
      })

      it('loses focus to the document body when no fallbacks exist', () => {
        const $childFallback2 = get('child-fallback-2')
        $childFallback2.focus()
        $childFallback2.remove()
        reconcileAllRegions()

        expect(getFocusedElementId()).to.equal('document.body')
      })

      context('when the child region is the first fallback of the parent region', () => {
        it('moves focus to the first fallback of the child region', () => {
          // regionMap.parent.setFallback(get('child-container'), {fallbackOrder: 1})
          regionMap.parent.setFallback(get('parent-fallback-2'), {fallbackOrder: 2})
          regionMap.child.setFallback(get('child-fallback-1'), {fallbackOrder: 1})
          regionMap.child.setFallback(get('child-fallback-2'), {fallbackOrder: 2})

          get('child-other').focus()
          get('child-other').remove()
          reconcileAllRegions()

          expect(getFocusedElementId()).to.equal('child-fallback-1')
        })

        it('uses the second fallback of the child region when the first has been removed', () => {
          // regionMap.parent.setFallback(get('child-container'), {fallbackOrder: 1})
          regionMap.parent.setFallback(get('parent-fallback-2'), {fallbackOrder: 2})
          regionMap.child.setFallback(get('child-fallback-1'), {fallbackOrder: 1})
          regionMap.child.setFallback(get('child-fallback-2'), {fallbackOrder: 2})

          get('child-other').focus()
          get('child-other').remove()
          get('child-fallback-1').remove()
          reconcileAllRegions()

          expect(getFocusedElementId()).to.equal('child-fallback-2')
        })

        it('uses the second fallback of the child region when the first has been unset', () => {
          // regionMap.parent.setFallback(get('child-container'), {fallbackOrder: 1})
          regionMap.parent.setFallback(get('parent-fallback-2'), {fallbackOrder: 2})
          regionMap.child.setFallback(get('child-fallback-1'), {fallbackOrder: 1})
          regionMap.child.setFallback(get('child-fallback-2'), {fallbackOrder: 2})

          get('child-other').focus()
          get('child-other').remove()
          regionMap.child.setFallback(null, {fallbackOrder: 1})
          reconcileAllRegions()

          expect(getFocusedElementId()).to.equal('child-fallback-2')
        })

        it('uses the second fallback of the parent when the child fallbacks have been removed', () => {
          // regionMap.parent.setFallback(get('child-container'), {fallbackOrder: 1})
          regionMap.parent.setFallback(get('parent-fallback-2'), {fallbackOrder: 2})
          regionMap.child.setFallback(get('child-fallback-1'), {fallbackOrder: 1})
          regionMap.child.setFallback(get('child-fallback-2'), {fallbackOrder: 2})

          get('child-other').focus()
          get('child-other').remove()
          get('child-fallback-1').remove()
          get('child-fallback-2').remove()
          reconcileAllRegions()

          expect(getFocusedElementId()).to.equal('parent-fallback-2')
        })

        it('uses the second fallback of the parent when the child has no fallbacks', () => {
          // regionMap.parent.setFallback(get('child-container'), {fallbackOrder: 1})
          regionMap.parent.setFallback(get('parent-fallback-2'), {fallbackOrder: 2})

          get('child-other').focus()
          get('child-other').remove()
          reconcileAllRegions()

          expect(getFocusedElementId()).to.equal('parent-fallback-2')
        })
      })
    })
  })
})
