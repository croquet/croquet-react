import React from 'react';
import ReactDOM from 'react-dom';
import { InCroquetSession, useModelRoot, useModelState } from '@croquet/react';
import { Model } from '@croquet/croquet';

class CounterModel extends Model {
    count!: number;

    init() {
        this.count = 0;
        this.subscribe(this.id, 'resetCounter', 'resetCounter');
        this.future(1000).tick();
    }

    resetCounter({to}: {to: number}) {
        this.count = to;
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
    const counter = useModelState(useModelRoot<CounterModel>());
    return <div onClick={() => counter.change.resetCounter({to: 42})}>Count: {counter.count}</div>
}

ReactDOM.render(<App />, document.getElementById('app'));
