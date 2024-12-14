import { Context, Markup, Telegraf } from 'telegraf';
import { fmt, bold } from 'telegraf/format';
import { Update } from 'telegraf/types';
import { callbackQuery } from 'telegraf/filters';

export function exampleReply(input: string = "", userId: string = ""): string {
    if (input && input.length > 0 && userId && userId.length > 0) {
        const secretPhrases = [
            "indeed it was there whence thine tabletops were laid bare",
            "not that it was much of a thing worth noting",
            "it wasn't so much found as fleetingly borrowed..",
        ];
        return secretPhrases[Math.floor(Math.random() * secretPhrases.length)];
    }

    const fallbackPhrases = ["Red pandas are the best!", "Red pandas are adorable!"];
    return fallbackPhrases[Math.floor(Math.random() * fallbackPhrases.length)];
}

export const setBotCommands = (bot: Telegraf<Context<Update>>) => {
    bot.command('version', async (ctx) => {
        console.log('[DEBUG] Version command received!');
        try {
            await ctx.reply(`👨‍💻🤓💾     v1.0.44`);
        } catch (error) {
            console.error('[ERROR] Failed to reply to /version command:', error);
        }
    });

    bot.command('prize', async (ctx) => {
        console.log('[DEBUG] Prize command received');
        try {
            const responses = ['You win! 🎉', 'Better luck next time! 😞'];
            await ctx.reply(responses[Math.floor(Math.random() * responses.length)]);
        } catch (error) {
            console.error('[ERROR] Failed to reply to /prize command:', error);
        }
    });
};