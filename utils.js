import { mnemonicToPrivateKey } from "@ton/crypto";
import { TonClient } from "@ton/ton";

export function log(text) {
    console.log(`[${new Date().toLocaleTimeString()}] ${text}`);
}

export function randomFloat(min, max) {
    return Math.random() * (max - min) + min;
}

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