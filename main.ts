import prompt from 'prompt-sync';
import { config } from 'dotenv';
import { Structura } from './src/structura/structura-core';

config();

(async () => {
    const structura = new Structura();

    const program = `
        CONTEXT:
            We are executing a "hello world" program.
        INSTRUCTIONS:
            Print the string "I am alive!" five times in all caps and put a space between each letter.
        OUTPUT: String
    `;

    /**
     * This program should output:
     * I A M  A L I V E !   I A M  A L I V E !   I A M  A L I V E !   I A M  A L I V E !   I A M  A L I V E !
     */

    if (process.env.VERBOSE === 'true') {
        console.log('> Program:', program);
        console.log('> AI output:', await structura.execute(program));
        console.log('> Token length:', structura.tokenLength);
    } else {
        console.log(await structura.execute(program));
    }

    let input;

    const interactiveFlag = process.argv[2];

    if (interactiveFlag === '--interactive' || interactiveFlag === '-i') {
        while (input = prompt()('> You: ')) {
            const response = await structura.talk(input);
            console.log('> Token length:', structura.tokenLength);
            console.log(`> AI: ${response}`);
        }
    }
})();
