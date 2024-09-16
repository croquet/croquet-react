import { createContext } from 'react'
import { ReactModel } from '../ReactModel'
import { CroquetSession } from '@croquet/croquet'
import { CroquetReactView } from '../CroquetReactView'
import { ChangeSessionParameters } from './CroquetRoot'

export type ContextType<M extends ReactModel> = {
  session: CroquetSession<CroquetReactView<M>> | null
  view: CroquetReactView<M> | null
  model: M | null
  changeSession: (newParams: ChangeSessionParameters) => void
  leaveSession: () => void
  sessionPassword: string | null
}

// A React context that stores the croquet session, view, and model
export const CroquetContext = createContext<ContextType<ReactModel> | undefined>(undefined)
