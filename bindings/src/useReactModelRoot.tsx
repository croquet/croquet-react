import { useState } from "react";
import { useModelRoot, useSubscribe, usePublish } from "..";
import { ReactModel } from "./ReactModel";

export function useReactModelRoot<T extends ReactModel>(): T {
    const model = useModelRoot() as T;
  
    const [modelState, setModelState] = useState({...model});
    
    useSubscribe(model.id, "react-updated", () => {
      setModelState({...model});
    });
    
    const methods: Partial<T> = {};
    model.__reactEvents.forEach(({ scope, event }) => {
      // @ts-ignore
      methods[event] = usePublish((data) => [scope, event, data]);
    });
    
    const properties: Partial<T> = {};
    for(const p in modelState) {
      if(p !== '__reactEvents') {
        properties[p] = modelState[p]
      }
    }
  
    return { ...properties, ...methods } as T;
  }