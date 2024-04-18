import { createContext } from 'react'
import { ReactModel } from '../ReactModel'
import { CroquetSession } from '@croquet/croquet'
import { CroquetReactView } from '../CroquetReactView'
import { ChangeSessionParameters } from './CroquetRoot'

export type ContextType = {
    session: CroquetSession<CroquetReactView> | null
    view: CroquetReactView | null
    model: ReactModel | null
  changeSession: (newParams: ChangeSessionParameters) => void
  }

// A React context that stores the croquet session, view, and model
export const CroquetContext = createContext<ContextType | undefined>(undefined)
