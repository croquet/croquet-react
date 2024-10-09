import { useView } from "./useView";

export function useIsJoined() {
    return useView() !== null
}
