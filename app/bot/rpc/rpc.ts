import {
  AccountRole,
  address,
  appendTransactionMessageInstruction,
  createKeyPairSignerFromBytes,
  createSolanaRpc,
  createTransactionMessage,
  getAddressEncoder,
  getProgramDerivedAddress,
  getSignatureFromTransaction,
  pipe,
  sendTransactionWithoutConfirmingFactory,
  setTransactionMessageFeePayerSigner,
  setTransactionMessageLifetimeUsingBlockhash,
  signTransactionMessageWithSigners,
  airdropFactory,
  createSolanaRpcSubscriptions,
  lamports,
  KeyPairSigner,
  generateKeyPairSigner,
} from "@solana/kit";
import "dotenv/config";
import idl from "../../../target/idl/vaultbot.json" assert { type: "json" };

const LAMPORTS_PER_SOL = 1_000_000_000n;

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

const PROGRAM = address(requireEnv("PROGRAM_ID"));
const SYSTEM_PROGRAM = address("11111111111111111111111111111111");

const RPC_URL = process.env.RPC_URL ?? "http://127.0.0.1:8899";
const RPC_WS_URL = process.env.RPC_WS_URL ?? "ws://127.0.0.1:8900";

const rpc = createSolanaRpc(RPC_URL);
const rpcSubscriptions = createSolanaRpcSubscriptions(RPC_WS_URL);

export async function create_bot() {
  const secretKeyBytes = new Uint8Array(JSON.parse(requireEnv("SECRET_KEY")));
  const signer = await createKeyPairSignerFromBytes(secretKeyBytes);

  return signer;
}

export async function is_vault_initialized(owner: KeyPairSigner) {
  const vault = await get_vault_pda(owner);

  const accountInfo = await rpc
    .getAccountInfo(vault, {
      commitment: "confirmed",
      encoding: "base64",
    })
    .send();

    return {
      initialized: accountInfo.value !== null,
      vault,
    }
}

export async function get_vault_pda(owner: KeyPairSigner) {
  const [vault] = await getProgramDerivedAddress({
    programAddress: PROGRAM,
    seeds: [
      new TextEncoder().encode("vault"),
      getAddressEncoder().encode(owner.address),
    ],
  });

  return vault;
}

export async function get_balance(bot: KeyPairSigner) {
  const balance = await rpc.getBalance(bot.address, {
    commitment: "confirmed",
  })
  .send();

  return (balance.value as bigint) / LAMPORTS_PER_SOL;
}

export async function initialize_vault(bot: KeyPairSigner) {
  const vault = await get_vault_pda(bot);

  const initializeVaultIx = (idl as any).instructions.find(
    (ix: any) => ix.name === "initializeVault" || ix.name === "initialize_vault"
  );

  if (!initializeVaultIx?.discriminator) {
    throw new Error("No initialize_vault discriminator found in IDL");
  }

  const instruction = {
    programAddress: PROGRAM,
    accounts: [
      {
        address: bot.address,
        role: AccountRole.WRITABLE_SIGNER,
        signer: bot,
      },
      {
        address: vault,
        role: AccountRole.WRITABLE,
      },
      {
        address: SYSTEM_PROGRAM,
        role: AccountRole.READONLY,
      },
    ],
    data: new Uint8Array(initializeVaultIx.discriminator),
  };

  const { value: blockhash } = await rpc.getLatestBlockhash().send();

  const txMessage = pipe(
    createTransactionMessage({ version: 0 }),
    (tx) => setTransactionMessageFeePayerSigner(bot, tx),
    (tx) => setTransactionMessageLifetimeUsingBlockhash(blockhash, tx),
    (tx) => appendTransactionMessageInstruction(instruction, tx)
  );

  const signedTx = await signTransactionMessageWithSigners(txMessage);
  const signature = getSignatureFromTransaction(signedTx);

  const sendTransaction = sendTransactionWithoutConfirmingFactory({ rpc });

  await sendTransaction(signedTx, {
    commitment: "confirmed",
  });

  console.log("Bot:", bot.address);
  console.log("Vault:", vault);
  console.log("Signature:", signature);

  return signature;
}

function concatBytes(...arrays: Uint8Array[]) {
  const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0);
  const result = new Uint8Array(totalLength);

  let offset = 0;
  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }

  return result;
}

