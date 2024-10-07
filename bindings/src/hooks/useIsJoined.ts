import { useCroquetView } from "./useCroquetView";

export function useIsJoined() {
    return useCroquetView() !== null
}
