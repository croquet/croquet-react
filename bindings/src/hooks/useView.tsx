import { useCroquetContext } from './useCroquetContext'
import { CroquetReactView } from '../CroquetReactView'
import { ReactModel } from '../ReactModel'

export function useView<M extends ReactModel>(): CroquetReactView<M> | null {
  const { view } = useCroquetContext<M>()
  return view
}
