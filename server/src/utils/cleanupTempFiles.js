import fs from 'fs/promises';
import path from 'path';

const ONE_HOUR_MS = 60 * 60 * 1000;

/**
 * Delete files in UPLOAD_TMP_DIR that are older than 1 hour.
 * Logs TEMP_FILE_DELETED for each removed file.
 * No cron libraries; call via setInterval from background worker (e.g. every 6 hours).
 */
export async function cleanupTempFiles() {
  const uploadDir = process.env.UPLOAD_TMP_DIR || path.join(process.cwd(), 'tmp', 'uploads');

  try {
    const entries = await fs.readdir(uploadDir, { withFileTypes: true });
    const now = Date.now();

    for (const entry of entries) {
      if (!entry.isFile()) continue;

      const filePath = path.join(uploadDir, entry.name);
      let stat;
      try {
        stat = await fs.stat(filePath);
      } catch {
        continue;
      }

      const age = now - stat.mtimeMs;
      if (age >= ONE_HOUR_MS) {
        try {
          await fs.unlink(filePath);
          console.log('[TEMP_FILE_DELETED]', filePath);
        } catch (err) {
          console.error('[TEMP_FILE_DELETED] Failed to unlink:', filePath, err?.message);
        }
      }
    }
  } catch (err) {
    if (err.code !== 'ENOENT') {
      console.error('[cleanupTempFiles]', err?.message);
    }
  }
}
