import {createContainer, renderString} from '@jneander/spec-utils-dom'
import sinon from 'sinon'

import {Regions} from '.'

describe('Regions', () => {
  let $container
  let onRegionBlur
  let onRegionFocus
  let regions

  beforeEach(() => {
    $container = createContainer()

    onRegionBlur = sinon.stub()
    onRegionFocus = sinon.stub()

    regions = new Regions({
      onRegionBlur,
      onRegionFocus,
    })
  })

  afterEach(() => {
    $container.remove()
  })

  function render(html) {
    renderString(html, $container)
  }

  function get(elementId) {
    return $container.querySelector(`#${elementId}`)
  }

  describe('#activeRegion', () => {
    it('is the region which contains the active element', () => {
      render(`
        <div id="container-1">
          <button id="button-1">Button 1</button>
        </div>

        <div id="container-2">
          <button id="button-2">Button 2</button>
        </div>
      `)
      regions.addRegion(get('container-1'))
      const region2 = regions.addRegion(get('container-2'))
      get('button-2').focus()
      expect(regions.activeRegion).to.equal(region2)
    })

    it('is the child-most containing region when nested regions contain the active element', () => {
      render(`
        <div id="container-1">
          <div id="container-2">
            <button id="button-2">Button 2</button>

            <div id="container-3">
              <button id="button-3">Button 3</button>
            </div>
          </div>
        </div>
      `)
      regions.addRegion(get('container-1'))
      const region2 = regions.addRegion(get('container-2'))
      regions.addRegion(get('container-3'))
      get('button-2').focus()
      expect(regions.activeRegion).to.equal(region2)
    })

    it('is `null` when no known regions contain the active element', () => {
      render(`
        <button id="button-x">

        <div id="container-1">
          <div id="container-2">
            <button id="button-2">Button 2</button>

            <div id="container-3">
              <button id="button-3">Button 3</button>
            </div>
          </div>
        </div>
      `)
      regions.addRegion(get('container-1'))
      regions.addRegion(get('container-2'))
      regions.addRegion(get('container-3'))
      get('button-x').focus()
      expect(regions.activeRegion).to.be.null
    })
  })

  describe('#addRegion()', () => {
    context('when the given container has not been added as a region', () => {
      beforeEach(() => {
        render(`
          <div id="container-1">
            <button id="button-1">Button 1</button>
          </div>
        `)
      })

      it('adds a region', () => {
        const countBefore = regions._regionList.length
        regions.addRegion(get('container-1'))
        expect(regions._regionList.length).to.equal(countBefore + 1)
      })

      it('returns the added region', () => {
        const region = regions.addRegion(get('container-1'))
        expect(region).to.exist
      })

      it('assigns the given container to the region', () => {
        const region = regions.addRegion(get('container-1'))
        expect(region.$container).to.equal(get('container-1'))
      })

      it('uses the given fallback order', () => {
        const region = regions.addRegion(get('container-1'), {fallbackOrder: 1})
        expect(region.fallbackOrder).to.equal(1)
      })

      it('defaults the fallback order to `0`', () => {
        const region = regions.addRegion(get('container-1'))
        expect(region.fallbackOrder).to.equal(0)
      })

      it('sets the region as a fallback region by default', () => {
        const region = regions.addRegion(get('container-1'))
        expect(region.isFallbackRegion).to.be.true
      })

      it('optionally sets the region as a non-fallback region', () => {
        const region = regions.addRegion(get('container-1'), {fallbackRegion: false})
        expect(region.isFallbackRegion).to.be.false
      })
    })

    context('when the given container already belongs to a region', () => {
      let existingRegion

      beforeEach(() => {
        render(`
          <div id="container-1">
            <button id="button-1">Button 1</button>
            <button id="button-2">Button 2</button>
          </div>
        `)
        existingRegion = regions.addRegion(get('container-1'))
      })

      it('removes the previous region', () => {
        regions.addRegion(get('container-1'))
        expect(regions._regionList).not.to.contain(existingRegion)
      })

      it('replaces the focus listener from the previous region', () => {
        const region = regions.addRegion(get('container-1'))
        get('button-1').focus()
        expect(onRegionFocus.callCount).to.equal(1)
        const [focusedRegion] = onRegionFocus.lastCall.args
        expect(focusedRegion).to.equal(region)
      })

      it('replaces the blur listener from the previous region', () => {
        const region = regions.addRegion(get('container-1'))
        get('button-1').focus()
        get('button-2').focus()
        expect(onRegionBlur.callCount).to.equal(1)
        const [blurredRegion] = onRegionBlur.lastCall.args
        expect(blurredRegion).to.equal(region)
      })

      it('adds a new region', () => {
        const countBefore = regions._regionList.length
        regions.addRegion(get('container-1'))
        expect(regions._regionList.length).to.equal(countBefore)
      })

      it('returns the added region', () => {
        const region = regions.addRegion(get('container-1'))
        expect(region).to.exist.and.not.equal(existingRegion)
      })

      it('assigns the given container to the region', () => {
        const region = regions.addRegion(get('container-1'))
        expect(region.$container).to.equal(get('container-1'))
      })
    })
  })

  describe('#removeRegion()', () => {
    it('removes the blur event listener', () => {
      render(`
        <div id="container-1">
          <button id="button-1">Button 1</button>
          <button id="button-2">Button 2</button>
        </div>
      `)
      const region = regions.addRegion(get('container-1'))
      regions.removeRegion(region)
      get('button-1').focus()
      get('button-2').focus()
      expect(onRegionBlur.callCount).to.equal(0)
    })

    it('removes the blur event listener', () => {
      render(`
        <div id="container-1">
          <button id="button-1">Button 1</button>
        </div>
      `)
      const region = regions.addRegion(get('container-1'))
      regions.removeRegion(region)
      get('button-1').focus()
      expect(onRegionFocus.callCount).to.equal(0)
    })

    it('removes the container as the fallback for other regions', () => {
      render(`
        <div id="container-1">
          <button id="button-1">Button 1</button>
        </div>

        <div id="container-2">
          <button id="button-2">Button 2</button>
        </div>

        <div id="container-3">
          <button id="button-3">Button 3</button>
        </div>
      `)
      regions.addRegion(get('container-1'))
      const region2 = regions.addRegion(get('container-2'))
      regions.addRegion(get('container-3'))
      regions.removeRegion(region2)
      const fallbacks = regions._regionList.flatMap(region => region.$fallbacks)
      expect(fallbacks).to.have.length(0)
    })
  })

  describe('focus event listener', () => {
    it('is added to handle focus within the given region container', () => {
      render(`
        <div id="container-1">
          <button id="button-1">Button 1</button>
        </div>
      `)
      regions.addRegion(get('container-1'))
      get('button-1').focus()
      expect(onRegionFocus.callCount).to.equal(1)
    })

    context('when called', () => {
      let region

      beforeEach(() => {
        render(`
          <div id="container-1">
            <button id="button-1">Button 1</button>
          </div>
        `)
        region = regions.addRegion(get('container-1'))
        get('button-1').focus()
      })

      it('includes the active region', () => {
        const [activeRegion] = onRegionFocus.lastCall.args
        expect(activeRegion).to.equal(region)
      })

      it('includes the active element', () => {
        const [, activeElement] = onRegionFocus.lastCall.args
        expect(activeElement).to.equal(get('button-1'))
      })
    })
  })

  describe('blur event listener', () => {
    it('is added to handle blurring within the given region container', () => {
      render(`
        <div id="container-1">
          <button id="button-1">Button 1</button>
          <button id="button-2">Button 2</button>
        </div>
      `)
      regions.addRegion(get('container-1'))
      get('button-1').focus()
      get('button-2').focus()
      expect(onRegionBlur.callCount).to.equal(1)
    })

    context('when called', () => {
      let region

      beforeEach(() => {
        render(`
          <div id="container-1">
            <button id="button-1">Button 1</button>
            <button id="button-2">Button 2</button>
          </div>
        `)
        region = regions.addRegion(get('container-1'))
        get('button-1').focus()
        get('button-2').focus()
      })

      it('includes the blurred region', () => {
        const [blurredRegion] = onRegionBlur.lastCall.args
        expect(blurredRegion).to.equal(region)
      })

      it('includes the blurred element', () => {
        const [, blurredElement] = onRegionBlur.lastCall.args
        expect(blurredElement).to.equal(get('button-1'))
      })
    })

    it('is not called when the element retains focus', () => {
      /*
       * This will happen when the browser window loses focus by going into the
       * background.
       */
      render(`
        <div id="container-1">
          <button id="button-1">Button 1</button>
        </div>
      `)
      regions.addRegion(get('container-1'))
      get('button-1').focus()
      get('button-1').dispatchEvent(new Event('blur'))
      expect(onRegionBlur.callCount).to.equal(0)
    })
  })

  describe('#includes()', () => {
    beforeEach(() => {
      render(`
        <div id="container-1">
          <button id="button-1">Button 1</button>
        </div>
      `)
    })

    it('returns `true` when the given region has been added', () => {
      const region = regions.addRegion(get('container-1'))
      expect(regions.includes(region)).to.be.true
    })

    it('returns `false` when the given region has been removed', () => {
      const region = regions.addRegion(get('container-1'))
      regions.removeRegion(region)
      expect(regions.includes(region)).to.be.false
    })
  })

  describe('#regionOwnsElement()', () => {
    let region1
    let region2

    beforeEach(() => {
      render(`
        <div id="container-1">
          <button id="button-1">Button 1</button>

          <div id="container-2">
            <button id="button-2">Button 2</button>
          </div>
        </div>
      `)

      region1 = regions.addRegion(get('container-1'))
      region2 = regions.addRegion(get('container-2'))
    })

    it('returns `true` for the child-most region containing the element', () => {
      expect(regions.regionOwnsElement(region1, get('button-1'))).to.be.true
    })

    it('returns `false` for a parent region of another region containing the element', () => {
      expect(regions.regionOwnsElement(region1, get('button-2'))).to.be.false
    })

    it('returns `false` when the region does not contain the element', () => {
      expect(regions.regionOwnsElement(region2, get('button-1'))).to.be.false
    })
  })

  describe('#getRegionLineage()', () => {
    let regionMap

    beforeEach(() => {
      render(`
        <div id="container-a">
          <div id="container-b1">
            <div id="container-c">
              <div id="container-d">
              </div>
            </div>
          </div>

          <div id="container-b2">
          </div>
        </div>

        <div id="container-x">
        </div>
      `)

      regionMap = {
        a: regions.addRegion(get('container-a')),
        b1: regions.addRegion(get('container-b1')),
        b2: regions.addRegion(get('container-b2')),
        c: regions.addRegion(get('container-c')),
        d: regions.addRegion(get('container-d')),
        x: regions.addRegion(get('container-x')),
      }
    })

    it('returns the region and its parent regions in order of ancestry', () => {
      const {a, b1, c, d} = regionMap
      const lineage = regions.getRegionLineage(d)
      expect(lineage).to.have.ordered.members([a, b1, c, d])
    })

    it('excludes child regions of the given region', () => {
      const {a, b1, c} = regionMap
      const lineage = regions.getRegionLineage(c)
      expect(lineage).to.have.ordered.members([a, b1, c])
    })

    it('excludes sibling regions', () => {
      const {a, b1} = regionMap
      const lineage = regions.getRegionLineage(b1)
      expect(lineage).to.have.ordered.members([a, b1])
    })

    it('excludes unrelated regions', () => {
      const {a} = regionMap
      const lineage = regions.getRegionLineage(a)
      expect(lineage).to.have.members([a])
    })
  })

  describe('#getParentRegion()', () => {
    let region1
    let region2
    let region3

    beforeEach(() => {
      render(`
        <div id="container-1">
          <div>
            <div id="container-2">
              <div>
                <div id="container-3">
                </div>
              </div>
            </div>
          </div>
        </div>
      `)

      region1 = regions.addRegion(get('container-1'))
      region2 = regions.addRegion(get('container-2'))
      region3 = regions.addRegion(get('container-3'))
    })

    it('returns the closest parent region to the given region', () => {
      expect(regions.getParentRegion(region3)).to.equal(region2)
    })

    it('returns `null` when the region has no parent region', () => {
      expect(regions.getParentRegion(region1)).to.be.null
    })
  })

  describe('#getChildRegions()', () => {
    let regionMap

    beforeEach(() => {
      render(`
        <div id="container-a">
          <div id="container-b1">
            <div id="container-c1">
            </div>

            <div id="container-c2">
            </div>
          </div>

          <div id="container-b2">
            <div id="container-c3">
            </div>
          </div>
        </div>
      `)

      regionMap = {
        a: regions.addRegion(get('container-a')),
        b1: regions.addRegion(get('container-b1')),
        b2: regions.addRegion(get('container-b2')),
        c1: regions.addRegion(get('container-c1')),
        c2: regions.addRegion(get('container-c2')),
        c3: regions.addRegion(get('container-c3')),
      }
    })

    it('returns the direct child regions within the given region', () => {
      const {b1, c1, c2} = regionMap
      expect(regions.getChildRegions(b1)).to.have.members([c1, c2])
    })

    it('excludes descendent regions that are not immediate children', () => {
      const {a, b1, b2} = regionMap
      expect(regions.getChildRegions(a)).to.have.members([b1, b2])
    })

    it('returns an empty array when the region has no children', () => {
      const {c1} = regionMap
      expect(regions.getChildRegions(c1)).to.have.length(0)
    })
  })

  describe('#getRegionForContainer()', () => {
    let region

    beforeEach(() => {
      render(`
        <div id="container-1">
          <button id="button-1">Button 1</button>
        </div>

        <button id="button-2">Button 2</button>
      `)

      region = regions.addRegion(get('container-1'))
      region.setFallback(get('button-1'))
    })

    it('returns the region having the given element as a container', () => {
      expect(regions.getRegionForContainer(get('container-1'))).to.equal(region)
    })

    it('returns `null` when given an element used only as a fallback', () => {
      expect(regions.getRegionForContainer(get('button-1'))).to.be.null
    })

    it('returns `null` when given an unrelated element', () => {
      expect(regions.getRegionForContainer(get('button-2'))).to.be.null
    })
  })

  describe('#getRegionOwnerForElement()', () => {
    let regionMap

    beforeEach(() => {
      render(`
        <div id="container-a">
          <div id="container-b">
            <div id="element-b">
            </div>
          </div>

          <div id="element-a">
          </div>
        </div>

        <div id="element-x"></div>
      `)

      regionMap = {
        a: regions.addRegion(get('container-a')),
        b: regions.addRegion(get('container-b')),
      }
    })

    it('returns the region containing the given element', () => {
      expect(regions.getRegionOwnerForElement(get('element-a'))).to.equal(regionMap.a)
    })

    it('disregards regions with a child containing the given element', () => {
      expect(regions.getRegionOwnerForElement(get('element-b'))).to.equal(regionMap.b)
    })

    it('returns `null` when no region contains the given element', () => {
      expect(regions.getRegionOwnerForElement(get('element-x'))).to.be.null
    })
  })

  describe('#getFallbacksForRegion()', () => {
    let regionMap

    beforeEach(() => {
      render(`
        <div id="container-a">
          <div id="container-b1">
            <div id="container-c1">
            </div>

            <div id="container-c2">
            </div>
          </div>

          <div id="container-b2">
            <div id="container-c3">
            </div>
          </div>
        </div>
      `)

      regionMap = {
        a: regions.addRegion(get('container-a')),
        b1: regions.addRegion(get('container-b1')),
        b2: regions.addRegion(get('container-b2')),
        c1: regions.addRegion(get('container-c1')),
        c2: regions.addRegion(get('container-c2')),
        c3: regions.addRegion(get('container-c3')),
      }
    })

    it('returns the direct child regions within the given region', () => {
      const {b1, c1, c2} = regionMap
      const $fallbacks = [c1.$container, c2.$container]
      expect(regions.getFallbacksForRegion(b1)).to.have.members($fallbacks)
    })

    it('excludes descendent regions that are not immediate children', () => {
      const {a, b1, b2} = regionMap
      const $fallbacks = [b1.$container, b2.$container]
      expect(regions.getFallbacksForRegion(a)).to.have.members($fallbacks)
    })

    it('excludes children that are not fallback regions', () => {
      regionMap.b1 = regions.addRegion(get('container-b1'), {fallbackRegion: false})
      const {a, b2} = regionMap
      const $fallbacks = [b2.$container]
      expect(regions.getFallbacksForRegion(a)).to.have.members($fallbacks)
    })

    it('returns an empty array when the region has no children', () => {
      const {c1} = regionMap
      expect(regions.getFallbacksForRegion(c1)).to.have.length(0)
    })
  })
})
