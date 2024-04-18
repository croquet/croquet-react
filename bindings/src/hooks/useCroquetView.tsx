import { useCroquetContext } from './useCroquetContext'
import { CroquetReactView } from '../CroquetReactView'

export function useCroquetView(): CroquetReactView | null {
  const { view } = useCroquetContext()
  return view
}
