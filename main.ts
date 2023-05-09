import prompt from 'prompt-sync';
import { config } from 'dotenv';
import { Structura } from './src/structura/structura-core';
import { readFileSync } from 'fs';

config();

(async () => {
    const {
        2: filename,
        3: interactiveFlag
    } = process.argv;

    if (filename === '-i' || filename === '--interactive') {
        // Will fix this command line parsing later
        await interactiveMode();
        return;
    }

    if (!((filename || '').trim())) {
        throw new Error('No filename provided!');
    }

    const program = readFileSync(filename, 'utf-8');

    const structura = new Structura();

    if (process.env.VERBOSE === 'true') {
        console.log('> Program:', program);
        console.log('> AI output:', await structura.execute(program));
        console.log('> Token length:', structura.tokenLength);
    } else {
        console.log(await structura.execute(program));
    }

    if (interactiveFlag === '--interactive' || interactiveFlag === '-i') {
        await interactiveMode();
    }

    async function interactiveMode() {
        let input;
        let messageCounter = 0;
        while (input = prompt()(`${messageCounter}> You: `)) {
            const response = structura.talk(input);
            console.log('> AI:', response);
        }
    }
})();
