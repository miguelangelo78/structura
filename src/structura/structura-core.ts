import { AICore } from '../ai-core';
import { theStructuraLanguage } from './language-definition';

export class Structura extends AICore {
    constructor() {
        super(theStructuraLanguage);
    }

    async execute(program: string, isInteractive = false): Promise<string> {
        const sanitised = this.sanitiseProgram(program);

        return this.talk(sanitised, isInteractive);
    }

    private sanitiseProgram(program: string) {
        let sanitised = program.replace(/^\/\/[^\n\r]+(?:[\n\r]|\*\))$/gi, ''); // Remove single line comments
        sanitised = sanitised.replace(/(\/\*)(.|\n)*(\*\/)/gm, ''); // Remove multi-line comments
        sanitised = sanitised.trim(); // Remove leading and trailing whitespace

        // Add more as needed here

        return sanitised;
    }
}
