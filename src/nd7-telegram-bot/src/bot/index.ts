import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { Scenes, session, Telegraf } from 'telegraf';
import { Update } from 'telegraf/typings/core/types/typegram';
import dotenv from 'dotenv';
import { setBotCommands } from './commands/botCommands';
import { addSampleCommand } from './commands/sampleCommand';

import awardWizard, { MyWizardContext } from "./commands/scenes/awardWizard";
import openaiUrlToTextWizard, { OpenAiWizardContext } from "./commands/scenes/openaiUrlToTextWizard";
import gptAssistantWizard, { GptWizardContext} from './commands/scenes/gptAssistantWizard';
import textAnalysisWizard from './commands/scenes/textAnalysisWizard';

// Load environment variables
dotenv.config();

// Ensure BOT_TOKEN exists
if (!process.env.BOT_TOKEN) {
    throw new Error("BOT_TOKEN environment variable is not set");
}

function readHeader(request: HttpRequest, key: string): string {
    return Object.fromEntries(request.headers.entries())[key];
}

let bot: Telegraf<MyWizardContext> = null as unknown as Telegraf<MyWizardContext>;
if (!bot) {
    bot = new Telegraf<MyWizardContext>(process.env.BOT_TOKEN!);

    
    bot.launch({
        allowedUpdates: ['message', 'callback_query', 'message_reaction'],
    });
    
    // Prevent webhook setup during tests
    if (process.env.NODE_ENV !== 'test') {
        const WEBHOOK_ADDRESS =
            process.env.NODE_ENV === 'production'
                ? `https://${process.env.WEBSITE_HOSTNAME}/api/bot`
                : process.env.WEBHOOK_ADDRESS;

                if (WEBHOOK_ADDRESS) {
                    bot.telegram.setWebhook(WEBHOOK_ADDRESS)
                        .then(() => console.log(`Webhook successfully set to ${WEBHOOK_ADDRESS}`))
                        .catch((err) => console.error('Failed to set webhook:', err));
                }
    }

    // Register WizardScene
    // Register the WizardScene
    const stage = new Scenes.Stage<MyWizardContext>([awardWizard]);
    const openaiUrlToText = new Scenes.Stage<OpenAiWizardContext>([openaiUrlToTextWizard]);
    const gptAssistantWizardStage = new Scenes.Stage<GptWizardContext>([gptAssistantWizard])

    // Use session middleware and ensure it works with MyWizardContext
    bot.use(session());

    // Use the stage middleware
    bot.use(stage.middleware());
    bot.use(openaiUrlToText.middleware()); // the worlds a stage!
    bot.use(gptAssistantWizardStage.middleware());
    // bot.use(textAnalysisWizard.middleware());

    setBotCommands(bot);
    addSampleCommand(bot);

    // Command to enter `awardWizard`
    bot.command("awardwiz", async (ctx) => await ctx.scene.enter("AWARD_WIZARD_SCENE_ID"));
    // Command to enter `openaiUrlToTextWizard`
    bot.command("urltotext", async (ctx) => await ctx.scene.enter("OPEN_AI_URL_TO_TEXT_SCENE"));
    // Command to enter gpt wizard
    bot.command("gptwizard", async (ctx) => await ctx.scene.enter("GPT_ASSISTANT_SCENE_ID"));
    // Command to enter url to txt
    // bot.command("urltotxt", async (ctx) => await ctx.scene.enter("TEXT_ANALYSIS_SCENE_ID"));

}

// Lazy-load initialization in handler
const getBotInstance = () => {
    if (!bot) throw new Error("Bot instance not initialized.");
    return bot;
};

// Async Azure Function handler for webhook
export async function telegramBotHandler(
    request: HttpRequest,
    context: InvocationContext
): Promise<HttpResponseInit> {
    context.log('Received an HTTP request');
    context.log(`Request method: ${request.method}`);
    context.log(`Request Headers: ${readHeader(request,"user-agent")} ${readHeader(request,"content-type")}`);
    

    try {
        const jsonBody = await request.json();
        context.log("Request Body (Raw):", jsonBody || "(No Body)");
        const rawBody = jsonBody || await request.text(); // Fetch raw text if body appears "empty"
        context.log('Raw Incoming Body:', rawBody);

        // Safely parse the body
        let update: Update;
        try {
            update = typeof rawBody === 'string' ? JSON.parse(rawBody) : rawBody;
        } catch (err) {
            context.error('Error parsing JSON body:', err);
            return { status: 400, body: 'Invalid JSON payload' };
        }

        context.log('Parsed Update:', JSON.stringify(update, null, 2));
        context.log("Parsed Update:", update || "(No Parsed Data)");
        

        if (!update) {
            return {
                status: 400,
                body: 'Invalid or empty payload',
            };
        }

        // Process the update via Telegraf
        await getBotInstance().handleUpdate(update);

        context.log('Update processed successfully.');
        return { status: 200, body: 'OK' };
    } catch (error) {
        context.error('Error in handler:', error);
        return { status: 500, body: 'Internal server error' };
    }
}

// Register the HTTP handler with Azure Functions runtime
app.http('bot', {
    methods: ['POST'], // Allow POST only for webhook updates
    authLevel: 'anonymous', // Anonymous for now - tighten in production if needed
    route:'api/bot',
    handler: telegramBotHandler,
});