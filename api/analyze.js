export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Gunakan POST untuk analisa foto." });
  }

  const apiKey = process.env.KENARI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: "KENARI_API_KEY belum diset di Env Vars Vercel."
    });
  }

  const { image } = req.body || {};
  if (typeof image !== "string" || !image.startsWith("data:image/")) {
    return res.status(400).json({ error: "Format foto tidak valid." });
  }
  if (image.length > 7_000_000) {
    return res.status(400).json({
      error: "Foto terlalu besar. Gunakan foto di bawah ~5 MB."
    });
  }

  const prompt =
    "Kamu OCR visual gigi. Jawab final saja, Bahasa Indonesia santai. " +
    "Format persis: HASIL OCR: jumlah gigi terlihat, warna, plak/karang, lubang, gusi. " +
    "KEMUNGKINAN: list kondisi edukatif yang terlihat (misal plak, karang, perubahan warna, kemungkinan karies, radang gusi). " +
    "SKOR: angka 0-100 + 2-3 saran singkat agar gigi lebih baik. " +
    "Tutup dengan: Ini skrining edukasi, bukan diagnosis dokter.";

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 90000);

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

    clearTimeout(timeout);

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      return res.status(502).json({
        error: "AI gagal menganalisa foto. Coba lagi sebentar.",
        detail: detail.slice(0, 300)
      });
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content) {
      return res.status(502).json({
        error: "AI tidak mengembalikan hasil. Coba foto lain yang lebih jelas."
      });
    }

    const scoreMatch = content.match(/SKOR\s*:?\s*(\d{1,3})/i);
    const score = scoreMatch
      ? Math.max(0, Math.min(100, Number(scoreMatch[1])))
      : null;

    return res.status(200).json({ result: content, score });
  } catch (error) {
    return res.status(502).json({
      error: "Koneksi ke AI gagal atau timeout. Coba lagi."
    });
  }
}
