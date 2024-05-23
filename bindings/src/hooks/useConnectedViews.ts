import { useReactModelRoot } from './useReactModelRoot'

export function useConnectedViews() {
  const model = useReactModelRoot()

  if(model.__views === null) {
    throw new Error(
      'Your root model is not tracking the connected views.\n'
    + 'Pass `options: { trackViews: true }` to your <CroquetRoot> component to start tracking them\n'
    )
  }

  const views = model.__views
  return {
    views: Array.from(views), viewCount: views.size
  }
}
