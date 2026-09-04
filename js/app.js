"use strict";

const camera = document.getElementById("camera");
const canvas = document.getElementById("photo-canvas");
const placeholder = document.getElementById("camera-placeholder");
const startCameraButton = document.getElementById("start-camera");
const captureButton = document.getElementById("capture-photo");
const analyzeButton = document.getElementById("analyze-photo");
const resetButton = document.getElementById("reset-photo");
const uploadInput = document.getElementById("photo-upload");
const photoName = document.getElementById("photo-name");
const cameraError = document.getElementById("camera-error");
const photoResult = document.getElementById("photo-result");

const foodForm = document.getElementById("food-form");
const foodInput = document.getElementById("food-input");
const frequencyInput = document.getElementById("frequency");
const sugarInput = document.getElementById("sugar");
const timingInput = document.getElementById("timing");
const foodResultBox = document.getElementById("food-result");

const cameraStage = document.querySelector(".camera-stage");
const stageBadge = document.getElementById("stage-badge");

let cameraStream = null;
let photoSource = null;

function setStageState(state, badgeText) {
  if (cameraStage) {
    cameraStage.setAttribute("data-state", state);
  }
  if (stageBadge) {
    if (badgeText) {
      stageBadge.textContent = badgeText;
      show(stageBadge);
    } else {
      hide(stageBadge);
    }
  }
}

function show(element) {
  element.classList.remove("hidden");
}

function hide(element) {
  element.classList.add("hidden");
}

function stopCamera() {
  if (cameraStream) {
    cameraStream.getTracks().forEach((track) => track.stop());
  }

  cameraStream = null;
  camera.srcObject = null;
}

function showError(message) {
  cameraError.textContent = message;
  show(cameraError);
}

function clearError() {
  cameraError.textContent = "";
  hide(cameraError);
}

async function startCamera() {
  try {
    clearError();
    stopCamera();

    cameraStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user" },
      audio: false
    });

    camera.srcObject = cameraStream;
    photoSource = "camera";

    setStageState("live", "Kamera aktif");
    show(camera);
    hide(canvas);
    canvas.classList.remove("visible");
    hide(placeholder);
    hide(startCameraButton);
    show(captureButton);
    hide(analyzeButton);
    hide(resetButton);
    hide(photoResult);
  } catch (error) {
    setStageState("empty");
    showError("Kamera tidak dapat diakses. Pastikan izin kamera sudah diberikan di browser.");
  }
}

function capturePhoto() {
  const context = canvas.getContext("2d");

  canvas.width = camera.videoWidth || 640;
  canvas.height = camera.videoHeight || 480;
  context.drawImage(camera, 0, 0, canvas.width, canvas.height);

  camera.pause();
  setStageState("selected", "Foto dari kamera");
  hide(camera);
  show(canvas);
  canvas.classList.add("visible");
  hide(captureButton);
  show(analyzeButton);
  show(resetButton);
  clearError();
  runPhotoCheck();
}

function loadUploadedPhoto(file) {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    showError("Format belum didukung. Pilih foto JPG, PNG, atau WebP.");
    return;
  }

  if (file.size > 10 * 1024 * 1024) {
    showError("Ukuran foto terlalu besar. Pilih file maksimal 10 MB.");
    return;
  }

  const imageUrl = URL.createObjectURL(file);
  const image = new Image();

  image.onload = function () {
    const scale = Math.min(
      1,
      1200 / Math.max(image.naturalWidth, image.naturalHeight)
    );

    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);

    stopCamera();
    photoSource = "upload";
    photoName.textContent = `Foto dipilih: ${file.name}`;

    setStageState("selected", "Foto dari galeri");
    clearError();
    hide(camera);
    hide(placeholder);
    hide(startCameraButton);
    hide(captureButton);
    show(canvas);
    canvas.classList.add("visible");
    show(photoName);
    show(analyzeButton);
    show(resetButton);
    runPhotoCheck();
    URL.revokeObjectURL(imageUrl);
  };

  image.onerror = function () {
    showError("Foto tidak dapat dibaca. Coba pilih file lain.");
    URL.revokeObjectURL(imageUrl);
  };

  image.src = imageUrl;
}

