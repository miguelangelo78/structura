import { Structura } from '../src/structura/structura-core';
import { readFileSync } from 'fs';
import { config } from 'dotenv';

config();

(async () => {
    const program = readFileSync('./examples/generate-new-program.struc', 'utf8');

    const structura = new Structura();
    console.log(await structura.execute(program));
})();
