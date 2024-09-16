import { useCroquetContext } from "./useCroquetContext"

export function useSessionPassword() {
    const { sessionPassword } = useCroquetContext()
    return sessionPassword ?? null
}