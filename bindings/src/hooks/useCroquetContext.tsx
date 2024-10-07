import { useContext } from 'react'
import { CroquetContext, ICroquetContext } from '../components/CroquetContext'
import { ReactModel } from '../ReactModel'

export function useCroquetContext<M extends ReactModel>(): ICroquetContext<M> {
  const contextValue = useContext(CroquetContext as React.Context<ICroquetContext<M> | undefined>)
  if (!contextValue) throw new Error('Not inside Croquet context')
  return contextValue
}
