import { useCroquetContext } from "./useCroquetContext";

export function useLeaveSession() {
    const { leaveSession } = useCroquetContext()
    return leaveSession
}
