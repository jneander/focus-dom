import {createContainer, renderString} from '@jneander/spec-utils-dom'

import {Focus, RegionWrapper} from '../focus'

describe('Focus fallback', () => {
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

  function get(elementId: string): HTMLElement {
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
          <button id="fallback-1">Fallback 1</button>
          <button id="fallback-2">Fallback 2</button>
        </div>
      `)

      regionMap.container = focus.addRegion(get('container'))
    })

    it('moves focus to the fallback focus element when assigned', () => {
      regionMap.container.setFallback(get('fallback-1'))

      const $button2 = get('fallback-2')
      $button2.focus()
      $button2.remove()
      reconcileAllRegions()

      expect(getFocusedElementId()).to.equal('fallback-1')
    })

    it('loses focus to the document body when the fallback focus element was removed', () => {
      const $button1 = get('fallback-1')
      regionMap.container.setFallback($button1)

      const $button2 = get('fallback-2')
      $button2.focus()
      $button1.remove()
      $button2.remove()
      reconcileAllRegions()

      expect(getFocusedElementId()).to.equal('document.body')
    })

    it('loses focus to the document body when no fallback focus element is assigned', () => {
      const $button2 = get('fallback-2')
      $button2.focus()
      $button2.remove()
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

          <div id="child-container">
            <button id="child-fallback-1">Child Fallback 1</button>
            <button id="child-fallback-2">Child Fallback 2</button>
          </div>
        </div>
      `)

      regionMap.parent = focus.addRegion(get('parent-container'))
      regionMap.child = focus.addRegion(get('child-container'))
    })

    context('when a focused element in the child region is removed', () => {
      it('moves focus to the fallback focus element of the child region when assigned', () => {
        regionMap.parent.setFallback(get('parent-fallback-1'))
        regionMap.child.setFallback(get('child-fallback-1'))

        const $childFallback2 = get('child-fallback-2')
        $childFallback2.focus()
        $childFallback2.remove()
        reconcileAllRegions()

        expect(getFocusedElementId()).to.equal('child-fallback-1')
      })

      it('uses the parent fallback when the child does not have one', () => {
        regionMap.parent.setFallback(get('parent-fallback-1'))

        const $childFallback2 = get('child-fallback-2')
        $childFallback2.focus()
        $childFallback2.remove()
        reconcileAllRegions()

        expect(getFocusedElementId()).to.equal('parent-fallback-1')
      })

      it('loses focus to the document body when no fallbacks exist', () => {
        const $childFallback2 = get('child-fallback-2')
        $childFallback2.focus()
        $childFallback2.remove()
        reconcileAllRegions()

        expect(getFocusedElementId()).to.equal('document.body')
      })
    })

    context('when a focused element in the parent region is removed', () => {
      it('moves focus to the fallback focus element of the parent region when assigned', () => {
        regionMap.parent.setFallback(get('parent-fallback-1'))
        regionMap.child.setFallback(get('child-fallback-1'))

        const $parentFallback2 = get('parent-fallback-2')
        $parentFallback2.focus()
        $parentFallback2.remove()
        reconcileAllRegions()

        expect(getFocusedElementId()).to.equal('parent-fallback-1')
      })

      it('moves focus to the fallback element in the child region when assigned', () => {
        regionMap.child.setFallback(get('child-fallback-1'))

        const $parentFallback2 = get('parent-fallback-2')
        $parentFallback2.focus()
        $parentFallback2.remove()
        reconcileAllRegions()

        expect(getFocusedElementId()).to.equal('child-fallback-1')
      })

      it('loses focus to the document body when no fallbacks exist', () => {
        const $parentFallback2 = get('parent-fallback-2')
        $parentFallback2.focus()
        $parentFallback2.remove()
        reconcileAllRegions()

        expect(getFocusedElementId()).to.equal('document.body')
      })
    })
  })

  context('with sibling regions', () => {
    beforeEach(() => {
      render(`
        <div id="parent-container">
          <div id="child-container-a">
            <button id="child-fallback-a1">Child Fallback A1</button>
            <button id="child-fallback-a2">Child Fallback A2</button>
          </div>

          <div id="child-container-b">
            <button id="child-fallback-b1">Child Fallback B1</button>
            <button id="child-fallback-b2">Child Fallback B2</button>
          </div>
        </div>
      `)

      regionMap.parent = focus.addRegion(get('parent-container'))
      regionMap.childA = focus.addRegion(get('child-container-a'))
      regionMap.childB = focus.addRegion(get('child-container-b'))
    })

    it('moves focus to the fallback focus element of the same region when assigned', () => {
      regionMap.childA.setFallback(get('child-fallback-a1'))
      regionMap.childB.setFallback(get('child-fallback-b1'))

      const $childFallback2 = get('child-fallback-a2')
      $childFallback2.focus()
      $childFallback2.remove()
      reconcileAllRegions()

      expect(getFocusedElementId()).to.equal('child-fallback-a1')
    })

    it('falls back to a child when the previous region has no fallback', () => {
      regionMap.childB.setFallback(get('child-fallback-b1'))

      const $childFallback2 = get('child-fallback-a2')
      $childFallback2.focus()
      $childFallback2.remove()
      reconcileAllRegions()

      expect(getFocusedElementId()).to.equal('child-fallback-b1')
    })

    it('loses focus to the document body when no fallbacks exist', () => {
      const $childFallback2 = get('child-fallback-a2')
      $childFallback2.focus()
      $childFallback2.remove()
      reconcileAllRegions()

      expect(getFocusedElementId()).to.equal('document.body')
    })
  })

  context('with deeply-nested regions', () => {
    beforeEach(() => {
      render(`
        <div id="grandparent-container">
          <button id="grandparent-fallback-1">Grandparent Fallback 1</button>
          <button id="grandparent-fallback-2">Grandparent Fallback 2</button>

          <div id="parent-container">
            <button id="parent-fallback-1">Parent Fallback 1</button>
            <button id="parent-fallback-2">Parent Fallback 2</button>

            <div id="child-container">
              <button id="child-fallback-1">Child Fallback 1</button>
              <button id="child-fallback-2">Child Fallback 2</button>

              <div id="grandchild-container">
                <button id="grandchild-fallback-1">Grandchild Fallback 1</button>
                <button id="grandchild-fallback-2">Grandchild Fallback 2</button>
              </div>
            </div>
          </div>
        </div>
      `)

      regionMap.grandparent = focus.addRegion(get('grandparent-container'))
      regionMap.parent = focus.addRegion(get('parent-container'))
      regionMap.child = focus.addRegion(get('child-container'))
      regionMap.grandchild = focus.addRegion(get('grandchild-container'))
    })

    it('falls back through regions without fallbacks', () => {
      regionMap.grandparent.setFallback(get('grandparent-fallback-2'))

      const $grandchildFallback2 = get('grandchild-fallback-2')
      $grandchildFallback2.focus()
      $grandchildFallback2.remove()

      reconcileAllRegions()

      expect(getFocusedElementId()).to.equal('grandparent-fallback-2')
    })

    it('falls forward through regions with container fallbacks', () => {
      regionMap.grandchild.setFallback(get('grandchild-fallback-2'))

      const $grandparentFallback2 = get('grandparent-fallback-2')
      $grandparentFallback2.focus()
      $grandparentFallback2.remove()

      reconcileAllRegions()

      expect(getFocusedElementId()).to.equal('grandchild-fallback-2')
    })

    it('continues to fall back when child containers contain no fallbacks', () => {
      regionMap.grandparent.setFallback(get('grandparent-fallback-2'))

      const $grandparentFallback2 = get('parent-fallback-2')
      $grandparentFallback2.focus()
      $grandparentFallback2.remove()

      reconcileAllRegions()

      expect(getFocusedElementId()).to.equal('grandparent-fallback-2')
    })
  })

  context('with multiple branches of deeply-nested regions', () => {
    beforeEach(() => {
      render(`
        <div id="grandparent-container">
          <button id="grandparent-fallback-1">Grandparent Fallback 1</button>
          <button id="grandparent-fallback-2">Grandparent Fallback 2</button>

          <div id="parent-container">
            <button id="parent-fallback-1">Parent Fallback 1</button>
            <button id="parent-fallback-2">Parent Fallback 2</button>

            <div id="child-container-a">
              <button id="child-fallback-a1">Child Fallback A1</button>
              <button id="child-fallback-a2">Child Fallback A2</button>

              <div id="grandchild-container-a">
                <button id="grandchild-fallback-a1">Grandchild Fallback A1</button>
                <button id="grandchild-fallback-a2">Grandchild Fallback A2</button>
              </div>
            </div>

            <div id="child-container-b">
              <button id="child-fallback-b1">Child Fallback B1</button>
              <button id="child-fallback-b2">Child Fallback B2</button>

              <div id="grandchild-container-b">
                <button id="grandchild-fallback-b1">Grandchild Fallback B1</button>
                <button id="grandchild-fallback-b2">Grandchild Fallback B2</button>
              </div>
            </div>
          </div>
        </div>
      `)

      regionMap.grandparent = focus.addRegion(get('grandparent-container'))
      regionMap.parent = focus.addRegion(get('parent-container'))
      regionMap.childA = focus.addRegion(get('child-container-a'))
      regionMap.childB = focus.addRegion(get('child-container-b'))
      regionMap.grandchildA = focus.addRegion(get('grandchild-container-a'))
      regionMap.grandchildB = focus.addRegion(get('grandchild-container-b'))
    })

    context('when child containers of one branch contain no fallbacks', () => {
      it('can fall forward through another branch with fallback containers', () => {
        regionMap.grandparent.setFallback(get('grandparent-fallback-2'))
        regionMap.grandchildA.setFallback(get('grandchild-fallback-a2'))

        const $childFallback2 = get('child-fallback-b2')
        $childFallback2.focus()
        $childFallback2.remove()

        reconcileAllRegions()

        expect(getFocusedElementId()).to.equal('grandchild-fallback-a2')
      })

      it('continues to fall back when no branches contain fallbacks', () => {
        regionMap.grandparent.setFallback(get('grandparent-fallback-2'))

        const $childFallback2 = get('child-fallback-b2')
        $childFallback2.focus()
        $childFallback2.remove()

        reconcileAllRegions()

        expect(getFocusedElementId()).to.equal('grandparent-fallback-2')
      })
    })
  })

  context('when a region fallback is updated', () => {
    beforeEach(() => {
      render(`
        <div id="parent-container">
          <button id="parent-fallback-1">Parent Fallback 1</button>
          <button id="parent-fallback-2">Parent Fallback 2</button>

          <div id="child-container">
            <button id="child-fallback-1">Child Fallback 1</button>
            <button id="child-fallback-2">Child Fallback 2</button>
            <button id="child-fallback-3">Child Fallback 3</button>
          </div>
        </div>
      `)

      regionMap.parent = focus.addRegion(get('parent-container'))
      regionMap.child = focus.addRegion(get('child-container'))

      regionMap.parent.setFallback(get('parent-fallback-2'))
      regionMap.child.setFallback(get('child-fallback-2'))
    })

    it('falls back to the given element when present', () => {
      regionMap.child.setFallback(get('child-fallback-3'))

      const $childFallback1 = get('child-fallback-1')
      $childFallback1.focus()
      $childFallback1.remove()

      reconcileAllRegions()

      expect(getFocusedElementId()).to.equal('child-fallback-3')
    })

    it('falls back to a parent when the updated fallback element has been removed', () => {
      regionMap.child.setFallback(get('child-fallback-3'))

      const $childFallback1 = get('child-fallback-1')
      $childFallback1.focus()
      $childFallback1.remove()
      get('child-fallback-3').remove()

      reconcileAllRegions()

      expect(getFocusedElementId()).to.equal('parent-fallback-2')
    })

    it('falls back to a parent when the region fallback is unset using null', () => {
      regionMap.child.setFallback(null)

      const $childFallback1 = get('child-fallback-1')
      $childFallback1.focus()
      $childFallback1.remove()

      reconcileAllRegions()

      expect(getFocusedElementId()).to.equal('parent-fallback-2')
    })
  })

  context('when a region is removed', () => {
    beforeEach(() => {
      render(`
        <div id="grandparent-container">
          <button id="grandparent-fallback-1">Grandparent Fallback 1</button>
          <button id="grandparent-fallback-2">Grandparent Fallback 2</button>

          <div id="parent-container">
            <button id="parent-fallback-1">Parent Fallback 1</button>
            <button id="parent-fallback-2">Parent Fallback 2</button>

            <div id="child-container">
              <button id="child-fallback-1">Child Fallback 1</button>
              <button id="child-fallback-2">Child Fallback 2</button>

              <div id="grandchild-container">
                <button id="grandchild-fallback-1">Grandchild Fallback 1</button>
                <button id="grandchild-fallback-2">Grandchild Fallback 2</button>
              </div>
            </div>
          </div>
        </div>
      `)

      regionMap.grandparent = focus.addRegion(get('grandparent-container'))
      regionMap.parent = focus.addRegion(get('parent-container'))
      regionMap.child = focus.addRegion(get('child-container'))
      regionMap.grandchild = focus.addRegion(get('grandchild-container'))

      regionMap.grandparent.setFallback(get('grandparent-fallback-2'))
      regionMap.parent.setFallback(get('parent-fallback-2'))
      regionMap.child.setFallback(get('child-fallback-2'))
      regionMap.grandchild.setFallback(get('grandchild-fallback-2'))
    })

    context('when the region owned focus', () => {
      context('when the region is not re-added', () => {
        it('falls back to the parent region', () => {
          /*
           * The current element effectively becomes part of the parent region,
           * so it will use the parent fallback.
           */
          get('child-fallback-1').focus()
          regionMap.child.remove()
          get('child-fallback-1').remove()

          reconcileAllRegions()

          expect(getFocusedElementId()).to.equal('parent-fallback-2')
        })

        it('loses focus to the document body when no other region has a fallback', () => {
          regionMap.grandparent.setFallback(null)
          regionMap.parent.setFallback(null)
          regionMap.grandchild.setFallback(null)

          get('child-fallback-1').focus()
          regionMap.child.remove()
          get('child-fallback-1').remove()

          reconcileAllRegions()

          expect(getFocusedElementId()).to.equal('document.body')
        })
      })

      it('when the region is re-added', () => {
        it('falls back to the fallback of the re-added region', () => {
          get('child-fallback-1').focus()
          regionMap.child.remove()
          get('child-fallback-1').remove()

          regionMap.child = focus.addRegion(get('child-container'))
          regionMap.child.setFallback(get('child-fallback-2'))

          reconcileAllRegions()

          expect(getFocusedElementId()).to.equal('child-fallback-2')
        })

        it('falls back to another region when a fallback was not set', () => {
          get('child-fallback-1').focus()
          regionMap.child.remove()
          get('child-fallback-1').remove()

          regionMap.child = focus.addRegion(get('child-container'))

          reconcileAllRegions()

          expect(getFocusedElementId()).to.equal('parent-fallback-2')
        })

        it('loses focus to the document body when no other region has a fallback', () => {
          regionMap.grandparent.setFallback(null)
          regionMap.parent.setFallback(null)
          regionMap.grandchild.setFallback(null)

          get('child-fallback-1').focus()
          regionMap.child.remove()
          get('child-fallback-1').remove()

          regionMap.child = focus.addRegion(get('child-container'))

          reconcileAllRegions()

          expect(getFocusedElementId()).to.equal('document.body')
        })
      })
    })

    context('when the region had a child which owned focus', () => {
      context('when the region is not re-added', () => {
        it('falls back to the fallback of the child region', () => {
          regionMap.grandparent.setFallback(get('grandparent-fallback-2'))
          regionMap.parent.setFallback(get('parent-fallback-2'))
          regionMap.grandchild.setFallback(get('grandchild-fallback-2'))

          get('grandchild-fallback-1').focus()
          regionMap.child.remove()
          get('grandchild-fallback-1').remove()

          reconcileAllRegions()

          expect(getFocusedElementId()).to.equal('grandchild-fallback-2')
        })

        it('falls back to another region when the child has no fallback', () => {
          regionMap.grandchild.setFallback(null)

          get('grandchild-fallback-1').focus()
          regionMap.child.remove()
          get('grandchild-fallback-1').remove()

          reconcileAllRegions()

          expect(getFocusedElementId()).to.equal('parent-fallback-2')
        })

        it('loses focus to the document body when no regions have a fallback', () => {
          regionMap.grandparent.setFallback(null)
          regionMap.parent.setFallback(null)
          regionMap.grandchild.setFallback(null)

          get('child-fallback-1').focus()
          regionMap.child.remove()
          get('child-fallback-1').remove()

          reconcileAllRegions()

          expect(getFocusedElementId()).to.equal('document.body')
        })
      })

      context('when the region is re-added', () => {
        it('falls back to the fallback of the child region', () => {
          get('grandchild-fallback-1').focus()
          regionMap.child.remove()
          get('grandchild-fallback-1').remove()

          regionMap.child = focus.addRegion(get('child-container'))
          regionMap.child.setFallback(get('child-fallback-2'))

          reconcileAllRegions()

          expect(getFocusedElementId()).to.equal('grandchild-fallback-2')
        })

        it('falls back to the fallback of the re-added region when the child has no fallback', () => {
          regionMap.grandchild.setFallback(null)

          get('grandchild-fallback-1').focus()
          regionMap.child.remove()
          get('grandchild-fallback-1').remove()

          regionMap.child = focus.addRegion(get('child-container'))
          regionMap.child.setFallback(get('child-fallback-2'))

          reconcileAllRegions()

          expect(getFocusedElementId()).to.equal('child-fallback-2')
        })

        it('falls back to a higher region when no fallbacks are present at or below the region', () => {
          regionMap.grandchild.setFallback(null)

          get('grandchild-fallback-1').focus()
          regionMap.child.remove()
          get('grandchild-fallback-1').remove()

          regionMap.child = focus.addRegion(get('child-container'))

          reconcileAllRegions()

          expect(getFocusedElementId()).to.equal('parent-fallback-2')
        })

        it('loses focus to the document body when no regions have a fallback', () => {
          regionMap.grandparent.setFallback(null)
          regionMap.parent.setFallback(null)
          regionMap.grandchild.setFallback(null)

          get('child-fallback-1').focus()
          regionMap.child.remove()
          get('child-fallback-1').remove()

          regionMap.child = focus.addRegion(get('child-container'))

          reconcileAllRegions()

          expect(getFocusedElementId()).to.equal('document.body')
        })
      })
    })

    context('when the region had a parent which owned focus', () => {
      context('when the region is not re-added', () => {
        it('falls back to the parent fallback', () => {
          get('parent-fallback-1').focus()
          regionMap.child.remove()
          get('parent-fallback-1').remove()
          regionMap.parent.setFallback(get('parent-fallback-2'))

          reconcileAllRegions()

          expect(getFocusedElementId()).to.equal('parent-fallback-2')
        })

        it('loses focus to the document body when no other region has a fallback', () => {
          regionMap.grandparent.setFallback(null)
          regionMap.parent.setFallback(null)
          regionMap.grandchild.setFallback(null)

          get('parent-fallback-1').focus()
          regionMap.child.remove()
          get('parent-fallback-1').remove()

          reconcileAllRegions()

          expect(getFocusedElementId()).to.equal('document.body')
        })
      })
    })
  })

  context('when an intermediate region is added', () => {
    beforeEach(() => {
      render(`
        <div id="grandparent-container">
          <button id="grandparent-fallback-1">Grandparent Fallback 1</button>
          <button id="grandparent-fallback-2">Grandparent Fallback 2</button>

          <div id="parent-container">
            <button id="parent-fallback-1">Parent Fallback 1</button>
            <button id="parent-fallback-2">Parent Fallback 2</button>

            <div id="child-container">
              <button id="child-fallback-1">Child Fallback 1</button>
              <button id="child-fallback-2">Child Fallback 2</button>
            </div>
          </div>
        </div>
      `)

      regionMap.grandparent = focus.addRegion(get('grandparent-container'))
      regionMap.child = focus.addRegion(get('child-container'))

      regionMap.grandparent.setFallback(get('grandparent-fallback-2'))
      regionMap.child.setFallback(get('child-fallback-2'))
    })

    context('when the added region owns focus upon being added', () => {
      it('uses the fallback of the added region', () => {
        get('parent-fallback-1').focus()
        regionMap.parent = focus.addRegion(get('parent-container'))
        regionMap.parent.setFallback(get('parent-fallback-2'))
        get('parent-fallback-1').remove()

        reconcileAllRegions()

        expect(getFocusedElementId()).to.equal('parent-fallback-2')
      })

      it('falls back to another region when the region has no fallback', () => {
        get('parent-fallback-1').focus()
        regionMap.parent = focus.addRegion(get('parent-container'))
        get('parent-fallback-1').remove()

        reconcileAllRegions()

        expect(getFocusedElementId()).to.equal('child-fallback-2')
      })
    })

    context('when a child of the region owns focus and has no fallback', () => {
      beforeEach(() => {
        regionMap.child.setFallback(null)
      })

      it('uses the fallback of the added region', () => {
        get('child-fallback-1').focus()
        regionMap.parent = focus.addRegion(get('parent-container'))
        regionMap.parent.setFallback(get('parent-fallback-2'))
        get('child-fallback-1').remove()

        reconcileAllRegions()

        expect(getFocusedElementId()).to.equal('parent-fallback-2')
      })

      it('falls back to the parent of the added region when the region has no fallback', () => {
        get('child-fallback-1').focus()
        regionMap.parent = focus.addRegion(get('parent-container'))
        get('child-fallback-1').remove()

        reconcileAllRegions()

        expect(getFocusedElementId()).to.equal('grandparent-fallback-2')
      })
    })

    context('when the parent of the region owns focus', () => {
      it('uses the fallback of the parent region', () => {
        get('grandparent-fallback-1').focus()
        regionMap.parent = focus.addRegion(get('parent-container'))
        regionMap.parent.setFallback(get('parent-fallback-2'))
        get('grandparent-fallback-1').remove()

        reconcileAllRegions()

        expect(getFocusedElementId()).to.equal('grandparent-fallback-2')
      })

      it('falls forward into the added region when the parent has no fallback', () => {
        regionMap.grandparent.setFallback(null)
        get('grandparent-fallback-1').focus()
        regionMap.parent = focus.addRegion(get('parent-container'))
        regionMap.parent.setFallback(get('parent-fallback-2'))
        get('grandparent-fallback-1').remove()

        reconcileAllRegions()

        expect(getFocusedElementId()).to.equal('parent-fallback-2')
      })
    })
  })
})
