import sinon from 'sinon'

import {FocusTracker} from '../focus-tracker'
import {Region} from '../regions/region'
import {Regions} from '../regions'

describe('FocusTracker', () => {
  let regions
  let tracker

  beforeEach(() => {
    regions = new Regions({})
    tracker = new FocusTracker(regions)
  })

  function stubRegion() {
    return new Region(null)
  }

  function stubElement() {
    return document.createElement('div')
  }

  describe('#currentRegion', () => {
    it('is the root region when focus has not been borrowed', () => {
      const region = stubRegion()
      tracker.updateCurrentFocus(stubRegion(), stubElement())
      tracker.updateCurrentFocus(region, stubElement())
      expect(tracker.currentRegion).to.equal(region)
    })

    it('is the latest borrow region when focus has been borrowed', () => {
      const region = stubRegion()
      tracker.updateCurrentFocus(stubRegion(), stubElement())
      tracker.addBorrow(stubRegion(), stubElement())
      tracker.addBorrow(region, stubElement())
      expect(tracker.currentRegion).to.equal(region)
    })

    it('is `null` when focus has not been established', () => {
      expect(tracker.currentRegion).to.be.null
    })
  })

  describe('#$currentElement', () => {
    it('is the root element when focus has not been borrowed', () => {
      const $element = stubElement()
      tracker.updateCurrentFocus(stubRegion(), stubElement())
      tracker.updateCurrentFocus(stubRegion(), $element)
      expect(tracker.$currentElement).to.equal($element)
    })

    it('is the latest borrow element when focus has been borrowed', () => {
      const $element = stubElement()
      tracker.updateCurrentFocus(stubRegion(), stubElement())
      tracker.addBorrow(stubRegion(), stubElement())
      tracker.addBorrow(stubRegion(), $element)
      expect(tracker.$currentElement).to.equal($element)
    })

    it('is `null` when focus has not been established', () => {
      expect(tracker.$currentElement).to.be.null
    })
  })

  describe('#updateCurrentFocus()', () => {
    context('when focus has not been established', () => {
      it('adds an entry to the focus stack', () => {
        tracker.updateCurrentFocus(stubRegion(), stubElement())
        expect(tracker._rootFocus).to.exist
      })

      it('sets the given region on the root focus', () => {
        const region = stubRegion()
        tracker.updateCurrentFocus(region, stubElement())
        expect(tracker._rootFocus.region).to.equal(region)
      })

      it('sets the given element on the root focus', () => {
        const $element = stubElement()
        tracker.updateCurrentFocus(stubRegion(), $element)
        expect(tracker._rootFocus.$element).to.equal($element)
      })
    })

    context('when focus has been established', () => {
      beforeEach(() => {
        tracker.updateCurrentFocus(stubRegion(), stubElement())
      })

      it('does not add an entry to the borrows stack', () => {
        tracker.updateCurrentFocus(stubRegion(), stubElement())
        expect(tracker._borrows).to.have.length(0)
      })

      it('updates the root focus with the given region', () => {
        const region = stubRegion()
        tracker.updateCurrentFocus(region, stubElement())
        expect(tracker._rootFocus.region).to.equal(region)
      })

      it('updates the root focus with the given element', () => {
        const $element = stubElement()
        tracker.updateCurrentFocus(stubRegion(), $element)
        expect(tracker._rootFocus.$element).to.equal($element)
      })
    })

    context('when focus has been borrowed', () => {
      beforeEach(() => {
        tracker.updateCurrentFocus(stubRegion(), stubElement())
        tracker.addBorrow(stubRegion(), stubElement())
        tracker.addBorrow(stubRegion(), stubElement())
      })

      it('does not add an entry to the focus stack', () => {
        tracker.updateCurrentFocus(stubRegion(), stubElement())
        expect(tracker._borrows).to.have.length(2)
      })

      it('updates the latest entry with the given region', () => {
        const region = stubRegion()
        tracker.updateCurrentFocus(region, stubElement())
        const [, entry] = tracker._borrows
        expect(entry.region).to.equal(region)
      })

      it('updates the latest entry with the given element', () => {
        const $element = stubElement()
        tracker.updateCurrentFocus(stubRegion(), $element)
        const [, entry] = tracker._borrows
        expect(entry.$element).to.equal($element)
      })
    })
  })

  describe('#replaceRegion()', () => {
    it('updates each stack entry for the previous region with the next region', () => {
      const previousRegion = stubRegion()
      tracker.updateCurrentFocus(previousRegion, stubElement())
      tracker.addBorrow(previousRegion, stubElement())
      tracker.addBorrow(previousRegion, stubElement())

      const nextRegion = stubRegion()
      tracker.replaceRegion(previousRegion, nextRegion)

      const regions = tracker._borrows.map(entry => entry.region)
      expect(regions).to.have.members([nextRegion, nextRegion])
    })

    it('ignores stack entries for other regions', () => {
      const previousRegion = stubRegion()
      const otherRegion = stubRegion()
      tracker.updateCurrentFocus(otherRegion, stubElement())
      tracker.addBorrow(previousRegion, stubElement())
      tracker.addBorrow(otherRegion, stubElement())

      const nextRegion = stubRegion()
      tracker.replaceRegion(previousRegion, nextRegion)

      const regions = tracker._borrows.map(entry => entry.region)
      expect(regions).to.have.members([nextRegion, otherRegion])
    })
  })

  describe('#removeRegion()', () => {
    it(`removes each borrow entry for the given region`, () => {
      const region = stubRegion()
      tracker.updateCurrentFocus(region, stubElement())
      tracker.addBorrow(region, stubElement())
      tracker.addBorrow(region, stubElement())

      tracker.removeRegion(region)

      expect(tracker._borrows).to.have.length(0)
    })

    it('replaces the region in the root entry with its immediate parent', () => {
      const [grandparent, parent, child] = [stubRegion(), stubRegion(), stubRegion()]
      sinon.stub(regions, 'getRegionLineage').withArgs(child).returns([grandparent, parent, child])
      tracker.updateCurrentFocus(child, stubElement())

      tracker.removeRegion(child)

      expect(tracker.currentRegion).to.equal(parent)
    })

    it('ignores stack entries for other regions', () => {
      const region = stubRegion()
      const otherRegion = stubRegion()
      tracker.updateCurrentFocus(otherRegion, stubElement())
      tracker.addBorrow(region, stubElement())
      tracker.addBorrow(otherRegion, stubElement())

      tracker.removeRegion(region)

      const regions = tracker._borrows.map(entry => entry.region)
      expect(regions).to.have.members([otherRegion])
    })
  })

  describe('#addBorrow()', () => {
    beforeEach(() => {
      tracker.updateCurrentFocus(stubRegion(), stubElement())
    })

    it('adds an entry to the borrow stack', () => {
      tracker.addBorrow(stubRegion(), stubElement())
      tracker.addBorrow(stubRegion(), stubElement())
      expect(tracker._borrows).to.have.length(2)
    })

    // it adds the lineage

    it('sets the given region on the added entry', () => {
      const region = stubRegion()
      tracker.addBorrow(region, stubElement())
      const [entry] = tracker._borrows
      expect(entry.region).to.equal(region)
    })

    it('sets the given element on the added entry', () => {
      const $element = stubElement()
      tracker.addBorrow(stubRegion(), $element)
      const [entry] = tracker._borrows
      expect(entry.$element).to.equal($element)
    })
  })

  describe('#removeLastBorrow()', () => {
    it(`removes the last borrow entry for the given region`, () => {
      const region = stubRegion()
      tracker.updateCurrentFocus(region, stubElement())
      tracker.addBorrow(stubRegion(), stubElement())
      tracker.addBorrow(region, stubElement())
      tracker.addBorrow(stubRegion(), stubElement())
      const [entry1, , entry3] = tracker._borrows

      tracker.removeLastBorrow(region)

      expect(tracker._borrows).to.have.ordered.members([entry1, entry3])
    })

    it('has no effect when the given region did not borrow', () => {
      const region = stubRegion()
      tracker.updateCurrentFocus(region, stubElement())
      tracker.addBorrow(stubRegion(), stubElement())
      tracker.addBorrow(stubRegion(), stubElement())

      tracker.removeLastBorrow(region)

      expect(tracker._borrows).to.have.length(2)
    })

    it('has no effect when the given region is not in the tracker', () => {
      tracker.updateCurrentFocus(stubRegion(), stubElement())
      tracker.addBorrow(stubRegion(), stubElement())
      tracker.addBorrow(stubRegion(), stubElement())

      tracker.removeLastBorrow(stubRegion())

      expect(tracker._borrows).to.have.length(2)
    })

    it('has no effect when the nothing has borrowed focus', () => {
      tracker.removeLastBorrow(stubRegion())
      expect(tracker._borrows).to.have.length(0)
    })
  })
})