function resetPhoto() {
  stopCamera();
  hide(canvas);
  canvas.classList.remove("visible");
  hide(camera);
  hide(photoResult);
  hide(photoName);
  hide(analyzeButton);
  hide(resetButton);
  hide(captureButton);
  clearError();
  setStageState("empty");
  analyzeButton.disabled = false;
  analyzeButton.textContent = "Analisa dengan AI";

  photoName.textContent = "";
  photoSource = null;
  show(placeholder);
  show(startCameraButton);
}

function inspectPhotoQuality() {
  const sample = document.createElement("canvas");
  sample.width = 128;
  sample.height = 128;

  const context = sample.getContext("2d", { willReadFrequently: true });

  if (!context) {
    return {
      score: 0,
      level: "Perlu foto ulang",
      levelClass: "high",
      brightness: "Tidak terbaca",
      contrast: "Tidak terbaca",
      sharpness: "Tidak terbaca",
      findings: ["Browser tidak dapat membaca kualitas foto ini."]
    };
  }

  context.drawImage(canvas, 0, 0, sample.width, sample.height);

  const pixels = context.getImageData(
    0,
    0,
    sample.width,
    sample.height
  ).data;

  const grays = new Float32Array(sample.width * sample.height);
  let total = 0;

  for (let index = 0, pixel = 0; index < pixels.length; index += 4, pixel += 1) {
    const gray =
      pixels[index] * 0.299 +
      pixels[index + 1] * 0.587 +
      pixels[index + 2] * 0.114;

    grays[pixel] = gray;
    total += gray;
  }

  const mean = total / grays.length;
  let variance = 0;
  let edgeTotal = 0;
  let edgeCount = 0;

  for (let y = 0; y < sample.height; y += 1) {
    for (let x = 0; x < sample.width; x += 1) {
      const index = y * sample.width + x;
      variance += (grays[index] - mean) ** 2;

      if (x > 0) {
        edgeTotal += Math.abs(grays[index] - grays[index - 1]);
        edgeCount += 1;
      }

      if (y > 0) {
        edgeTotal += Math.abs(grays[index] - grays[index - sample.width]);
        edgeCount += 1;
      }
    }
  }

  const contrastValue = Math.sqrt(variance / grays.length);
  const sharpnessValue = edgeCount ? edgeTotal / edgeCount : 0;
  const findings = [];
  let score = 100;

  if (mean < 55) {
    findings.push("Foto terlalu gelap. Tambahkan cahaya dari arah depan.");
    score -= 38;
  } else if (mean > 220) {
    findings.push("Foto terlalu terang. Kurangi pantulan lampu atau flash.");
    score -= 32;
  }

  if (contrastValue < 24) {
    findings.push("Kontras foto rendah sehingga batas gigi kurang jelas.");
    score -= 24;
  }

  if (sharpnessValue < 10) {
    findings.push("Foto kemungkinan buram. Stabilkan kamera dan fokuskan ke gigi.");
    score -= 30;
  }

  if (canvas.width < 480 || canvas.height < 360) {
    findings.push("Resolusi foto rendah. Gunakan gambar yang lebih besar.");
    score -= 18;
  }

  score = Math.max(5, Math.min(100, score));

  if (findings.length === 0) {
    findings.push("Pencahayaan dan ketajaman foto cukup baik untuk dokumentasi awal.");
  }

  return {
    score,
    level: score >= 78 ? "Baik" : score >= 52 ? "Cukup" : "Perlu foto ulang",
    levelClass: score >= 78 ? "low" : score >= 52 ? "medium" : "high",
    brightness: mean < 55 ? "Terlalu gelap" : mean > 220 ? "Terlalu terang" : "Cukup",
    contrast: contrastValue < 24 ? "Rendah" : "Cukup",
    sharpness: sharpnessValue < 10 ? "Kemungkinan buram" : "Cukup tajam",
    findings
  };
}

const AI_STEPS = [
  "Menyiapkan foto…",
  "Mendeteksi area gigi…",
  "Membaca warna dan permukaan gigi…",
  "Menyusun estimasi visual…",
  "Menyiapkan saran perawatan dasar…"
];

