import { Structura } from '../src/structura/structura-core';
import { readFileSync } from 'fs';
import { config } from 'dotenv';

config();

(async () => {
    let filename = process.argv[2];

    if (!filename) {
        console.log('Please provide a filename.');
    }

    filename = !filename.endsWith('.struc') ? `${filename}.struc` : filename;

    const path = `./examples/${filename}`;
    const program = readFileSync(path, 'utf8');
    if (!program) {
        console.log(`Couldn\'t find program in ${path} .`);
        return;
    }

    const structura = new Structura();
    console.log(await structura.execute(program));
})();
