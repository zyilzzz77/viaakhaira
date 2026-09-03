const fs = require("fs");
const http = require("http");
const path = require("path");

const root = __dirname;
const envPath = path.join(root, ".env");

if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, "utf8")
    .split(/\r?\n/)
    .forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) return;
      const index = trimmed.indexOf("=");
      const key = trimmed.slice(0, index).trim();
      const value = trimmed.slice(index + 1).trim();
      if (key && !process.env[key]) process.env[key] = value;
    });
}

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8"
};

function sendJson(res, status, data) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(data));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 10_000_000) reject(new Error("Body terlalu besar."));
    });
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

async function handleAnalyze(req, res) {
  const apiKey = process.env.KENARI_API_KEY;
  if (!apiKey) {
    return sendJson(res, 500, { error: "KENARI_API_KEY belum ada di .env" });
  }

  let payload = {};
  try {
    payload = JSON.parse(await readBody(req));
  } catch {
    return sendJson(res, 400, { error: "Body JSON tidak valid." });
  }

  const image = payload.image;
  if (typeof image !== "string" || !image.startsWith("data:image/")) {
    return sendJson(res, 400, { error: "Format foto tidak valid." });
  }

  const prompt =
    "Kamu OCR visual gigi. Jawab final saja, Bahasa Indonesia santai. " +
    "Format persis: HASIL OCR: jumlah gigi terlihat, warna, plak/karang, lubang, gusi. " +
    "KEMUNGKINAN: list kondisi edukatif yang terlihat (misal plak, karang, perubahan warna, kemungkinan karies, radang gusi). " +
    "SKOR: angka 0-100 + 2-3 saran singkat agar gigi lebih baik. " +
    "Tutup dengan: Ini skrining edukasi, bukan diagnosis dokter.";

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 90000);

  try {
    const response = await fetch("https://kenari.id/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "mistral-medium-3-5:free",
        max_tokens: 800,
        temperature: 0.2,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: image } }
            ]
          }
        ]
      }),
      signal: controller.signal
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      return sendJson(res, 502, {
        error: "AI gagal menganalisa foto. Coba lagi sebentar.",
        detail: detail.slice(0, 300)
      });
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content) {
      return sendJson(res, 502, {
        error: "AI tidak mengembalikan hasil. Coba foto lain yang lebih jelas."
      });
    }

    const match = content.match(/SKOR\s*:?\s*(\d{1,3})/i);
    const score = match ? Math.max(0, Math.min(100, Number(match[1]))) : null;
    return sendJson(res, 200, { result: content, score });
  } catch {
    return sendJson(res, 502, { error: "Koneksi ke AI gagal atau timeout. Coba lagi." });
  } finally {
    clearTimeout(timeout);
  }
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, "http://localhost");

  if (url.pathname === "/api/analyze") {
    if (req.method !== "POST") {
      return sendJson(res, 405, { error: "Gunakan POST untuk analisa foto." });
    }
    return handleAnalyze(req, res);
  }

  let filePath = path.join(root, decodeURIComponent(url.pathname));
  if (url.pathname === "/") filePath = path.join(root, "index.html");
  if (filePath === root) filePath = path.join(root, "index.html");

  const normalized = path.normalize(filePath);
  if (!normalized.startsWith(root)) {
    res.writeHead(403);
    return res.end("Forbidden");
  }
  if (normalized.endsWith(`${path.sep}.env`)) {
    res.writeHead(403);
    return res.end("Forbidden");
  }

  fs.readFile(normalized, (error, data) => {
    if (error) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      return res.end("File tidak ditemukan.");
    }
    res.writeHead(200, {
      "Content-Type": MIME[path.extname(normalized).toLowerCase()] || "application/octet-stream",
      "Cache-Control": "no-store, max-age=0"
    });
    res.end(data);
  });
});

const port = Number(process.env.PORT || 3000);
server.listen(port, () => {
  console.log(`Jalan di http://localhost:${port}`);
});
