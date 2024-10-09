import { useSession } from '.'

/**
 * Hook that gives access to the sessionId.
 */
export function useSessionId(): string | null {
  const session = useSession()
  return session?.id ?? null
}
