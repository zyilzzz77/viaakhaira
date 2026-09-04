export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Gunakan POST untuk analisa makanan." });
  }

  const apiKey = process.env.KENARI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: "KENARI_API_KEY belum diset di Env Vars Vercel."
    });
  }

  const { food, frequency, sugar, timing } = req.body || {};
  if (typeof food !== "string" || food.trim().length < 2) {
    return res.status(400).json({ error: "Nama makanan/minuman/benda belum jelas." });
  }
  if (food.length > 200) {
    return res.status(400).json({ error: "Nama terlalu panjang. Singkatkan dulu." });
  }

  const prompt =
    "Kamu asisten edukasi kesehatan gigi. Bahasa Indonesia santai dan singkat. " +
    `Pengguna menanyakan: "${food.trim()}" ` +
    `(frekuensi: ${frequency || "tidak diketahui"}, tambahan gula: ${sugar || "tidak diketahui"}, waktu konsumsi: ${timing || "tidak diketahui"}). ` +
    "Ini bisa berupa makanan, minuman, atau benda/kebiasaan (misal es batu, kuku, pulpen, merokok). " +
    "JANGAN tampilkan proses berpikirmu. Langsung jawab final dengan format persis ini: " +
    "EFEK: 1-2 kalimat efek ke gigi (karies, erosi email, noda, patah/retak, luka gusi). " +
    "SKOR: angka 0-100 (0 = aman, 100 = sangat berbahaya bagi gigi) + label risiko (rendah/sedang/tinggi/sangat tinggi). " +
    "SARAN: 2 saran singkat agar lebih aman. " +
    "Tutup dengan: Ini edukasi, bukan diagnosis dokter gigi.";

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000);

    const response = await fetch("https://kenari.id/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "hy3:free",
        max_tokens: 700,
        temperature: 0.4,
        reasoning_effort: "low",
        messages: [{ role: "user", content: prompt }]
      }),
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      return res.status(502).json({
        error: "AI makanan gagal menjawab. Coba lagi sebentar.",
        detail: detail.slice(0, 300)
      });
    }

    const data = await response.json();
    const message = data?.choices?.[0]?.message;
    const content = message?.content || message?.reasoning_content || message?.reasoning;
    if (!content || !String(content).match(/SKOR|EFEK/i)) {
      return res.status(502).json({
        error: "AI tidak mengembalikan hasil. Coba kata kunci lain."
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
