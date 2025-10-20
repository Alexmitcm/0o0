import { createReadStream } from "node:fs";
import { mkdir, readdir, readFile, unlink, writeFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { Extract } from "unzip-stream";

export class FileService {
  private static uploadsDir = join(process.cwd(), "uploads");
  private static gamesDir = join(this.uploadsDir, "games");
  private static thumbnailsDir = join(this.uploadsDir, "thumbnails");

  static async ensureDirectories() {
    await mkdir(FileService.uploadsDir, { recursive: true });
    await mkdir(FileService.gamesDir, { recursive: true });
    await mkdir(FileService.thumbnailsDir, { recursive: true });
  }

  static async saveGameFile(
    file: File,
    slug: string
  ): Promise<{ basePath: string; entryFilePath: string }> {
    await FileService.ensureDirectories();

    const gameDir = join(FileService.gamesDir, slug);
    await mkdir(gameDir, { recursive: true });

    // Save the ZIP file
    const zipPath = join(gameDir, "game.zip");
    const arrayBuffer = await file.arrayBuffer();
    await writeFile(zipPath, Buffer.from(arrayBuffer));

    // Extract the ZIP file
    await FileService.extractZip(zipPath, gameDir);

    // Try to detect entry file path (common locations: root index.html or nested html5/index.html)
    // Default to 'index.html' if not found
    let entryFilePath = "index.html";
    try {
      const chosen = await FileService.pickBestIndexHtml(gameDir);
      if (chosen) {
        entryFilePath = chosen
          .replace(`${gameDir}\\`, "")
          .replace(`${gameDir}/`, "");
      }
    } catch {}

    // Return the local path and detected entry path
    return { basePath: `/uploads/games/${slug}`, entryFilePath };
  }

  static async saveThumbnail(
    file: File,
    slug: string,
    type: "cover" | "icon"
  ): Promise<string> {
    await FileService.ensureDirectories();

    const ext = extname(file.name);
    const filename = `${type}${ext}`;
    const thumbnailPath = join(
      FileService.thumbnailsDir,
      `${slug}_${filename}`
    );

    const arrayBuffer = await file.arrayBuffer();
    await writeFile(thumbnailPath, Buffer.from(arrayBuffer));

    return `/uploads/thumbnails/${slug}_${filename}`;
  }

  private static async extractZip(
    zipPath: string,
    extractPath: string
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const readStream = createReadStream(zipPath);

      readStream
        .pipe(Extract({ path: extractPath }))
        .on("close", () => {
          // Clean up the ZIP file after extraction
          unlink(zipPath).catch(console.error);
          resolve();
        })
        .on("error", reject);
    });
  }

  // Prefer real game entry over documentation:
  // - Deprioritize paths containing: documentation, docs, manual, guide, help
  // - Prioritize folders: html5, build, dist, public, www, webgl
  // - Inspect file content for known engines (Construct c3runtime.js, Phaser, UnityLoader, Godot)
  private static async pickBestIndexHtml(dir: string): Promise<string | null> {
    const candidates: string[] = [];
    const queue: string[] = [dir];
    while (queue.length) {
      const current = queue.shift() as string;
      const entries = await readdir(current, { withFileTypes: true });
      for (const entry of entries) {
        const full = join(current, entry.name);
        if (entry.isFile() && entry.name.toLowerCase() === "index.html") {
          candidates.push(full);
        } else if (entry.isDirectory()) {
          queue.push(full);
        }
      }
    }
    if (candidates.length === 0) return null;

    const lowerBad = ["documentation", "docs", "manual", "guide", "help"];
    const preferDirs = ["html5", "build", "dist", "public", "www", "webgl"];

    let bestScore = Number.NEGATIVE_INFINITY;
    let bestPath = candidates[0];
    for (const p of candidates) {
      let score = 0;
      const pl = p.toLowerCase();
      if (
        preferDirs.some((d) => pl.includes(`\\${d}\\`) || pl.includes(`/${d}/`))
      )
        score += 5;
      if (
        lowerBad.some((d) => pl.includes(`\\${d}\\`) || pl.includes(`/${d}/`))
      )
        score -= 5;
      // Shallower paths are better
      score -= pl.split(/[/\\]/).length - dir.split(/[/\\]/).length;
      // Content-based signals
      try {
        const html = await readFile(p, "utf8");
        if (/c3runtime\.js|construct|phaser|unity|godot/i.test(html))
          score += 10;
        if (
          /table of contents|documentation|changelog|support policy/i.test(html)
        )
          score -= 8;
      } catch {}
      if (score > bestScore) {
        bestScore = score;
        bestPath = p;
      }
    }
    return bestPath;
  }

  static async deleteGameFiles(slug: string): Promise<void> {
    try {
      const gameDir = join(FileService.gamesDir, slug);

      // Delete game directory
      await FileService.deleteDirectory(gameDir);

      // Delete thumbnails
      const thumbnails = await readdir(FileService.thumbnailsDir);
      for (const thumbnail of thumbnails) {
        if (thumbnail.startsWith(slug)) {
          await unlink(join(FileService.thumbnailsDir, thumbnail));
        }
      }
    } catch (error) {
      console.error("Error deleting game files:", error);
    }
  }

  private static async deleteDirectory(dirPath: string): Promise<void> {
    try {
      const files = await readdir(dirPath);
      for (const file of files) {
        const filePath = join(dirPath, file);
        await unlink(filePath);
      }
      await rmdir(dirPath);
    } catch (error) {
      console.error("Error deleting directory:", error);
    }
  }
}

// Helper function to remove directory
async function rmdir(path: string): Promise<void> {
  const { rmdir } = await import("node:fs/promises");
  return rmdir(path);
}
