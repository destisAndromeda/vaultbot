# vaultbot

Telegram bot for managing a Solana vault, built with [grammy](https://grammy.dev) and [@solana/kit](https://github.com/anza-xyz/kit).

## Stack

- **Bot framework:** grammy
- **Solana:** @solana/kit (web3.js v2), no Anchor client — instructions are built manually from the IDL
- **Program:** `vaultbot` (Anchor, Rust) — `programs/vaultbot`

## Structure

```
app/bot/
  index.ts       — bot commands
  rpc/rpc.ts      — instruction building, PDA derivation, transaction sending
programs/vaultbot/ — Anchor program
```

## Install

```bash
yarn install
```

## Configuration

Create a `.env` file in the project root:

```env
BOT_TOKEN=token_from_@BotFather
PROGRAM_ID=4m8Q5cy48fXkDowUDU4sVg3342KiimSqvid7emy5SfgP
RPC_URL=http://127.0.0.1:8899
RPC_WS_URL=ws://127.0.0.1:8900
```

For devnet, use `https://api.devnet.solana.com` and `wss://api.devnet.solana.com`.

> `.env` and `bot-keypair.json` are in `.gitignore` — don't commit them.

## Running the program (localnet)

```bash
anchor build
anchor deploy
```

## Running the bot

```bash
npx tsx app/bot/index.ts
```

On first run, the bot generates and saves its own keypair to `bot-keypair.json` — this key owns the vault.

## Commands

| Command | Description |
|---|---|
| `/start` | Show the bot's public address |
| `/initialize_vault` | Create the Vault PDA |
| `/deposit <amount>` | Deposit SOL into the vault, e.g. `/deposit 0.5` |
| `/withdraw <amount>` | Withdraw SOL from the vault |
| `/balance` | Show the bot wallet's balance |

## Known limitations (MVP)

- Custodial model: the bot holds the key and signs all transactions — users don't have their own wallets.
- Single shared vault per bot, not per-user.