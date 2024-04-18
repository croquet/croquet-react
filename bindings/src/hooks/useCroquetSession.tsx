import { CroquetSession } from '@croquet/croquet'
import { CroquetReactView } from '../CroquetReactView'
import { useCroquetContext } from './useCroquetContext'

/** Hook that gives access to the Croquet Session the user is currently connected to.
 */
export function useCroquetSession(): CroquetSession<CroquetReactView> | null {
  const { session } = useCroquetContext()
  return session
}
