import React, { useLayoutEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import {
    InCroquetSession,
    useModelRoot,
    usePublish,
    useViewId,
    useWatchModel,
} from '@croquet/react';
import { Model } from '@croquet/croquet';
import randomcolor from 'randomcolor';

type PositionInElem = { elemPath: string; xRatio: number; yRatio: number };

class CursorModel extends Model {
    cursors!: { [viewId: string]: { name: string; position?: PositionInElem } };

    init() {
        this.cursors = {};
        this.subscribe(this.id, 'moveCursor', this.moveCursor);
    }

    moveCursor({
        viewId,
        name,
        position,
    }: {
        viewId: string;
        name: string;
        position?: PositionInElem;
    }) {
        this.cursors[viewId] = { name, position };
    }
}

CursorModel.register('CounterModel');

function useMultiplayerHoverable<E extends HTMLElement>(
    cursorModel: CursorModel,
) {
    const elem = useRef<E | null>(null);
    const [elemPath, setElemPath] = useState('');
    const viewId = useViewId();

    const moveCursor = usePublish((xRatio: number, yRatio: number) => [
        cursorModel.id,
        'moveCursor',
        { viewId, name: viewId, position: { elemPath, xRatio, yRatio } },
    ]);

    useLayoutEffect(() => {
        if (!elem.current) return;
        let el = elem.current as HTMLElement;

        const path = [];

        while (el.parentElement) {
            const name =
                el.getAttribute('data-cursor-key') ||
                el.id ||
                Array.from(el.parentElement.children).indexOf(el);
            path.unshift(name);
            el = el.parentElement;
        }

        setElemPath(path.join('/'));
    }, [elem.current]);

    elem.current?.addEventListener('mousemove', (e: MouseEvent) => {
        const xRatio = e.offsetX / (e.target as HTMLElement).offsetWidth;
        const yRatio = e.offsetY / (e.target as HTMLElement).offsetHeight;
        console.log(elemPath, xRatio, yRatio);
        moveCursor(xRatio, yRatio);
    });

    return { ref: elem };
}

function WithCursors({
    cursors,
    children,
}: {
    cursors: CursorModel;
    children: React.ReactNode;
}) {
    const cursorsWatched = useWatchModel(cursors);
    const root = useRef<HTMLDivElement>(null);

    return (
        <div>
            {children}
            <div
                ref={root}
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    bottom: 0,
                    right: 0,
                    pointerEvents: 'none',
                }}
            >
                {Object.entries(cursorsWatched.cursors).map(
                    ([viewId, cursor]) => {
                        if (!cursor.position) return;

                        let targetElem = document.body;
                        const path = cursor.position.elemPath.split('/');

                        while (path.length > 0) {
                            targetElem =
                                document.getElementById(path[0]) ||
                                (targetElem.children[
                                    parseInt(path[0])
                                ] as HTMLElement);
                            path.shift();
                        }

                        if (!targetElem || !root.current) return;

                        const rootRect = root.current.getBoundingClientRect();
                        const rect = targetElem.getBoundingClientRect();
                        const x =
                            rect.left +
                            cursor.position.xRatio * rect.width -
                            rootRect.left;
                        const y =
                            rect.top +
                            cursor.position.yRatio * rect.height -
                            rootRect.top;

                        return (
                            <div
                                key={viewId}
                                style={{
                                    position: 'absolute',
                                    top: y,
                                    left: x,
                                    transition: 'top 0.1s, left 0.1s',
                                }}
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    x="0px"
                                    y="0px"
                                    width="15"
                                    height="15"
                                    viewBox="7 3 30 30"
                                    style={{ fill: randomcolor({seed: viewId}), stroke: "#000000 "}}
                                >
                                    {' '}
                                    <path d="M 9 3 A 1 1 0 0 0 8 4 L 8 21 A 1 1 0 0 0 9 22 A 1 1 0 0 0 9.796875 21.601562 L 12.919922 18.119141 L 16.382812 26.117188 C 16.701812 26.855187 17.566828 27.188469 18.298828 26.855469 C 19.020828 26.527469 19.340672 25.678078 19.013672 24.955078 L 15.439453 17.039062 L 21 17 A 1 1 0 0 0 22 16 A 1 1 0 0 0 21.628906 15.222656 L 9.7832031 3.3789062 A 1 1 0 0 0 9 3 z"></path>
                                </svg>
                                {cursor.name}
                            </div>
                        );
                    },
                )}
            </div>
        </div>
    );
}

const App = function () {
    return (
        <InCroquetSession
            model={CursorModel}
            apiKey="1_9oolgb5b5wc5kju39lx8brrrhm82log9xvdn34uq"
            appId="io.croquet.react-example-cursors"
        >
            <CursorView />
        </InCroquetSession>
    );
};

const CursorView = function () {
    const cursors = useModelRoot<CursorModel>();

    return (
        <WithCursors cursors={cursors}>
            <div
                style={{ width: 500, height: 300, backgroundColor: '#aaaaaa' }}
                {...useMultiplayerHoverable(cursors)}
            ></div>
        </WithCursors>
    );
};

ReactDOM.render(<App />, document.getElementById('app'));
