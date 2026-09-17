# ⚡ EchoMind — High-Velocity AI Chat Studio

An ultra-fast, minimalist streaming chat studio powered by Groq's high-speed LPU inference engine.

## Features
- **Real-Time Streaming**: Live Server-Sent Events (SSE) word-by-word streaming token output.
- **Groq Speedometer**: Real-time tokens/second counter, latency meter (ms), and total token counts.
- **Multiple Open Models**: Seamlessly switch between `llama-3.3-70b-versatile`, `llama-3.1-8b-instant`, and `qwen/qwen3.8-27b`.
- **Specialized Personas**: General Assistant, Code Expert, and Creative Writer with optimized system instructions.
- **Code Highlighting & Copy**: Syntax-highlighted code blocks with 1-click clipboard copy.
- **Chat Management**: Chat session persistence via `localStorage`, new chat reset, and full Markdown export.
- **Configurable Settings**: Temperature (0.0 to 2.0) and Max Completion Token sliders.

## Getting Started
1. Open `index.html` in any modern web browser.
2. Click the **Settings (⚙️)** button in the top right corner.
3. Paste your Groq API Key (stored safely in browser `localStorage`).
4. Select your model and persona, and start chatting!

## Technologies
- Vanilla JavaScript (ES6+ Streams & Fetch)
- Marked.js for markdown parsing
- Highlight.js for code block styling
- Lucide Icons
