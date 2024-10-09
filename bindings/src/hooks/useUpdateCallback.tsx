import { UpdateCallback } from '../CroquetReactView'
import { useView } from './useView'

/**
 * Hook that sets up a callback for Croquet.View.update().
 *
 * The function will be called at each simulation cycle.
 */
export function useUpdateCallback(callback: UpdateCallback | null): void {
  const croquetView = useView()
  if (croquetView !== null) {
    croquetView.updateCallback = callback
  }
}
