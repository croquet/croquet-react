import { useCroquetContext } from './useCroquetContext'

/** This hook returns a function that changes the CroquetSession the user is connected to
 * @param name
 * @param password
 */
export function useChangeSession() {
  const { changeSession } = useCroquetContext()
  return changeSession
}
