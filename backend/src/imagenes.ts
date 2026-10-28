import { Router, raw } from 'express';
import sharp from 'sharp';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

export function rutasImagenes(directory: string) {
    const router = Router();
    router.post('/', raw({ type: ['image/jpeg', 'image/png', 'image/webp'], limit: '5mb' }), async (req, res) => {
        if (!Buffer.isBuffer(req.body) || !req.body.length) {
            res.status(400).json({ error: 'Seleccioná una imagen JPG, PNG o WebP.' }); return;
        }
        let image: Buffer;
        try {
            const processor = sharp(req.body, { limitInputPixels: 25000000 });
            const metadata = await processor.metadata();
            if (!['jpeg', 'png', 'webp'].includes(metadata.format || '') || (metadata.pages || 1) > 1) throw new Error('Formato no permitido');
            image = await processor.rotate().resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true }).webp({ quality: 85 }).toBuffer();
        } catch {
            res.status(400).json({ error: 'La imagen no es válida. Usá JPG, PNG o WebP sin animación, de hasta 25 megapíxeles.' }); return;
        }
        const filename = `${randomUUID()}.webp`;
        await mkdir(directory, { recursive: true });
        await writeFile(resolve(directory, filename), image, { flag: 'wx' });
        res.status(201).json({ imagen: `assets/uploads/${filename}` });
    });
    return router;
}