let aiStepTimer = null;

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function showAnalyzing() {
  let stepIndex = 0;
  setStageState("analyzing", "Menganalisis…");

  photoResult.innerHTML = `
    <h3>Menganalisis foto…</h3>
    <div class="ai-scan photo-thinking" aria-hidden="true">
      <div class="ai-scan-bar"></div>
      <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#1E7195" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
        <circle cx="12" cy="13" r="4"/>
      </svg>
    </div>
    <p id="ai-step" class="ai-step-text loading">${AI_STEPS[0]}</p>
    <div class="risk-meter ai-progress-track"><span class="medium ai-progress"></span></div>
    <p class="result-note">Jangan tutup halaman ini. Biasanya selesai dalam 10–30 detik.</p>
  `;
  show(photoResult);

  const stepEl = document.getElementById("ai-step");
  if (aiStepTimer) window.clearInterval(aiStepTimer);
  aiStepTimer = window.setInterval(function () {
    if (stepEl) {
      stepEl.classList.add("swap");
      window.setTimeout(function () {
        stepIndex = (stepIndex + 1) % AI_STEPS.length;
        stepEl.textContent = AI_STEPS[stepIndex];
        stepEl.classList.remove("swap");
      }, 220);
    }
  }, 2000);
}

function stopAnalyzing() {
  if (aiStepTimer) window.clearInterval(aiStepTimer);
  aiStepTimer = null;
}

function scoreLevel(score) {
  if (score == null) return { label: "Estimasi selesai", levelClass: "medium" };
  if (score >= 78) return { label: "Tampak baik", levelClass: "low" };
  if (score >= 55) return { label: "Cukup", levelClass: "medium" };
  if (score >= 35) return { label: "Perlu perhatian", levelClass: "high" };
  return { label: "Disarankan ke dokter gigi", levelClass: "very-high" };
}

function renderAiReport(result, score) {
  const level = scoreLevel(score);
  const safeText = escapeHtml(result).replace(/\n/g, "<br>");

  setStageState("done", "Hasil siap");
  photoResult.innerHTML = `
    <h3>Hasil estimasi visual</h3>
    <div class="quality-summary">
      <strong>
        Estimasi kondisi visual:
        <span class="risk-label ${level.levelClass}">${score == null ? level.label : score + "/100 · " + level.label}</span>
      </strong>
    </div>
    <div class="risk-meter" aria-label="Estimasi kondisi visual gigi ${score == null ? "" : score + " dari 100"}">
      <span class="${level.levelClass}" style="width: ${score == null ? 100 : score}%"></span>
    </div>
    <div class="ai-result-text">${safeText}</div>
    <p class="result-note">
      <strong>Indikasi awal dari foto, bukan diagnosis.</strong>
      Jika ada nyeri, bengkak, perdarahan gusi, lubang, atau bercak yang menetap,
      periksakan langsung ke dokter gigi.
    </p>
  `;
}

async function analyzePhoto() {
  clearError();

  if (!canvas.width || !canvas.classList.contains("visible")) {
    showError("Ambil atau pilih foto gigi dulu sebelum klik analisa.");
    return;
  }

  const quality = inspectPhotoQuality();
  if (quality.score < 40) {
    setStageState("selected", "Foto perlu diperbaiki");
    renderPhotoReport(quality);
    showError("Foto terlalu gelap/buram. Perbaiki pencahayaan lalu klik Analisa dengan AI lagi.");
    return;
  }

  analyzeButton.disabled = true;
  analyzeButton.textContent = "Menganalisis…";
  showAnalyzing();

  try {
    const image = canvas.toDataURL("image/jpeg", 0.85);
    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image })
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.error || "AI gagal menganalisa foto.");
    }

    stopAnalyzing();
    renderAiReport(data.result, data.score);
  } catch (error) {
    stopAnalyzing();
    setStageState("selected", "Foto siap");
    showError(error.message || "AI gagal menganalisa foto. Coba lagi.");
    hide(photoResult);
  } finally {
    analyzeButton.disabled = false;
    analyzeButton.textContent = "Analisa dengan AI";
  }
}

