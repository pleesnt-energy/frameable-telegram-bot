// bot/commands/sampleCommand.ts
import { Context, Telegraf } from 'telegraf';
import { Update } from 'telegraf/types';

export const addSampleCommand = <T extends Context>(bot: Telegraf<T>) => {
    bot.command('sample', (ctx) => {
        const name = ctx.from.first_name || 'User';
        ctx.reply(`Hi ${name}, this is a sample command!`);
    });
};