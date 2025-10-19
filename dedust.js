import { Asset, Factory, JettonRoot, MAINNET_FACTORY_ADDR, PoolType, ReadinessStatus, VaultJetton } from "@dedust/sdk";
import { Address, toNano, WalletContractV5R1 } from "@ton/ton";
import 'dotenv/config';
import { createKeyPair, createTonClient, GROYP_CONTRACT, log, randomFloat, sleep } from './utils.js';

const client = createTonClient()
const keyPair = await createKeyPair();

const workchain = 0;
const wallet = WalletContractV5R1.create({
    workchain,
    publicKey: keyPair.publicKey,
});

log(`Wallet V5: ${wallet.address.toString({ bounceable: false })}`)

const contract = client.open(wallet);

const deDust = client.open(Factory.createFromAddress(MAINNET_FACTORY_ADDR));

const provider = contract.sender(keyPair.secretKey)

async function deDustSwapTon(amount) {
    const tonVault = client.open(await deDust.getNativeVault());
    const TON = Asset.native();
    const GROYP = Asset.jetton(Address.parse(GROYP_CONTRACT));
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
    const JETTON_ADDRESS = Address.parse(GROYP_CONTRACT);
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

export async function swapDeDust() {
    await deDustSwapTon(randomFloat(0.5, 1))
    await sleep(20 * 1000)
    await deDustSwapGroyp(randomFloat(1000, 3500))
}