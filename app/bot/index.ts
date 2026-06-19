import { Bot } from 'grammy';
import {
  create_bot,
  get_balance,
  initialize_vault,
  is_vault_initialized,
  deposit_to_vault,
  sol_to_lamports,
  withdraw_from_vault,
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
  try {
    if (!botSigner) {
      await ctx.reply("No bot signer yet. Run /start first");
      return;
    }

    const amountText = ctx.match.trim().split(/\s+/)[0];

    if (!amountText) {
      await ctx.reply("Usage: /deposit 1\nExample: /deposit 0.5");
      return;
    }

    const { initialized, vault } = await is_vault_initialized(botSigner);

    if (!initialized) {
      await ctx.reply("Vault is not initialized yet. Run /initialize_vault first.");
      return;
    }

    const amountLamports = sol_to_lamports(amountText);

    await ctx.reply(`Depositing ${amountText} SOL...`);

    const { signature } = await deposit_to_vault(botSigner, amountLamports);

    await ctx.reply(
      `Deposit success\nVault: ${vault}\nSignature: ${signature}`
    );
  } catch (err) {
    console.error(err);
    await ctx.reply("Failed to deposit");
  }
});

bot.command("withdraw", async (ctx) => {
  try {
    if (!botSigner) {
      await ctx.reply("No bot signer yet. Run /start first");
      return;
    }

    const amountText = ctx.match.trim().split(/\s+/)[0];

    if (!amountText) {
      await ctx.reply("Usage: /withdraw 1\nExample: /withdraw 0.5");
      return;
    }

    const { initialized, vault } = await is_vault_initialized(botSigner);

    if (!initialized) {
      await ctx.reply("Vault is not initialized yet. Run /initialize_vault first.");
      return;
    }

    const amountLamports = sol_to_lamports(amountText);

    await ctx.reply(`Withdrawing ${amountText} SOL...`);

    const { signature } = await withdraw_from_vault(botSigner, amountLamports);

    await ctx.reply(
      `Withdraw success\nVault: ${vault}\nSignature: ${signature}`
    );
  } catch (err) {
    console.error(err);
    await ctx.reply("Failed to withdraw");
  }
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