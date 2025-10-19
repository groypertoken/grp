import { DEX, pTON } from "@ston-fi/sdk";
import { Address, fromNano, toNano } from "@ton/ton";
import { createKeyPair, createTonClient, createWallet, GROYP_CONTRACT, log, randomFloat, sleep, getJettonBalance } from './utils.js';

const tonClient = createTonClient();
const keyPair = await createKeyPair();
const wallet = await createWallet();
const contract = tonClient.open(wallet);
const stonFi = tonClient.open(new DEX.v1.Router());
const sender = contract.sender(keyPair.secretKey)

/**
 * @param {string | number | bigint} nanoTonAmount
 */
async function stonFiSwapTon(nanoTonAmount) {
    const txArgs = {
        offerAmount: nanoTonAmount,
        askJettonAddress: GROYP_CONTRACT,
        minAskAmount: toNano("0.1"),
        proxyTon: new pTON.v1(),
        userWalletAddress: wallet.address.toString(),
    };

    await stonFi.sendSwapTonToJetton(sender, txArgs);
    log(`✅ stonFi swap ${fromNano(nanoTonAmount)} Ton`);
}

/**
 * @param {string | number | bigint} nanoGroypAmount
 */
async function stonFiSwapGroyp(nanoGroypAmount) {
    const txArgs = {
        userWalletAddress: wallet.address.toString(),
        proxyTon: new pTON.v1(),
        offerJettonAddress: GROYP_CONTRACT,
        offerAmount: nanoGroypAmount,
        minAskAmount: toNano("0.1"),
    };
    await stonFi.sendSwapJettonToTon(sender, txArgs);
    log(`✅ stonFi swap ${fromNano(nanoGroypAmount)} Groyp`);
}

async function getNanoTonBalance() {
    const balance = await contract.getBalance()
    log(`Ton balance: ${fromNano(balance)}`)
    return balance
}

export async function swapStonFi() {
    const provider = tonClient.provider(Address.parse("EQAMEZFNjuKK4oesZHkqdY1pqohuPE7ufhR3XgZOFB47-Asq"))
    const groypHalfBalance = await getJettonBalance(provider) / 2n
    const tonHalfBalance = await getNanoTonBalance() / 2n
    await stonFiSwapTon(tonHalfBalance)
    await sleep(30 * 1000)
    await stonFiSwapGroyp(groypHalfBalance)
}