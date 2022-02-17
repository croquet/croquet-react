import React, { useEffect, useMemo } from 'react';
import ReactDOM from 'react-dom';
import {
    InCroquetSession,
    useModelRoot,
    usePublish,
    useWatchModel,
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
        track,
        offset16th,
        on,
    }: {
        track: number;
        offset16th: number;
        on: boolean;
    }) {
        if (!this.tracks[track]) {
            this.tracks[track] = [];
        }
        this.tracks[track][offset16th] = on;
    }
}

SequenceModel.register('SequenceModel');

const App = function () {
    return (
        <InCroquetSession
            model={SequenceModel}
            apiKey="1_9oolgb5b5wc5kju39lx8brrrhm82log9xvdn34uq"
            appId="io.croquet.react-drumloop"
            name="react-drumloop"
            password="secret"
        >
            <CounterView />
        </InCroquetSession>
    );
};

const offsets16ths = Array.from({ length: 4 * 4 }, (x, i) => i);

const CounterView = function () {
    const sequence = useWatchModel(useModelRoot<SequenceModel>());
    const setNote = usePublish(
        (track: number, offset16th: number, on: boolean) => [
            sequence.id,
            'setNote',
            { track, offset16th, on },
        ],
    );

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
                                setNote(
                                    trackIdx,
                                    offset16th,
                                    !track[offset16th],
                                )
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