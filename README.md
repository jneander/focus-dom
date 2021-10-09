# @jneander/focus-dom

Focus management for the DOM

## Next Steps

- Add examples of borrowing from outside Focus.

### Questions

- How to ensure everything works correctly while window is in background?
- What might need to happen when the element hierarchy rearranges?

### Unknown Behaviors to Consider

- automatic reconciliation
  - might depend on more fine-grained fallback rules
    - i.e. removed borrowers release to lenders instead of fallback
- observability
  - onFocus, onBlur for the FocusRegion?
    - alternately, at the root Focus container
- iframes in focus
  - focus fallback out of an iframe
  - focus falling into an iframe
