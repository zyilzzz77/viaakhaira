"use strict";

window.basicFoodImpacts = [
  {
    icon: "🍬",
    name: "Permen & cokelat",
    impact: "Gula meningkatkan risiko gigi berlubang.",
    tone: "high"
  },
  {
    icon: "🥤",
    name: "Soda",
    impact: "Gula dan asam berisiko pada karies serta erosi email.",
    tone: "high"
  },
  {
    icon: "☕",
    name: "Kopi & teh",
    impact: "Dapat meninggalkan noda; gula tambahan meningkatkan risiko karies.",
    tone: "medium"
  },
  {
    icon: "🍊",
    name: "Jeruk & makanan asam",
    impact: "Terlalu sering dapat meningkatkan risiko erosi email.",
    tone: "medium"
  },
  {
    icon: "🍞",
    name: "Keripik & makanan berpati",
    impact: "Sisa makanan dapat mudah menempel atau terselip.",
    tone: "medium"
  },
  {
    icon: "💧",
    name: "Air putih",
    impact: "Membantu membilas sisa makanan tanpa gula tambahan.",
    tone: "low"
  }
];

window.foodDatabase = [
  {
    keywords: [
      "cokelat susu", "coklat susu", "permen cokelat", "cokelat",
      "coklat", "permen", "gulali", "marshmallow", "lollipop"
    ],
    icon: "🍫",
    title: "Makanan tinggi gula",
    effect: "Gula dapat digunakan bakteri plak untuk menghasilkan asam yang menyerang email dan meningkatkan risiko karies.",
    tip: "Lebih baik dikonsumsi bersama waktu makan, tidak sedikit-sedikit sepanjang hari, lalu minum air putih.",
    traits: ["tinggi gula", "risiko karies"],
    baseRisk: 68
  },
  {
    keywords: [
      "karamel", "dodol", "gummy", "permen jelly", "permen karet bergula",
      "selai", "madu", "kismis", "kurma", "buah kering", "manisan buah"
    ],
    icon: "🍬",
    title: "Manis dan lengket",
    effect: "Gula dan tekstur lengket membuat sisa makanan lebih lama berada di permukaan atau sela gigi.",
    tip: "Batasi frekuensinya, minum air setelah makan, dan bersihkan sela gigi dengan cara yang aman.",
    traits: ["tinggi gula", "lengket", "mudah terselip"],
    baseRisk: 78
  },
  {
    keywords: [
      "martabak manis", "terang bulan", "donat", "brownies", "cupcake",
      "kue", "cake", "biskuit", "cookies", "wafer", "roti manis",
      "pancake", "es krim", "puding", "cereal manis", "sereal manis"
    ],
    icon: "🍰",
    title: "Camilan manis dan berpati",
    effect: "Gabungan gula dan pati dapat menyediakan bahan bagi bakteri plak serta meninggalkan sisa di sela gigi.",
    tip: "Pilih porsi wajar bersama waktu makan dan hindari ngemil berulang dalam waktu lama.",
    traits: ["gula", "pati", "camilan"],
    baseRisk: 70
  },
  {
    keywords: [
      "soda diet", "cola zero", "soda zero",
      "minuman bersoda tanpa gula", "sparkling water rasa"
    ],
    icon: "🥤",
    title: "Minuman bersoda tanpa gula",
    effect: "Walau tanpa gula, sifat asamnya tetap dapat meningkatkan risiko erosi email jika sering diminum.",
    tip: "Minum air putih setelahnya dan jangan langsung menyikat gigi setelah minuman asam.",
    traits: ["asam", "risiko erosi"],
    baseRisk: 58
  },
  {
    keywords: [
      "soda", "cola", "soft drink", "minuman energi", "energy drink",
      "minuman olahraga", "sports drink", "minuman bersoda"
    ],
    icon: "🥤",
    title: "Minuman manis dan asam",
    effect: "Gula meningkatkan risiko karies, sedangkan keasaman dapat berkontribusi pada erosi email.",
    tip: "Air putih adalah pilihan utama. Hindari menyesap minuman ini terus-menerus sepanjang hari.",
    traits: ["tinggi gula", "asam", "risiko karies dan erosi"],
    baseRisk: 88
  },
  {
    keywords: [
      "boba", "thai tea", "teh manis", "kopi susu gula aren", "kopi susu",
      "frappuccino", "milkshake", "sirup", "es buah", "es campur",
      "susu kental manis", "susu cokelat", "susu rasa"
    ],
    icon: "🧋",
    title: "Minuman dengan gula tambahan",
    effect: "Gula cair mudah tersebar di seluruh mulut; kebiasaan menyesapnya lama-lama dapat memperpanjang paparan gula.",
    tip: "Kurangi tambahan gula dan habiskan bersama waktu makan, bukan diminum sedikit-sedikit berjam-jam.",
    traits: ["gula tambahan", "paparan lama"],
    baseRisk: 76
  },
  {
    keywords: [
      "jus jeruk", "jus lemon", "jus buah", "jus mangga", "jus apel",
      "smoothie", "minuman buah kemasan", "sari buah"
    ],
    icon: "🧃",
    title: "Jus atau smoothie",
    effect: "Buah yang dijus atau diblender melepaskan gula dari strukturnya; beberapa jenis juga cukup asam.",
    tip: "Konsumsi bersama waktu makan dan pilih buah utuh lebih sering.",
    traits: ["gula bebas", "dapat bersifat asam"],
    baseRisk: 62
  },
  {
    keywords: [
      "lemon", "jeruk nipis", "jeruk", "limau", "asam jawa",
      "nanas", "acar", "cuka", "saus tomat", "tomat"
    ],
    icon: "🍊",
    title: "Makanan asam",
    effect: "Paparan asam yang sering dapat meningkatkan risiko erosi atau keausan email.",
    tip: "Bilas dengan air setelahnya dan beri jeda sebelum menyikat gigi.",
    traits: ["asam", "risiko erosi"],
    baseRisk: 48
  },
  {
    keywords: [
      "kopi hitam", "kopi tanpa gula", "kopi", "teh tawar",
      "teh hijau", "teh hitam", "teh"
    ],
    icon: "☕",
    title: "Kopi atau teh",
    effect: "Tanpa gula, risiko kariesnya lebih rendah, tetapi minuman ini dapat meninggalkan noda pada permukaan gigi.",
    tip: "Hindari tambahan gula berlebihan dan minum air putih setelahnya.",
    traits: ["dapat meninggalkan noda"],
    baseRisk: 28
  },
  {
    keywords: [
      "keripik", "kerupuk", "kentang goreng", "kentang", "roti putih",
      "roti", "nasi", "mi instan", "mie instan", "mi", "mie",
      "pasta", "bubur", "sereal tawar", "cracker"
    ],
    icon: "🍞",
    title: "Makanan berpati",
    effect: "Pati dapat terurai menjadi gula, sementara teksturnya kadang mudah terselip atau menempel di sela gigi.",
    tip: "Minum air setelah makan dan bersihkan sela gigi secara teratur.",
    traits: ["pati", "mudah terselip"],
    baseRisk: 43
  },
  {
    keywords: ["yogurt rasa", "yoghurt rasa", "yogurt manis", "yoghurt manis"],
    icon: "🥣",
    title: "Yogurt dengan gula tambahan",
    effect: "Produk susu dapat mengandung kalsium, tetapi varian rasa sering memiliki gula tambahan yang meningkatkan paparan gula.",
    tip: "Periksa label dan pilih yogurt tawar tanpa banyak gula tambahan.",
    traits: ["produk susu", "gula tambahan"],
    baseRisk: 48
  },
  {
    keywords: ["yogurt tawar", "yoghurt tawar", "susu tawar", "susu putih", "susu", "keju"],
    icon: "🥛",
    title: "Produk susu rendah gula",
    effect: "Produk susu tawar umumnya tidak asam seperti soda dan menyediakan kalsium serta fosfat.",
    tip: "Pilih varian tawar atau rendah gula tambahan.",
    traits: ["rendah gula", "kalsium dan fosfat"],
    baseRisk: 16
  },
  {
    keywords: [
      "apel", "pir", "wortel", "timun", "mentimun", "seledri",
      "brokoli", "selada", "bayam", "sayur", "lalapan"
    ],
    icon: "🍎",
    title: "Buah atau sayur berserat",
    effect: "Mengunyah makanan berserat membantu merangsang air liur, tetapi tidak menggantikan sikat dan pembersihan sela gigi.",
    tip: "Bagus sebagai bagian dari pola makan seimbang; tetap jaga kebersihan gigi setiap hari.",
    traits: ["berserat", "merangsang air liur"],
    baseRisk: 14
  },
  {
    keywords: [
      "pisang", "mangga", "anggur", "semangka", "melon", "pepaya",
      "stroberi", "buah naga", "jambu", "buah"
    ],
    icon: "🍌",
    title: "Buah utuh",
    effect: "Gula alami masih ada, tetapi buah utuh lebih baik daripada jus karena gula tetap berada dalam struktur buah.",
    tip: "Nikmati sebagai buah utuh dan tetap minum air serta menjaga kebersihan gigi.",
    traits: ["gula alami", "buah utuh"],
    baseRisk: 24
  },
  {
    keywords: ["telur", "ayam", "ikan", "daging", "tahu", "tempe", "kacang", "almond", "edamame"],
    icon: "🍳",
    title: "Protein tanpa tambahan gula",
    effect: "Makanan ini umumnya rendah gula sehingga tidak memberi paparan gula sebesar camilan manis.",
    tip: "Waspadai saus manis atau bumbu lengket yang ditambahkan.",
    traits: ["rendah gula", "cenderung netral"],
    baseRisk: 12
  },
  {
    keywords: ["permen karet bebas gula", "permen karet tanpa gula", "sugar free gum"],
    icon: "🫧",
    title: "Permen karet tanpa gula",
    effect: "Mengunyah dapat merangsang produksi air liur, selama produknya benar-benar tanpa gula.",
    tip: "Tetap bukan pengganti sikat gigi dan pembersihan sela gigi.",
    traits: ["tanpa gula", "merangsang air liur"],
    baseRisk: 8
  },
  {
    keywords: ["air kelapa", "coconut water"],
    icon: "🥥",
    title: "Air kelapa",
    effect: "Mengandung gula alami; risikonya biasanya lebih rendah daripada soda tetapi tetap bukan pengganti air putih.",
    tip: "Pilih tanpa tambahan gula dan jangan menyesapnya terus-menerus.",
    traits: ["gula alami"],
    baseRisk: 30
  },
  {
    keywords: ["air putih", "air mineral", "air bening", "water"],
    icon: "💧",
    title: "Air putih",
    effect: "Membantu membilas sisa makanan dan menjaga mulut terhidrasi tanpa menambahkan gula atau asam.",
    tip: "Jadikan air putih sebagai minuman utama sehari-hari.",
    traits: ["tanpa gula", "tidak asam"],
    baseRisk: 4
  }
];

window.foodSuggestions = [
  "Cokelat",
  "Soda",
  "Boba",
  "Jus buah",
  "Kopi",
  "Keripik",
  "Keju",
  "Apel",
  "Telur",
  "Air putih"
];
