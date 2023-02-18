import {createContainer, renderString} from '@jneander/spec-utils-dom'

import type {RegionWrapper} from '../focus/region-wrapper'
import {Focus} from '..'

describe('Borrowing focus', () => {
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
          <button id="button-1">Button 1</button>
          <button id="button-2">Button 2</button>
          <button id="button-3">Button 3</button>
        </div>
      `)

      regionMap.container = focus.addRegion(get('container'))
    })

    it('moves focus to the borrowing element', () => {
      get('button-1').focus()
      const $button2 = get('button-2')
      regionMap.container.borrowFocus($button2)

      expect(getFocusedElementId()).to.equal('button-2')
    })

    it('releases focus to the previously-focused element', () => {
      get('button-1').focus()
      const $button2 = get('button-2')
      regionMap.container.borrowFocus($button2)
      regionMap.container.releaseFocus()

      expect(getFocusedElementId()).to.equal('button-1')
    })

    context('when no previously-focused element was in a known region', () => {
      it('does not move focus to the fallback focus element in the borrower region', () => {
        /*
         * Even if focus was not previously set, borrowing it means that it has become
         * managed and needs to remain so.
         */
        regionMap.container.setFallback(get('button-2'))

        regionMap.container.borrowFocus(get('button-3'))
        regionMap.container.releaseFocus()

        // Focus will be lost if this element is subsequently removed
        expect(getFocusedElementId()).to.equal('button-3')
      })
    })

    context('when the previously-focused element has been removed', () => {
      it('moves focus to the fallback focus element when assigned', () => {
        regionMap.container.setFallback(get('button-2'))

        const $button1 = get('button-1')
        $button1.focus()

        regionMap.container.borrowFocus(get('button-3'))
        $button1.remove()
        reconcileAllRegions()

        regionMap.container.releaseFocus()

        expect(getFocusedElementId()).to.equal('button-2')
      })

      it('does not move focus when the fallback focus element was removed', () => {
        const $button2 = get('button-2')
        regionMap.container.setFallback($button2)

        const $button1 = get('button-1')
        $button1.focus()

        regionMap.container.borrowFocus(get('button-3'))
        $button1.remove()
        $button2.remove()
        reconcileAllRegions()

        regionMap.container.releaseFocus()

        // Focus will be lost if this element is subsequently removed
        expect(getFocusedElementId()).to.equal('button-3')
      })

      it('does not move focus when no fallback focus element is assigned', () => {
        const $button1 = get('button-1')
        $button1.focus()

        regionMap.container.borrowFocus(get('button-3'))
        $button1.remove()
        reconcileAllRegions()

        regionMap.container.releaseFocus()

        // Focus will be lost if this element is subsequently removed
        expect(getFocusedElementId()).to.equal('button-3')
      })
    })
  })

  context('with two levels of regions and the child borrows from itself', () => {
    beforeEach(() => {
      render(`
        <div id="parent-container">
          <button id="parent-button-1">Parent Button 1</button>

          <div id="child-container">
            <button id="child-button-1">Child Button 1</button>
            <button id="child-button-2">Child Button 2</button>
            <button id="child-button-3">Child Button 3</button>
          </div>
        </div>
      `)

      regionMap.parent = focus.addRegion(get('parent-container'))
      regionMap.child = focus.addRegion(get('child-container'))
    })

    it('releases focus to the previously-active element', () => {
      regionMap.parent.setFallback(get('parent-button-1'))
      regionMap.child.setFallback(get('child-button-2'))

      get('child-button-1').focus()
      regionMap.child.borrowFocus(get('child-button-2'))
      regionMap.child.releaseFocus()

      expect(getFocusedElementId()).to.equal('child-button-1')
    })

    it('is not affected by changes to focus while in the borrower region', () => {
      /*
       * Any changes to focus within the borrower are treated as simply
       * updates to the current focus and are not inserted into the
       * focus stack.
       */
      regionMap.parent.setFallback(get('parent-button-1'))
      regionMap.child.setFallback(get('child-button-2'))

      get('child-button-1').focus()
      regionMap.child.borrowFocus(get('child-button-2'))
      get('child-button-3').focus()
      regionMap.child.releaseFocus()

      expect(getFocusedElementId()).to.equal('child-button-1')
    })

    context('when the previously-focused element has been removed', () => {
      it('falls back to the child focus fallback when assigned', () => {
        regionMap.parent.setFallback(get('parent-button-1'))
        regionMap.child.setFallback(get('child-button-2'))

        const $childButton1 = get('child-button-1')
        $childButton1.focus()

        regionMap.child.borrowFocus(get('child-button-3'))
        $childButton1.remove()
        reconcileAllRegions()

        regionMap.child.releaseFocus()

        expect(getFocusedElementId()).to.equal('child-button-2')
      })

      it('falls back to the parent when no child focus fallback was assigned', () => {
        regionMap.parent.setFallback(get('parent-button-1'))

        const $childButton1 = get('child-button-1')
        $childButton1.focus()

        regionMap.child.borrowFocus(get('child-button-3'))
        $childButton1.remove()
        reconcileAllRegions()

        regionMap.child.releaseFocus()

        expect(getFocusedElementId()).to.equal('parent-button-1')
      })

      it('falls back to the parent when the child focus fallback was removed', () => {
        const $childButton2 = get('child-button-2')
        regionMap.parent.setFallback(get('parent-button-1'))
        regionMap.child.setFallback($childButton2)

        const $childButton1 = get('child-button-1')
        $childButton1.focus()

        regionMap.child.borrowFocus(get('child-button-3'))
        $childButton1.remove()
        $childButton2.remove()
        reconcileAllRegions()

        regionMap.child.releaseFocus()

        expect(getFocusedElementId()).to.equal('parent-button-1')
      })

      it('does not move focus when the only focus fallback was removed', () => {
        const $childButton2 = get('child-button-2')
        regionMap.child.setFallback($childButton2)

        const $childButton1 = get('child-button-1')
        $childButton1.focus()

        regionMap.child.borrowFocus(get('child-button-3'))
        $childButton1.remove()
        $childButton2.remove()
        reconcileAllRegions()

        regionMap.child.releaseFocus()

        // Focus will be lost if this element is subsequently removed
        expect(getFocusedElementId()).to.equal('child-button-3')
      })

      it('does not move focus when no focus fallback is assigned', () => {
        const $childButton1 = get('child-button-1')
        $childButton1.focus()

        regionMap.child.borrowFocus(get('child-button-3'))
        $childButton1.remove()
        reconcileAllRegions()

        regionMap.child.releaseFocus()

        // Focus will be lost if this element is subsequently removed
        expect(getFocusedElementId()).to.equal('child-button-3')
      })
    })
  })

  context('with two levels of regions and the child borrows from the parent', () => {
    beforeEach(() => {
      render(`
        <div id="parent-container">
          <button id="parent-button-1">Parent Button 1</button>
          <button id="parent-button-2">Parent Button 2</button>

          <div id="child-container">
            <button id="child-button-1">Child Button 1</button>
            <button id="child-button-2">Child Button 2</button>
            <button id="child-button-3">Child Button 3</button>
          </div>
        </div>
      `)

      regionMap.parent = focus.addRegion(get('parent-container'))
      regionMap.child = focus.addRegion(get('child-container'))
    })

    it('releases focus to the previously-active element in the parent', () => {
      regionMap.parent.setFallback(get('parent-button-2'))
      regionMap.child.setFallback(get('child-button-2'))

      get('parent-button-1').focus()
      regionMap.child.borrowFocus(get('child-button-2'))
      regionMap.child.releaseFocus()

      expect(getFocusedElementId()).to.equal('parent-button-1')
    })

    it('is not affected by changes to focus while in the borrower region', () => {
      /*
       * Any changes to focus within the borrower are treated as simply
       * updates to the current focus and are not inserted into the
       * focus stack.
       */
      regionMap.parent.setFallback(get('parent-button-2'))
      regionMap.child.setFallback(get('child-button-2'))

      get('parent-button-1').focus()
      regionMap.child.borrowFocus(get('child-button-2'))
      get('child-button-3').focus()
      regionMap.child.releaseFocus()

      expect(getFocusedElementId()).to.equal('parent-button-1')
    })

    context('when the previously-focused element has been removed', () => {
      it('falls back to the parent focus fallback when assigned', () => {
        regionMap.parent.setFallback(get('parent-button-2'))
        regionMap.child.setFallback(get('child-button-2'))

        const $parentButton1 = get('parent-button-1')
        $parentButton1.focus()

        regionMap.child.borrowFocus(get('child-button-3'))
        $parentButton1.remove()
        reconcileAllRegions()

        regionMap.child.releaseFocus()

        expect(getFocusedElementId()).to.equal('parent-button-2')
      })

      it('uses the child fallback when no parent focus fallback was assigned', () => {
        regionMap.child.setFallback(get('child-button-2'))

        get('parent-button-1').focus()
        regionMap.child.borrowFocus(get('child-button-3'))
        get('parent-button-1').remove()

        reconcileAllRegions()
        regionMap.child.releaseFocus()

        // Focus will be lost if this element is subsequently removed
        expect(getFocusedElementId()).to.equal('child-button-2')
      })

      it('does not move focus when no fallbacks were assigned', () => {
        get('parent-button-1').focus()
        regionMap.child.borrowFocus(get('child-button-3'))
        get('parent-button-1').remove()

        reconcileAllRegions()
        regionMap.child.releaseFocus()

        // Focus will be lost if this element is subsequently removed
        expect(getFocusedElementId()).to.equal('child-button-3')
      })
    })
  })

  context('with two levels of regions and the parent borrows from the child', () => {
    beforeEach(() => {
      render(`
        <div id="parent-container">
          <button id="parent-button-1">Parent Button 1</button>
          <button id="parent-button-2">Parent Button 2</button>
          <button id="parent-button-3">Parent Button 3</button>

          <div id="child-container">
            <button id="child-button-1">Child Button 1</button>
            <button id="child-button-2">Child Button 2</button>
            <button id="child-button-3">Child Button 3</button>
          </div>
        </div>
      `)

      regionMap.parent = focus.addRegion(get('parent-container'))
      regionMap.child = focus.addRegion(get('child-container'))
    })

    it('releases focus to the previously-active element in the child', () => {
      regionMap.parent.setFallback(get('parent-button-2'))
      regionMap.child.setFallback(get('child-button-2'))

      get('child-button-1').focus()
      regionMap.parent.borrowFocus(get('parent-button-2'))
      regionMap.parent.releaseFocus()

      expect(getFocusedElementId()).to.equal('child-button-1')
    })

    it('is not affected by changes to focus while in the borrower region', () => {
      /*
       * Any changes to focus within the borrower are treated as simply
       * updates to the current focus and are not inserted into the
       * focus stack.
       */
      regionMap.child.setFallback(get('child-button-2'))
      regionMap.parent.setFallback(get('parent-button-2'))

      get('child-button-1').focus()
      regionMap.parent.borrowFocus(get('parent-button-2'))
      get('parent-button-3').focus()
      regionMap.parent.releaseFocus()

      expect(getFocusedElementId()).to.equal('child-button-1')
    })

    context('when the previously-focused element has been removed', () => {
      it('falls back to the child focus fallback when assigned', () => {
        regionMap.parent.setFallback(get('parent-button-2'))
        regionMap.child.setFallback(get('child-button-2'))

        const $childButton1 = get('child-button-1')
        $childButton1.focus()

        regionMap.parent.borrowFocus(get('parent-button-3'))
        $childButton1.remove()
        reconcileAllRegions()

        regionMap.parent.releaseFocus()

        expect(getFocusedElementId()).to.equal('child-button-2')
      })

      it('falls back to the parent when no child focus fallback was assigned', () => {
        regionMap.parent.setFallback(get('parent-button-2'))

        const $childButton1 = get('child-button-1')
        $childButton1.focus()

        regionMap.parent.borrowFocus(get('parent-button-3'))
        $childButton1.remove()
        reconcileAllRegions()

        regionMap.parent.releaseFocus()

        expect(getFocusedElementId()).to.equal('parent-button-2')
      })

      it('falls back to the parent when the child focus fallback was removed', () => {
        const $childButton2 = get('child-button-2')
        regionMap.parent.setFallback(get('parent-button-2'))
        regionMap.child.setFallback($childButton2)

        const $childButton1 = get('child-button-1')
        $childButton1.focus()

        regionMap.parent.borrowFocus(get('parent-button-3'))
        $childButton1.remove()
        $childButton2.remove()
        reconcileAllRegions()

        regionMap.parent.releaseFocus()

        expect(getFocusedElementId()).to.equal('parent-button-2')
      })

      it('does not move focus when the only focus fallback was removed', () => {
        const $parentButton2 = get('parent-button-2')
        regionMap.parent.setFallback($parentButton2)

        const $childButton1 = get('child-button-1')
        $childButton1.focus()

        regionMap.parent.borrowFocus(get('parent-button-3'))
        $childButton1.remove()
        $parentButton2.remove()
        reconcileAllRegions()

        regionMap.parent.releaseFocus()

        // Focus will be lost if this element is subsequently removed
        expect(getFocusedElementId()).to.equal('parent-button-3')
      })

      it('does not move focus when no focus fallback is assigned', () => {
        const $childButton1 = get('child-button-1')
        $childButton1.focus()

        regionMap.parent.borrowFocus(get('parent-button-3'))
        $childButton1.remove()
        reconcileAllRegions()

        regionMap.parent.releaseFocus()

        // Focus will be lost if this element is subsequently removed
        expect(getFocusedElementId()).to.equal('parent-button-3')
      })
    })
  })

  context('between indirectly-related regions and one borrows from another', () => {
    beforeEach(() => {
      render(`
        <div id="parent-container">
          <div id="child-container-a">
            <button id="child-button-a1">Child Button A1</button>
            <button id="child-button-a2">Child Button A2</button>
          </div>

          <div id="child-container-b">
            <button id="child-button-b1">Child Button B1</button>
            <button id="child-button-b2">Child Button B2</button>
          </div>

          <button id="parent-button-1">Parent Button 1</button>
        </div>
      `)

      regionMap.parent = focus.addRegion(get('parent-container'))
      regionMap.childA = focus.addRegion(get('child-container-a'))
      regionMap.childB = focus.addRegion(get('child-container-b'))
    })

    it('releases focus to the previously-active element', () => {
      regionMap.childA.setFallback(get('child-button-a1'))
      regionMap.childB.setFallback(get('child-button-b1'))
      regionMap.parent.setFallback(get('parent-button-1'))

      get('child-button-a2').focus()

      regionMap.childB.borrowFocus(get('child-button-b2'))
      regionMap.childB.releaseFocus()

      expect(getFocusedElementId()).to.equal('child-button-a2')
    })

    it('is not affected by changes to focus while in the borrower region', () => {
      /*
       * Any changes to focus within the borrower are treated as simply
       * updates to the current focus and are not inserted into the
       * focus stack.
       */
      regionMap.childA.setFallback(get('child-button-a1'))
      regionMap.childB.setFallback(get('child-button-b1'))
      regionMap.parent.setFallback(get('parent-button-1'))

      get('child-button-a2').focus()

      regionMap.childB.borrowFocus(get('child-button-b2'))
      get('child-button-b1').focus()
      regionMap.childB.releaseFocus()

      expect(getFocusedElementId()).to.equal('child-button-a2')
    })

    context('when the previously-focused element has been removed', () => {
      it('falls back to the lender focus fallback when assigned', () => {
        regionMap.parent.setFallback(get('parent-button-1'))
        regionMap.childA.setFallback(get('child-button-a1'))
        regionMap.childB.setFallback(get('child-button-b1'))

        const $childButton2 = get('child-button-a2')
        $childButton2.focus()

        regionMap.childB.borrowFocus(get('child-button-b2'))
        $childButton2.remove()
        reconcileAllRegions()

        regionMap.childB.releaseFocus()

        expect(getFocusedElementId()).to.equal('child-button-a1')
      })

      it('falls back to the parent when the lender has no fallback', () => {
        regionMap.parent.setFallback(get('parent-button-1'))
        regionMap.childB.setFallback(get('child-button-b1'))

        const $childButton2 = get('child-button-a2')
        $childButton2.focus()

        regionMap.childB.borrowFocus(get('child-button-b2'))
        $childButton2.remove()
        reconcileAllRegions()

        regionMap.childB.releaseFocus()

        expect(getFocusedElementId()).to.equal('parent-button-1')
      })

      it('falls over into a child region with a fallback', () => {
        regionMap.childA.setFallback(get('child-button-a1'))
        regionMap.childB.setFallback(get('child-button-b1'))

        const $childButton2 = get('child-button-a2')
        $childButton2.focus()

        regionMap.childB.borrowFocus(get('child-button-b2'))
        $childButton2.remove()
        reconcileAllRegions()

        regionMap.childB.releaseFocus()

        expect(getFocusedElementId()).to.be.oneOf(['child-button-a1', 'child-button-b1'])
      })

      it('does not move focus when no fallbacks exist', () => {
        const $childButton2 = get('child-button-a2')
        $childButton2.focus()

        regionMap.childB.borrowFocus(get('child-button-b2'))
        $childButton2.remove()
        reconcileAllRegions()

        regionMap.childB.releaseFocus()

        expect(getFocusedElementId()).to.equal('child-button-b2')
      })
    })

    context('when the lending region has been removed', () => {
      it('restores focus to the previously-active element', () => {
        regionMap.parent.setFallback(get('parent-button-1'))
        regionMap.childB.setFallback(get('child-button-b1'))

        get('child-button-a2').focus()

        regionMap.childB.borrowFocus(get('child-button-b2'))
        regionMap.childA.remove()
        regionMap.childB.releaseFocus()

        expect(getFocusedElementId()).to.equal('child-button-a2')
      })

      it('falls back to the parent when the previously-active element was removed', () => {
        regionMap.parent.setFallback(get('parent-button-1'))
        regionMap.childB.setFallback(get('child-button-b1'))

        get('child-button-a2').focus()

        regionMap.childB.borrowFocus(get('child-button-b2'))
        get('child-button-a2').remove()
        regionMap.childA.remove()
        regionMap.childB.releaseFocus()

        expect(getFocusedElementId()).to.equal('parent-button-1')
      })
    })
  })

  context('when one region borrows from another borrower', () => {
    beforeEach(() => {
      render(`
        <div id="parent-container">
          <div id="child-container-a">
            <button id="child-button-a1">Child Button A1</button>
            <button id="child-button-a2">Child Button A2</button>
          </div>

          <div id="child-container-b">
            <button id="child-button-b1">Child Button B1</button>
            <button id="child-button-b2">Child Button B2</button>
          </div>

          <div id="child-container-c">
            <button id="child-button-c1">Child Button C1</button>
            <button id="child-button-c2">Child Button C2</button>
          </div>

          <button id="parent-button-1">Parent Button 1</button>
          <button id="parent-button-2">Parent Button 2</button>
        </div>
      `)

      regionMap.parent = focus.addRegion(get('parent-container'))
      regionMap.childA = focus.addRegion(get('child-container-a'))
      regionMap.childB = focus.addRegion(get('child-container-b'))
      regionMap.childC = focus.addRegion(get('child-container-c'))
    })

    it('releases focus to the previously-active element of the previous borrower', () => {
      regionMap.childA.setFallback(get('child-button-a1'))
      regionMap.childB.setFallback(get('child-button-b1'))
      regionMap.childC.setFallback(get('child-button-c1'))
      regionMap.parent.setFallback(get('parent-button-1'))

      get('parent-button-1').focus()

      regionMap.childA.borrowFocus(get('child-button-a2'))
      regionMap.childB.borrowFocus(get('child-button-b2'))
      regionMap.childB.releaseFocus()

      expect(getFocusedElementId()).to.equal('child-button-a2')
    })

    it('accounts for focus changes in the lender', () => {
      /*
       * Any changes to focus within the borrower are treated as simply
       * updates to the current focus and are not inserted into the
       * focus stack.
       */
      regionMap.childA.setFallback(get('child-button-a1'))
      regionMap.childB.setFallback(get('child-button-b1'))
      regionMap.childC.setFallback(get('child-button-c1'))
      regionMap.parent.setFallback(get('parent-button-1'))

      get('parent-button-1').focus()

      regionMap.childA.borrowFocus(get('child-button-a2'))
      get('child-button-a1').focus()
      regionMap.childB.borrowFocus(get('child-button-b2'))
      regionMap.childB.releaseFocus()

      expect(getFocusedElementId()).to.equal('child-button-a1')
    })

    context('when all borrows release focus in the reverse order', () => {
      it('releases focus to the previous non-borrower lender', () => {
        regionMap.childA.setFallback(get('child-button-a1'))
        regionMap.childB.setFallback(get('child-button-b1'))
        regionMap.childC.setFallback(get('child-button-c1'))
        regionMap.parent.setFallback(get('parent-button-1'))

        get('parent-button-2').focus()

        regionMap.childA.borrowFocus(get('child-button-a2'))
        regionMap.childB.borrowFocus(get('child-button-b2'))
        regionMap.childB.releaseFocus()
        regionMap.childA.releaseFocus()

        expect(getFocusedElementId()).to.equal('parent-button-2')
      })

      it('falls back to the focus fallback of the previous non-borrower lender', () => {
        regionMap.childA.setFallback(get('child-button-a1'))
        regionMap.childB.setFallback(get('child-button-b1'))
        regionMap.childC.setFallback(get('child-button-c1'))
        regionMap.parent.setFallback(get('parent-button-1'))

        get('parent-button-2').focus()

        regionMap.childA.borrowFocus(get('child-button-a2'))
        regionMap.childB.borrowFocus(get('child-button-b2'))

        get('parent-button-2').remove()
        reconcileAllRegions()

        regionMap.childB.releaseFocus()
        regionMap.childA.releaseFocus()

        expect(getFocusedElementId()).to.equal('parent-button-1')
      })
    })

    context('when all borrows release focus in irregular order', () => {
      it('releases focus to the previous non-borrower lender', () => {
        regionMap.childA.setFallback(get('child-button-a1'))
        regionMap.childB.setFallback(get('child-button-b1'))
        regionMap.childC.setFallback(get('child-button-c1'))
        regionMap.parent.setFallback(get('parent-button-1'))

        get('parent-button-2').focus()

        regionMap.childA.borrowFocus(get('child-button-a2'))
        regionMap.childB.borrowFocus(get('child-button-b2'))
        regionMap.childA.releaseFocus()
        regionMap.childB.releaseFocus()

        expect(getFocusedElementId()).to.equal('parent-button-2')
      })

      it('falls back to the focus fallback of the previous non-borrower lender', () => {
        regionMap.childA.setFallback(get('child-button-a1'))
        regionMap.childB.setFallback(get('child-button-b1'))
        regionMap.childC.setFallback(get('child-button-c1'))
        regionMap.parent.setFallback(get('parent-button-1'))

        get('parent-button-2').focus()

        regionMap.childA.borrowFocus(get('child-button-a2'))
        regionMap.childB.borrowFocus(get('child-button-b2'))

        get('parent-button-2').remove()
        reconcileAllRegions()

        regionMap.childA.releaseFocus()
        regionMap.childB.releaseFocus()

        expect(getFocusedElementId()).to.equal('parent-button-1')
      })
    })

    context(
      'when the previously-focused element of an intermediate borrower has been removed',
      () => {
        it('falls back to the fallback of the lender', () => {
          regionMap.childA.setFallback(get('child-button-a1'))
          regionMap.childB.setFallback(get('child-button-b1'))
          regionMap.childC.setFallback(get('child-button-c1'))
          regionMap.parent.setFallback(get('parent-button-1'))

          get('parent-button-2').focus()

          regionMap.childA.borrowFocus(get('child-button-a2'))
          regionMap.childB.borrowFocus(get('child-button-b2'))
          regionMap.childC.borrowFocus(get('child-button-c2'))

          get('child-button-b2').remove()
          reconcileAllRegions()

          regionMap.childC.releaseFocus()

          expect(getFocusedElementId()).to.equal('child-button-b1')
        })
      },
    )
  })

  context('when a region outside the root region borrows focus', () => {
    beforeEach(() => {
      render(`
        <div>
          <div id="container-a">
            <button id="button-a1">Button A1</button>
            <button id="button-a2">Button A2</button>
          </div>

          <div id="container-b">
            <button id="button-b1">Button B1</button>
            <button id="button-b2">Button B2</button>
          </div>
        </div>
      `)

      regionMap.a = focus.addRegion(get('container-a'))
      regionMap.b = focus.addRegion(get('container-b'))
    })

    it('releases focus to the previously-active element', () => {
      regionMap.a.setFallback(get('button-a1'))
      regionMap.b.setFallback(get('button-b1'))

      get('button-a2').focus()

      regionMap.b.borrowFocus(get('button-b2'))
      regionMap.b.releaseFocus()

      expect(getFocusedElementId()).to.equal('button-a2')
    })

    it('is not affected by changes to focus while in the borrower region', () => {
      regionMap.a.setFallback(get('button-a1'))
      regionMap.b.setFallback(get('button-b1'))

      get('button-a2').focus()

      regionMap.b.borrowFocus(get('button-b2'))
      get('button-b1').focus()
      regionMap.b.releaseFocus()

      expect(getFocusedElementId()).to.equal('button-a2')
    })
  })

  context('when a borrower releases to a region that has been removed', () => {
    context('when the lending region is not the root', () => {
      beforeEach(() => {
        render(`
          <div>
            <div id="parent-container">
              <button id="parent-fallback">Parent Fallback</button>

              <div id="child-container">
                <button id="child-button">Child Button</button>
              </div>
            </div>

            <div id="borrower-container">
              <button id="borrower-button">Borrower Button</button>
            </div>
          </div>
        `)

        regionMap.parent = focus.addRegion(get('parent-container'))
        regionMap.child = focus.addRegion(get('child-container'))
        regionMap.borrower = focus.addRegion(get('borrower-container'))
      })

      it('releases focus to a region related to the previously-active region', () => {
        regionMap.parent.setFallback(get('parent-fallback'))

        get('child-button').focus()
        regionMap.borrower.borrowFocus(get('borrower-button'))

        get('child-container').remove()
        regionMap.child.remove()
        regionMap.borrower.releaseFocus()
        reconcileAllRegions()

        expect(getFocusedElementId()).to.equal('parent-fallback')
      })
    })
  })

  context('when a borrowing region is the only region', () => {
    beforeEach(() => {
      render(`
        <button id="other-button">Other Button</button>

        <div id="borrower-container">
          <button id="borrower-button">Borrower Button</button>
        </div>
      `)

      regionMap.borrower = focus.addRegion(get('borrower-container'))
    })

    it('restores focus to the previously-active element', () => {
      get('other-button').focus()
      regionMap.borrower.borrowFocus(get('borrower-button'))

      regionMap.borrower.releaseFocus()
      reconcileAllRegions()

      expect(getFocusedElementId()).to.equal('borrower-button')
    })

    it('does not change focus when the previously-active element has been removed', () => {
      get('other-button').focus()
      regionMap.borrower.borrowFocus(get('borrower-button'))

      get('other-button').remove()
      regionMap.borrower.releaseFocus()
      reconcileAllRegions()

      expect(getFocusedElementId()).to.equal('borrower-button')
    })

    it('does not change focus when the region is removed before releasing focus', () => {
      get('other-button').focus()
      regionMap.borrower.borrowFocus(get('borrower-button'))

      regionMap.borrower.remove()
      reconcileAllRegions()

      expect(getFocusedElementId()).to.equal('borrower-button')
    })
  })
})
