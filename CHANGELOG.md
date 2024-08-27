# Changelog
- 2.1.2
  - Update @croquet/croquet to `^2.0.0-19`
- 2.1.1
  - Update @croquet/croquet to `^2.0.0-18`
  - React Model uses `super.subscribe()` to subscribe to view-join and view-exit events
- 2.1.0
  - Optimize useConnectedViews to minimize rerenders
  - Update CroquetRoot to not rerender when model changes
  - Added `useModelSelector` hook
  - Updated typing annotations for `useModelRoot`
- 2.0.2
  - Export CroquetContext
- 2.0.1
  - Reduce view-side handler invocations (using oncePerFrame)
  - Model-side handler survives minification step
- 2.0.0
  - Major new release with magic ✨

