import { Composer, Scenes, Markup, Context } from "telegraf";
import { message } from "telegraf/filters";
import axios from "axios";
import * as cheerio from "cheerio"; 
import { fetchOpenAIResponse } from "../../services/openaiService"; 

interface OpenAiWizardSession extends Scenes.WizardSessionData {
  url?: string; 
  extractedText?: string; 
}

export interface OpenAiWizardContext extends Context {
  scene: Scenes.SceneContextScene<OpenAiWizardContext, OpenAiWizardSession>;
  wizard: Scenes.WizardContextWizard<OpenAiWizardContext>;
}

/**
 * Entry Step 1: Welcome the user and set up session.
 */
async function entryStepHandler(ctx: OpenAiWizardContext) {
  await ctx.reply("Welcome to the URL-to-Text Wizard! Please type your URL.");
  ctx.scene.session.extractedText = undefined; // Reset any stale session values
  return ctx.wizard.next(); // Advance to the next step!
}

/**
 * Step 2: Collect the user-provided URL.
 */
const askForUrl = new Composer<OpenAiWizardContext>();
askForUrl.on(message("text"), async (ctx) => {
  const url = ctx.message?.text?.trim();

  // Check for End Phrases
  const endPhrases = ["bye", "end", "quit", "stop"];
  if (endPhrases.some((phrase) => url.toLowerCase().includes(phrase))) {
    await ctx.reply("🛑 Conversation ended. Thank you!");
    return ctx.scene.leave();
  }

  if (!isValidUrl(url)) {
    await ctx.reply("❌ Invalid URL. Please try again with a valid URL.");
    return; // Stay on the current step
  }

  ctx.scene.session.url = url;
  await ctx.reply("🔍 Great! I'll extract text from this URL. This may take a few moments...");
  ctx.wizard.next(); // Proceed to extract the URL content
});

/**
 * Step 3: Extract text from the provided URL.
 */
async function extractText(ctx: OpenAiWizardContext) {
  const url = ctx.scene.session.url;

  if (!url) {
    await ctx.reply("⚠️ Something went wrong while processing the URL. Please restart.");
    return ctx.scene.leave(); // Exiting as no valid URL exists in session
  }

  try {
    const extractedText = await extractTextFromUrl(url);

    if (!extractedText || extractedText.length === 0) {
      await ctx.reply("⚠️ No readable content was found at the URL. Please try another page.");
      return ctx.scene.leave(); // End the wizard gracefully
    }

    // Save successful result in the wizard context
    ctx.scene.session.extractedText = extractedText;

    // Present choices for analysis
    await ctx.reply(
      "✅ Text extracted successfully! Now, what would you like to do with it?",
      Markup.inlineKeyboard([
        Markup.button.callback("📝 Summarize", "ANALYZE_SUM"),
        Markup.button.callback("📑 Keywords", "ANALYZE_KEY"),
        Markup.button.callback("💡 Sentiment", "ANALYZE_SENT"),
      ])
    );

    ctx.wizard.next(); // Move to the next step
  } catch (err:any) {
    console.error("ExtractText Error:", err.message || err);
    await ctx.reply("❌ Text extraction failed. Please check the URL and try again.");
    ctx.scene.leave(); // Terminate gracefully upon failure
  }
}

/**
 * Step 4: Process the extracted text based on user selection.
 */
const processText = new Composer<OpenAiWizardContext>();

processText.action("ANALYZE_SUM", async (ctx) => {
  await ctx.answerCbQuery(); // Acknowledge the button click
  await performAnalysis(ctx, "Summarize:\n\n");
});

processText.action("ANALYZE_KEY", async (ctx) => {
  await ctx.answerCbQuery();
  await performAnalysis(ctx, "Extract the most important keywords:\n\n");
});

processText.action("ANALYZE_SENT", async (ctx) => {
  await ctx.answerCbQuery();
  await performAnalysis(ctx, "Analyze the sentiment of this text:\n\n");
});

/**
 * Helper: Perform Analysis Tasks via OpenAI
 */
async function performAnalysis(ctx: OpenAiWizardContext, promptIntro: string) {
  const text = ctx.scene.session.extractedText;

  if (!text) {
    await ctx.reply("⚠️ Text missing in the session. Please start over.");
    return ctx.scene.leave();
  }

  try {
    const response = await fetchOpenAIResponse([
      ['user',`${promptIntro}${text}`],
    ]);

    await ctx.reply(`✅ Here's the result:\n\n${response}`);
  } catch (err) {
    console.error("Error during analysis:", err);
    await ctx.reply("❌ An error occurred while analyzing the text. Please try again.");
  } finally {
    ctx.scene.leave(); // Cleanup after task completion
  }
}

/**
 * Utility: Validate URLs
 */
function isValidUrl(url: string): boolean {
  const pattern = /^(https?:\/\/)[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(:[0-9]{1,5})?(\/.*)?$/;
  return pattern.test(url || "");
}

/**
 * Utility: Extracts readable text from a webpage URL using Cheerio
 */
async function extractTextFromUrl(url: string): Promise<string> {
  const response = await axios.get(url);
  const html = response.data;
  const $ = cheerio.load(html);

  return $("h1, h2, h3, p")
    .map((_, el) => $(el).text().trim())
    .get()
    .join("\n"); // Combine relevant sections into plain text
}

/**
 * Final Wizard Scene Export
 */
export const openaiUrlToTextWizard = new Scenes.WizardScene(
  "OPEN_AI_URL_TO_TEXT_SCENE", // Unique Scene ID
  entryStepHandler, // Step 1: Entry and initialize context
  askForUrl, // Step 2: User inputs URL
  extractText, // Step 3: Extract content
  processText // Step 4: Analyze extracted text
);

export default openaiUrlToTextWizard;