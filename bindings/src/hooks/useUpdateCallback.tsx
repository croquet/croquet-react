import { UpdateCallback } from '../CroquetReactView'
import { useCroquetView } from './useCroquetView'

/**
 * Hook that sets up a callback for Croquet.View.update().
 *
 * The function will be called at each simulation cycle.
 */
export function useUpdateCallback(callback: UpdateCallback | null): void {
  const croquetView = useCroquetView()
  if (croquetView !== null) {
    croquetView.updateCallback = callback
  }
}
