import prompt from 'prompt-sync';
import { config } from 'dotenv';
import { Structura } from './src/structura/structura-core';
import { readFileSync } from 'fs';

config();

async function main() {
    const {
        2: filename,
        3: interactiveFlag
    } = process.argv;

    const structura = new Structura();

    // This checks for an edge case where the user might have typed `npx ts-node main.ts -i`
    if (filename === '-i' || filename === '--interactive') {
        // Will fix this command line parsing later
        await interactiveMode();
        return;
    }

    if (!((filename || '').trim())) {
        throw new Error('No filename provided!');
    }

    const isInteractive = interactiveFlag === '--interactive' || interactiveFlag === '-i';

    const program = readFileSync(filename, 'utf-8');

    if (process.env.VERBOSE === 'true') {
        console.log('> Program:', program);
        console.log('> AI output:', await structura.execute(program));
        console.log('> Token length:', structura.tokenLength);
    } else {
        console.log(await structura.execute(program, isInteractive));
    }

    if (isInteractive) {
        await interactiveMode();
    }

    async function interactiveMode() {
        let input;
        let messageCounter = 1;

        while (input = prompt()(`${messageCounter++}> You: `)) {
            const response = await structura.talk(input);
            console.log('> AI:', response);
        }
    }
}

main().catch(console.error);
