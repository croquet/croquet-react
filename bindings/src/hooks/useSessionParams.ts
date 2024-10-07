import { useCroquetContext } from "./useCroquetContext"

export function useSessionParams() {
    const { sessionParams } = useCroquetContext()
    return sessionParams
}