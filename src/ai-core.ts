import { ChatCompletionRequestMessage, Configuration, OpenAIApi } from 'openai';
import * as libs from '../libs';

const MAX_TOKEN_LENGTH = 8192;

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
        const messages: ChatCompletionRequestMessage[] = [{ role: 'system', content: prompt }];

        if (this.context) {
            messages.unshift(...this.context.map((content) => ({ role: 'system', content } as ChatCompletionRequestMessage)));
        }

        this.tokenLength = messages.reduce((acc, message) => acc + message.content.length, 0);

        if (this.tokenLength > MAX_TOKEN_LENGTH) {
            console.info(`>>>>> Reached maximum token length! Max: ${MAX_TOKEN_LENGTH}, current: ${this.tokenLength} <<<<<`);
        }

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
            prompt = `${prompt}\nRe-run the program (and don't mention it) but replace the previous CALL command with the following:${commandOutput}`;
            return this.talk(prompt, false);
        }

        return result;
    }

    private checkAndExecuteCommand(aiOutput: string): string | undefined {
        // Check if the AI has outputted an external Structura command
        // Syntax: CALL $.myFunction WITH arg1, arg2, ...
        const structuraCommand = [...aiOutput.trim().matchAll(/CALL(?:.|\n)+?\$\.(\w+)(?:.|\n)+?WITH(?:.|\n)+?(.+?)$/gi)];

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

    private log(...args: any[]) {
        if (process.env.VERBOSE === 'true') {
            console.log(...args);
        }
    }
}
