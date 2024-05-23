import { SyncedCallback } from '../CroquetReactView'
import { useCroquetView } from './useCroquetView'

/**
 * Hook that sets up a callback for Croquet.View.synced().
 *
 * The function will be called when Croquet synced event occurs.
 */
export function useSyncedCallback(callback: SyncedCallback | null): void {
  const croquetView = useCroquetView()
  if (croquetView !== null) {
    croquetView.syncedCallback = callback
  }
}
