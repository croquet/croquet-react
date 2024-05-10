// import ReactDom from "react-dom/client";
import {
  usePublish,
  useViewId,
  useModelRoot,
  useSubscribe,
  useUpdateCallback,
  useSyncedCallback,
} from "@croquet/react";

import { useState, useCallback, CSSProperties } from "react";

import {Point, MusicBoxModel, pointerId, ballId, BallData, BallDiameter, ptof} from "./model.ts";

let audioContext:AudioContext|null = null;

export function MusicBoxField() {
  const model = useModelRoot() as MusicBoxModel;
  const [wrapTime, setWrapTime] = useState(0); // Croquet logical time in seconds
  const [lastWrapTime, setLastWrapTime] = useState(wrapTime); // Croquet logical time in seconds
  const [lastWrapRealTime, setLastWrapRealTime] = useState(Date.now()); // real time in ms
  const [barPos, setBarPos] = useState(0); // position in css pixels

  const [grabInfo, setGrabInfo] = useState<Map<pointerId, {ballId:ballId, grabPoint:Point, translation:Point}>>(new Map());
  const [viewBalls, setViewBalls] = useState(new Map(model.balls));

  const updateBalls = () => {
    setViewBalls((oldViewBalls) => {
      return mergeBalls(model.balls, oldViewBalls);
    });
  };

  useSubscribe<number>(model.id, "wrap", (time) => setWrapTime(time));
  // useSubscribe(model.id, "grabbed", (data) => console.log("grabbed", data));
  useSubscribe(model.id, "moved", updateBalls);
  useSubscribe(model.id, "released", updateBalls);
  useSubscribe(model.id, "added", updateBalls);
  useSubscribe(model.id, "removed", updateBalls);

  const viewId = useViewId();
  const publishGrab = usePublish((id) => [model.id, 'grab', {viewId, id}]);
  const publishMove = usePublish((id, newTranslation) => {
    return [model.id, 'move', {viewId, id, x: newTranslation.x, y: newTranslation.y}]});
  const publishRelease = usePublish((id) => [model.id, 'release', {viewId, id}]);
  const publishAddBall = usePublish((x, y) => [model.id, 'addBall', {viewId, x, y}]);
  const publishRemoveBall = usePublish((id) => [model.id, 'removeBall', {id, viewId}]);

  const findBall = useCallback((x:number, y:number, balls:Map<ballId, BallData>) : [ballId, BallData]|null => {
    const entries = Array.from(balls.entries());
    for (let i = entries.length - 1; i >= 0; i--) {
      const entry = entries[i];
      const diffX = (entry[1].x + BallDiameter) - x;
      const diffY = (entry[1].y + BallDiameter) - y;
      if ((diffX * diffX + diffY * diffY) <= BallDiameter ** 2) {
        return entry;
      }
    }
    return null;
  }, []);

  const mergeBalls = useCallback((modelBalls:Map<ballId, BallData>, viewBalls:Map<ballId, BallData>) => {
    const newViewBalls = new Map();
    modelBalls.forEach((ballData, ballId) => {
      if (ballData.grabbed === viewId) {
        newViewBalls.set(ballId, viewBalls.get(ballId));
      } else {
        newViewBalls.set(ballId, ballData);
      }
    });
    return newViewBalls;
  }, [viewId]);

  const pointerDown = useCallback((evt:PointerEvent) => {
    enableSound();
    const nativeEvent = (evt as unknown as {nativeEvent:PointerEvent}).nativeEvent;
    const x = nativeEvent.offsetX;
    const y = nativeEvent.offsetY;
    const pointerId = evt.pointerId;
    const balls = model.balls;
    const entry = findBall(x, y, balls);
    if (!entry) {return;}
    const [ballId, ballData] = entry;
    if (ballData.grabbed && ballData.grabbed !== viewId) {return;}
    const info = grabInfo.get(pointerId);
    if (info) {return;}
    const g = {ballId: entry[0], grabPoint: {x: x, y: y} as Point, translation: {x: ballData.x, y: ballData.y} as Point};

    // const newGrabInfo = new Map([...grabInfo.entries(), [evt.pointerId, g]]);
    const newGrabInfo = new Map(grabInfo);
    newGrabInfo.set(evt.pointerId, g);
    setGrabInfo(newGrabInfo);
    publishGrab(ballId);
    (evt.target as HTMLElement).setPointerCapture(evt.pointerId);
  }, [grabInfo, findBall, model.balls, publishGrab, viewId]);

  const pointerMove = useCallback((evt:PointerEvent) => {
    if (evt.buttons === 0) {return;}
    const pointerId = evt.pointerId;
    const info = grabInfo.get(pointerId);
    if (!info) {return;}

    const nativeEvent = (evt as unknown as {nativeEvent:PointerEvent}).nativeEvent;

    let x = nativeEvent.offsetX - info.grabPoint.x + info.translation.x;
    let y = nativeEvent.offsetY - info.grabPoint.y + info.translation.y;
    if (x <= 0) {x = 0;}
    // if (x > model.width - BallDiameter) {x = model.width - BallDiameter;}
    if (y <= 0) {y = 0}
    if (y > model.height - BallDiameter * 2) {y = model.height - BallDiameter * 2;}
    const step = (model.height - BallDiameter * 2) / 12;
    y = Math.floor(y / step) * step;

    setViewBalls((oldViewBalls) => {
      const oldEntry = oldViewBalls.get(info.ballId);
      if (!oldEntry) {return oldViewBalls;}
      const newItem = {x, y, grabbed: oldEntry.grabbed};
      const newData = new Map(oldViewBalls);
      newData.set(info.ballId, newItem);
      return newData;
    });
  
    publishMove(info.ballId, {x, y});
  }, [grabInfo, publishMove, model.height/*, model.width*/]);

  const pointerUp = useCallback((evt:PointerEvent) => {
    const pointerId = evt.pointerId;
    (evt.target as HTMLElement).releasePointerCapture(pointerId);
    const info = grabInfo.get(pointerId);
    if (!info) {return;}

    const newGrabInfo = new Map(grabInfo);
    newGrabInfo.delete(evt.pointerId);

    setGrabInfo(newGrabInfo);
    const ballData = model.balls.get(info.ballId);
    if (!ballData) {return;}
    if (ballData.grabbed !== viewId) {return;}
    if (ballData.x > model.width) {
      publishRemoveBall(info.ballId);
    }
    publishRelease(info.ballId);
  }, [grabInfo, model.balls, publishRelease, publishRemoveBall, model.width, viewId]);

  const update = () => {
    setBarPos((oldBarPos) => {
      const updateNow = Date.now();
      const barTiming = (updateNow - lastWrapRealTime) / 2000;
      const newBarPos = barTiming * model.width; // be [0..model.width+)
      const toPlay:number[] = [];
      viewBalls.forEach((ballData) => {
        if ((oldBarPos <= ballData.x && ballData.x < newBarPos) ||
        (oldBarPos > newBarPos && ballData.x < newBarPos)) {
          toPlay.push((model.height - ballData.y) / model.height);
        }
      });
      playSound(toPlay);
      return newBarPos;
    });
  };
  useUpdateCallback(update);

  useSyncedCallback((flag:boolean) => {
    console.log("synced", flag, barPos);
  });
  
  if (lastWrapTime !== wrapTime) {
    setLastWrapTime(wrapTime);
    const now = Date.now();
    setLastWrapRealTime(now);
  }

  const balls:JSX.Element[] = [];
  viewBalls.forEach((ball: BallData, id: number) => {
    balls.push(<Ball x={ball.x} y={ball.y} key={id} id={id} grabbed={ball.grabbed}/>);
  });

  const neededRatio = (model.width + 100) / (model.height + 100);

  const needV = (window.innerWidth / window.innerHeight) > neededRatio;

  let scale;
  if (needV) {
    scale = Math.min(1, window.innerHeight / (model.height + 100));
  } else {
    scale = Math.min(1, window.innerWidth / (model.width + 100));
  }

  const style = {
    transform: `scale(${scale})`, transformOrigin: "0 0", width: model.width, height: model.height};

  return (
    <>
      <div id="field" style={style as CSSProperties}
        onPointerDown={(pointerDown as unknown) as React.PointerEventHandler<HTMLDivElement>}
        onPointerMove={(pointerMove as unknown) as React.PointerEventHandler<HTMLDivElement>}
        onPointerUp={(pointerUp as unknown) as React.PointerEventHandler<HTMLDivElement>}
      >  
        <Bar pos={barPos}></Bar>
        {balls}
     </div>
     <BallContainer publishAddBall={publishAddBall} position={scale * model.height + 20}/>
    </>
  );
}

