import { createContext } from 'react'
import { ReactModel } from '../ReactModel'
import { CroquetSession } from '@croquet/croquet'
import { CroquetReactView } from '../CroquetReactView'
import { ReactSessionParameters } from './CroquetRoot'

export type ContextType<M extends ReactModel> = {
  sessionParams: ReactSessionParameters<M>
  session: CroquetSession<CroquetReactView<M>> | null
  view: CroquetReactView<M> | null
  model: M | null
  setSession: (newParams: Partial<Omit<ReactSessionParameters<M>, 'model'>>) => void
  leaveSession: () => void
}

// A React context that stores the croquet session, view, and model
export const CroquetContext = createContext<ContextType<ReactModel> | undefined>(undefined)
