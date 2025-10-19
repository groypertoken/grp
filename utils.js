import { mnemonicToPrivateKey } from "@ton/crypto";
import { Address, fromNano, JettonWallet, TonClient, WalletContractV5R1 } from "@ton/ton";

/**
 * @param {string | bigint} text
 */
export function log(text) {
    console.log(`[${new Date().toLocaleTimeString()}] ${text}`);
}

/**
 * @param {number} min
 * @param {number} max
 */
export function randomFloat(min, max) {
    return Math.random() * (max - min) + min;
}

/**
 * @param {number} ms
 */
export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export const GROYP_CONTRACT = "EQAtwo6qMNwtr0iTA9eKVZ32cuACFJ0VKd78GrBWOe83-X1P"

export function createTonClient() {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        throw new Error("❌ API_KEY .env");
    }

    const client = new TonClient({
        endpoint: "https://toncenter.com/api/v2/jsonRPC",
        apiKey: apiKey
    });

    return client
}

export async function createKeyPair() {
    const seed = process.env.SEED;
    if (!seed) {
        throw new Error("❌ SEED .env");
    }

    const mnemonics = seed.trim().split(" ");

    const keyPair = await mnemonicToPrivateKey(mnemonics);
    return keyPair
}

export async function createWallet() {
    const keyPair = await createKeyPair()

    const workchain = 0;
    const wallet = WalletContractV5R1.create({
        workchain,
        publicKey: keyPair.publicKey,
    });

    log(`Wallet V5: ${wallet.address.toString({ bounceable: false })}`)
    return wallet
}

/**
 * @param {import("@ton/ton").ContractProvider} provider
 */
export async function getJettonBalance(provider) {
    const jettonWallet = JettonWallet.create(Address.parse(GROYP_CONTRACT))
    const balance = await jettonWallet.getBalance(provider)
    log(`Groyp balance: ${fromNano(balance)}`)
    return balance
}