import { ReactModel } from '..'
import { useModelRoot } from './useModelRoot'

/** Hook that gives access to the Model specified by an id of this croquet session.
 * Can be used to read Model properties (including other referenced Models),
 * and to publish events to the Model or to subscribe to Model events using the other hooks.
 */
export function useModelById<M extends ReactModel>(id: string): M | null {
  const model = useModelRoot()
  return model?.getModel<M>(id) ?? null
}
