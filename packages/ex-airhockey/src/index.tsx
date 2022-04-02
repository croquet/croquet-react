import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import {
    InCroquetSession,
    useModelRoot,
    useModelState,
} from '@croquet/react';
import { Model } from '@croquet/croquet';
import { vec2 } from 'gl-matrix';

class AirHockey extends Model {
    fieldSize!: vec2;
    puck!: Puck;
    strikers!: [Striker, Striker];
    scores!: [number, number];

    init() {
        this.fieldSize = [300, 600];
        this.scores = [0, 0];
        this.puck = Puck.create({game: this, initialPosition: [this.fieldSize[0] / 2, this.fieldSize[1] / 2]});

        this.strikers = [
            Striker.create({game: this, initialPosition: [this.fieldSize[0] / 2, this.fieldSize[1] / 4]}),
            Striker.create({game: this, initialPosition: [this.fieldSize[0] / 2, (3 * this.fieldSize[1]) / 4]})
        ]

        this.future(500).physicsTick();
    }

    physicsTick() {
        this.puck.physicsTick();

        let someoneScored = false;
        if (this.puck.position[1] < 0) {
            this.scores[1] += 1;
            someoneScored = true;
        } else if (this.puck.position[1] > this.fieldSize[1]) {
            this.scores[0] += 1;
            someoneScored = true;
        }

        if (someoneScored) {
            this.puck.position = [this.fieldSize[0] / 2, this.fieldSize[1] / 2];
            this.puck.velocity = [0, 0];
        }

        for (const striker of this.strikers) {
            if (
                vec2.distance(this.puck.position, striker.position) <
                this.puck.radius + striker.radius
            ) {
                // https://en.wikipedia.org/wiki/Elastic_collision#Two-dimensional_collision_with_two_moving_objects
                const positionDifference = vec2.subtract(
                    [0, 0], //vec2.create(),
                    this.puck.position,
                    striker.position,
                );
                const velocityDifference = vec2.subtract(
                    [0, 0], //vec2.create(),
                    this.puck.velocity,
                    striker.measureEffectiveVelocity(),
                );

                const massRatio =
                    (2 * striker.mass) / (striker.mass + this.puck.mass);
                const multiplier =
                    (massRatio *
                        vec2.dot(velocityDifference, positionDifference)) /
                    vec2.squaredLength(positionDifference);

                const velocityChange = vec2.scale(
                    [0, 0], //vec2.create(),
                    positionDifference,
                    multiplier,
                );

                vec2.subtract(
                    this.puck.velocity,
                    this.puck.velocity,
                    velocityChange,
                );

                // move puck out of striker
                vec2.add(
                    this.puck.position,
                    this.puck.position,
                    vec2.scale(
                        [0, 0],
                        positionDifference,
                        1.1 * (this.puck.radius + striker.radius) /
                        vec2.length(positionDifference),
                    ),
                );
            }
        }

        this.future(60).physicsTick();
    }
}

AirHockey.register('AirhockeyModel');

class Puck extends Model {
    game!: AirHockey
    position!: vec2
    velocity!: vec2
    radius!: number
    mass!: number

    init({game, initialPosition}: {game: AirHockey, initialPosition: vec2}) {
        this.game = game;
        this.position = initialPosition;
        this.velocity = [0, 0];
        this.radius = 5;
        this.mass = 0.02;
    }

    physicsTick() {
        vec2.add(this.position, this.position, this.velocity);

        if (this.position[0] < 0) {
            this.position[0] = 0;
            this.velocity[0] *= -1;
        } else if (this.position[0] > this.game.fieldSize[0]) {
            this.position[0] = this.game.fieldSize[0];
            this.velocity[0] *= -1;
        }

        vec2.scale(this.velocity, this.velocity, 0.9);
    }
}

Puck.register('Puck');

class Striker extends Model {
    game!: AirHockey
    position!: vec2
    lastPosition!: vec2
    radius!: number
    mass!: number

    init({game, initialPosition}: {game: AirHockey, initialPosition: vec2}) {
        this.game = game;
        this.position = initialPosition;
        this.lastPosition = vec2.copy([0, 0], initialPosition);
        this.radius = 10;
        this.mass = 0.2;

        this.subscribe(this.id, 'move', this.move)
    }

