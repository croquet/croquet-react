import React from 'react';
import ReactDOM from 'react-dom';
import {
    InCroquetSession,
    useModelRoot,
    useViewId,
    useModelState,
} from '@croquet/react';
import { Model } from '@croquet/croquet';

class PollModel extends Model {
    prompt?: string;
    options?: string[];
    created?: boolean;
    votes?: { [voter: string]: number };

    init() {
        this.subscribe(this.id, 'setPrompt', this.setPrompt);
        this.subscribe(this.id, 'addOption', this.addOption);
        this.subscribe(this.id, 'setOption', this.setOption);
        this.subscribe(this.id, 'create', this.create);
        this.subscribe(this.id, 'vote', this.vote);
    }

    setPrompt({ prompt }: { prompt: string }) {
        this.prompt = prompt;
    }

    addOption() {
        if (!this.options) this.options = [];
        this.options.push('');
    }

    setOption({ optionIdx, value }: { optionIdx: number; value: string }) {
        if (!this.options) this.options = [];
        this.options[optionIdx] = value;
    }

    create() {
        this.created = true;
    }

    vote({ clientId, optionIdx }: { clientId: string; optionIdx: number }) {
        if (!this.votes) this.votes = {};
        this.votes[clientId] = optionIdx;
    }
}

PollModel.register('PollModel');

const App = function () {
    return (
        <InCroquetSession
            model={PollModel}
            apiKey="1_9oolgb5b5wc5kju39lx8brrrhm82log9xvdn34uq"
            appId="io.croquet.react-example-poll"
        >
            <PollView />
        </InCroquetSession>
    );
};

const PollView = function () {
    const poll = useModelState(useModelRoot<PollModel>());
    const clientId = useViewId();

    return poll.created ? (
        <div>
            <h1>{poll.prompt}</h1>
            <ol>
                {poll.options?.map((option, optionIdx) => (
                    <li key={optionIdx}>
                        {option}{' '}
                        {poll.votes?.[clientId] === undefined ? (
                            <button onClick={() => poll.change.vote({clientId, optionIdx})}>Vote</button>
                        ) : (
                            Object.values(poll.votes).filter(
                                (vote) => vote === optionIdx,
                            ).length
                        )}
                    </li>
                ))}
            </ol>
        </div>
    ) : (
        <div>
            Prompt:
            <input
                type="text"
                value={poll.prompt}
                onChange={(event) => poll.change.setPrompt({prompt: event.target.value})}
            />
            <ol>
                {poll.options?.map((option, optionIdx) => (
                    <li key={optionIdx}>
                        <input
                            type="text"
                            value={option}
                            onChange={(event) =>
                                poll.change.setOption({optionIdx, value: event.target.value})
                            }
                        />
                    </li>
                ))}
            </ol>
            <button onClick={() => poll.change.addOption()}>Add Option</button>
            <button onClick={() => poll.change.create()}>Create Poll</button>
        </div>
    );
};

ReactDOM.render(<App />, document.getElementById('app'));
