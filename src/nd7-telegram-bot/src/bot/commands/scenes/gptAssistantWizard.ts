import { Composer, Context, Scenes, Markup } from "telegraf";
import { message } from "telegraf/filters";
import { ChatRole, fetchOpenAIResponse } from "../../services/openaiService"; // Custom OpenAI Service

// Define Custom Wizard Session Data Structure
interface GptWizardSession extends Scenes.WizardSessionData {
  chatHistory?: [role: ChatRole, content: string][]; // Tracks the conversation for OpenAI
}

// Define Custom Wizard Context
export interface GptWizardContext extends Context {
  scene: Scenes.SceneContextScene<GptWizardContext, GptWizardSession>;
  wizard: Scenes.WizardContextWizard<GptWizardContext>;
}

// Scene Logic Step 2: Chat Processing
const chatStepHandler = new Composer<GptWizardContext>();

chatStepHandler.on(message("text"), async (ctx) => {
  const userMessage = ctx.message?.text.trim();
  const session = ctx.scene.session;

  // Initialize chatHistory if it doesn't exist
  if (!session.chatHistory) {
    session.chatHistory = [];
  }

  // Check for End Phrases
  const endPhrases = ["bye", "end", "quit", "stop"];
  if (endPhrases.some((phrase) => userMessage.toLowerCase().includes(phrase))) {
    await ctx.reply("🛑 Conversation ended. Thank you!");
    session.chatHistory = []; // Cleanup history
    return ctx.scene.leave();
  }

  // Add user message to chatHistory
  session.chatHistory.push(["user", userMessage]);

  try {
    // Fetch OpenAI Assistant Response
    const botReply = await fetchOpenAIResponse(session.chatHistory);

    // Add bot response to chatHistory
    session.chatHistory.push(["assistant", botReply]);

    // Send response to user
    await ctx.replyWithMarkdownV2(botReply);
    return;
  } catch (error) {
    console.error("Error communicating with OpenAI:", error);
    await ctx.reply("❌ There was an error processing your request. Please try again.");
    return;
  }
});

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