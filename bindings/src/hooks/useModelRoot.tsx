import { ReactModel } from '../ReactModel'
import { useCroquetContext } from './useCroquetContext'
/** Hook that gives access to the root Model of this croquet session.
 * Can be used to read Model properties (including other referenced Models),
 * and to publish events to the Model or to subscribe to Model events using the other hooks.
 */
export function useModelRoot<T extends ReactModel>(): T | null {
  const { model } = useCroquetContext()
  return model as T
}
