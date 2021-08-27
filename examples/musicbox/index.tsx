import ReactDom from "react-dom";
import { Model, App } from "@croquet/croquet";
import {
  usePublish,
  useViewId,
  useModelRoot,
  InCroquetSession,
  CroquetContext,
  useSubscribe,
  useUpdateCallback,
  useSyncedCallback,
} from "@croquet/react";

import React, { useState, useContext, useCallback } from "react";

const BallDiameter = 25;
let audioContext:AudioContext|null = null;

type BallId = number;
type PointerId = number;
type ViewId = string;
type BallData = {x:number, y:number, grabbed:ViewId|null};
type MoveData = {viewId:string, id:BallId, x:number, y:number};
type GrabData = {viewId:string, id:BallId};
interface Point {
  x: number;
  y: number;
}

class MusicBoxModel extends Model {
  width = 720;
  height = 480;
  wrapTime = 0;
  balls:Map<BallId, BallData> = new Map();
  currentId = 0;
  init(options:any) {
    super.init(options);
    // {x: normalizedPos, n: note}. x is normalized to [0, width - BallDiameter * 2]. f is converted to y which is with in (height - BallDiameter... 0)
    [
      {x: 0.000, n: 'C'},
      {x: 0.125, n: 'D'},
      {x: 0.250, n: 'E'},
      {x: 0.375, n: 'F'},
      {x: 0.500, n: 'G'},
      {x: 0.625, n: 'A'},
      {x: 0.750, n: 'B'},
      {x: 0.875, n: 'C^'},
    ].forEach((obj) => {
      this.balls.set(this.currentId++, {
        x: obj.x * (this.width - BallDiameter * 2),
        
        y: this.height - (ftop(stof(obj.n)) * (this.height - BallDiameter * 2)) - BallDiameter * 2,
        grabbed: null} as BallData);
    });

    this.future(2000).wrap();
    this.subscribe<GrabData>(this.id, "grab", this.grab);
    this.subscribe<MoveData>(this.id, "move", this.move);
    this.subscribe<GrabData>(this.id, "release", this.release);
    this.subscribe<{viewId:string, x:number, y:number}>(this.id, "addBall", this.addBall);
    this.subscribe<GrabData>(this.id, "removeBall", this.removeBall);
    this.subscribe<string>(this.sessionId, "view-exit", this.deleteUser);
  }

  deleteUser(viewId:string) {
    this.balls.forEach((value) => {
      if (value.grabbed === viewId) {
          value.grabbed = null;
      }
    })
  }

  grab(data:{viewId:string, id:BallId}) {
    const {viewId, id} = data;
    const ball = this.balls.get(id);
    if (!ball) {return;}
    if (ball.grabbed) {return;}
    ball.grabbed = viewId;
    this.publish(this.id, "grabbed", data);
  }

  move(data:MoveData) {
    const {viewId, id, x, y} = data;
    const ball = this.balls.get(id);
    if (!ball) {return;}
    if (ball.grabbed !== viewId) {return;}
    ball.x = x;
    ball.y = y;
    this.publish(this.id, "moved", data);
  }

  release(data:{viewId:string, id:BallId}) {
    const {viewId, id} = data;
    const ball = this.balls.get(id);
    if (!ball) {return;}
    if (ball.grabbed !== viewId) {return;}
    ball.grabbed = null;
    ball.x = Math.min(ball.x, this.width - BallDiameter);
    this.publish(this.id, "released", data);
  }

  addBall(data:{viewId:string, x: number, y:number}) {
    const id = this.currentId++;
    const x = data.x || this.width / 2;
    const y = data.y || this.width / 2;
    this.balls.set(id, {x, y, grabbed:null});

    const result = {...data, id};
    this.publish(this.id, "added", result);
  }

  removeBall(data:{viewId:string, id:BallId}) {
    const {viewId, id} = data;
    const ball = this.balls.get(id);
    if (!ball) {return;}
    if (ball.grabbed !== viewId) {return;}
    this.balls.delete(id);

    this.publish(this.id, "removed", {viewId, id});
  }

  wrap() {
    this.wrapTime = this.now() / 1000.0;
    this.future(2000).wrap();
    this.publish(this.id, "wrap", this.wrapTime);
  }
}

MusicBoxModel.register("MusicBoxModel");

function MusicBoxApp() {
  return (
    <InCroquetSession name={App.autoSession("q")} tps={10} apiKey="1_k2xgbwsmtplovtjbknerd53i73otnqvlwwjvix0f" appId="io.croquet.react.musicbox" password="abc" model={MusicBoxModel} eventRateLimit={60} debug={["session"]}>
      <MusicBoxField/>
    </InCroquetSession>
  );
}

