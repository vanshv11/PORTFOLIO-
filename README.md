# Portfolio

Personal portfolio web application for Vansh Vyas with interactive project search, weather widget, theme toggle, and AI assistant chatbot.

## Running Locally

To start the local web server:

```bash
node server.mjs
```

or with npm:

```bash
npm start
```

Then open [http://localhost:3000](http://localhost:3000) in your browser.

### AI Chatbot Configuration (Optional)

To enable live Groq-powered AI chat answers beyond the built-in greetings:
1. Create a `.env` file in the root directory.
2. Add your Groq API key:
   ```env
   GROQ_API_KEY=your_groq_api_key_here
   ```