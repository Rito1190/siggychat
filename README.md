# SIggyverse Chatbox

A simple AI chatbox designed to answer questions about technology using a provided source. It now automatically preloads a specific web page on startup.

## Features

- AI Name: **SIggyverse**
- Personality: firm, a bit rude, loves to joke and tease users
- Uses a source text for knowledge
- **Preloads knowledge from:** https://www.ritualfoundation.org/docs/overview/what-is-ritual
- Simple web interface (HTML/JS/CSS)
- Uses OpenAI Chat API (configure your own key)
- Displays avatar image (`siggyverse.png`)

## Usage

1. Open `index.html` in a modern browser.
2. The AI automatically loads the default source from the web; no action needed.
3. Type a question into the input box, press Enter or click **Send**.
4. SIggyverse will reply in its characteristic rude and teasing style.

> **Note:**
> - Replace `YOUR_API_KEY_HERE` in `script.js` with your OpenAI API key.
> - You can modify the model, behavior, or conversation logic as desired.

## Further Development

- Add the ability to load sources from a URL.
- Implement conversation caching in `localStorage`.
- Adjust humor or rudeness to better suit your audience.

Enjoy! 😎