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
const PROGRAM = address(process.env.PROGRAM_ID!);
const SYSTEM_PROGRAM = address("11111111111111111111111111111111");

  const rpc = createSolanaRpc(process.env.RPC_URL ?? "http://127.0.0.1:8899");

  const rpcSubscriptions = createSolanaRpcSubscriptions(
    process.env.RPC_WS_URL ?? "ws://127.0.0.1:8900"
  );

export async function create_bot() {
  const botSigner = await generateKeyPairSigner();

  const balance = await rpc
    .getBalance(botSigner.address, {
      commitment: "confirmed",
    })
    .send();

  if (balance.value < lamports(1_000_000_000n)) {
    const airdrop = airdropFactory({
      rpc,
      rpcSubscriptions,
    });

    const signature = await airdrop({
      recipientAddress: botSigner.address,
      lamports: lamports(10_000_000_000n),
      commitment: "confirmed",
    });
  }

  return botSigner;
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
