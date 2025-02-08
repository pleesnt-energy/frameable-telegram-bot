import { Composer, Context, Scenes, Markup } from "telegraf";
import { message } from "telegraf/filters";
import { ChatRole, fetchOpenAIResponse } from "../../services/openaiService"; // Custom OpenAI Service

// Define Custom Wizard Session Data Structure
interface GptWizardSession extends Scenes.WizardSessionData {
  chatHistory?: [role: ChatRole, content: string][]; // Tracks the conversation for OpenAI
  toggleView1:boolean;
  recipient?: string; // Stores username of the recipient
  token?: string;     // Stores token entered by the user
}

// Define Custom Wizard Context
export interface GptWizardContext extends Context {
  scene: Scenes.SceneContextScene<GptWizardContext, GptWizardSession>;
  wizard: Scenes.WizardContextWizard<GptWizardContext>;
}

/**
 * Splits a long text into 4096-character chunks while ensuring MarkdownV2 compliance.
 */
function splitMarkdownMessage(text: string, maxLength: number = 4096): string[] {
  const chunks = [];
  let currentChunk = '';

  for (const line of text.split('\n')) {
    // Add line to the current chunk if it's within the limit
    if ((currentChunk + line).length <= maxLength) {
      currentChunk += `${line}\n`;
    } else {
      // Push the completed chunk and start a new one
      chunks.push(currentChunk);
      currentChunk = `${line}\n`;
    }
  }

  // Push the last chunk if it exists
  if (currentChunk.length > 0) {
    chunks.push(currentChunk);
  }

  return chunks;
}

// Scene Logic Step 2: Chat Processing
const chatStepHandler = new Composer<GptWizardContext>();
chatStepHandler.command("end", async (ctx) => {
  await ctx.reply("🛑 Conversation ended. Thank you!");
  ctx.scene.session.chatHistory = []; // Cleanup history
  return await ctx.scene.leave();
});

chatStepHandler.command("toggle", async (ctx) => {
  const toggle1 = ctx.scene.session.toggleView1; 
  ctx.scene.session.toggleView1 = !toggle1;
  await ctx.reply("Format toggled.");
  return; // do not leave scene
});

chatStepHandler.on(message("text"), async (ctx) => {
  const userMessage = ctx.message?.text.trim();
  const session = ctx.scene.session;

  // Initialize chatHistory if it doesn't exist
  if (!session.chatHistory) {
    session.chatHistory = [];
  }

  // Add user message to chatHistory
  session.chatHistory.push(["user", userMessage]);

  try {
    // Fetch OpenAI Assistant Response
    const botReply = await fetchOpenAIResponse(session.chatHistory);

    // Add bot response to chatHistory
    session.chatHistory.push(["assistant", botReply]);

    // Escape special characters for Markdown
    const escapedReply = escapeMarkdownV2(botReply);
    const safeReply = formatMarkdownV2(botReply);
    const wrappedReply = formatChatGPTResponseForTelegram(botReply);

    console.log("DEBUG - Raw Text:", botReply);
    console.log("DEBUG - Safe Text:", safeReply);
    console.log("DEBUG - Escaped Text:", escapedReply);
    console.log("DEBUG - Format:", wrappedReply);

    // Send response to user
    const toggleView1 = ctx.scene.session.toggleView1;
    await ctx.replyWithMarkdownV2(toggleView1 ? safeReply : escapeMarkdown(botReply));
    return;
  } catch (error) {
    console.error("Error communicating with OpenAI:", error);
    await ctx.reply("❌ There was an error processing your request. Please try again.");
    return;
  }
});

/**
 * Escapes special MarkdownV2 characters in a given text.
 * Handles nested special characters and avoids double-escaping existing characters.
 */
export function formatMarkdownV2(text: string): string {
  const markdownSpecialChars = [
    "_", "*", "[", "]", "(", ")", "~", "`", ">", "#", "+", "-", "=", "|", "{", "}", ".", "!"
  ];

  // Escape special characters using a regex dynamically generated from above array
  const escapeRegex = new RegExp(`(?<!\\\\)([${markdownSpecialChars.map(c => `\\${c}`).join("")}])`, "g");

  // Perform escaping
  return text.replace(escapeRegex, '\\$1');
}

/**
 * Formats ChatGPT responses or any text for safe Telegram MarkdownV2 rendering.
 * Allows further control over message-specific transformation.
 */
export function formatChatGPTResponseForTelegram(response: string): string {
  // Escape the whole response for MarkdownV2
  const escapedText = formatMarkdownV2(response);

  // Optional: Customize formatting (e.g., surrounding with italics/star/bold markers)
  // Example: Wrap in a code block, maintain safe Markdown formatting
  // Adjust or remove wrappers based on your UX design
  return `\`\`\`${escapedText}\`\`\``;
}

function escapeMarkdownV2(text: string): string {
  /**
   * Safely escape special characters in Markdown V2 texts.
   * Negative lookbehind prevents double-escaping characters starting with `\`.
   */
  return text.replace(/(?<!\\)([_*[\]()~`>#+\-=|{}.!])/g, '\\$1');
}

// Function to escape special characters for Markdown V2
function escapeMarkdown(text:string) {
  return text
    // .replace(/_/g, '\\_') // Escape underscores
    // .replace(/\*/g, '\\*') // Escape asterisks
    // .replace(/~/g, '\\~') // Escape tildes
    // .replace(/`/g, '\\`') // Escape backticks
    // .replace(/>/g, '\\>') // Escape greater-than signs
    // .replace(/#/g, '\\#') // Escape hashtags
    // .replace(/\+/g, '\\+') // Escape plus signs
    .replace(/-/g, '\\-') // Escape hyphens
    // .replace(/=/g, '\\=') // Escape equal signs
    // .replace(/\|/g, '\\|') // Escape pipes
    // .replace(/$$/g, '\\[') // Escape opening brackets     .replace(/$$/g, '\\]') // Escape closing brackets
    // .replace(/{/g, '\\{') // Escape opening braces
    // .replace(/}/g, '\\}') // Escape closing braces
    .replace(/!/g, '\\!') // Escape exclamation marks
    .replace(/\./g, '\\.'); // Escape dots
}

// Function to escape only normal text while retaining Markdown formatting
function escapeNormalText(text:string) {
  // Escape characters that are not part of Markdown formatting
  return text.replace(/([_`~*#!$$$$()<>|{}\.])/g, '\\$1'); // Escape Markdown special characters
}

// Step 1: Entry and Introduction
const entryStepHandler = async (ctx: GptWizardContext) => {
  await ctx.reply(
    "🧠 OpenAI GPT Assistant is active! Type anything to start the conversation.\nSay 'bye' to stop the interaction."
  );

  // Initialize chat history at beginning
  ctx.scene.session.chatHistory = [];
  return ctx.wizard.next(); // Move to Step 2 (Chat Loop)
};

// Scene Setup
export const gptAssistantWizard = new Scenes.WizardScene(
  "GPT_ASSISTANT_SCENE_ID",
  entryStepHandler, // Step 1: Introduction
  chatStepHandler // Step 2: Chat Loop
);

export default gptAssistantWizard;