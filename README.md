# CNC Technical AI

A chatbot that provides detailed technical information about CNC machines and related products. It is built using Python, Flask, and OpenAI's GPT-3, and is deployed on Heroku.

## Note

This is a work in progress and is for testing purposes only. The chatbot may not provide accurate information. Always double-check with a qualified professional.

## Prerequisites

Before you begin, ensure you have met the following requirements:

- **Node.js**: The project is built on Node.js. You can download it from [here](https://nodejs.org/).
- **Yarn**: This project uses Yarn as the package manager. You can install it from [here](https://yarnpkg.com/).
- **OpenAI API Key**: You'll need an API key from OpenAI to access their GPT models. You can get one from [OpenAI's website](https://beta.openai.com/signup/).

## Getting Started

1. **Clone the Repository**:

    ```bash
    git clone https://github.com/Deejpotter/CNC-Technical-AI.git
    ```

2. **Navigate to the project directory**:

    ```bash
    cd CNC-Technical-AI
    ```

3. **Install Dependencies**:

    ```bash
    yarn install
    ```

4. **Set Environment Variables**:
    - Create a `.env` file in the root directory.
    - Add your OpenAI API key like so:

        ```env
        OPENAI_API_KEY=your-api-key-here
        ```

    - Also add your ALLOWED_ORIGINS separated by commas:

        ```env
        ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5000
        ```

5. **Run the Application**:

    ```bash
    # For development with auto-reload:
    yarn dev

    # For production:
    yarn start
    ```

## Contributing

If you'd like to contribute, please fork the repository and use a feature branch. Pull requests are warmly welcome.

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.
