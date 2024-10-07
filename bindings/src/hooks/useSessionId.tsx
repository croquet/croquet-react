import { useCroquetSession } from './useCroquetSession'

/**
 * Hook that gives access to the sessionId.
 */
export function useSessionId(): string | null {
  const session = useCroquetSession()
  return session?.id ?? null
}
