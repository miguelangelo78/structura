import { ChatCompletionRequestMessage, ChatCompletionRequestMessageFunctionCall, Configuration, OpenAIApi } from 'openai';
import * as libs from '../libs';

const DEFAULT_MAX_TOKEN_LENGTH = 8192;

const aiFunctions = [
    {
        name: 'execute_external_function',
        description: 'Execute external function',
        parameters: {
            name: 'function_name',
            type: 'object',
            properties: {
                functionName: {
                    type: 'string',
                },
                args: {
                    type: 'array',
                    items: {
                        type: 'string',
                    }
                }
            }
        }
    }
];

export class AICore {
    public tokenLength = 0;

    private openai: OpenAIApi;
    private context: ChatCompletionRequestMessage[] = [];
    private model = process.env.AI_CORE_MODEL || 'gpt-4';

    private setContext(context: ChatCompletionRequestMessage[]) {
        this.context = context;
    }

    private addContext(context: ChatCompletionRequestMessage) {
        this.context.push(context);
    }

    private rewindContext(steps = 1) {
        // Each step consists of two elements: the user prompt and the AI response.
        // This means that we need to multiply the steps by 2 to get the correct number of elements to remove.
        this.setContext(this.context.slice(0, -(steps * 2)));
    }

    public getContext(): ChatCompletionRequestMessage[] {
        return this.context;
    }

    constructor(initialContext?: string) {
        this.openai = new OpenAIApi(new Configuration({
            apiKey: process.env.OPENAI_API_KEY,
        }));

        if (initialContext) {
            this.log(`Initial context is currently ${initialContext.length} characters long.`);
            this.setContext([{ role: 'system', content: initialContext }]);
        }
    }

    async talk(prompt?: string, assimilate = true): Promise<string> {
        prompt = this.handleRewindCommand(prompt ?? '');

        const messages = this.getMessages(prompt);

        this.updateTokenLength(messages);

        let result: string | undefined;

        try {
            const response = await this.openai.createChatCompletion({
                model: this.model,
                messages,
                temperature: +(process.env.AI_CORE_TEMPERATURE || 0),
                frequency_penalty: +(process.env.AI_CORE_FREQUENCY_PENALTY || 0.1),
                presence_penalty: +(process.env.AI_CORE_PRESENCE_PENALTY || 0.6),
                functions: aiFunctions,
                function_call: 'auto'
            });

            const [{ message }] = response.data.choices;

            result = message?.content || '';

            if (assimilate) {
                this.assimilate(prompt, result);
            }

            // Check if the AI has outputted an external function call or a regular response:
            if (message?.function_call?.name === 'execute_external_function') {
                // Handle function calling down here:
                const { functionName, functionOutput } = await this.executeFunction(message.function_call);

                // Add the function name and output to the context so that it can be used in the next prompt.
                this.addContext({ role: 'function', name: functionName, content: functionOutput });

                return this.talk('Keep executing the Structura program', false);
            }
        }
        catch (error) {
            console.error(error);
        }

        if (!result) {
            throw new Error('AI returned an empty response!');
        }

        return result;
    }

    private assimilate(prompt: string, result: string): string {
        if (prompt.trim()) {
            this.addContext({ role: 'system', content: `Previous user prompt: ${prompt}` });
        }

        if (result.trim()) {
            this.addContext({ role: 'system', content: `AI response: ${result}` });
        }

        return result;
    }

    private async executeFunction(function_call: ChatCompletionRequestMessageFunctionCall): Promise<{ functionName: string, functionOutput: string }> {
        const { functionName, args } = JSON.parse(function_call.arguments ?? '{}');

        if (!functionName || !args) {
            throw new Error('Function name is required!');
        }

        const lib = libs as any;

        if (lib[functionName] === undefined) {
            throw new Error(`Function ${functionName} (args: ${args}) is not defined!`);
        }

        this.log(`>>>>> Executing function ${functionName}(${args.join(', ')}... <<<<<`);

        const functionOutput = await lib[functionName as any](...args);

        this.log(`>>>>> Function ${functionName}(${args.join(', ')}) returned: ${functionOutput} <<<<<`);

        return { functionName, functionOutput };
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

                // Consume any remaining <<< commands:
                while (prompt.startsWith('<<<')) {
                    prompt = prompt.slice(3).trim();
                }

                return prompt;
            }

            // Remove the first 3 characters from prompt
            prompt = prompt.slice(3).trim(); // Remove one <<< from prompt

            this.log('Rewinding context by one step...');
            this.rewindContext(1);
        }

        return prompt;
    }

    private getMessages(prompt: string): ChatCompletionRequestMessage[] {
        const messages: ChatCompletionRequestMessage[] = !prompt ? [] : [{ role: 'system', content: prompt }];

        // Prepend the context to the prompt:
        if (this.context) {
            messages.unshift(...this.context);
        }

        return messages;
    }

    private updateTokenLength(messages: ChatCompletionRequestMessage[]) {
        this.tokenLength = messages.reduce((acc, message) => acc + (message.content?.length ?? 0), 0);

        this.log(`>>>> Token length is currently ${this.tokenLength} characters long.`)

        if (this.tokenLength > DEFAULT_MAX_TOKEN_LENGTH) {
            console.warn(`>>>>> Reached maximum token length! Max: ${DEFAULT_MAX_TOKEN_LENGTH}, current: ${this.tokenLength} <<<<<`);
        }
    }

    protected log(...args: any[]) {
        if (process.env.VERBOSE === 'true') {
            console.log(...args);
        }
    }
}
