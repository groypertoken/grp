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