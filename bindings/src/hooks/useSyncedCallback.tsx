import { SyncedCallback } from '../CroquetReactView'
import { useView } from './useView'

/**
 * Hook that sets up a callback for Croquet.View.synced().
 *
 * The function will be called when Croquet synced event occurs.
 */
export function useSyncedCallback(callback: SyncedCallback | null): void {
  const croquetView = useView()
  if (croquetView !== null) {
    croquetView.syncedCallback = callback
  }
}
