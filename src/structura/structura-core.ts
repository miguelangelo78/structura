import { AICore } from '../ai-core';
import { theStructuraLanguage } from './language-definition';

export class Structura extends AICore {
    constructor() {
        super(theStructuraLanguage);
    }

    async execute(program: string): Promise<string> {
        const wrappedMessage = `Please execute the following program and print only the output:\n${program}\nOUTPUT:`
        return this.talk(wrappedMessage, false);
    }
}
