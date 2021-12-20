import React from 'react';
import ReactDOM from 'react-dom';
import { InCroquetSession, useModelRoot, useWatchModel } from '@croquet/react';
import { Model } from '@croquet/croquet';

class CounterModel extends Model {
    count!: number;

    init() {
        this.count = 0;
        this.subscribe('counter', 'reset', this.resetCounter);
        this.future(1000).tick();
    }

    resetCounter() {
        this.count = 0;
        this.publish('counter', 'changed');
    }

    tick() {
        this.count++;
        this.publish('counter', 'changed');
        this.future(1000).tick();
    }
}

CounterModel.register("CounterModel");

const App = function () {
    return (
        <InCroquetSession
            model={CounterModel}
            apiKey="1_9oolgb5b5wc5kju39lx8brrrhm82log9xvdn34uq"
            appId="io.croquet.react-counter"
            name="react-counter"
            password="secret"
        >
            <CounterView/>
        </InCroquetSession>
    );
};

const CounterView = function () {
    const counter = useWatchModel(useModelRoot<CounterModel>());

    return <div>Count: {counter.count}</div>
}

ReactDOM.render(<App />, document.getElementById('app'));
