"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const db_1 = __importDefault(require("../lib/db"));
const multer_1 = __importDefault(require("multer"));
const cloudinary_1 = require("cloudinary");
const streamifier_1 = __importDefault(require("streamifier"));
const router = (0, express_1.Router)();
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage(), limits: { fileSize: 2 * 1024 * 1024 } });
cloudinary_1.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});
const updateAgencySchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(100).optional(),
    logoUrl: zod_1.z.string().url().optional(),
    brandColor: zod_1.z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
    timezone: zod_1.z.string().optional(),
    narrativeTone: zod_1.z.enum(['professional', 'conversational', 'executive']).optional(),
    anomalyAlertsEnabled: zod_1.z.boolean().optional(),
    referredByCode: zod_1.z.string().max(32).optional(),
    onboardingCompletedAt: zod_1.z.string().optional().transform(v => v ? new Date(v) : undefined),
});
router.get('/me', async (req, res) => {
    const agency = await db_1.default.agency.findUnique({ where: { id: req.agencyId } });
    if (!agency)
        return res.status(404).json({ error: 'Agency not found' });
    res.json(agency);
});
router.put('/me', async (req, res) => {
    try {
        const data = updateAgencySchema.parse(req.body);
        const agency = await db_1.default.agency.update({ where: { id: req.agencyId }, data });
        res.json(agency);
    }
    catch (e) {
        if (e.name === 'ZodError')
            return res.status(400).json({ error: e.errors });
        throw e;
    }
});
router.post('/me/logo', upload.single('file'), async (req, res) => {
    if (!req.file)
        return res.status(400).json({ error: 'No file provided' });
    const allowed = ['image/png', 'image/jpeg', 'image/svg+xml'];
    if (!allowed.includes(req.file.mimetype)) {
        return res.status(400).json({ error: 'Invalid file type. PNG, JPG, or SVG only.' });
    }
    try {
        if (process.env.CLOUDINARY_CLOUD_NAME) {
            const uploadResult = await new Promise((resolve, reject) => {
                const stream = cloudinary_1.v2.uploader.upload_stream({ folder: `reportcraft/logos/${req.agencyId}`, resource_type: 'auto' }, (err, result) => (err ? reject(err) : resolve(result)));
                streamifier_1.default.createReadStream(req.file.buffer).pipe(stream);
            });
            const agency = await db_1.default.agency.update({
                where: { id: req.agencyId },
                data: { logoUrl: uploadResult.secure_url },
            });
            return res.json({ url: uploadResult.secure_url, agency });
        }
        else {
            const base64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
            const agency = await db_1.default.agency.update({
                where: { id: req.agencyId },
                data: { logoUrl: base64 },
            });
            return res.json({ url: base64, agency });
        }
    }
    catch (e) {
        console.error('Logo upload error:', e);
        return res.status(500).json({ error: 'Logo upload failed' });
    }
});
exports.default = router;
//# sourceMappingURL=agencies.js.map