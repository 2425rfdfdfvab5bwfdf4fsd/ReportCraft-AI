"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.encrypt = encrypt;
exports.decrypt = decrypt;
const crypto_1 = __importDefault(require("crypto"));
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const TAG_LENGTH = 16;
function getKey() {
    const key = process.env.ENCRYPTION_KEY;
    if (key) {
        // Support 64-char hex key (32 bytes) per PRD §5.3
        if (/^[0-9a-fA-F]{64}$/.test(key)) {
            return Buffer.from(key, 'hex');
        }
        // Fallback: use raw string, padded/sliced to 32 bytes
        return Buffer.from(key.padEnd(32).slice(0, 32), 'utf8');
    }
    // Dev-only default key — warn in production
    if (process.env.NODE_ENV === 'production') {
        console.error('ENCRYPTION_KEY not set in production — tokens are insecure!');
    }
    return Buffer.from('default-dev-key-32-chars-minimum!'.slice(0, 32), 'utf8');
}
function encrypt(text) {
    if (!text)
        return '';
    const iv = crypto_1.default.randomBytes(IV_LENGTH);
    const cipher = crypto_1.default.createCipheriv(ALGORITHM, getKey(), iv);
    const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return Buffer.concat([iv, tag, encrypted]).toString('base64');
}
function decrypt(data) {
    if (!data)
        return '';
    const buf = Buffer.from(data, 'base64');
    const iv = buf.subarray(0, IV_LENGTH);
    const tag = buf.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
    const encrypted = buf.subarray(IV_LENGTH + TAG_LENGTH);
    const decipher = crypto_1.default.createDecipheriv(ALGORITHM, getKey(), iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
}
//# sourceMappingURL=encryption.js.map