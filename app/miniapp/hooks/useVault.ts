import { useWallet, useConnection } from '@solana/wallet-adapter-react';

export default function useVault() {
    const { publicKey, signTransaction } = useWallet();
    const connection = useConnection();

    // Deposit amount in lamports
    async function deposit(amount: bigint) {

    }

    return { deposit };
}
