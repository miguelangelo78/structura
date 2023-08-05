import { ChatCompletionRequestMessage, Configuration, OpenAIApi } from 'openai';
import * as libs from '../libs';

const MAX_TOKEN_LENGTH = 8192;

const REGEX_COMMAND = /CALL (?:.|\n)*?\$\.(\w+)(?:.|\n)+?WITH(?:.|\n)+?(.+?)(?:\n|$)/gi;

export class AICore {
    public tokenLength = 0;

    private openai: OpenAIApi;
    private context: string[] = [];
    private model = 'gpt-4-0314';

    private setContext(context: string[]) {
        this.context = context;
    }

    private addContext(context: string) {
        this.context.push(context);
    }

    constructor(initialContext?: string) {
        this.openai = new OpenAIApi(new Configuration({
            apiKey: process.env.OPENAI_API_KEY,
        }));

        if (initialContext) {
            this.setContext([initialContext]);
        }
    }

    async talk(prompt: string, assimilate = true): Promise<string> {
        const messages = this.buildMessages(prompt);

        this.updateTokenLength(messages);

        const response = await this.openai.createChatCompletion({
            model: this.model,
            messages,
            temperature: 0.12,
            frequency_penalty: 0.1,
            presence_penalty: 0.6,
        });

        const result = response.data.choices[0].message?.content || '';

        if (assimilate) {
            this.addContext(`This is the previous user prompt: ${prompt}`);
            this.addContext(`Use your previous response as context. Your previous response was:\n>${result}`);
        }

        const commandOutput = this.checkAndExecuteCommand(result);

        if (commandOutput) {
            // Re-run the AI with the command output in the prompt
            const updatedStructuraProgram = this.mutateStructuraProgram(prompt, commandOutput);

            return this.talk(updatedStructuraProgram, false);
        }

        return result;
    }

    private buildMessages(prompt: string): ChatCompletionRequestMessage[] {
        const messages: ChatCompletionRequestMessage[] = [{ role: 'system', content: prompt }];

        if (this.context) {
            messages.unshift(...this.context.map((content) => ({ role: 'system', content } as ChatCompletionRequestMessage)));
        }

        return messages;
    }

    private updateTokenLength(messages: ChatCompletionRequestMessage[]) {
        this.tokenLength = messages.reduce((acc, message) => acc + message.content.length, 0);

        if (this.tokenLength > MAX_TOKEN_LENGTH) {
            console.info(`>>>>> Reached maximum token length! Max: ${MAX_TOKEN_LENGTH}, current: ${this.tokenLength} <<<<<`);
        }
    }

    private checkAndExecuteCommand(aiOutput: string): string | undefined {
        const sanitised = this.sanitiseAIOutputForExecution(aiOutput);

        // Check if the AI has outputted an external Structura command
        // Syntax: CALL $.myFunction WITH arg1, arg2, ...
        const structuraCommand = [...sanitised.trim().matchAll(REGEX_COMMAND)];

        if (structuraCommand.length) {
            this.log('>>>>> Detected Structura command! <<<<<');

            for (const match of structuraCommand) {
                const { 1: command, 2: args } = match;

                const argsList = args.split(',').map((arg) => arg.trim());

                this.log('>>>>> Command:', command);
                this.log('>>>>> Args:', argsList);

                const lib = libs as any;

                if (lib[command as string] === undefined) {
                    throw new Error(`Command ${command} (args: ${argsList}) is not defined!`);
                }

                this.log('>>>>> Executing command... <<<<<');

                return lib[command as any](...argsList);
            }
        }
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

    private log(...args: any[]) {
        if (process.env.VERBOSE === 'true') {
            console.log(...args);
        }
    }
}
