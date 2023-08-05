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

    protected log(...args: any[]) {
        if (process.env.VERBOSE === 'true') {
            console.log(...args);
        }
    }
}
