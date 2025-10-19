import { DEX, pTON } from "@ston-fi/sdk";
import { fromNano, toNano } from "@ton/ton";
import { createKeyPair, createTonClient, createWallet, GROYP_CONTRACT, log, randomFloat, sleep } from './utils.js';

const client = createTonClient();
const keyPair = await createKeyPair();
const wallet = await createWallet();

const contract = client.open(wallet);

const stonFi = client.open(new DEX.v1.Router());

const provider = contract.sender(keyPair.secretKey)

async function stonFiSwapTon(nanoTonAmount) {
    const txArgs = {
        offerAmount: nanoTonAmount,
        askJettonAddress: GROYP_CONTRACT,
        minAskAmount: toNano("0.1"),
        proxyTon: new pTON.v1(),
        userWalletAddress: wallet.address.toString(),
    };

    await stonFi.sendSwapTonToJetton(provider, txArgs);
    log(`✅ stonFi swap ${fromNano(nanoTonAmount)} Ton`);
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

async function getNanoTonBalance() {
    return await contract.getBalance()
}

export async function swapStonFi() {
    const tonHalfBalance = await getNanoTonBalance() / 2n
    await stonFiSwapTon(tonHalfBalance)
    await sleep(30 * 1000)
    await stonFiSwapGroyp(randomFloat(1000, 3500))
}