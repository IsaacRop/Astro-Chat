# Astro - Next Gen AI Assistant

![Astro Mascot](public/favicon.ico)

Astro is a futuristic AI specialized in educational tutoring and knowledge management. Built with Next.js 16 and the Vercel AI SDK, it features a dynamic chat interface, a connected knowledge graph, and a robust note-taking system.

## 🚀 Key Features

### 🧠 AI Chat Assistant
- **Socratic Tutor**: Astro acts as an educational guide, using analogies and step-by-step explanations.
- **Real-time Streaming**: Powered by OpenAI (`gpt-4o-mini`) via Vercel AI SDK.
- **Markdown Support**: Renders code blocks, tables, and formatted text beautifully.
- **Session Management**: Automatically saves chat history and supports creating/deleting sessions.

### 🕸️ Knowledge Graph
- **Dynamic Visualization**: Chat topics are automatically converted into nodes in an interactive 2D graph.
- **Visual Connections**: See how your learning topics connect to each other.
- **Debug & Process**: (`/api/graph/process`) Analyzes chat messages to generate semantic labels and embeddings.

### 📝 Notes System (Cadernos)
- **Full Editor**: Write and edit notes with rich text formatting (Bold, Italic, Headings, Lists).
- **Local Persistence**: Notes are saved locally for privacy and speed.
- **Mascot Navigation**: Access notes easily through the interactive Octopus menu.

### 🎨 Immersive UI
- **Octopus Mascot**: A fully interactive SVG mascot that tracks your mouse/touch.
- **Cosmic Theme**: Beautiful dark/light mode with "Cosmic Pastel" gradients.
- **Responsive Design**: Mobile-first approach using Tailwind CSS 4.
- **Animations**: Smooth transitions powered by Framer Motion.

## 🛠️ Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **AI**: [Vercel AI SDK](https://sdk.vercel.ai/) + [OpenAI](https://openai.com/)
- **Graph**: [`react-force-graph-2d`](https://github.com/vasturiano/react-force-graph-2d)
- **Icons**: [Lucide React](https://lucide.dev/)

## 📦 Getting Started

### Prerequisites
- Node.js 18+ installed
- OpenAI API Key

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/my-ai-app.git
   cd my-ai-app
   ```

2. **Install dependencies:**
   ```bash
   npm install
   # or
   pnpm install
   ```

3. **Configure Environment:**
   Create a `.env.local` file in the root directory:
   ```env
   OPENAI_API_KEY=your_sk_key_here
   ```

4. **Run Development Server:**
   ```bash
   npm run dev
   ```

5. **Open Browser:**
   Visit [http://localhost:3000](http://localhost:3000) to start interacting with Astro.

## 📂 Project Structure

```
├── app/
│   ├── api/          # Backend API routes (Chat, Graph)
│   ├── chat/         # Chat interface page
│   ├── notes/        # Notes management page
│   ├── globals.css   # Global styles & Tailwind
│   └── page.tsx      # Landing page with Mascot
├── components/       # Reusable UI components
│   ├── OctopusMascot.tsx  # Interactive home menu
│   └── Header.tsx         # App navigation header
└── utils/            # Helper functions & storage logic
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
