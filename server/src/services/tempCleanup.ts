import fs from "node:fs/promises";

export async function cleanupTempFiles(paths: string[]): Promise<void> {
  await Promise.all(paths.map(async (p) => {
    try {
      await fs.unlink(p);
    } catch {
      // ignore cleanup errors
    }
  }));
}
