import {
 Model
} from "@croquet/react";


export function stof(s:string) {
  const scale = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B', 'C^'];
  const index = scale.indexOf(s);
  return Math.pow(1.0594630943592953, index) * 261.63;
}

export function ftop(f:number) {
  // log_1.059 p = log p / log 1.059

  const p = f / 261.63;
  return Math.log(p) / Math.log(1.0594630943592953) / 12.0;
}

export function ptof(p:number) {
  return Math.pow(1.0594630943592953, p * 12) * 261.63;
}

export const BallDiameter = 25;

type viewId = string;
export type BallData = {x:number, y:number, grabbed:viewId|null};

export interface Point {
  x: number;
  y: number;
}
export type ballId = number;
export type pointerId = number;

export class MusicBoxModel extends Model {
  width = 720;
  height = 480;
  wrapTime = 0;
  balls:Map<ballId, BallData> = new Map();
  currentId = 0;
  init(options: object) {
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
    this.subscribe(this.id, "grab", this.grab);
    this.subscribe(this.id, "move", this.move);
    this.subscribe(this.id, "release", this.release);
    this.subscribe(this.id, "addBall", this.addBall);
    this.subscribe(this.id, "removeBall", this.removeBall);
    this.subscribe(this.sessionId, "view-exit", this.deleteUser);
  }

  deleteUser(viewId:string) {
    this.balls.forEach((value, _key) => {
      if (value.grabbed === viewId) {
          value.grabbed = null;
      }
    })
  }

  grab(data:{viewId:string, id:ballId}) {
    const {viewId, id} = data;
    const ball = this.balls.get(id);
    if (!ball) {return;}
    if (ball.grabbed) {return;}
    ball.grabbed = viewId;
    this.publish(this.id, "grabbed", data);
  }

  move(data:{viewId:string, id:ballId, x:number, y:number}) {
    const {viewId, id, x, y} = data;
    const ball = this.balls.get(id);
    if (!ball) {return;}
    if (ball.grabbed !== viewId) {return;}
    ball.x = x;
    ball.y = y;

    this.publish(this.id, "moved", data);
  }

  release(data:{viewId:string, id:ballId}) {
    const {viewId, id} = data;
    const ball = this.balls.get(id);
    if (!ball) {return;}
    if (ball.grabbed !== viewId) {return;}
    ball.grabbed = null;
    ball.x = Math.min(ball.x, this.width - BallDiameter);
    this.publish(this.id, "released", data);
  }

  addBall(data:Point) {
    const id = this.currentId++;
    const x = data.x || this.width / 2;
    const y = data.y || this.width / 2;
    this.balls.set(id, {x, y, grabbed:null});
    this.publish(this.id, "added");
  }

  removeBall(data:{viewId:string, id:ballId}) {
    const {viewId, id} = data;
    const ball = this.balls.get(id);
    if (!ball) {return;}
    if (ball.grabbed !== viewId) {return;}
    this.balls.delete(id);
    this.publish(this.id, "removed");
  }

  wrap() {
    this.wrapTime = this.now() / 1000.0;
    this.future(2000).wrap();
    this.publish(this.id, "wrap", this.wrapTime);
  }
}

MusicBoxModel.register("MusicBoxModel");
