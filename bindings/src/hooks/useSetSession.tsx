import { useCroquetContext } from './useCroquetContext'

/** This hook returns a function that changes the CroquetSession the user is joined to
 * @param name
 * @param password
 */
export function useSetSession() {
  const { setSession } = useCroquetContext()
  return setSession
}
