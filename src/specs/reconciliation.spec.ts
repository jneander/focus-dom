import {createContainer, renderString} from '@jneander/spec-utils-dom'

import {Reconciliation} from '../reconciliation'
import {Regions} from '../regions/regions'
import {Region} from '../regions/region'

describe('Reconciliation', () => {
  let $container: HTMLElement
  let reconciliation: Reconciliation
  let regions: Regions

  beforeEach(() => {
    $container = createContainer()

    regions = new Regions({})
    reconciliation = new Reconciliation(regions)
  })

  afterEach(() => {
    $container.remove()
  })

  function render(htmlString: string) {
    renderString(htmlString, $container)
  }

  function get(elementId: string): HTMLElement {
    return $container.querySelector(`#${elementId}`)
  }

  describe('#getElementToFocus()', () => {
    let regionMap: Record<string, Region>

    beforeEach(() => {
      regionMap = {}
    })

    /*
     * Many of these examples include extraneous elements that are never
     * referenced in the functional code. This is to ensure that their presence
     * does not have any impact on the internal element traversal when seeking
     * the next element to focus. Only the elements explicitly connected will
     * be considered for that result.
     */

    context('with one region', () => {
      beforeEach(() => {
        render(`
          <div id="container">
            <button id="fallback">Fallback</button>
            <button>Other</button>
          </div>
        `)
        regionMap.root = regions.addRegion(get('container'))
      })

      it('returns the fallback of the given region', () => {
        regionMap.root.setFallback(get('fallback'))
        expect(reconciliation.getElementToFocus(regionMap.root)).to.equal(get('fallback'))
      })

      it('returns `null` when the region has no fallback', () => {
        expect(reconciliation.getElementToFocus(regionMap.root)).to.be.null
      })

      it('returns `null` when the fallback has been removed', () => {
        regionMap.root.setFallback(get('fallback'))
        get('fallback').remove()
        expect(reconciliation.getElementToFocus(regionMap.root)).to.be.null
      })

      it('returns `undefined` when given an invalid region', () => {
        expect(reconciliation.getElementToFocus(null)).to.be.undefined
      })
    })

    context('with multiple root regions', () => {
      beforeEach(() => {
        render(`
          <div id="container-a">
            <button id="fallback-a">Fallback A</button>
            <button>Other A</button>
          </div>

          <div id="container-b">
            <button id="fallback-b">Fallback B</button>
            <button>Other B</button>
          </div>
        `)

        regionMap.a = regions.addRegion(get('container-a'))
        regionMap.b = regions.addRegion(get('container-b'))
      })

      it('returns the fallback of the given region when assigned', () => {
        regionMap.a.setFallback(get('fallback-a'))
        expect(reconciliation.getElementToFocus(regionMap.a)).to.equal(get('fallback-a'))
      })

      it('returns `null` when the region has no fallback', () => {
        expect(reconciliation.getElementToFocus(regionMap.a)).to.be.null
      })

      it('returns `null` when the fallback has been removed', () => {
        regionMap.a.setFallback(get('fallback-a'))
        get('fallback-a').remove()
        expect(reconciliation.getElementToFocus(regionMap.a)).to.be.null
      })

      context('when the fallback of the region is the container of another region', () => {
        it('returns the fallback of the other region when assigned', () => {
          regionMap.a.setFallback(get('container-b'))
          regionMap.b.setFallback(get('fallback-b'))
          expect(reconciliation.getElementToFocus(regionMap.a)).to.equal(get('fallback-b'))
        })

        it('returns `null` when the other region has no fallback', () => {
          regionMap.a.setFallback(get('container-b'))
          expect(reconciliation.getElementToFocus(regionMap.a)).to.be.null
        })

        it('returns `null` when the fallback of the other region has been removed', () => {
          regionMap.a.setFallback(get('container-b'))
          regionMap.b.setFallback(get('fallback-b'))
          get('fallback-b').remove()
          expect(reconciliation.getElementToFocus(regionMap.a)).to.be.null
        })
      })
    })

    context('with parent and child regions', () => {
      beforeEach(() => {
        render(`
          <div id="parent-container">
            <button id="parent-fallback">Parent Fallback</button>
            <button>Parent Other</button>

            <div id="child-container">
              <button id="child-fallback">Child Fallback</button>
              <button>Child Other</button>
            </div>
          </div>
        `)

        regionMap.parent = regions.addRegion(get('parent-container'))
        regionMap.child = regions.addRegion(get('child-container'))
      })

      context('when given the child region', () => {
        it('returns the child fallback when assigned', () => {
          regionMap.parent.setFallback(get('parent-fallback'))
          regionMap.child.setFallback(get('child-fallback'))
          expect(reconciliation.getElementToFocus(regionMap.child)).to.equal(get('child-fallback'))
        })

        it('returns the parent fallback when the child has no fallback', () => {
          regionMap.parent.setFallback(get('parent-fallback'))
          expect(reconciliation.getElementToFocus(regionMap.child)).to.equal(get('parent-fallback'))
        })

        it('returns the parent fallback when the child fallback was removed', () => {
          regionMap.parent.setFallback(get('parent-fallback'))
          regionMap.child.setFallback(get('child-fallback'))
          get('child-fallback').remove()
          expect(reconciliation.getElementToFocus(regionMap.child)).to.equal(get('parent-fallback'))
        })

        it('returns `null` when no fallbacks are assigned', () => {
          regionMap.parent.setFallback(get('parent-fallback'))
          expect(reconciliation.getElementToFocus(regionMap.child)).to.equal(get('parent-fallback'))
        })
      })

      context('when given the parent region', () => {
        it('returns the child fallback when assigned', () => {
          regionMap.child.setFallback(get('child-fallback'))
          expect(reconciliation.getElementToFocus(regionMap.parent)).to.equal(get('child-fallback'))
        })

        it('returns `null` when the child has no fallback', () => {
          expect(reconciliation.getElementToFocus(regionMap.parent)).to.be.null
        })

        it('returns `null` when the child fallback was removed', () => {
          regionMap.child.setFallback(get('child-fallback'))
          get('child-fallback').remove()
          expect(reconciliation.getElementToFocus(regionMap.parent)).to.be.null
        })

        context('when the child is not a fallback region for the parent', () => {
          beforeEach(() => {
            regionMap.child = regions.addRegion(get('child-container'), {fallbackRegion: false})
            regionMap.child.setFallback(get('child-fallback'))
          })

          it('returns the parent fallback when assigned', () => {
            regionMap.parent.setFallback(get('parent-fallback'))
            expect(reconciliation.getElementToFocus(regionMap.parent)).to.equal(
              get('parent-fallback'),
            )
          })

          it('returns `null` when the parent has no fallback', () => {
            expect(reconciliation.getElementToFocus(regionMap.parent)).to.be.null
          })

          it('returns `null` when the parent fallback was removed', () => {
            regionMap.parent.setFallback(get('parent-fallback'))
            get('parent-fallback').remove()
            expect(reconciliation.getElementToFocus(regionMap.parent)).to.be.null
          })
        })
      })
    })

    context('with sibling regions', () => {
      beforeEach(() => {
        render(`
          <div id="parent-container">
            <button>Parent Other</button>
            <button id="parent-fallback">Parent Fallback</button>

            <div id="child-container-a">
              <button>Child Other A</button>
              <button id="child-fallback-a">Child Fallback A</button>
            </div>

            <div id="child-container-b">
              <button>Child Other B</button>
              <button id="child-fallback-b">Child Fallback B</button>
            </div>
          </div>
        `)

        regionMap.parent = regions.addRegion(get('parent-container'))
        regionMap.childA = regions.addRegion(get('child-container-a'))
        regionMap.childB = regions.addRegion(get('child-container-b'))
      })

      context('when given a child region', () => {
        it('returns the fallback of the given region when assigned', () => {
          regionMap.parent.setFallback(get('parent-fallback'))
          regionMap.childA.setFallback(get('child-fallback-a'))
          regionMap.childB.setFallback(get('child-fallback-b'))
          expect(reconciliation.getElementToFocus(regionMap.childA)).to.equal(
            get('child-fallback-a'),
          )
        })

        it('returns the parent fallback when the child has no fallback', () => {
          regionMap.parent.setFallback(get('parent-fallback'))
          regionMap.childB.setFallback(get('child-fallback-b'))
          expect(reconciliation.getElementToFocus(regionMap.childA)).to.equal(
            get('parent-fallback'),
          )
        })

        it('returns the fallback of the other child when assigned', () => {
          /*
           * This is a case of "up and over" fallback where a region indirectly
           * falls back to a neighboring region it does not know about. The
           * parent region knows about both, and Reconciliation knows how to
           * transfer focus from one to the other.
           */
          regionMap.childB.setFallback(get('child-fallback-b'))
          expect(reconciliation.getElementToFocus(regionMap.childA)).to.equal(
            get('child-fallback-b'),
          )
        })

        it('returns `null` when no fallbacks are assigned', () => {
          expect(reconciliation.getElementToFocus(regionMap.childA)).to.be.null
        })

        it('returns `null` when the regions fallback cyclically', () => {
          /*
           * Simply stated, this is broken configuration.
           */
          regionMap.parent.setFallback(get('child-container-a'))
          regionMap.childA.setFallback(get('child-container-b'))
          regionMap.childB.setFallback(get('parent-container'))
          expect(reconciliation.getElementToFocus(regionMap.childA)).to.be.null
        })
      })

      context('when given the parent region', () => {
        it('returns the fallback of the given region when assigned', () => {
          regionMap.parent.setFallback(get('parent-fallback'))
          regionMap.childA.setFallback(get('child-fallback-a'))
          regionMap.childB.setFallback(get('child-fallback-b'))
          expect(reconciliation.getElementToFocus(regionMap.parent)).to.equal(
            get('parent-fallback'),
          )
        })

        it('returns the fallback of a child when assigned', () => {
          regionMap.childA.setFallback(get('child-fallback-a'))
          regionMap.childB.setFallback(get('child-fallback-b'))
          expect(reconciliation.getElementToFocus(regionMap.parent)).to.be.oneOf([
            get('child-fallback-a'),
            get('child-fallback-b'),
          ])
        })

        it('returns the fallback of an earlier child when a later child has no fallback', () => {
          regionMap.childA.setFallback(get('child-fallback-a'))
          expect(reconciliation.getElementToFocus(regionMap.parent)).to.equal(
            get('child-fallback-a'),
          )
        })

        it('returns the fallback of a later child when an earlier child has no fallback', () => {
          regionMap.childB.setFallback(get('child-fallback-b'))
          expect(reconciliation.getElementToFocus(regionMap.parent)).to.equal(
            get('child-fallback-b'),
          )
        })

        it('returns the fallback of an earlier child when it has the lowest fallback order', () => {
          regionMap.childA = regions.addRegion(get('child-container-a'), {fallbackOrder: 1})
          regionMap.childB = regions.addRegion(get('child-container-b'), {fallbackOrder: 2})
          regionMap.childA.setFallback(get('child-fallback-a'))
          regionMap.childB.setFallback(get('child-fallback-b'))
          expect(reconciliation.getElementToFocus(regionMap.parent)).to.equal(
            get('child-fallback-a'),
          )
        })

        it('returns the fallback of a later child when it has the lowest fallback order', () => {
          regionMap.childA = regions.addRegion(get('child-container-a'), {fallbackOrder: 2})
          regionMap.childB = regions.addRegion(get('child-container-b'), {fallbackOrder: 1})
          regionMap.childA.setFallback(get('child-fallback-a'))
          regionMap.childB.setFallback(get('child-fallback-b'))
          expect(reconciliation.getElementToFocus(regionMap.parent)).to.equal(
            get('child-fallback-b'),
          )
        })

        it('returns `null` when no fallbacks are assigned', () => {
          expect(reconciliation.getElementToFocus(regionMap.childA)).to.be.null
        })

        context('when one child fallback is another child container', () => {
          /*
           * This is a case of "down and over" fallback where a child region
           * defers focus to a sibling region. It might not be a common use
           * case, but is supported by design.
           */

          beforeEach(() => {
            regionMap.childA.setFallback(get('child-container-b'))
          })

          it('returns the fallback of the other child when assigned', () => {
            regionMap.childB.setFallback(get('child-fallback-b'))
            expect(reconciliation.getElementToFocus(regionMap.parent)).to.equal(
              get('child-fallback-b'),
            )
          })

          it('returns `null` when the other child has no fallback', () => {
            expect(reconciliation.getElementToFocus(regionMap.parent)).to.be.null
          })
        })

        context('when one child is not a fallback region for the parent', () => {
          beforeEach(() => {
            regionMap.childA = regions.addRegion(get('child-container-a'), {fallbackRegion: false})
            regionMap.childA.setFallback(get('child-fallback-a'))
          })

          it('returns the fallback of the other child when assigned', () => {
            regionMap.childB.setFallback(get('child-fallback-b'))
            expect(reconciliation.getElementToFocus(regionMap.parent)).to.equal(
              get('child-fallback-b'),
            )
          })

          it('returns `null` when the other child has no fallback', () => {
            expect(reconciliation.getElementToFocus(regionMap.parent)).to.be.null
          })
        })

        it('returns `null` when the regions fallback cyclically', () => {
          /*
           * This repeats the other cyclic example, covering the case of
           * starting with the parent region.
           */
          regionMap.parent.setFallback(get('child-container-a'))
          regionMap.childA.setFallback(get('child-container-b'))
          regionMap.childB.setFallback(get('parent-container'))
          expect(reconciliation.getElementToFocus(regionMap.parent)).to.be.null
        })
      })
    })

    context('with a single, deep lineage', () => {
      /*
       * These examples ensure that fallbacks will continue through a lengthy
       * lineage, returning either the appropriate fallback or `null` when
       * all connected regions have been considered.
       */

      beforeEach(() => {
        render(`
          <div id="grandparent-container">
            <button id="grandparent-fallback">Grandparent Fallback</button>

            <div id="parent-container">
              <button id="parent-fallback">Parent Fallback</button>

              <div id="child-container">
                <button id="child-fallback">Child Fallback</button>

                <div id="grandchild-container">
                  <button id="grandchild-fallback">Grandchild Fallback</button>
                </div>
              </div>
            </div>
          </div>
        `)

        regionMap.grandparent = regions.addRegion(get('grandparent-container'))
        regionMap.parent = regions.addRegion(get('parent-container'))
        regionMap.child = regions.addRegion(get('child-container'))
        regionMap.grandchild = regions.addRegion(get('grandchild-container'))
      })

      it('falls back through regions without fallbacks', () => {
        regionMap.grandparent.setFallback(get('grandparent-fallback'))
        expect(reconciliation.getElementToFocus(regionMap.grandchild)).to.equal(
          get('grandparent-fallback'),
        )
      })

      it('falls forward through regions with container fallbacks', () => {
        regionMap.grandchild.setFallback(get('grandchild-fallback'))
        expect(reconciliation.getElementToFocus(regionMap.grandparent)).to.equal(
          get('grandchild-fallback'),
        )
      })

      it('continues to fall back when child containers contain no fallbacks', () => {
        /*
         * This demonstrates a region falling forward through multiple levels
         * of child container fallbacks, finding a child region with no
         * fallback, then continuing backward through the lineage to a parent
         * with a fallback.
         */
        regionMap.grandparent.setFallback(get('grandparent-fallback'))
        expect(reconciliation.getElementToFocus(regionMap.parent)).to.equal(
          get('grandparent-fallback'),
        )
      })
    })

    context('with multiple branches of lineage', () => {
      /*
       * These examples ensure that fallback traversal can change direction as
       * many times as needed before conclusion.
       */

      beforeEach(() => {
        render(`
          <div id="grandparent-container">
            <button id="grandparent-fallback">Grandparent Fallback</button>

            <div id="parent-container">
              <button id="parent-fallback">Parent Fallback</button>

              <div id="child-container-a">
                <button id="child-fallback-a">Child Fallback A</button>

                <div id="grandchild-container-a">
                  <button id="grandchild-fallback-a">Grandchild Fallback A</button>
                </div>
              </div>

              <div id="child-container-b">
                <button id="child-fallback-b">Child Fallback B</button>

                <div id="grandchild-container-b">
                  <button id="grandchild-fallback-b">Grandchild Fallback B</button>
                </div>
              </div>
            </div>
          </div>
        `)

        regionMap.grandparent = regions.addRegion(get('grandparent-container'))
        regionMap.parent = regions.addRegion(get('parent-container'))
        regionMap.childA = regions.addRegion(get('child-container-a'))
        regionMap.childB = regions.addRegion(get('child-container-b'))
        regionMap.grandchildA = regions.addRegion(get('grandchild-container-a'))
        regionMap.grandchildB = regions.addRegion(get('grandchild-container-b'))

        regionMap.grandparent.setFallback(get('grandparent-fallback'))
      })

      it('falls back through regions without fallbacks', () => {
        /*
         *         Child A (fallback is Grandchild A)
         *         └─ Grandchild A (no fallback)
         *      ┌─────┘
         *      Parent (fallback is Child B)
         *      └─ Child B (no fallback)
         *         └─ Grandchild B (has fallback button)
         */
        regionMap.grandchildB.setFallback(get('grandchild-fallback-b'))
        expect(reconciliation.getElementToFocus(regionMap.childA)).to.equal(
          get('grandchild-fallback-b'),
        )
      })

      it('falls forward through regions with container fallbacks', () => {
        /*
         *         Child A (fallback is Grandchild A)
         *         └─ Grandchild A (no fallback)
         *      ┌─────┘
         *      Parent (fallback is Child B)
         *      └─ Child B (no fallback)
         *         └─ Grandchild B (no fallback)
         *   ┌────────┘
         *   Grandparent (has fallback button)
         */
        expect(reconciliation.getElementToFocus(regionMap.childA)).to.equal(
          get('grandparent-fallback'),
        )
      })
    })
  })
})
