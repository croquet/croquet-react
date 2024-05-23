import { useContext } from 'react'
import { CroquetContext, ContextType } from '../components/CroquetContext'

export function useCroquetContext(): ContextType {
  const contextValue = useContext(CroquetContext)
  if (!contextValue) throw new Error('Not inside Croquet context')
  return contextValue
}
