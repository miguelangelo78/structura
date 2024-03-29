# Structura
A new meta programming language for AI systems

## What is Structura

Structura is an experimental meta programming language designed for creating structured prompts that can be interpreted by AI systems. With Structura, you can easily create programs that interact with AI systems, perform complex tasks, and manipulate structured data.

## Contents
- [Important note](#important-note)
- [Features](#features)
- [Getting Started](#getting-started)
- [Usage](#usage)
- [Examples](#examples)
- [Contributing](#contributing)
- [License](#license)


## Important note
Please bear in mind that Structura is just an experimental tool. It relies on existing AI models to produce the output. It is not intended to be used for any serious projects, and it is not recommended to use it for anything other than experimentation and learning purposes.

## Features

- Structured prompts: Structura provides a syntax that allows you to define the context, instructions, variables, and output format of a program, making it easy to express complex interactions with AI systems.
- Variable support: You can define and use variables to store and manipulate data within your programs.
- Permissions control: Structura allows you to define permissions for AI systems, specifying what actions they can perform.
- Error handling: The language supports error handling, allowing you to catch and handle errors gracefully.
- Interactivity: Structura supports an interactive mode that allows users to provide input and interact with the program during execution.
- Integration with AI systems: The language is designed to seamlessly integrate with AI systems like ChatGPT, allowing you to create AI-powered applications.

## Getting Started

To get started with Structura, you will need to have Node.js installed on your machine. You can download and install Node.js from the official website: [https://nodejs.org](https://nodejs.org)

Once you have Node.js installed, you can follow these steps to run Structura programs:

1. Clone the Structura repository to your local machine:

```bash
git clone https://github.com/miguelangelo78/structura.git
```

2. Navigate to the project directory:

```bash
cd structura
```

3. Install the required dependencies:

```bash
npm install
```


## Usage

To run a Structura program, you can use the following command:

```bash
npm start -- structuraProgram.struc [-i | --interactive]
```

- `structuraProgram.struc` should be replaced with the path to your Structura program file.
- The `-i` or `--interactive` flag is optional and enables interactive mode, allowing user input during program execution.

You can also run Structura without a program file in REPL mode:

```bash
npm start -- -i
```
Or
```bash
npm start -- --interactive
```

You can then run Structura commands directly in the terminal. Try typing:
```bash
CALL helloWorld 40, 2
```


## Examples

In the `examples/` directory, you will find several example Structura programs that demonstrate different features and use cases of the language. You can explore these examples to get a better understanding of how to write Structura programs.

You can run them like this:
```bash
npm start -- examples/helloworld.struc
```

Here's a hello world in Structura:
```bash
CONTEXT:
    We are executing a "hello world" program.

INSTRUCTIONS:
    PRINT "I am alive!"

OUTPUT: Void
PERMISSIONS: None
!END!
```

## Contributing

Contributions to Structura are welcome! If you have any ideas, suggestions, or bug reports, please open an issue on the GitHub repository. If you'd like to contribute code, you can fork the repository, make your changes, and submit a pull request.

## License

Structura is released under the MIT License. See the [LICENSE](LICENSE) file for more details.