function MusicBoxField() {
  const model = useModelRoot() as MusicBoxModel;
  const myViewId = useViewId();

  const [wrapTime, setWrapTime] = useState(0); // Croquet logical time in seconds
  const [lastWrapTime, setLastWrapTime] = useState(wrapTime); // Croquet logical time in seconds
  const [lastWrapRealTime, setLastWrapRealTime] = useState(Date.now()); // real time in ms
  const [barPos, setBarPos] = useState(0); // position in css pixels

  const [grabInfo, setGrabInfo] = useState<{data: Map<PointerId, {ballId:BallId, grabPoint:Point, translation:Point}>}>({data: new Map()});
  const [viewBalls, setViewBalls] = useState<{data: Map<BallId, BallData>}>({data: new Map(model.balls)});

  const grabBall = useCallback((data:{viewId:string, id:BallId}, viewSide?:boolean) => {
    const {viewId, id} = data;

    if (!viewSide && viewId === myViewId) {return;}

    setViewBalls((oldViewBalls) =>{
      const map = oldViewBalls.data;
      const ball = map.get(id);
      if (ball) {
        const newBall = {...ball, grabbed: viewId};
        map.set(id, newBall);
      }
      return {data: map};
    });
  }, [myViewId]);

  const moveBall = useCallback((data:MoveData, viewSide?:boolean) => {
    const {viewId, id, x, y} = data;

    if (!viewSide && viewId === myViewId) {return;}

    setViewBalls((oldViewBalls) =>{
      const map = oldViewBalls.data;
      map.set(id, {x, y, grabbed: viewId});
      return {data: map};
    });
  }, [myViewId]);

  const releaseBall = useCallback((data:{viewId:string, id:BallId}, viewSide?:boolean) => {
    const {viewId, id} = data;

    if (viewSide && viewId === myViewId) {return;}

    setViewBalls((oldViewBalls) =>{
      const map = oldViewBalls.data;
      const ball = map.get(id);
      if (ball) {
        const newBall = {...ball, grabbed: null};
        map.set(id, newBall);
      }
      return {data: map};
    });
  }, [myViewId]);

  const addBall = useCallback((data:{viewId:string, x:number, y:number, id:BallId}) => {
    const {id, x, y} = data;
    setViewBalls((oldViewBalls) =>{
      const map = oldViewBalls.data;
      map.set(id, {x, y, grabbed: null});
      return {data: map};
    });
  }, []);
 
  const removeBall = useCallback((data:{viewId:string,id:BallId}) => {
    const {id} = data;
    setViewBalls((oldViewBalls) =>{
      const map = oldViewBalls.data;
      map.delete(id);
      return {data: map};
    });
  }, []);

  useSubscribe<number>(model.id, "wrap", (time) => setWrapTime(time));
  useSubscribe<GrabData>(model.id, "grabbed", grabBall);
  useSubscribe<MoveData>(model.id, "moved", moveBall);
  useSubscribe<GrabData>(model.id, "released", releaseBall);
  useSubscribe<MoveData>(model.id, "added", addBall);
  useSubscribe<GrabData>(model.id, "removed", removeBall);

  const publishGrab = usePublish<GrabData>((id) => [model.id, 'grab', {viewId: myViewId, id}]);
  const publishMove = usePublish<MoveData>((id, newTranslation) => {
    return [model.id, 'move', {viewId: myViewId, id, x: newTranslation.x, y: newTranslation.y}]});
  const publishRelease = usePublish<GrabData>((id) => [model.id, 'release', {viewId: myViewId, id}]);
  const publishAddBall = usePublish((x, y) => [model.id, 'addBall', {viewId: myViewId, x, y}]);
  const publishRemoveBall = usePublish<GrabData>((id) => [model.id, 'removeBall', {id, viewId: myViewId}]);

  const findBall = useCallback((x:number, y:number, balls:Map<BallId, BallData>) : [BallId, BallData]|null => {
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

  const pointerDown = useCallback((evt) => {
    enableSound();
    const x = evt.nativeEvent.offsetX;
    const y = evt.nativeEvent.offsetY;
    const pointerId:PointerId = evt.pointerId;
    const balls = model.balls;
    const entry = findBall(x, y, balls);
    if (!entry) {return;}
    const [ballId, ballData] = entry;
    if (ballData.grabbed && ballData.grabbed !== myViewId) {return;}
    const info = grabInfo.data.get(pointerId);
    if (info) {return;}
    const g = {ballId: entry[0], grabPoint: {x: x, y: y} as Point, translation: {x: ballData.x, y: ballData.y} as Point};

    grabInfo.data.set(evt.pointerId, g);
    setGrabInfo({data: grabInfo.data});
    grabBall({viewId: myViewId, id: ballId}, true);

    publishGrab(ballId);
    evt.target.setPointerCapture(evt.pointerId);
  }, [grabInfo, findBall, grabBall, model.balls, publishGrab, myViewId]);

  const pointerMove = useCallback((evt) => {
    if (evt.buttons === 0) {return;}
    const pointerId:PointerId = evt.pointerId;
    const info = grabInfo.data.get(pointerId);
    if (!info) {return;}
  
    const ball = model.balls.get(info.ballId);
    if (!ball) {return;}
    if (ball.grabbed && ball.grabbed !== myViewId) {return;}

    let x = evt.nativeEvent.offsetX - info.grabPoint.x + info.translation.x;
    let y = evt.nativeEvent.offsetY - info.grabPoint.y + info.translation.y;
    if (x <= 0) {x = 0;}
    // if (x > model.width - BallDiameter) {x = model.width - BallDiameter;}
    if (y <= 0) {y = 0}
    if (y > model.height - BallDiameter * 2) {y = model.height - BallDiameter * 2;}

    moveBall({x, y, viewId: myViewId, id: info.ballId}, true);
  
    publishMove(info.ballId, {x, y});
  }, [grabInfo, moveBall, publishMove, model.height, model.balls, myViewId]);

  const pointerUp = useCallback((evt) => {
    const pointerId:PointerId = evt.pointerId;
    evt.target.releasePointerCapture(pointerId);
    const info = grabInfo.data.get(pointerId);
    if (!info) {return;}

    grabInfo.data.delete(evt.pointerId);
    setGrabInfo({data: grabInfo.data});
    const ballData = model.balls.get(info.ballId);
    if (!ballData) {return;}
    if (ballData.grabbed && ballData.grabbed !== myViewId) {return;}
    if (ballData.x > model.width) {
      publishRemoveBall(info.ballId);
    }

    releaseBall({viewId: myViewId, id: info.ballId}, true);
    publishRelease(info.ballId);
  }, [grabInfo, model.balls, publishRelease, publishRemoveBall, model.width, myViewId, releaseBall]);

  const update = (_time:number) => {
    setBarPos((oldBarPos) => {
      const updateNow = Date.now();
      const barTiming = (updateNow - lastWrapRealTime) / 2000;
      const newBarPos = barTiming * model.width; // be [0..model.width+)
      const toPlay:number[] = [];
      viewBalls.data.forEach((ballData) => {
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

  const croquetContext = useContext(CroquetContext);
  if (!croquetContext) {return <div/>;}
  
  if (lastWrapTime !== wrapTime) {
    setLastWrapTime(wrapTime);
    const now = Date.now();
    setLastWrapRealTime(now);
  }

  const balls:JSX.Element[] = [];
  viewBalls.data.forEach((ball: BallData, id: number) => {
    balls.push(<Ball x={ball.x} y={ball.y} key={id} id={id} grabbed={ball.grabbed}/>);
  });

  const scale = Math.min(1, window.innerWidth / model.width, window.innerHeight / model.height);

  const style = {
    transform: `scale(${scale})`, transformOrigin: "0 0", width: model.width, height: model.height,
    border: "1px solid black", position: "absolute", left: 0, top: 0};

  return (
    <>
      <div id="field" style={style as any}
        onPointerDown={pointerDown}
        onPointerMove={pointerMove}
        onPointerUp={pointerUp}
      >  
        <Bar pos={barPos}></Bar>
        {balls}
     </div>
     <BallContainer publishAddBall={publishAddBall}/>
    </>
  );
}

function BallContainer(props:{publishAddBall:(x:number, y:number) => void}) {
  const {publishAddBall} = props;
  const create = () => {
    
    publishAddBall(BallDiameter * 2, BallDiameter * 2);
  }

  return (
    <div id="add-container" onClick={create}>
       <div className="piece"></div>
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

function Ball(props:{x:number, y:number, id:BallId, grabbed:string|null}) {
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

function stof(s:string) {
  const scale = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B', 'C^'];
  const index = scale.indexOf(s);
  return Math.pow(1.0594630943592953, index) * 261.63;
}

function ftop(f:number) {
  // log_1.059 p = log p / log 1.059

  const p = f / 261.63;
  return Math.log(p) / Math.log(1.0594630943592953) / 12.0;
}

function ptof(p:number) {
  return Math.pow(1.0594630943592953, p * 12) * 261.63;
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
    //  AudioScheduledSourceNode.start() used to take three parameters but anymore.
    o.start(0);

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

ReactDom.render(<MusicBoxApp />, document.getElementById("app"));
