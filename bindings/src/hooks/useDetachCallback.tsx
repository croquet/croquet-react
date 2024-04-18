import { DetachCallback } from '../CroquetReactView'
import { useCroquetView } from './useCroquetView'

/** Hook that sets up a callback for Croquet.View.detach().
 * The function will be called when the root View is detached.
 */
export function useDetachCallback(callback: DetachCallback | null): void {
  const croquetView = useCroquetView()
  if (croquetView !== null) {
    croquetView.detachCallback = callback
  }
}