function u64ToLittleEndianBytes(value: bigint) {
  const bytes = new Uint8Array(8);
  new DataView(bytes.buffer).setBigUint64(0, value, true);
  return bytes;
}

export function sol_to_lamports(solAmount: string) {
  const amount = solAmount.trim();

  if (!/^\d+(\.\d{1,9})?$/.test(amount)) {
    throw new Error("Invalid SOL amount");
  }

  const [whole, fraction = ""] = amount.split(".");

  return (
    BigInt(whole) * LAMPORTS_PER_SOL +
    BigInt(fraction.padEnd(9, "0"))
  );
}

export async function deposit_to_vault(bot: KeyPairSigner, amountLamports: bigint) {
  if (amountLamports <= 0n) {
    throw new Error("Amount must be greater than 0");
  }

  const vault = await get_vault_pda(bot);

  const depositIx = (idl as any).instructions.find(
    (ix: any) => ix.name === "deposit"
  );

  if (!depositIx?.discriminator) {
    throw new Error("No deposit discriminator found in IDL");
  }

  const ownerBytes = getAddressEncoder().encode(bot.address);
  const amountBytes = u64ToLittleEndianBytes(amountLamports);

  const instruction = {
    programAddress: PROGRAM,
    accounts: [
      {
        address: bot.address,
        role: AccountRole.WRITABLE_SIGNER,
        signer: bot,
      },
      {
        address: vault,
        role: AccountRole.WRITABLE,
      },
      {
        address: SYSTEM_PROGRAM,
        role: AccountRole.READONLY,
      },
    ],
    data: concatBytes(
      new Uint8Array(depositIx.discriminator),
      ownerBytes,
      amountBytes
    ),
  };

  const { value: blockhash } = await rpc.getLatestBlockhash().send();

  const txMessage = pipe(
    createTransactionMessage({ version: 0 }),
    (tx) => setTransactionMessageFeePayerSigner(bot, tx),
    (tx) => setTransactionMessageLifetimeUsingBlockhash(blockhash, tx),
    (tx) => appendTransactionMessageInstruction(instruction, tx)
  );

  const signedTx = await signTransactionMessageWithSigners(txMessage);
  const signature = getSignatureFromTransaction(signedTx);

  const sendTransaction = sendTransactionWithoutConfirmingFactory({ rpc });

  await sendTransaction(signedTx, {
    commitment: "confirmed",
  });

  return {
    signature,
    vault,
  };
}

export async function withdraw_from_vault(
  bot: KeyPairSigner,
  amountLamports: bigint
) {
  if (amountLamports <= 0n) {
    throw new Error("Amount must be greater than 0");
  }

  const vault = await get_vault_pda(bot);

  const withdrawIx = (idl as any).instructions.find(
    (ix: any) => ix.name === "withdraw"
  );

  if (!withdrawIx?.discriminator) {
    throw new Error("No withdraw discriminator found in IDL");
  }

  const instruction = {
    programAddress: PROGRAM,
    accounts: [
      {
        address: bot.address,
        role: AccountRole.WRITABLE_SIGNER,
        signer: bot,
      },
      {
        address: vault,
        role: AccountRole.WRITABLE,
      },
      {
        address: SYSTEM_PROGRAM,
        role: AccountRole.READONLY,
      },
    ],
    data: concatBytes(
      new Uint8Array(withdrawIx.discriminator),
      u64ToLittleEndianBytes(amountLamports)
    ),
  };

  const { value: blockhash } = await rpc.getLatestBlockhash().send();

  const txMessage = pipe(
    createTransactionMessage({ version: 0 }),
    (tx) => setTransactionMessageFeePayerSigner(bot, tx),
    (tx) => setTransactionMessageLifetimeUsingBlockhash(blockhash, tx),
    (tx) => appendTransactionMessageInstruction(instruction, tx)
  );

  const signedTx = await signTransactionMessageWithSigners(txMessage);
  const signature = getSignatureFromTransaction(signedTx);

  const sendTransaction = sendTransactionWithoutConfirmingFactory({ rpc });

  await sendTransaction(signedTx, {
    commitment: "confirmed",
  });

  return {
    signature,
    vault,
  };
}