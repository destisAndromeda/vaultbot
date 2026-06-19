import { Bot } from 'grammy';
import {
  create_bot,
  get_balance,
  initialize_vault,
  is_vault_initialized,
} from './rpc/rpc';
import config from '../../config.json' assert { type: 'json' };
import { KeyPairSigner } from '@solana/kit';

const bot = new Bot(config.bot_token);
let botSigner: KeyPairSigner;

bot.command("start", async (ctx) => {
  botSigner = await create_bot();
  await ctx.reply(`Bot Pubkey: ${botSigner.address}`)
});

bot.command("initialize_vault", async (ctx) => {
  try {
    await ctx.reply("Creating vault...");

    const { initialized, vault } = await is_vault_initialized(botSigner);
    if (initialized) {
      await ctx.reply(`Vault is already initialized\nVault: ${vault}`);
      return;
    }

    const result = await initialize_vault(botSigner);
    await ctx.reply(`Success\nVault:${vault}`);
  
  } catch (err) {
    console.error(err);
    await ctx.reply("Failed to initialize vault");
  }
});

bot.command("deposit", async (ctx) => {
  await ctx.reply("processing...");
});

bot.command("withdraw", async (ctx) => {
  await ctx.reply("processing...");
});

bot.command("balance", async (ctx) => {
  try {
    if (!botSigner) {
      await ctx.reply("No bot signer yet. Run /start first");
      return;
    }

    const botBalance = await get_balance(botSigner);
    await ctx.reply(`${botBalance} SOL`);
  } catch(err) {
    console.error("err");
    ctx.reply("Failed to read balance");
  }
});

bot.start();