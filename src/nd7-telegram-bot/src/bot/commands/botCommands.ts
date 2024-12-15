import { Context, Markup, Telegraf } from 'telegraf';
import { fmt, bold } from 'telegraf/format';
import { Update } from 'telegraf/types';
import { callbackQuery, message } from 'telegraf/filters';
import { ScoreService } from '../services/scoringService';

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

export const setBotCommands = <T extends Context>(bot: Telegraf<T>) => {
    
    bot.command("score", async (ctx) => {
        try {
          const leaderboard = await ScoreService.tallyGoalsAndPrintLeaderboard();
          await ctx.reply(`🌟 Leaderboard 🌟\n${leaderboard?.plain}`);
        } catch(err: any){
            ctx.reply(`❌ Error fetching scoreboard: ${err.message}`);
        }
      });
      
      bot.command("award", async (ctx) => {

        const username = ctx.message.text.split(" ")[1]; // `/award @username`
        
        const senderUsername = ctx.message.from.username;
        if (!senderUsername) {
            return ctx.reply(`❌ Your username is missing! Make sure you're logged into Telegram.`);
        }

        const token = "demo-token"; // Replace this with the actual token logic ( for scoring )
        
        if (!username) {
          return ctx.reply(`❌ Please mention a username to award a goal.`);
        }
      
        try {
          await ScoreService.awardGoalToMember(token, senderUsername, username);
          await ctx.reply(`✅ Goal awarded to *${username}* successfully!`);
        } catch(err:any){
            ctx.reply(`❌ Error awarding goal: ${err.message}`);
        }
      });
    
    // BONUS: Reaction-based scoring (using the `reactions.added` detection)
    bot.reaction('👍', async (ctx) => {
        if (ctx.reactions.added.has("👍")) {
            const token = "reaction-token"; // Simulate the reaction token
            // In future, fetch Notion scores dynamically and issue a goal if valid
            try {
                await ctx.reply(`➕ Reaction logged! You added a 👍. Let’s tally this.`);
            } catch (err:any) {
                ctx.reply(`❌ Something went wrong with the reaction handler.`);
            }
        }
    });
    
    
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