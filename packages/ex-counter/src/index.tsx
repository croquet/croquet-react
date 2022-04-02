import React from 'react';
import ReactDOM from 'react-dom';
import { InCroquetSession, useModelRoot, usePublish, useWatchModel } from '@croquet/react';
import { Model, App as CroquetApp } from '@croquet/croquet';

class CounterModel extends Model {
    count!: number;

    init() {
        this.count = 0;
        this.subscribe(this.id, 'reset', this.resetCounter);
        this.future(1000).tick();
    }

    resetCounter() {
        this.count = 0;
    }

    tick() {
        this.count++;
        this.future(1000).tick();
    }
}

CounterModel.register("CounterModel");

const App = function () {
    return (
        <InCroquetSession
            model={CounterModel}
            apiKey="1_9oolgb5b5wc5kju39lx8brrrhm82log9xvdn34uq"
            appId="io.croquet.react-example-counter"
        >
            <CounterView/>
        </InCroquetSession>
    );
};

const CounterView = function () {
    const counter = useWatchModel(useModelRoot<CounterModel>());
    const reset = usePublish(() =>
        [counter.id, 'reset']
    )

    return <div onClick={reset}>Count: {counter.count}</div>
}

ReactDOM.render(<App />, document.getElementById('app'));