function runPhotoCheck() {
  photoResult.innerHTML = `
    <h3>Foto siap</h3>
    <p>Klik <strong>Analisa dengan AI</strong> untuk estimasi kondisi visual dan saran perawatan dasar.</p>
  `;
  show(photoResult);
}

function renderPhotoReport(report) {
  const findings = report.findings
    .map((finding) => `<li>${finding}</li>`)
    .join("");

  photoResult.innerHTML = `
    <h3>Hasil pemeriksaan kualitas foto</h3>
    <div class="quality-summary">
      <strong>
        Kualitas:
        <span class="risk-label ${report.levelClass}">${report.level}</span>
      </strong>
      <span>${report.score}/100</span>
    </div>
    <div class="quality-grid">
      <div><small>Pencahayaan</small><strong>${report.brightness}</strong></div>
      <div><small>Kontras</small><strong>${report.contrast}</strong></div>
      <div><small>Ketajaman</small><strong>${report.sharpness}</strong></div>
    </div>
    <ul class="quality-findings">${findings}</ul>
    <p class="result-note">
      <strong>Tidak ada diagnosis dari foto ini.</strong>
      Jika ada nyeri, bengkak, perdarahan gusi, atau bercak yang menetap,
      periksakan langsung ke dokter gigi.
    </p>
  `;
}

function findFoodProfile(value) {
  const input = value.toLowerCase().trim();
  const candidates = [];

  window.foodDatabase.forEach(function (profile) {
    profile.keywords.forEach(function (keyword) {
      if (input.includes(keyword)) {
        candidates.push({ profile, keyword });
      }
    });
  });

  candidates.sort(function (first, second) {
    return second.keyword.length - first.keyword.length;
  });

  return candidates.length ? candidates[0].profile : null;
}

function calculateFoodResult() {
  const value = foodInput.value.trim();

  if (value.length < 2) {
    hide(foodResultBox);
    return;
  }

  const matched = findFoodProfile(value);
  if (!matched) {
    analyzeFoodAI();
    return;
  }
  const profile = matched;

  const frequencyModifier = {
    jarang: -4,
    harian: 9,
    sering: 18
  }[frequencyInput.value];

  const sugarModifier = {
    tidak: -6,
    tidak_tahu: 0,
    ya: 14
  }[sugarInput.value];

  const timingModifier = timingInput.value === "selingan" ? 8 : -4;
  const score = Math.max(
    3,
    Math.min(
      95,
      profile.baseRisk + frequencyModifier + sugarModifier + timingModifier
    )
  );

  let level = "Dampak relatif rendah";
  let levelClass = "low";

  if (score >= 75) {
    level = "Dampak relatif sangat tinggi";
    levelClass = "very-high";
  } else if (score >= 55) {
    level = "Dampak relatif tinggi";
    levelClass = "high";
  } else if (score >= 35) {
    level = "Dampak relatif sedang";
    levelClass = "medium";
  }

  renderFoodResult(foodInput.value.trim(), profile, score, level, levelClass);
}

function handleFoodAnalyze() {
  const value = foodInput.value.trim();

  if (value.length < 2) {
    foodResultBox.innerHTML = `
      <p><strong>Masukkan dulu</strong> makanan, minuman, atau kebiasaan yang ingin kamu cek — minimal 2 huruf.</p>
    `;
    show(foodResultBox);
    return;
  }

  const matched = findFoodProfile(value);
  if (matched) {
    calculateFoodResult();
    return;
  }

  analyzeFoodAI();
}

