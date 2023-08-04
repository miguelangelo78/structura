import { ChatCompletionRequestMessage, Configuration, OpenAIApi } from 'openai';

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

    async talk(prompt: string, assimilate = true) {
        const messages: ChatCompletionRequestMessage[] = [{ role: 'system', content: prompt }];

        if (this.context) {
            messages.unshift(...this.context.map((content) => ({ role: 'system', content } as ChatCompletionRequestMessage)));
        }

        this.tokenLength = messages.reduce((acc, message) => acc + message.content.length, 0);

        const response = await this.openai.createChatCompletion({
            model: this.model,
            messages,
            temperature: 0.12,
            frequency_penalty: 0.1,
            presence_penalty: 0.6,
        });

        const result = response.data.choices[0].message?.content || '';

        if (assimilate) {
            this.addContext(`Use your previous answer as context. Your previous response was:\n>${result}`);
        }

        return result;
    }
}
