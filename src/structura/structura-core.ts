import { AICore } from '../ai-core';
import { theStructuraLanguage } from './language-definition';

export class Structura extends AICore {
    constructor() {
        super(theStructuraLanguage);
    }

    async execute(program: string): Promise<string> {
        const sanitised = this.sanitise(program);
        const wrappedMessage = `Please execute the following program and print only on the keyword !END!:\n${sanitised}\n!END!`;

        return this.talk(wrappedMessage, false);
    }

    private sanitise(program: string) {
        let sanitised = program.replace(/^\/\/[^\n\r]+(?:[\n\r]|\*\))$/gi, ''); // Remove single line comments
        sanitised = sanitised.replace(/(\/\*)(.|\n)*(\*\/)/gm, ''); // Remove multi-line comments
        sanitised = sanitised.trim(); // Remove leading and trailing whitespace

        // Add more as needed here

        return sanitised;
    }
}