function BallContainer(props:{publishAddBall:(x:number, y:number) => void, position:number}) {
  const {publishAddBall, position} = props;
  const create = () => {
    
    publishAddBall(BallDiameter * 2, BallDiameter * 2);
  }

  return (
    <div id="add-container" onClick={create} style={{top: `${position}px`}}>
       <div className="piece innert"></div>
    </div>
  )
}

function Bar(props: { pos: number }) {
  return (
    <div style={{
      position: "absolute",
      backgroundColor: "black",
      transformOrigin: "0 0",
      transform: `translate(${props.pos}px, 0px)`,
      width: "10px",
      height: "20px"
    }} />
  );
}

function Ball(props:{x:number, y:number, id:ballId, grabbed:string|null}) {
  const {x, y, id, grabbed} = props;
  // const style = {"transform": `translate(${x}px, ${y}px)`, "pointerEvents": "none"};
  const viewId = useViewId();
  const border = !grabbed ? "" : (grabbed === viewId ? "1px solid red" : "1px solid black");

  return (
    <div className="piece" style={{"transform": `translate(${x}px, ${y}px)`, "pointerEvents": "none", "border": border}} key={id}/>
  );
}

function enableSound() {
  if (audioContext) {return;}
  if (window.AudioContext) {
    audioContext = new window.AudioContext();
    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }
  }
}

function playSound(toPlay:number[]) :void {
  if (!audioContext) {return;}
  const now = audioContext.currentTime;
  toPlay.forEach(p => {
    if (!audioContext) {return;}// a dubious line
    const f = ptof(p);
    const o = audioContext.createOscillator();
    o.type = "sine";

    o.frequency.setValueAtTime(f, now);

    const g = audioContext.createGain();
    g.gain.setValueAtTime(0.0, now);
    g.gain.linearRampToValueAtTime(0.2, now + 0.1);
    o.connect(g);
    g.connect(audioContext.destination);
    o.start(0)

    const stopTone = () => {
      if (!audioContext) {return;}
      const future = audioContext.currentTime;
      //g.gain.cancelScheduledValues(future);
      g.gain.setValueAtTime(g.gain.value, future);
      g.gain.exponentialRampToValueAtTime(0.00001, future + 1.0);
      o.stop(future + 1);
    };
    setTimeout(stopTone, 100);
  });
}