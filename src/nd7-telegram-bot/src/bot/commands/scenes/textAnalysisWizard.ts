import { Composer, Context, Scenes, Markup } from "telegraf";
import { message } from "telegraf/filters";
import axios from "axios";
import * as cheerio from "cheerio"; // FIX: Ensure Cheerio library is properly typed and imported
import { fetchOpenAIResponse } from "../../services/openaiService";

// Define Wizard Session and Context
interface TextAnalysisWizardSession extends Scenes.WizardSessionData {
  url?: string; // User-provided URL
  extractedText?: string; // Text extracted from the webpage for processing
}

export interface TextAnalysisWizardContext extends Context {
  scene: Scenes.SceneContextScene<TextAnalysisWizardContext, TextAnalysisWizardSession>;
  wizard: Scenes.WizardContextWizard<TextAnalysisWizardContext>;
}

/**
 * Step 1: Collect URL
 */
const inputUrlStep = new Composer<TextAnalysisWizardContext>();

inputUrlStep.on(message("text"), async (ctx) => {
  const url = ctx.message?.text?.trim();

    // Check for End Phrases
    const endPhrases = ["bye", "end", "quit", "stop"];
    if (endPhrases.some((phrase) => url.toLowerCase().includes(phrase))) {
      await ctx.reply("🛑 Url to txt ended. Thank you!");
      return ctx.scene.leave();
    }

  if (!isValidUrl(url)) {
    return ctx.reply("❌ Invalid URL! Please send a valid URL.");
  }

  // Store the URL in the session and proceed to text extraction
  ctx.scene.session.url = url;
  await ctx.reply("🔍 Extracting text from the webpage...\nThis may take a moment.");
  ctx.wizard.next(); // FIX: Don't use `return` with `ctx.wizard.next()` to avoid unexpected async behavior
});

/**
 * Step 2: Extract Text from URL
 */
const extractTextStep = async (ctx: TextAnalysisWizardContext) => {
  const url = ctx.scene.session.url;

  if (!url) {
    await ctx.reply("⚠️ Something went wrong! URL missing from session.");
    return ctx.scene.leave(); // Gracefully exit if the URL is missing
  }

  try {
    const extractedText = await extractTextFromUrl(url);

    // Check if meaningful text was extracted
    if (!extractedText || extractedText.length === 0) {
      await ctx.reply("⚠️ No readable content was found on the webpage. Try another URL.");
      return ctx.scene.leave();
    }

    // Store extracted text in the session
    ctx.scene.session.extractedText = extractedText;

    // Display available analysis options
    await ctx.reply(
      "✅ Text extracted successfully! What would you like to do with it?\n\n" +
        "Choose one of the following options:",
      Markup.inlineKeyboard([
        Markup.button.callback("📝 Summarize", "ANALYZE_SUMMARIZE"),
        Markup.button.callback("📑 Extract Keywords", "ANALYZE_KEYWORDS"),
        Markup.button.callback("💡 Analyze Sentiment", "ANALYZE_SENTIMENT"),
      ])
    );

    ctx.wizard.next(); // Move to the third step
  } catch (err) {
    console.error(err);
    await ctx.reply("❌ Failed to extract text from the webpage. Please check the URL or try again later.");
    ctx.scene.leave();
  }
};

/**
 * Step 3: Perform Chosen Action
 */
const processTextStep = new Composer<TextAnalysisWizardContext>();

// Summarization action
processTextStep.action("ANALYZE_SUMMARIZE", async (ctx) => {
  await ctx.answerCbQuery(); // Acknowledge button press
  await ctx.reply("📝 Summarizing the content...");
  handleOpenAIResponse(ctx, "Summarize the following:\n\n");
});

// Extract keywords action
processTextStep.action("ANALYZE_KEYWORDS", async (ctx) => {
  await ctx.answerCbQuery(); // Acknowledge button press
  await ctx.reply("📑 Extracting keywords from the content...");
  handleOpenAIResponse(ctx, "Extract the most important keywords:\n\n");
});

// Sentiment analysis action
processTextStep.action("ANALYZE_SENTIMENT", async (ctx) => {
  await ctx.answerCbQuery(); // Acknowledge button press
  await ctx.reply("💡 Analyzing the sentiment of the content...");
  handleOpenAIResponse(ctx, "Analyze the sentiment of this text:\n\n");
});

/**
 * Helper: OpenAI Response Handler
 */
async function handleOpenAIResponse(ctx: TextAnalysisWizardContext, promptIntro: string) {
  try {
    const extractedText = ctx.scene.session.extractedText;

    // Ensure the text exists before making API calls
    if (!extractedText) {
      await ctx.reply("⚠️ Unable to process empty text. Please restart the process.");
      return ctx.scene.leave();
    }

    // Request the OpenAI Chat API for processing
    const result = await fetchOpenAIResponse([
      ["user", `${promptIntro}${extractedText}`]
    ]);

    // Respond with the results
    await ctx.reply(`✅ Here's the result:\n\n${result}`);
  } catch (err) {
    console.error("OpenAI API error:", err);
    await ctx.reply("❌ Failed to process the text. Please try again.");
  } finally {
    // Properly clean up session data and terminate the scene
    ctx.scene.session.url = undefined;
    ctx.scene.session.extractedText = undefined;
    ctx.scene.leave();
  }
}

/**
 * URL Validation Helper
 */
function isValidUrl(url: string): boolean {
  return /^(https?:\/\/)?([a-zA-Z0-9.\-]+)\.[a-zA-Z]{2,}(:[0-9]{1,5})?(\/.*)?$/.test(url);
}

/**
 * Extract Text from URL Tool
 */
async function extractTextFromUrl(url: string): Promise<string> {
  const response = await axios.get(url);
  const html = response.data;
  const $ = cheerio.load(html);

  // Extract text from headers and paragraphs
  return $("h1, h2, h3, p")
    .contents()
    .map((_, el) => $(el).text().trim())
    .get()
    .join("\n");
}

async function entryStepHandler(ctx: TextAnalysisWizardContext) {
  await ctx.reply("Welcome to the URL-to-Txt Wizard! Please type your URL.");
  ctx.scene.session.extractedText = undefined; // Reset any stale session values
  return ctx.wizard.next(); // Advance to the next step!
}

/**
 * Scene Setup
 */
export const textAnalysisWizard = new Scenes.WizardScene(
  "TEXT_ANALYSIS_SCENE_ID", // Scene ID
  entryStepHandler,
  inputUrlStep, // Step 1: Collect URL
  extractTextStep, // Step 2: Extract content
  processTextStep // Step 3: Perform analysis
);

export default textAnalysisWizard;