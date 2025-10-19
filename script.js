import 'dotenv/config';
import { swapStonFi } from './stonfi.js';
import { randomFloat, log } from './utils.js';

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

