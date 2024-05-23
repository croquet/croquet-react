import { useCroquetSession } from './useCroquetSession'

/**
 * Hook that gives access to the sessionId.
 */
export function useSessionId(): string | undefined {
  const session = useCroquetSession()
  return session?.id
}