function renderFoodResult(value, profile, score, level, levelClass) {
  foodResultBox.innerHTML = `
    <p class="result-eyebrow">Hasil analisis</p>
    <h3 class="result-item">${escapeHtml(value)}</h3>
    <p class="result-status">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 11.1V12a10 10 0 1 1-5.9-9.1"/><path d="M22 4L12 14l-3-3"/></svg>
      Analisis selesai
    </p>
    <div class="score-card">
      <div class="score-circle ${levelClass}">${score}</div>
      <div class="score-body">
        <strong class="score-risk ${levelClass}">${level}</strong>
        <p class="score-line">Skor indikatif: ${score}/100</p>
        <p class="score-hint">Semakin tinggi skor, semakin besar potensi dampaknya pada gigi.</p>
        <div class="risk-meter score-meter" aria-label="Skor dampak ${score} dari 100">
          <span class="${levelClass}" style="width: ${score}%"></span>
        </div>
      </div>
    </div>
    <section class="result-section"><h4>Efek pada gigi</h4><p>${escapeHtml(profile.effect)}</p></section>
    <section class="result-section"><h4>Saran</h4><p>${escapeHtml(profile.tip)}</p></section>
    <section class="result-about">
      <h4>Tentang hasil ini</h4>
      <p>Penilaian dibuat berdasarkan informasi yang kamu masukkan. Hasil ini bersifat edukatif dan bukan diagnosis dokter gigi.</p>
    </section>
  `;

  foodResultBox.classList.remove("anim-in");
  void foodResultBox.offsetWidth;
  foodResultBox.classList.add("anim-in");
  show(foodResultBox);
}

const FOOD_AI_STEPS = [
  "Memeriksa input kamu…",
  "Menilai pengaruh ke gigi…",
  "Menyusun estimasi risiko…",
  "Menyiapkan saran…"
];

let foodAiStepTimer = null;
let foodAiLoading = false;

function stopFoodThinking() {
  if (foodAiStepTimer) window.clearInterval(foodAiStepTimer);
  foodAiStepTimer = null;
}

function showFoodThinking() {
  let stepIndex = 0;

  foodResultBox.innerHTML = `
    <div class="food-result-head food-result-head-plain">
      <div>
        <small>Memeriksa…</small>
        <h3>"${escapeHtml(foodInput.value.trim())}" sedang dicek</h3>
      </div>
    </div>
    <div class="ai-scan food-thinking" aria-hidden="true">
      <div class="ai-scan-bar"></div>
      <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#1E7195" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
    </div>
    <p id="food-ai-step" class="ai-step-text loading">${FOOD_AI_STEPS[0]}</p>
    <div class="risk-meter ai-progress-track"><span class="medium ai-progress"></span></div>
    <p class="result-note">Jangan tutup halaman ini. Biasanya selesai dalam beberapa detik.</p>
  `;
  show(foodResultBox);

  const stepEl = document.getElementById("food-ai-step");
  if (foodAiStepTimer) window.clearInterval(foodAiStepTimer);
  foodAiStepTimer = window.setInterval(function () {
    if (stepEl) {
      stepEl.classList.add("swap");
      window.setTimeout(function () {
        stepIndex = (stepIndex + 1) % FOOD_AI_STEPS.length;
        stepEl.textContent = FOOD_AI_STEPS[stepIndex];
        stepEl.classList.remove("swap");
      }, 220);
    }
  }, 1600);
}

function foodRiskLevel(score) {
  if (score == null) return { label: "Selesai dianalisis", levelClass: "medium" };
  if (score <= 20) return { label: "Dampak relatif rendah", levelClass: "low" };
  if (score < 40) return { label: "Dampak relatif sedang", levelClass: "medium" };
  if (score < 70) return { label: "Dampak relatif tinggi", levelClass: "high" };
  return { label: "Dampak relatif sangat tinggi", levelClass: "very-high" };
}

function parseFoodAi(text) {
  const raw = String(text || "");
  const clean = function (s) {
    return String(s || "")
      .replace(/^[\s:–-]+/, "")
      .trim();
  };
  const efekMatch = raw.match(/EFEK\s*:([\s\S]*?)(?=SKOR\s*:|SARAN\s*:|$)/i);
  const saranMatch = raw.match(/SARAN\s*:([\s\S]*?)(?=Ini edukasi|$)/i);
  return {
    efek: clean(efekMatch ? efekMatch[1] : ""),
    saran: clean(saranMatch ? saranMatch[1] : "")
  };
}

