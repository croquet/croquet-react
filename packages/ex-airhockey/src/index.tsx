import React from 'react';
import ReactDOM from 'react-dom';
import {
    InCroquetSession,
    useModelRoot,
    usePublish,
    useWatchModel,
} from '@croquet/react';
import { Model } from '@croquet/croquet';
import { vec2 } from 'gl-matrix';

class AirhockeyModel extends Model {
    fieldSize!: vec2;
    puckRadius!: number;
    strikerRadius!: number;
    puckMass!: number;
    strikerMass!: number;

    puckPosition!: vec2;
    puckVelocity!: vec2;
    strikerPositions!: vec2[];
    lastStrikerPositions!: vec2[];
    scores!: number[];

    init() {
        this.fieldSize = [300, 600];
        this.puckRadius = 5;
        this.strikerRadius = 10;
        this.puckMass = 0.05;
        this.strikerMass = 0.2;

        this.puckPosition = [this.fieldSize[0] / 2, this.fieldSize[1] / 2];
        this.puckVelocity = [0, 0];
        this.strikerPositions = [
            [this.fieldSize[0] / 2, this.fieldSize[1] / 4],
            [this.fieldSize[0] / 2, (3 * this.fieldSize[1]) / 4],
        ];
        this.lastStrikerPositions = [
            vec2.copy([0, 0], this.strikerPositions[0]), // vec2.clone(this.strikerPositions[0]),
            vec2.copy([0, 0], this.strikerPositions[1]), // vec2.clone(this.strikerPositions[1]),
        ];

        this.subscribe(this.id, 'moveStriker', this.moveStriker);
        this.future(500).physicsTick();
    }

    moveStriker({
        strikerIdx,
        newPosition,
    }: {
        strikerIdx: number;
        newPosition: vec2;
    }) {
        vec2.copy(this.strikerPositions[strikerIdx], newPosition);
        // if (
        //     strikerIdx === 0 &&
        //     this.strikerPositions[strikerIdx][1] > this.fieldSize[1] / 2
        // ) {
        //     this.strikerPositions[strikerIdx][1] = this.fieldSize[1] / 2;
        // }
    }

    physicsTick() {
        vec2.add(this.puckPosition, this.puckPosition, this.puckVelocity);

        this.strikerPositions.forEach((strikerPosition, idx) => {
            const lastStrikerPosition = this.lastStrikerPositions[idx];
            const effectiveStrikerVelocity = vec2.subtract(
                [0, 0], //vec2.create(),
                strikerPosition,
                lastStrikerPosition,
            );

            if (
                vec2.distance(this.puckPosition, strikerPosition) <
                this.puckRadius + this.strikerRadius
            ) {
                // https://en.wikipedia.org/wiki/Elastic_collision#Two-dimensional_collision_with_two_moving_objects
                const positionDifference = vec2.subtract(
                    [0, 0], //vec2.create(),
                    this.puckPosition,
                    strikerPosition,
                );
                const velocityDifference = vec2.subtract(
                    [0, 0], //vec2.create(),
                    this.puckVelocity,
                    effectiveStrikerVelocity,
                );

                const massRatio =
                    (2 * this.strikerMass) / (this.strikerMass + this.puckMass);
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
                    this.puckVelocity,
                    this.puckVelocity,
                    velocityChange,
                );

                // move puck out of striker
                vec2.add(
                    this.puckPosition,
                    this.puckPosition,
                    vec2.scale(
                        [0, 0],
                        positionDifference,
                        1.1 * (this.puckRadius + this.strikerRadius) /
                        vec2.length(positionDifference),
                    ),
                );
            }

            vec2.copy(this.lastStrikerPositions[idx], strikerPosition);
        });

        this.future(60).physicsTick();
    }
}

AirhockeyModel.register('AirhockeyModel');

const App = function () {
    return (
        <InCroquetSession
            model={AirhockeyModel}
            apiKey="1_9oolgb5b5wc5kju39lx8brrrhm82log9xvdn34uq"
            appId="io.croquet.react-example-airhockey"
        >
            <AirHockeyView />
        </InCroquetSession>
    );
};

const AirHockeyView = function () {
    const game = useWatchModel(useModelRoot<AirhockeyModel>());
    const moveStriker = usePublish((newPosition: vec2) => [
        game.id,
        'moveStriker',
        { strikerIdx: 0, newPosition },
    ]);

    return (
        <div
            style={{
                width: game.fieldSize[0],
                height: game.fieldSize[1],
                backgroundColor: '#dddddd',
                position: 'relative',
            }}
            onMouseMove={(event) => {
                const parentRect = (
                    event.currentTarget as HTMLDivElement
                ).getBoundingClientRect();
                const newPosition = [
                    event.clientX - parentRect.left,
                    event.clientY - parentRect.top,
                ];
                console.log(event.clientX, event.clientY);
                console.log(newPosition);

                moveStriker(newPosition);
                event.stopPropagation();
            }}
        >
            <div
                style={{
                    position: 'absolute',
                    left: game.puckPosition[0] - game.puckRadius,
                    top: game.puckPosition[1] - game.puckRadius,
                    width: game.puckRadius * 2,
                    height: game.puckRadius * 2,
                    borderRadius: game.puckRadius,
                    backgroundColor: '#000000',
                }}
            />
            {game.strikerPositions.map((strikerPosition, idx) => (
                <div
                    key={idx}
                    style={{
                        position: 'absolute',
                        left: strikerPosition[0] - game.strikerRadius,
                        top: strikerPosition[1] - game.strikerRadius,
                        width: game.strikerRadius * 2,
                        height: game.strikerRadius * 2,
                        borderRadius: game.strikerRadius,
                        backgroundColor: '#888888',
                    }}
                ></div>
            ))}
        </div>
    );
};

ReactDOM.render(<App />, document.getElementById('app'));
