import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { Telegraf } from 'telegraf';
import { Update } from 'telegraf/typings/core/types/typegram';
import dotenv from 'dotenv';
import { setBotCommands } from './commands/botCommands';
import { addSampleCommand } from './commands/sampleCommand';

// Load environment variables
dotenv.config();

// Ensure BOT_TOKEN exists
if (!process.env.BOT_TOKEN) {
    throw new Error("BOT_TOKEN environment variable is not set");
}

function readHeader(request: HttpRequest, key: string): string {
    return Object.fromEntries(request.headers.entries())[key];
}

let bot: Telegraf = null as unknown as Telegraf;
if (!bot) {
    bot = new Telegraf(process.env.BOT_TOKEN);
    
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
    setBotCommands(bot);
    addSampleCommand(bot);
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