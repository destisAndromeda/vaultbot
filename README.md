# vaultbot

Telegram-бот для управления Solana vault через [grammy](https://grammy.dev) и [@solana/kit](https://github.com/anza-xyz/kit).

## Стек

- **Bot framework:** grammy
- **Solana:** @solana/kit (web3.js v2), без Anchor-клиента — инструкции собираются вручную из IDL
- **Программа:** `vaultbot` (Anchor, Rust) — `programs/vaultbot`

## Структура

```
app/bot/
  index.ts       — команды бота
  rpc/rpc.ts      — сборка инструкций, PDA, отправка транзакций
programs/vaultbot/ — Anchor-программа
```

## Установка

```bash
yarn install
```

## Конфигурация

Создай `.env` в корне:

```env
BOT_TOKEN=токен_от_@BotFather
PROGRAM_ID=4m8Q5cy48fXkDowUDU4sVg3342KiimSqvid7emy5SfgP
RPC_URL=http://127.0.0.1:8899
RPC_WS_URL=ws://127.0.0.1:8900
```

Для devnet используй `https://api.devnet.solana.com` и `wss://api.devnet.solana.com`.

> `.env` и `bot-keypair.json` в `.gitignore` — не коммить.

## Запуск программы (localnet)

```bash
anchor build
anchor deploy
```

## Запуск бота

```bash
npx tsx app/bot/index.ts
```

При первом запуске бот сгенерирует и сохранит свой keypair в `bot-keypair.json` — этот ключ владеет vault'ом.

## Команды

| Команда | Описание |
|---|---|
| `/start` | Показать публичный адрес бота |
| `/initialize_vault` | Создать Vault PDA |
| `/deposit <сумма>` | Депозит SOL в vault, напр. `/deposit 0.5` |
| `/withdraw <сумма>` | Вывод SOL из vault |
| `/balance` | Баланс кошелька бота |

## Известные ограничения (MVP)

- Custodial-модель: бот сам хранит ключ и подписывает все транзакции — у пользователей нет собственного кошелька.
- Один общий vault на бота, не per-user.