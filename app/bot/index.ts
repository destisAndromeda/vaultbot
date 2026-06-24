import "dotenv/config";
import { Bot } from 'grammy';

const MINIAPP_URL = process.env.MINIAPP_URL!;
const BOT_TOKEN = process.env.BOT_TOKEN!;
const bot = new Bot(BOT_TOKEN);

bot.command('deposit', async (ctx) => {
  const amount = ctx.match.trim();
  await ctx.reply('Unlock your wallet for sign tx', {
    reply_markup: {
      inline_keyboard: [[{
        text: '🔑 Sign',
        web_app: { url: `${MINIAPP_URL}?action=deposit&amount=${amount}` },
      }]]
    }
  });
});

bot.start();