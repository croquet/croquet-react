import { useCroquetSession } from "./useCroquetSession";

export function useSessionName(): string | null {
    const session = useCroquetSession()
    if(!session) return null
    // @ts-expect-error We know that the session has a name
    return session.name
}
