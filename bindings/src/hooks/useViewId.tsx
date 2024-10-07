import { useCroquetView } from './useCroquetView'

/** Hook that gives access to the id of the client. This can be used as an identifier for different clients.
 */
export function useViewId(): string | null {
  const croquetView = useCroquetView()
  return croquetView?.viewId ?? null
}