function foodAdviceList(html) {
  const parts = String(html || "")
    .split(/<br\s*\/?>/i)
    .map((part) => part.replace(/^[•\-\d.)\s]+/, "").trim())
    .filter(Boolean);
  if (parts.length <= 1) return null;
  return `<ul class="advice-list">${parts.map((part) => `<li>${part}</li>`).join("")}</ul>`;
}

function renderFoodAiReport(value, aiResult, aiScore, aiSourceNote) {
  const level = foodRiskLevel(aiScore);
  const parsed = parseFoodAi(aiResult);
  const safeValue = escapeHtml(value);
  const efekHtml = parsed.efek
    ? escapeHtml(parsed.efek).replace(/\n/g, "<br>")
    : escapeHtml(aiResult).replace(/\n/g, "<br>");
  const saranHtml = parsed.saran
    ? escapeHtml(parsed.saran).replace(/\n/g, "<br>")
    : "";
  const saranList = foodAdviceList(saranHtml);
  const saranBlock = saranHtml
    ? `<section class="result-section"><h4>Saran</h4>${saranList || `<p>${saranHtml}</p>`}</section>`
    : "";
  const sourceNote = aiSourceNote
    ? `<p class="source-note">Sumber analisis: estimasi AI.</p>`
    : "";

  foodResultBox.innerHTML = `
    <p class="result-eyebrow">Hasil analisis</p>
    <h3 class="result-item">${safeValue}</h3>
    <p class="result-status">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 11.1V12a10 10 0 1 1-5.9-9.1"/><path d="M22 4L12 14l-3-3"/></svg>
      Analisis selesai
    </p>
    <div class="score-card">
      <div class="score-circle ${level.levelClass}">${aiScore == null ? "?" : aiScore}</div>
      <div class="score-body">
        <strong class="score-risk ${level.levelClass}">${level.label}</strong>
        <p class="score-line">Skor indikatif: ${aiScore == null ? "—" : aiScore + "/100"}</p>
        <p class="score-hint">Semakin tinggi skor, semakin besar potensi dampaknya pada gigi.</p>
        <div class="risk-meter score-meter" aria-label="Skor dampak ${aiScore == null ? "" : aiScore + " dari 100"}">
          <span class="${level.levelClass}" style="width: ${aiScore == null ? 100 : aiScore}%"></span>
        </div>
      </div>
    </div>
    <section class="result-section"><h4>Efek pada gigi</h4><p>${efekHtml}</p></section>
    ${saranBlock}
    <section class="result-about">
      <h4>Tentang hasil ini</h4>
      <p>Penilaian dibuat berdasarkan informasi yang kamu masukkan. Hasil ini bersifat edukatif dan bukan diagnosis dokter gigi.</p>
      ${sourceNote}
    </section>
  `;
  foodResultBox.classList.remove("anim-in");
  void foodResultBox.offsetWidth;
  foodResultBox.classList.add("anim-in");
  show(foodResultBox);
}

async function analyzeFoodAI() {
  const value = foodInput.value.trim();
  const button = document.getElementById("food-ai-button");

  if (value.length < 2) {
    foodResultBox.innerHTML = `
      <p><strong>Masukkan dulu</strong> makanan, minuman, atau kebiasaan yang ingin kamu cek — minimal 2 huruf.</p>
    `;
    show(foodResultBox);
    return;
  }

  if (foodAiLoading) return;
  foodAiLoading = true;
  if (button) {
    button.disabled = true;
    button.textContent = "Memeriksa…";
  }
  showFoodThinking();

  try {
    const controller = new AbortController();
    const foodTimeout = window.setTimeout(function () {
      controller.abort();
    }, 65000);

    const response = await fetch("/api/food", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        food: value,
        frequency: frequencyInput.value,
        sugar: sugarInput.value,
        timing: timingInput.value
      }),
      signal: controller.signal
    });

    window.clearTimeout(foodTimeout);

    const data = await response.json().catch(() => ({}));

    if (response.status === 404) {
      throw new Error(
        "Endpoint /api/food tidak ketemu. Restart node server.js, atau redeploy Vercel biar api/food.js ikut naik."
      );
    }

    if (!response.ok) {
      throw new Error(data.error || "Pemeriksaan gagal. Coba lagi.");
    }

    stopFoodThinking();
    renderFoodAiReport(value, data.result, data.score, true);
  } catch (error) {
    stopFoodThinking();
    const isAbort = error && error.name === "AbortError";
    const isFetchFail =
      error instanceof TypeError ||
      String((error && error.message) || "").includes("Failed to fetch");
    const message = isAbort
      ? "Pemeriksaan memakan waktu terlalu lama. Coba lagi."
      : isFetchFail
        ? "Tidak bisa terhubung ke server. Periksa koneksi lalu coba lagi."
        : error.message || "Coba lagi.";
    foodResultBox.innerHTML = `
      <div class="food-result-head food-result-head-plain">
        <div>
          <small>Gagal</small>
          <h3>Tidak bisa menampilkan hasil</h3>
        </div>
      </div>
      <p>${escapeHtml(message)}</p>
    `;
    show(foodResultBox);
  } finally {
    foodAiLoading = false;
    if (button) {
      button.disabled = false;
      button.textContent = "Cek efek";
    }
  }
}

