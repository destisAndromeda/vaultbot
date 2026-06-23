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

// bot.command("initialize_vault", async (ctx) => {
//   try {
//     await ctx.reply("Creating vault...");

//     const { initialized, vault } = await is_vault_initialized(botSigner);
//     if (initialized) {
//       await ctx.reply(`Vault is already initialized\nVault: ${vault}`);
//       return;
//     }

//     const result = await initialize_vault(botSigner);
//     await ctx.reply(`Success\nVault:${vault}`);
//     await ctx.reply(`Signature:${result}`);

//   } catch (err) {
//     console.error(err);
//     await ctx.reply("Failed to initialize vault");
//   }
// });

// bot.command("deposit", async (ctx) => {
//   try {
//     if (!botSigner) {
//       await ctx.reply("No bot signer yet. Run /start first");
//       return;
//     }

//     const amountText = ctx.match.trim().split(/\s+/)[0];

//     if (!amountText) {
//       await ctx.reply("Usage: /deposit 1\nExample: /deposit 0.5");
//       return;
//     }

//     const { initialized, vault } = await is_vault_initialized(botSigner);

//     if (!initialized) {
//       await ctx.reply("Vault is not initialized yet. Run /initialize_vault first.");
//       return;
//     }

//     const amountLamports = sol_to_lamports(amountText);

//     await ctx.reply(`Depositing ${amountText} SOL...`);

//     const { signature } = await deposit_to_vault(botSigner, amountLamports);

//     await ctx.reply(
//       `Deposit success\nVault: ${vault}\nSignature: ${signature}`
//     );
//   } catch (err) {
//     console.error(err);
//     await ctx.reply("Failed to deposit");
//   }
// });

// bot.command("withdraw", async (ctx) => {
//   try {
//     if (!botSigner) {
//       await ctx.reply("No bot signer yet. Run /start first");
//       return;
//     }

//     const amountText = ctx.match.trim().split(/\s+/)[0];

//     if (!amountText) {
//       await ctx.reply("Usage: /withdraw 1\nExample: /withdraw 0.5");
//       return;
//     }

//     const { initialized, vault } = await is_vault_initialized(botSigner);

//     if (!initialized) {
//       await ctx.reply("Vault is not initialized yet. Run /initialize_vault first.");
//       return;
//     }

//     const amountLamports = sol_to_lamports(amountText);

//     await ctx.reply(`Withdrawing ${amountText} SOL...`);

//     const { signature } = await withdraw_from_vault(botSigner, amountLamports);

//     await ctx.reply(
//       `Withdraw success\nVault: ${vault}\nSignature: ${signature}`
//     );
//   } catch (err) {
//     console.error(err);
//     await ctx.reply("Failed to withdraw");
//   }
// });

// bot.command("balance", async (ctx) => {
//   try {
//     if (!botSigner) {
//       await ctx.reply("No bot signer yet. Run /start first");
//       return;
//     }

//     const botBalance = await get_balance(botSigner);
//     await ctx.reply(`${botBalance} SOL`);
//   } catch (err) {
//     console.error("err");
//     ctx.reply("Failed to read balance");
//   }
// });

bot.start();