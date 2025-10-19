import {toNano, TonClient, WalletContractV5R1} from "@ton/ton";
import {mnemonicToPrivateKey} from "@ton/crypto";
import {DEX, pTON} from "@ston-fi/sdk";
import 'dotenv/config';
import { randomFloat, log, sleep, GROYP_CONTRACT } from './utils.js';

const apiKey = process.env.API_KEY;
if (!apiKey) {
  throw new Error("❌ API_KEY .env");
}

const client = new TonClient({
    endpoint: "https://toncenter.com/api/v2/jsonRPC",
    apiKey: apiKey
});

const seed = process.env.SEED;
if (!seed) {
  throw new Error("❌ SEED .env");
}

const mnemonics = seed.trim().split(" ");

const keyPair = await mnemonicToPrivateKey(mnemonics);

const workchain = 0;
const wallet = WalletContractV5R1.create({
    workchain,
    publicKey: keyPair.publicKey,
});

log(`Wallet V5: ${wallet.address.toString({bounceable: false})}`)

const contract = client.open(wallet);

const stonFi = client.open(new DEX.v1.Router());

const provider = contract.sender(keyPair.secretKey)

async function stonFiSwapTon(amount) {
    const txArgs = {
        offerAmount: toNano(amount),
        askJettonAddress: GROYP_CONTRACT,
        minAskAmount: toNano("0.1"),
        proxyTon: new pTON.v1(),
        userWalletAddress: wallet.address.toString(),
    };

    await stonFi.sendSwapTonToJetton(provider, txArgs);
    log(`✅ stonFi swap ${amount} Ton`);
}

async function stonFiSwapGroyp(amount) {
    const txArgs = {
        userWalletAddress: wallet.address.toString(),
        proxyTon: new pTON.v1(),
        offerJettonAddress: GROYP_CONTRACT,
        offerAmount: toNano(amount),
        minAskAmount: toNano("0.1"),
    };
    await stonFi.sendSwapJettonToTon(provider, txArgs);
    log(`✅ stonFi swap ${amount} Groyp`);
}

export async function swapStonFi() {
    await stonFiSwapTon(randomFloat(0.5, 1))
    await sleep(20 * 1000)
    await stonFiSwapGroyp(randomFloat(1000, 3500))
}
