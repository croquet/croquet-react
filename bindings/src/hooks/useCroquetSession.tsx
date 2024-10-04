import { CroquetSession } from '@croquet/croquet'
import { CroquetReactView } from '../CroquetReactView'
import { useCroquetContext } from './useCroquetContext'
import { ReactModel } from '../ReactModel'

/** Hook that gives access to the Croquet Session the user is currently joined to.
 */
export function useCroquetSession<M extends ReactModel>(): CroquetSession<CroquetReactView<M>> | null {
  const { session } = useCroquetContext<M>()
  return session
}
