import React, { useEffect, useMemo } from 'react';
import ReactDOM from 'react-dom';
import {
    InCroquetSession,
    useModelRoot,
    useModelState,
} from '@croquet/react';
import { Model } from '@croquet/croquet';
import * as Tone from 'tone';

class SequenceModel extends Model {
    tracks!: boolean[][];

    init() {
        this.tracks = [[], [], [], []];
        this.subscribe(this.id, 'setNote', this.setNote);
    }

    setNote({
        trackIdx,
        offset16th,
        on,
    }: {
        trackIdx: number;
        offset16th: number;
        on: boolean;
    }) {
        if (!this.tracks[trackIdx]) {
            this.tracks[trackIdx] = [];
        }
        this.tracks[trackIdx][offset16th] = on;
    }
}

SequenceModel.register('SequenceModel');

const App = function () {
    return (
        <InCroquetSession
            model={SequenceModel}
            apiKey="1_9oolgb5b5wc5kju39lx8brrrhm82log9xvdn34uq"
            appId="io.croquet.react-example-drumloop"
        >
            <CounterView />
        </InCroquetSession>
    );
};

const offsets16ths = Array.from({ length: 4 * 4 }, (x, i) => i);

const CounterView = function () {
    const sequence = useModelState(useModelRoot<SequenceModel>());

    const sampler = useMemo(
        () =>
            new Tone.Sampler({
                urls: {
                    C1: 'bd1000.wav',
                },
                baseUrl: '',
            }),
        [],
    );

    useEffect(() => {
        const loop = new Tone.Loop((t) => {
            sampler.triggerAttackRelease('C1', '8n');
        }, '16n');

        loop.start(0);

        return () => {
            loop.stop();
        };
    }, [sequence.tracks[0]]);

    return (
        <div>
            <div style={{ display: 'flex' }}>
                {offsets16ths.map((offset16th) => (
                    <div
                        key={offset16th}
                        style={{ width: '2em', textAlign: 'center' }}
                    >
                        {offset16th % 4 === 0 ? offset16th / 4 + 1 : ''}
                    </div>
                ))}
            </div>
            {sequence.tracks.map((track, trackIdx) => (
                <div key={trackIdx} style={{ display: 'flex' }}>
                    {offsets16ths.map((offset16th) => (
                        <div
                            key={offset16th}
                            onClick={() =>
                                sequence.change.setNote({
                                    trackIdx,
                                    offset16th,
                                    on: !track[offset16th],
                                })
                            }
                            style={{
                                width: '2em',
                                cursor: 'pointer',
                                textAlign: 'center',
                            }}
                        >
                            {track[offset16th] ? 'X' : '.'}
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
};

ReactDOM.render(<App />, document.getElementById('app'));
