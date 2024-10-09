import { DetachCallback } from '../CroquetReactView'
import { useView } from './useView'

/** Hook that sets up a callback for Croquet.View.detach().
 * The function will be called when the root View is detached.
 */
export function useDetachCallback(callback: DetachCallback | null): void {
  const croquetView = useView()
  if (croquetView !== null) {
    croquetView.detachCallback = callback
  }
}