function renderBasicImpacts() {
  const container = document.getElementById("basic-impact-list");
  container.innerHTML = "";

  window.basicFoodImpacts.forEach(function (item) {
    const row = document.createElement("div");
    row.className = "food-example";

    const title = document.createElement("h4");
    const description = document.createElement("p");

    title.textContent = item.name;
    description.textContent = item.impact;

    row.append(title, description);
    container.append(row);
  });
}

function renderFoodSuggestions() {
  const container = document.getElementById("food-suggestions");

  window.foodSuggestions.forEach(function (suggestion) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = suggestion;

    button.addEventListener("click", function () {
      foodInput.value = suggestion;
      hide(foodResultBox);
      handleFoodAnalyze();
    });

    container.append(button);
  });
}

startCameraButton.addEventListener("click", startCamera);
captureButton.addEventListener("click", capturePhoto);
analyzeButton.addEventListener("click", analyzePhoto);
resetButton.addEventListener("click", resetPhoto);

uploadInput.addEventListener("change", function (event) {
  const file = event.target.files[0];
  event.target.value = "";

  if (file) {
    loadUploadedPhoto(file);
  }
});

foodForm.addEventListener("submit", function (event) {
  event.preventDefault();
  handleFoodAnalyze();
});

foodInput.addEventListener("input", function () {
  hide(foodResultBox);
});
frequencyInput.addEventListener("change", function () {
  hide(foodResultBox);
});
sugarInput.addEventListener("change", function () {
  hide(foodResultBox);
});
timingInput.addEventListener("change", function () {
  hide(foodResultBox);
});

window.addEventListener("beforeunload", stopCamera);

function initTypewriter() {
  const target = document.getElementById("typewriter");
  if (!target) return;

  const phrases = [
    "Rawat kesehatan gigi dengan lebih mudah.",
    "Senyum sehat dimulai dari gigi bersih.",
    "Cek gigi dan makanan dengan AI."
  ];

  let phraseIndex = 0;
  let charIndex = 0;
  let deleting = false;

  function tick() {
    const current = phrases[phraseIndex];

    if (deleting) {
      charIndex -= 1;
      target.textContent = current.slice(0, Math.max(0, charIndex));
      if (charIndex <= 0) {
        deleting = false;
        phraseIndex = (phraseIndex + 1) % phrases.length;
        window.setTimeout(tick, 500);
        return;
      }
      window.setTimeout(tick, 32);
    } else {
      const next = phrases[phraseIndex];
      charIndex += 1;
      target.textContent = next.slice(0, charIndex);
      if (charIndex >= next.length) {
        deleting = true;
        window.setTimeout(tick, 2600);
        return;
      }
      const char = next[charIndex - 1];
      let delay = 50 + Math.random() * 60;
      if (char === "," || char === ".") delay += 220;
      if (char === " ") delay = 40;
      window.setTimeout(tick, delay);
    }
  }

  window.setTimeout(tick, 2200);
}

renderBasicImpacts();
renderFoodSuggestions();
initTypewriter();
