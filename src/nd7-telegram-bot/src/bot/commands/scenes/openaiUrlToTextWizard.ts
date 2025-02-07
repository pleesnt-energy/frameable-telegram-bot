import { Composer, Scenes, Markup, Context } from "telegraf";
import axios from "axios"; // For HTTP requests
import * as cheerio from "cheerio"; // For webpage parsing
import { fetchOpenAIResponse } from "../../services/openaiService"; // Your existing OpenAI helper
import { message } from "telegraf/filters";

// Wizard session fields
interface OpenAiWizardSession extends Scenes.WizardSessionData {
  url?: string; // URL for input
  extractedText?: string; // Text fetched from the webpage
}

export interface OpenAiWizardContext extends Context {
  scene: Scenes.SceneContextScene<OpenAiWizardContext, OpenAiWizardSession>;
  wizard: Scenes.WizardContextWizard<OpenAiWizardContext>;
}

// Step 1: Entry and Introduction
const entryStepHandler = async (ctx: OpenAiWizardContext) => {
  await ctx.reply(
    "Url to text. Type your URL please"
  );

  // Initialize chat history at beginning
  ctx.scene.session.extractedText = "";
  return ctx.wizard.next(); // Move to Step 2 (Chat Loop)
};

/**
 * Step 1: Collect user-provided URL.
 */
const askForUrl = new Composer<OpenAiWizardContext>();


askForUrl.on(message("text"), async (ctx) => {
  const userUrl = ctx.message?.text.trim();

  // Validate URL
  if (!isValidUrl(userUrl)) {
    await ctx.reply("❌ This doesn’t look like a valid URL. Please try again.");
    return;
  }

  // Save valid URL to session
  ctx.scene.session.url = userUrl;
  await ctx.reply("🔍 Got the URL! Let me extract text from it...");
  return ctx.wizard.next();
});

/**
 * Step 2: Extract text from the provided URL.
 */
const extractText = async (ctx: OpenAiWizardContext) => {
    const url = ctx.scene.session.url;

    if (!url) {
      await ctx.reply("⚠️ Oops! Something went wrong. Please restart the wizard.");
      return ctx.scene.leave();
    }
  
    try {
      // Extract text using helper function
      const text = await extractTextFromUrl(url);
  
      if (!text || text.length === 0) {
        await ctx.reply("⚠️ No readable content was found at the URL. Please try another page.");
        return ctx.scene.leave();
      }
  
      // Save the extracted text in the session
      ctx.scene.session.extractedText = text;
  
      // Ask user what to do with the extracted text
      await ctx.reply(
        "✅ Text extracted! What would you like me to do with it?",
        Markup.inlineKeyboard([
          Markup.button.callback("📝 Summarize", "ANALYZE_SUM"),
          Markup.button.callback("📑 Extract Keywords", "ANALYZE_KEY"),
          Markup.button.callback("💡 Sentiment Analysis", "ANALYZE_SENT"),
        ])
      );
  
      return ctx.wizard.next(); // Move to the next step
    } catch (err:any) {
      console.error("Error extracting text:", err.message ?? "");
      await ctx.reply("❌ Failed to extract text from the webpage. Please try again.");
      return ctx.scene.leave();
    }
};


/**
 * Step 3: Process extracted text based on user selection.
 */
const processText = new Composer<OpenAiWizardContext>();

// Inline actions for processing
processText.action("ANALYZE_SUM", async (ctx) => {
  await ctx.answerCbQuery();
  await handleAnalysis(ctx, "Summarize the following:\n\n");
});

processText.action("ANALYZE_KEY", async (ctx) => {
  await ctx.answerCbQuery();
  await handleAnalysis(ctx, "Extract the most important keywords:\n\n");
});

processText.action("ANALYZE_SENT", async (ctx) => {
  await ctx.answerCbQuery();
  await handleAnalysis(ctx, "Analyze the sentiment of the following text:\n\n");
});

/**
 * General helper for analysis tasks using OpenAI.
 */
async function handleAnalysis(ctx: OpenAiWizardContext, taskPrompt: string) {
  const extractedText = ctx.scene.session.extractedText;

  if (!extractedText) {
    await ctx.reply("⚠️ No text available to analyze. Please restart the wizard.");
    return ctx.scene.leave();
  }

  try {
    // Send message history to OpenAI API
    const result = await fetchOpenAIResponse([['user','message']]);

    await ctx.reply(`✅ Here is the analysis result:\n\n${result}`);
  } catch (err:any) {
    console.error("OpenAI API Error:", err.message);
    await ctx.reply("❌ Something went wrong processing your request. Try again later.");
  } finally {
    return ctx.scene.leave(); // End the scene after analysis
  }
}

/**
 * Utility function to validate URLs.
 */
function isValidUrl(url: string): boolean {
  const pattern = /^(https?:\/\/)?([a-zA-Z0-9.\-]+)\.[a-zA-Z]{2,}(:[0-9]{1,5})?(\/.*)?$/;
  return pattern.test(url || "");
}

/**
 * Utility function to extract text from a webpage.
 */
async function extractTextFromUrl(url: string): Promise<string> {
  const response = await axios.get(url);
  const html = response.data;
  const $ = cheerio.load(html);

  // Extract readable text from headers and paragraphs
  return $("h1, h2, h3, p")
    .map((_, el) => $(el).text().trim())
    .get()
    .join("\n");
}

/**
 * Final Text Analysis Wizard Scene.
 */
export const openaiUrlToTextWizard = new Scenes.WizardScene(
  "OPEN_AI_URL_TO_TEXT_SCENE", // Unique ID for the scene
  entryStepHandler,
  askForUrl, // Step 1: Collect URL
  extractText, // Step 2: Extract webpage content
  processText // Step 3: Analyze the content
);

export default openaiUrlToTextWizard;