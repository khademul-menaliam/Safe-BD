import { randomUUID } from "crypto";
import { mkdir, writeFile, readFile } from "fs/promises";
import path from "path";
import { existsSync } from "fs";

const UPLOAD_ROOT = path.join(process.cwd(), "uploads", "gd-documents");

export async function ensureUploadDir() {
  if (!existsSync(UPLOAD_ROOT)) await mkdir(UPLOAD_ROOT, { recursive: true });
}

export async function storeGDFile(buffer: Buffer, originalName: string): Promise<{ storedFileName: string }> {
  await ensureUploadDir();
  const ext = path.extname(originalName).toLowerCase();
  const storedFileName = `${randomUUID()}${ext}`;
  await writeFile(path.join(UPLOAD_ROOT, storedFileName), buffer);
  return { storedFileName };
}

export async function readGDFile(storedFileName: string): Promise<Buffer> {
  const safeName = path.basename(storedFileName);
  return readFile(path.join(UPLOAD_ROOT, safeName));
}
