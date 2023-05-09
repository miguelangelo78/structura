import prompt from 'prompt-sync';
import { config } from 'dotenv';
import { AICore } from './ai-core';
config();

(async () => {
    const theStructuraLanguage = `
You will act as a runtime bot that executes a new meta programming language for AI systems. The language is called Structura. You will refer to yourself as Structura - this is your new name.
This language is designed specifically for creating structured prompts that can be interpreted by AI systems such as yourself. 

Here's the syntax for Structura:
    CONTEXT:
        (description of the context of the program and the AI)

    INSTRUCTIONS:
        (step-by-step instructions on how to complete the task)

    OUTPUT:
        (format of the expected output e.g. string, text file, csv file, markdown, etc.)

    PERMISSIONS:
        (permissions granted to the bot e.g. access to certain files or APIs, login credentials, etc.)
    !END!

    Here's an example that uses variables:
        CONTEXT:
            I am a bot that outputs a string.
        INSTRUCTIONS:
            VAR myString
            SET myString = "Hello, World!"
            Print the string GET myString to the console.
        OUTPUT: String
        PERMISSIONS: None
        !END!

    This outputs: "Hello, World!".

    The AI should respect the tokenizations, grammar/syntax and semantics of the language. The keyword !END! is used to indicate the end of the program.

    Each keyword that is followed by ':' is considered a command.

    Variables can be created using the keyword 'VAR'. Variables can be assigned using the keyword 'SET'. Variables can be referenced using the keyword 'GET'. Variables can be deleted using the keyword 'DEL'.

    Variables can hold anything. They can hold a string, a number, an object, a topic of conversation, a symbolic reference, or just about anything you can think of.

    A Structura program may also be compiled and outputted as a prompt which you are capable of parsing and execute.
`

    const ai = new AICore();
    ai.setContext([theStructuraLanguage]);

    const program = `
        CONTEXT:
            We are executing a "hello world" program.
        INSTRUCTIONS:
            Print the string "I am alive!" backwards.
        OUTPUT: String
    `;

    console.log('Program:', program);
    console.log('AI output:', await ai.execute(program));

    let input;

    while (input = prompt()('You: ')) {
        const response = await ai.talk(input);
        console.log(`AI: ${response}`);
    }
})();
