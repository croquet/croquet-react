import { useContext } from 'react'
import { CroquetContext, ContextType } from '../components/CroquetContext'
import { ReactModel } from '../ReactModel'

export function useCroquetContext<M extends ReactModel>(): ContextType<M> {
  const contextValue = useContext(CroquetContext as React.Context<ContextType<M> | undefined>)
  if (!contextValue) throw new Error('Not inside Croquet context')
  return contextValue
}
