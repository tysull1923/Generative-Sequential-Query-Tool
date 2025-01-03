# Generative Sequential Query Tool (GSQT)

A web application for managing and executing sequential API requests to AI language models like OpenAI's GPT and Anthropic's Claude.

## Features

- Create and manage multiple chat requests
- System context configuration
- Sequential request execution with pause points
- Response viewing and management 
- Support for OpenAI and Anthropic APIs
- Code block syntax highlighting in responses

## Installation

1. Clone repository
```bash
git clone https://github.com/tysull1923/Generative-Sequential-Query-Tool.git
cd Generative-Sequential-Query-Tool
```

2. Install dependencies
```bash
npm install
```

3. Configure environment variables
Create `.env` file in root directory:
```plaintext
VITE_OPENAI_API_KEY=your_openai_key
VITE_ANTHROPIC_API_KEY=your_anthropic_key
```

4. Start development server
```bash
npm run dev
```

## Usage

1. **Configure System Context (Optional)**
   - Click "Add System Context" to set initial context
   - This context will be included in all requests

2. **Managing Requests**
   - Add chat requests using "Add New Request"
   - Insert pause points between requests if needed
   - Reorder requests using up/down arrows
   - Delete unwanted requests

3. **Execution**
   - Click play to start processing requests
   - Requests execute sequentially
   - Processing pauses at pause points
   - Monitor status in left panel

4. **Viewing Responses**
   - Click any completed request to view response
   - Responses display in right panel
   - Code blocks automatically syntax highlighted

## Tech Stack

- React + TypeScript
- Tailwind CSS
- shadcn/ui components
- OpenAI/Anthropic APIs

## Contributing

1. Fork repository
2. Create feature branch 
3. Submit pull request

## License

[MIT License](LICENSE)