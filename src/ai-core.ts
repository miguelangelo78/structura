import { ChatCompletionRequestMessage, Configuration, OpenAIApi } from 'openai';

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

    private rewindContext(steps = 1) {
        this.setContext(this.context.slice(0, -steps));
    }

    public getContext(): string[] {
        return this.context;
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
        prompt = this.handleRewindCommand(prompt);

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
            this.addContext(`Previous user prompt: ${prompt}`);
            this.addContext(result);
        }

        return result;
    }

    // Rewind command overrules everything else that precedes it.
    // <<< is the command for rewinding the context by one step.
    private handleRewindCommand(prompt: string): string {
        prompt = prompt.trim();

        // If there are more <<< after each other keep rewinding by one more step.
        while (prompt.startsWith('<<<')) {
            if (this.context.length <= 3) {
                // If there are no more steps to rewind, just return the prompt as is.

                if (this.context.length === 3) {
                    // Remove the last element from the context and keep just the language specification and the initial prompt:
                    this.context.pop();
                }

                while (prompt.startsWith('<<<')) {
                    prompt = prompt.slice(3).trim();
                }

                return prompt;
            }

            // Remove the first 3 characters from prompt
            prompt = prompt.slice(3).trim(); // Remove <<< from prompt

            this.log('Rewinding context by one step...');
            this.rewindContext(2); // Each step consists of two elements: the user prompt and the AI response.
        }

        return prompt;
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

    protected log(...args: any[]) {
        if (process.env.VERBOSE === 'true') {
            console.log(...args);
        }
    }
}
