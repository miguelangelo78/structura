import { AICore } from '../ai-core';
import { theStructuraLanguage } from './language-definition';
import * as libs from '../../libs';

const REGEX_COMMAND = /CALL (?:.|\n)*?\$\.(\w+)(?:.|\n)+?WITH(?:.|\n)+?(.+?)(?:\n|$)/gi;

export class Structura extends AICore {
    constructor() {
        super(theStructuraLanguage);
    }

    async execute(program: string, isInteractive = false): Promise<string> {
        const sanitised = this.sanitise(program);

        const response = await this.talk(sanitised, isInteractive);

        const commandOutput = await this.checkAndExecuteCommand(response);

        if (commandOutput) {
            let _program = program;

            if (isInteractive) {
                // In interactive mode we must provide the original program as context instead of the user input.

                // Get the initial context (the one after the language definition) which contains the original program
                _program = super.getContext()[1].content ?? '';
            }

            // Re-run the AI with the command output in the program
            const updatedStructuraProgram = this.mutateStructuraProgram(_program, commandOutput);

            return this.execute(updatedStructuraProgram, false);
        }

        return response;
    }

    private async checkAndExecuteCommand(aiOutput: string): Promise<string | undefined> {
        if (process.env.DISABLE_LEGACY_FUNCTION_CALLING === 'true') {
            return;
        }

        const sanitised = this.sanitiseAIOutputForExecution(aiOutput);

        // Check if the AI has outputted an external Structura command
        // Syntax: CALL $.myFunction WITH arg1, arg2, ...
        const structuraCommand = [...sanitised.trim().matchAll(REGEX_COMMAND)];

        if (structuraCommand.length) {
            this.log('>>>>> Detected Structura command! <<<<<');

            for (const match of structuraCommand) {
                const { 1: command, 2: args } = match;

                const argsList = args.split(',').map(this.sanitiseArgument);

                this.log('>>>>> Command:', command);
                this.log('>>>>> Args:', argsList);

                const lib = libs as any;

                if (lib[command as string] === undefined) {
                    throw new Error(`Command ${command} (args: ${argsList}) is not defined!`);
                }

                this.log('>>>>> Executing command... <<<<<');

                return await lib[command as any](...argsList);
            }
        }
    }

    private sanitiseArgument(arg: string): string {
        let _arg = arg.trim();

        if (_arg.startsWith('"') && _arg.endsWith('"')) {
            _arg = _arg.slice(1, -1);
        }

        return _arg;
    }

    private sanitiseAIOutputForExecution(aiOutput: string): string {
        let sanitised = aiOutput;

        // Check if the AI has echoed multiple CALL commands. If so, execute only the first one.
        if ((sanitised.match(/CALL /gi)?.length ?? 0) > 1) {
            if (!sanitised.includes('\n')) {
                throw new Error('AI output contains multiple CALL commands but no newline!');
            }

            // Remove any non CALL commands
            sanitised = sanitised.split('\n').filter((line) => line.includes('CALL '))[0] || '';
        }

        return sanitised;
    }

    private mutateStructuraProgram(prompt: string, commandOutput: string): string {
        const callCommands = prompt.match(REGEX_COMMAND) ?? [];

        // Replace the first CALL command with the given command output
        if (callCommands.length > 0 && callCommands[0]) {
            return prompt.replace(callCommands[0], commandOutput);
        }

        throw new Error('Could not mutate Structura program! A command output was produced but no CALL command was found in the prompt!');
    }

    private sanitise(program: string) {
        let sanitised = program.replace(/^\/\/[^\n\r]+(?:[\n\r]|\*\))$/gi, ''); // Remove single line comments
        sanitised = sanitised.replace(/(\/\*)(.|\n)*(\*\/)/gm, ''); // Remove multi-line comments
        sanitised = sanitised.trim(); // Remove leading and trailing whitespace

        // Add more as needed here

        return sanitised;
    }
}
