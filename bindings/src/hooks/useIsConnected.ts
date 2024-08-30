import { useCroquetView } from "./useCroquetView";

export function useIsConnected() {
    return useCroquetView() !== null
}