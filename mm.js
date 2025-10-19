import {Address, toNano, TonClient, WalletContractV5R1} from "@ton/ton";
import {mnemonicToPrivateKey} from "@ton/crypto";
import {DEX, pTON} from "@ston-fi/sdk";
import {Asset, Factory, JettonRoot, MAINNET_FACTORY_ADDR, PoolType, ReadinessStatus, VaultJetton} from "@dedust/sdk";
import 'dotenv/config';

const JETTON = "EQAtwo6qMNwtr0iTA9eKVZ32cuACFJ0VKd78GrBWOe83-X1P"

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

function log(text) {
    console.log(`[${new Date().toLocaleTimeString()}] ${text}`);

}

log(`Wallet V5: ${wallet.address.toString({bounceable: false})}`)

const contract = client.open(wallet);

const stonFi = client.open(new DEX.v1.Router());
const deDust = client.open(Factory.createFromAddress(MAINNET_FACTORY_ADDR));

const provider = contract.sender(keyPair.secretKey)

async function deDustSwapTon(amount) {
    const tonVault = client.open(await deDust.getNativeVault());
    const TON = Asset.native();
    const GROYP = Asset.jetton(Address.parse(JETTON));
    const pool = client.open(await deDust.getPool(PoolType.VOLATILE, [TON, GROYP]));

    if ((await pool.getReadinessStatus()) !== ReadinessStatus.READY) {
        throw new Error('Pool (TON, SCALE) does not exist.');
    }

    if ((await tonVault.getReadinessStatus()) !== ReadinessStatus.READY) {
        throw new Error('Vault (TON) does not exist.');
    }

    await tonVault.sendSwap(provider, {
        poolAddress: pool.address,
        amount: toNano(amount),
        gasAmount: toNano("0.25"),
    });

    log(`✅ deDust swap ${amount} Ton`);
}

async function deDustSwapGroyp(amount) {
    const JETTON_ADDRESS = Address.parse(JETTON);
    const GROYP = Asset.jetton(JETTON_ADDRESS);
    const TON = Asset.native();
    const pool = client.open(await deDust.getPool(PoolType.VOLATILE, [TON, GROYP]));
    const poolAddress = pool.address;

    const groypVault = client.open(await deDust.getJettonVault(JETTON_ADDRESS));
    const groypRoot = client.open(JettonRoot.createFromAddress(JETTON_ADDRESS));
    const groypWallet = client.open(await groypRoot.getWallet(provider.address));

    if ((await pool.getReadinessStatus()) !== ReadinessStatus.READY) {
        throw new Error('Pool (TON, SCALE) does not exist.');
    }

    if ((await groypVault.getReadinessStatus()) !== ReadinessStatus.READY) {
        throw new Error('Vault (TON) does not exist.');
    }

    await groypWallet.sendTransfer(provider, toNano("0.3"), {
        amount: toNano(amount),
        destination: groypVault.address,
        responseAddress: provider.address, // return gas to user
        forwardAmount: toNano("0.25"),
        forwardPayload: VaultJetton.createSwapPayload({ poolAddress }),
    });

    log(`✅ deDust swap ${amount} Groyp`);
}

async function stonFiSwapTon(amount) {
    const txArgs = {
        offerAmount: toNano(amount),
        askJettonAddress: JETTON,
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
        offerJettonAddress: JETTON,
        offerAmount: toNano(amount),
        minAskAmount: toNano("0.1"),
    };
    await stonFi.sendSwapJettonToTon(provider, txArgs);
    log(`✅ stonFi swap ${amount} Groyp`);
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function randomFloat(min, max) {
    return Math.random() * (max - min) + min;
}

async function swapDeDust() {
    await deDustSwapTon(randomFloat(0.5, 1))
    await sleep(20 * 1000)
    await deDustSwapGroyp(randomFloat(1000, 3500))
}

async function swapStonFi() {
    await stonFiSwapTon(randomFloat(0.5, 1))
    await sleep(20 * 1000)
    await stonFiSwapGroyp(randomFloat(1000, 3500))
}

async function makeSomeShit() {
    // const tasks = [swapStonFi, swapDeDust];
    const tasks = [swapStonFi];
    const randomSwap = tasks[Math.floor(Math.random() * tasks.length)];
    await randomSwap();

    const delay = randomFloat(60, 600)
    log(`⏳ Delay: ${(delay / 60).toFixed(1)}m`);
    setTimeout(() => {
        makeSomeShit()
    }, delay * 1000)
}

await makeSomeShit()