    measureEffectiveVelocity() {
        const effectiveVelocity = vec2.subtract(
            [0, 0], //vec2.create(),
            this.position,
            this.lastPosition,
        );

        vec2.copy(this.lastPosition, this.position); // vec2.clone(this.position);

        return effectiveVelocity;
    }

    move({newPosition}: {newPosition: vec2}) {
        vec2.copy(this.position, newPosition);

        if (this.position[0] + this.radius > this.game.fieldSize[0]) {
            this.position[0] = this.game.fieldSize[0] - this.radius
        } else if (this.position[0] - this.radius < 0) {
            this.position[0] = this.radius;
        }
    }
}

Striker.register("Striker");

const App = function () {
    return (
        <InCroquetSession
            model={AirHockey}
            apiKey="1_9oolgb5b5wc5kju39lx8brrrhm82log9xvdn34uq"
            appId="io.croquet.react-example-airhockey"
        >
            <AirHockeyView />
        </InCroquetSession>
    );
};

const AirHockeyView = function () {
    const game = useModelState(useModelRoot<AirHockey>());
    const striker = useModelState(game.strikers[0]);

    const [dragging, setDragging] = useState(false);

    return (
        <div
            style={{
                width: game.fieldSize[0],
                height: game.fieldSize[1],
                backgroundColor: '#dddddd',
                position: 'relative',
            }}
            onPointerUp={() => setDragging(false)}
            onPointerLeave={() => setDragging(false)}
            onPointerMove={(event) => {
                if (dragging) {
                    const parentRect = (
                        event.currentTarget as HTMLDivElement
                    ).getBoundingClientRect();
                    const newPosition: vec2 = [
                        event.clientX - parentRect.left,
                        event.clientY - parentRect.top,
                    ];
                    console.log("move");
                    striker.change.move({newPosition});
                }
                event.stopPropagation();
            }}
        >
            <ScoreView score={game.scores[0]} position={[game.fieldSize[0] / 2, game.fieldSize[1] / 6]}/>
            <ScoreView score={game.scores[1]} position={[game.fieldSize[0] / 2, 5 * game.fieldSize[1] / 6]}/>
            <PuckView puck={game.puck}/>
            {game.strikers.map((striker, idx) => <StrikerView striker={striker} key={idx} onStartDrag={() => setDragging(true)} dragging={dragging}/>)}
        </div>
    );
};

function PuckView(props: {puck: Puck}) {
    const puck = useModelState(props.puck);

    return <div
        style={{
            position: 'absolute',
            left: puck.position[0] - puck.radius,
            top: puck.position[1] - puck.radius,
            width: puck.radius * 2,
            height: puck.radius * 2,
            borderRadius: puck.radius,
            backgroundColor: '#000000',
        }}
    />
}

function StrikerView(props: {striker: Striker, onStartDrag: () => void, dragging: boolean}) {
    const striker = useModelState(props.striker);

    return (
        <div
            style={{
                position: 'absolute',
                left: striker.position[0] - striker.radius,
                top: striker.position[1] - striker.radius,
                width: striker.radius * 2,
                height: striker.radius * 2,
                borderRadius: striker.radius,
                backgroundColor: '#888888',
                cursor: props.dragging ? 'grabbing' : 'grab'
            }}
            onPointerDown={(event) => {
                event.preventDefault();
                props.onStartDrag();
            }}
        ></div>
    );
}

function ScoreView({score, position}: {score: number, position: vec2}) {
    return (
        <h1
            style={{
                position: 'absolute',
                fontSize: '3em',
                left: `calc(${position[0]}px - 0.5em)`,
                top: `calc(${position[1]}px - 0.5em)`,
                margin: 0,
                width: '1em',
                height: '1em',
                textAlign: 'center',
                fontFamily: 'sans-serif',
                color: '#bbbbbb',
                pointerEvents: 'none'
            }}
        >
            {score}
        </h1>
    );
}

ReactDOM.render(<App />, document.getElementById('app'));
