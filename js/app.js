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

let cameraStream = null;
let photoSource = null;

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
    showError("Kamera tidak dapat diakses. Pastikan izin kamera sudah diberikan di browser.");
  }
}

function capturePhoto() {
  const context = canvas.getContext("2d");

  canvas.width = camera.videoWidth || 640;
  canvas.height = camera.videoHeight || 480;
  context.drawImage(camera, 0, 0, canvas.width, canvas.height);

  camera.pause();
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

  if (file.size > 8 * 1024 * 1024) {
    showError("Ukuran foto terlalu besar. Pilih file maksimal 8 MB.");
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
  hide(canvas);
  canvas.classList.remove("visible");
  hide(photoResult);
  hide(photoName);
  hide(analyzeButton);
  hide(resetButton);
  clearError();
  analyzeButton.disabled = false;
  analyzeButton.textContent = "✨ Analisa dengan AI";

  photoName.textContent = "";

  if (photoSource === "camera" && cameraStream) {
    camera.play();
    show(camera);
    show(captureButton);
  } else {
    photoSource = null;
    show(placeholder);
    show(startCameraButton);
  }
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
  "Membaca warna & plak (OCR visual)…",
  "Menilai kebersihan gigi…",
  "Menyusun skor & saran…"
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

  photoResult.innerHTML = `
    <h3>🤖 AI sedang menganalisa…</h3>
    <div class="ai-scan" aria-hidden="true">
      <div class="ai-orbs"><i></i><i></i><i></i></div>
      <div class="ai-ring"></div>
      <div class="ai-ring delay"></div>
      <div class="ai-scan-bar"></div>
      <span class="ai-tooth">🦷</span>
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
  if (score == null) return { label: "Skrining selesai", levelClass: "medium" };
  if (score >= 78) return { label: "Baik", levelClass: "low" };
  if (score >= 55) return { label: "Cukup", levelClass: "medium" };
  if (score >= 35) return { label: "Perlu perhatian", levelClass: "high" };
  return { label: "Segera ke dokter gigi", levelClass: "very-high" };
}

function renderAiReport(result, score) {
  const level = scoreLevel(score);
  const safeText = escapeHtml(result).replace(/\n/g, "<br>");

  photoResult.innerHTML = `
    <h3>🦷 Hasil Analisa AI</h3>
    <div class="quality-summary">
      <strong>
        Skor kebersihan:
        <span class="risk-label ${level.levelClass}">${score == null ? level.label : score + "/100 · " + level.label}</span>
      </strong>
    </div>
    <div class="risk-meter" aria-label="Skor kebersihan gigi ${score == null ? "" : score + " dari 100"}">
      <span class="${level.levelClass}" style="width: ${score == null ? 100 : score}%"></span>
    </div>
    <div class="ai-result-text">${safeText}</div>
    <p class="result-note">
      <strong>Ini skrining edukasi, bukan diagnosis dokter gigi.</strong>
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
    renderPhotoReport(quality);
    showError("Foto terlalu gelap/buram. Perbaiki pencahayaan lalu klik Analisa dengan AI lagi.");
    return;
  }

  analyzeButton.disabled = true;
  analyzeButton.textContent = "⏳ Menganalisa…";
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
    showError(error.message || "AI gagal menganalisa foto. Coba lagi.");
    hide(photoResult);
  } finally {
    analyzeButton.disabled = false;
    analyzeButton.textContent = "✨ Analisa dengan AI";
  }
}

function runPhotoCheck() {
  photoResult.innerHTML = `
    <h3>Foto siap</h3>
    <p>Klik <strong>✨ Analisa dengan AI</strong> untuk skor kebersihan gigi dan saran.</p>
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
  const profile = matched || {
    icon: "🔎",
    title: "Analisis umum",
    effect: "Makanan ini belum ada di database. Risiko biasanya meningkat bila makanan sering manis, asam, lengket, atau mudah terselip.",
    tip: "Masukkan nama yang lebih sederhana atau perhatikan kandungan gula, keasaman, dan seberapa sering dikonsumsi.",
    traits: ["belum dikenali"],
    baseRisk: 35
  };

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

  let level = "Risiko rendah";
  let levelClass = "low";

  if (score >= 75) {
    level = "Risiko sangat tinggi";
    levelClass = "very-high";
  } else if (score >= 55) {
    level = "Risiko tinggi";
    levelClass = "high";
  } else if (score >= 35) {
    level = "Risiko sedang";
    levelClass = "medium";
  }

  renderFoodResult(profile, Boolean(matched), score, level, levelClass);
}

function renderFoodResult(profile, known, score, level, levelClass) {
  const traits = profile.traits
    .map((trait) => `<span>${trait}</span>`)
    .join("");

  foodResultBox.innerHTML = `
    <div class="food-result-head">
      <span>${profile.icon}</span>
      <div>
        <small>${known ? "Kategori ditemukan" : "Belum ada data khusus"}</small>
        <h3>${profile.title}</h3>
      </div>
    </div>
    <div class="risk-row">
      <div>
        <strong>Perkiraan dampak:</strong>
        <span class="risk-label ${levelClass}">${level}</span>
      </div>
      <div class="risk-meter" aria-label="Skor perkiraan risiko ${score} dari 100">
        <span class="${levelClass}" style="width: ${score}%"></span>
      </div>
    </div>
    <div class="trait-list">${traits}</div>
    <p><strong>Efek ke gigi:</strong> ${profile.effect}</p>
    <p><strong>Saran:</strong> ${profile.tip}</p>
    <p class="result-note">
      Skor ini adalah perkiraan edukasi berdasarkan jenis makanan dan
      kebiasaan konsumsi, bukan pemeriksaan atau diagnosis dokter gigi.
    </p>
  `;

  show(foodResultBox);
}

function renderBasicImpacts() {
  const container = document.getElementById("basic-impact-list");

  window.basicFoodImpacts.forEach(function (item) {
    const article = document.createElement("article");
    article.className = `basic-impact ${item.tone}`;

    const icon = document.createElement("span");
    icon.textContent = item.icon;

    const content = document.createElement("div");
    const title = document.createElement("h3");
    const description = document.createElement("p");

    title.textContent = item.name;
    description.textContent = item.impact;

    content.append(title, description);
    article.append(icon, content);
    container.append(article);
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
      calculateFoodResult();
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
  calculateFoodResult();
});

foodInput.addEventListener("input", calculateFoodResult);
frequencyInput.addEventListener("change", calculateFoodResult);
sugarInput.addEventListener("change", calculateFoodResult);
timingInput.addEventListener("change", calculateFoodResult);

window.addEventListener("beforeunload", stopCamera);

function initTypewriter() {
  const target = document.getElementById("typewriter");
  if (!target) return;

  const phrases = [
    "Rawat gigi, rawat hal yang paling penting",
    "Senyum sehat dimulai dari gigi bersih",
    "Cek gigi dengan AI, jaga tiap hari"
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
