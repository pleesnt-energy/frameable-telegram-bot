
# nd7-telegram-bot-starter

**nd7-telegram-bot** is a feature-rich Telegram bot built with [Telegraf.js](https://telegraf.js.org/) and Typescript.

## ✨ Features
- **Seamless Integration with Azure Function V4**:
  Built to leverage the latest Azure Function V4, ensuring superior performance, scalability, and cost-efficiency for your serverless architecture.
- **Robust Testing Framework with Jest**:
  Includes a starter setup for Jest, making it simple to write, organize, and execute unit tests for your bot’s logic. Test confidently and ship smoother.
- **Rush-Powered Version Management**:
  With Rush, maintain clean versioning for your dependencies while streamlining multi-package workflows and ensuring consistent configurations across your bot’s environment.
- **Automated CI/CD Workflows via GitHub Actions**:
  Ready out-of-the-box with baked-in GitHub Actions. Automate code builds, run tests, and deploy to Azure with a simple push to the main or develop branch.

## 🚀 Getting Started
### Prerequisites
1. **Node.js** (>= 20.x) with **npm** installed.
2. **Azure Functions Core Tools** (For local testing):
   - Install the Azure Functions CLI: [Installation Guide](https://learn.microsoft.com/en-us/azure/azure-functions/functions-run-local#install-the-azure-functions-core-tools).
3. Telegram Bot API Token:
   - Get a bot token from [BotFather](https://core.telegram.org/bots#botfather).

---

### 🏗️ Directory Structure
```plaintext
src/
├── bot/                        # Main bot logic
│   ├── commands/               # Command handlers
│   │   ├── botCommands.ts      # Command logic
│   │   ├── sampleCommand.ts    # Ur next command?
│   └── index.ts                # Entry point for the bot
├── utils/
│   ├── imagemagick.ts          # Shared ImageMagick utilities
├── LEARNINGS.md                # Development insights and notes
```

---

### 🖥️ Running the Bot Locally
#### 1. Install Dependencies
```bash
npm install
```

#### 2. Build the Project
```bash
npm run build
```

#### 3. Start Azure Functions
```bash
npm start
# Runs the bot locally
```

#### 4. Testing Telegram Commands
Interact with the bot on Telegram using supported commands:
- `/prize`: Replies with a random text message.
- `/version`: Replies with a text message.
- `/sample`: Replies with a personalised text message.

---

### 📦 Deployment
The bot is hosted on **Azure Functions** and deployed via GitHub Actions.

#### Deploying via GitHub Actions
1. Push updates to the `main` or `develop` branch.
2. GitHub Actions will trigger the deployment job:
   - **Stage 1**: Provision Azure resources (Function App, Storage, etc.).
   - **Stage 2**: Apply additional configuration (e.g., app settings) and deploy the bot.

#### Manual Deployment
To deploy manually:
```bash
# Package the bot
func azure functionapp publish <YOUR-FUNCTION-APP-NAME>
```

---

### 📘 Documentation
- **Text Wrapping**: Future-proofed multi-line text rendering.
- **Text Coloring**: Keyword highlighting for specific terms (rich annotation support).
- **ImageMagick Commands**: Handles complex tasks via `imagemagick.ts` utilities.

---

### 🔮 Project Roadmap
1. **Enhanced Visual Themes**:
   - Add more pre-styled themes for PostScript banners and quotes (e.g., retro, pastel).
2. **GIF/Animation Output**:
   - Explore text typing effects or animated banner creation.
3. **Refactoring**:
   - Modularize additional utilities for scalable feature additions.
4. **Extending Bot Features**:
   - Add chatbot or NLP support for conversational engagement.

---

### ♥️ Special Thanks
- **Akbanatab**: For constant inspiration, guidance, and sharp debugging skills!
