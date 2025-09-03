import React, { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  ChevronDown,
  ChevronRight,
  Upload,
  Shield,
  Truck,
  Sparkles,
  Palette,
  BadgePercent,
  Calendar,
  Euro,
  CreditCard,
  Bike,
  Image as ImageIcon,
  MessageCircle,
  Plus,
  Minus,
  MapPin,
  Lock,
  HeartHandshake,
  Wrench,
  Package,
} from "lucide-react";

// ==== Brand palette (E-Power) ====
const EP_COLOR = "#52a8b9"; // highlight
const EP_BG = "#292929"; // page background

// ==== Config ====
const WA_PHONE = "393931234567"; // <-- Numero WhatsApp E-Power (internazionale senza +)
// URL dello script di Google fornito
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbw7G2bdEIot7-RZRtQo5KWgeys8xvkPqeIS1CH84ymoJzZ21P40RGgTqHz7NT24zZA9/exec";

// ==== Utils ====
const money = (n) =>
  new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(n);

// Funzione di utilità per costruire il testo del messaggio WhatsApp
const buildWhatsAppText = (form, selectedColorName, totals) => {
  const extrasText = [];
  if (form.baule)
    extrasText.push(
      `Baule ${form.baule.code} ${form.baule.insulated ? "coibentato" : "non coibentato"} (${form.baule.dimensions})`
    );
  if (form.extras?.length)
    extrasText.push(...form.extras.map((e) => e.label + (e.qty ? ` ×${e.qty}` : "")));
  if (form.tannusQty > 0) extrasText.push(`Pneumatici antiforatura Tannus ×${form.tannusQty}`);
  if (form.logoFile) extrasText.push(`Caricato file logo: ${form.logoFile.name}`);
  return (
    `Ciao, sono ${form.name || ""}. Vorrei bloccare la promo e ricevere la bozza personalizzata per eBike Delivery.\n` +
    `Opzione: ${form.plan}. Colore: ${selectedColorName || "—"}. Città: ${form.city || "—"}.\n` +
    (form.company ? `Azienda: ${form.company}. ` : "") +
    (extrasText.length ? `\nExtra: ${extrasText.join(", ")}.` : "") +
    (totals
      ? `\nTotale stimato: ${money(totals.total)} (Bike ${money(totals.base)} + Extra ${money(
          totals.extras
        )}).`
      : "")
  );
};

const buildWhatsAppURL = (text) =>
  `https://wa.me/${WA_PHONE}?text=${encodeURIComponent(text)}`;

const StepDot = ({ active, done }) => (
  <div
    className="w-2.5 h-2.5 rounded-full border"
    style={{
      backgroundColor: done ? EP_COLOR : active ? "#ffffff" : "rgba(255,255,255,0.5)",
      borderColor: done ? EP_COLOR : active ? "#ffffff" : "rgba(255,255,255,0.3)",
    }}
  />
);

const Section = ({ id, eyebrow, title, kicker, children }) => (
  <section
    id={id}
    className="w-full max-w-6xl mx-auto px-4 md:px-6 py-12 md:py-16 text-white"
  >
    <div className="mb-8">
      {eyebrow && (
        <div className="text-xs uppercase tracking-wider text-white/60 mb-2">{eyebrow}</div>
      )}
      <h2 className="text-2xl md:text-4xl font-semibold leading-tight flex items-start gap-3">
        <span
          className="inline-flex items-center justify-center w-9 h-9 rounded-full border mr-1"
          style={{ backgroundColor: EP_COLOR, borderColor: "rgba(255,255,255,0.2)" }}
        >
          <Sparkles className="w-4 h-4 text-white" />
        </span>
        {title}
      </h2>
      {kicker && <p className="text-white/70 mt-3 text-base md:text-lg">{kicker}</p>}
    </div>
    {children}
  </section>
);

const colors = [
  { name: "Lascio fare a voi", value: "default" },
  { name: "Nero Opaco", value: "#0a0a0a" },
  { name: "Bianco Perla", value: "#f5f5f6" },
  { name: "Blu E-Power", value: "#0a3cff" },
  { name: "Rosso Corsa", value: "#e10600" },
  { name: "Giallo Taxi", value: "#ffd400" },
  { name: "Verde Neon", value: "#00ff7b" },
  { name: "Viola INSOMNIA", value: "#7200fe" },
  { name: "Arancione Energia", value: "#ff8c00" },
  { name: "Azzurro Cielo", value: "#87ceeb" },
];

// === Baule options (BAULI GRATIS) ===
const BAULE_COIBENTATI = [
  { code: "BP33CS", dimensions: "34×35×h45", price: 0, insulated: true },
  { code: "BP33CR", dimensions: "41×41×h45", price: 0, insulated: true },
  { code: "BP40CR", dimensions: "46×47×h45", price: 0, insulated: true },
];
const BAULE_NON_COIB = [
  { code: "BPE33R", dimensions: "41×43×h45", price: 0, insulated: false },
  { code: "BPE40R", dimensions: "47×49×h45", price: 0, insulated: false },
  { code: "BP45R", dimensions: "53×55×h45", price: 0, insulated: false },
  { code: "BP50R", dimensions: "56×58×h45", price: 0, insulated: false },
];

// === Extra catalog ===
const EXTRA = {
  GPS_NO_FEE: {
    key: "gps229",
    label: "Tracker GPS con SIM inclusa (nessun canone)",
    price: 229,
    icon: MapPin,
  },
  GPS_CANONE: {
    key: "gps129+29",
    label: "Tracker GPS con SIM (129€ + 29€/anno)",
    price: 129,
    recurring: { yearly: 29 },
    icon: MapPin,
  },
  AIRTAG: { key: "airtag", label: "Apple AirTag (no canoni)", price: 40, icon: Lock },
  TANNUS: {
    key: "tannus",
    label: "Pneumatici antiforatura Tannus",
    price: 50,
    perUnit: true,
    icon: Wrench,
  }, // per pneumatico
  INSURANCE: {
    key: "assicurazione",
    label: "Assicurazione facoltativa",
    price: 75,
    recurring: { yearly: 75 },
    icon: HeartHandshake,
  },
};

const benefits = [
  { icon: Shield, title: "2 anni garanzia", text: "Assistenza premium con ricambi sempre disponibili." },
  { icon: Truck, title: "Spedizione gratuita", text: "In tutta Italia, consegna rapida al tuo locale." },
  { icon: Palette, title: "Branding completo", text: "Colori e logo incisi su telaio + baule coibentato." },
  { icon: BadgePercent, title: "Promo limitata", text: "€1990 IVA incl. fino a fine mese." },
];

const faqs = [
  {
    q: "Posso vedere un'anteprima con il mio logo?",
    a: "Certo. Carica il logo (meglio in HD e vettoriale: SVG, PDF, AI, EPS – accettiamo anche PNG/JPG). Se non ce l'hai, procedi e ti aiutiamo noi senza sbatti.",
  },
  {
    q: "È possibile dilazionare il pagamento?",
    a: "Sì: 12 mesi tasso 0 a €165/mese IVA incl. Oppure noleggio operativo €60/mese + IVA per 36 mesi con furto/danni inclusi.",
  },
  {
    q: "Il baule è refrigerato?",
    a: "È coibentato per mantenere caldo/freddo più a lungo. Su richiesta integriamo accessori dedicati.",
  },
  { q: "Tempi di consegna?", a: "Da 2 a 4 settimane in base alla personalizzazione e disponibilità." },
];

const initialForm = {
  company: "",
  vat: "",
  name: "",
  email: "",
  phone: "",
  city: "",
  plan: "acquisto", // acquisto | rate | noleggio
  color: colors[3].value, // Blu E-Power
  logoFile: null,
  privacy: false,
  notes: "",
  baule: null, // {code, dimensions, price, insulated}
  extras: [], // [{key,label,price,qty?}]
  tannusQty: 0, // default 0
};

const OptionCard = ({ title, subtitle, bullets, icon: Icon, active, onSelect }) => (
  <button
    type="button"
    onClick={onSelect}
    aria-pressed={!!active}
    className="rounded-2xl border p-5 text-left transition-colors duration-200 ease-in-out hover:border-white/50"
    style={{ borderColor: active ? EP_COLOR : "rgba(255,255,255,0.15)" }}
  >
    <div className="flex items-center gap-3 mb-3">
      <span
        className="inline-flex w-8 h-8 rounded-full items-center justify-center border"
        style={{
          borderColor: active ? "transparent" : "rgba(255,255,255,0.2)",
          backgroundColor: active ? EP_COLOR : "rgba(255,255,255,0.1)",
        }}
      >
        <Icon className="w-4 h-4" style={{ color: active ? "#0b0b0b" : "#fff" }} />
      </span>
      <div className="font-semibold text-white/90">{title}</div>
    </div>
    <div className="text-white/70 text-sm mb-3">{subtitle}</div>
    <ul className="text-white/60 space-y-1 text-xs">
      {bullets.map((b, i) => (
        <li key={i} className="flex items-center gap-2">
          <Check className="w-3 h-3" /> {b}
        </li>
      ))}
    </ul>
  </button>
);

export default function EPDeliveryFunnel() {
  const [funnelStep, setFunnelStep] = useState("quiz"); // 'quiz' or 'summary'
  const [openFAQ, setOpenFAQ] = useState(null);
  const [quizStep, setQuizStep] = useState(0);
  const [quizData, setQuizData] = useState({
    name: "",
    surname: "",
    company: "",
    city: "",
    phone: "",
    email: "",
    privacy: false,
    type: null,
    volume: null,
    priority: null,
    color: colors[0].value,
    plan: null,
    baule: null,
    extras: [],
    tannusQty: 0,
    logoFile: null,
  });
  // Nuovi stati per gestire l'invio del modulo
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState(null); // 'success' | 'error'

  const priceBlock = useMemo(() => ({ base: 1990, monthlyRate: 165, rental: 60 }), []);

  const updateQuiz = (patch) =>
    setQuizData((q) => (typeof patch === "function" ? patch(q) : { ...q, ...patch }));

  const selectedColor = colors.find((c) => c.value === quizData.color);

  const totals = useMemo(() => {
    const extrasFlat = (quizData.extras || []).reduce(
      (sum, e) => sum + e.price * (e.qty || 1),
      0
    );
    const tannus = (quizData.tannusQty || 0) * EXTRA.TANNUS.price;
    const baule = quizData.baule ? quizData.baule.price : 0;
    const total = priceBlock.base + baule + extrasFlat + tannus;
    return { base: priceBlock.base, extras: baule + extrasFlat + tannus, total };
  }, [quizData.baule, quizData.extras, quizData.tannusQty, priceBlock.base]);

  const [message, setMessage] = useState({ title: "", text: "" });
  const [isMessageVisible, setIsMessageVisible] = useState(false);

  const showMessageBox = (title, text) => {
    setMessage({ title, text });
    setIsMessageVisible(true);
  };
  const closeMessageBox = () => setIsMessageVisible(false);

  const GPS_KEYS = [EXTRA.GPS_NO_FEE.key, EXTRA.GPS_CANONE.key];

  const toggleExtra = (extra) => {
    updateQuiz((q) => {
      const exists = (q.extras || []).some((e) => e.key === extra.key);
      let newExtras = q.extras || [];

      if (GPS_KEYS.includes(extra.key)) {
        newExtras = newExtras.filter((e) => !GPS_KEYS.includes(e.key));
      }

      if (exists) {
        newExtras = newExtras.filter((e) => e.key !== extra.key);
      } else {
        newExtras = [
          ...newExtras,
          { key: extra.key, label: extra.label, price: extra.price },
        ];
      }

      return { ...q, extras: newExtras };
    });
  };

  const handleFile = (file) => {
    if (!file) {
      updateQuiz({ logoFile: null });
      return;
    }
    try {
      if (!/(png|jpg|jpeg|svg|pdf|ai|eps)$/i.test(file.name)) {
        throw new Error("Formato non supportato. Carica SVG, PDF, AI, EPS, PNG o JPG.");
      }
      if (file.size > 10 * 1024 * 1024) {
        throw new Error("File troppo grande. Max 10MB.");
      }
      updateQuiz({ logoFile: file });
    } catch (e) {
      showMessageBox("Errore", e.message);
      updateQuiz({ logoFile: null });
    }
  };

  // Funzione per inviare i dati a Google Apps Script
  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setSubmissionStatus(null);

    // Semplice validazione del form
    if (!quizData.name || !quizData.surname || !quizData.company || !quizData.city || !quizData.phone || !quizData.email || !quizData.privacy) {
      showMessageBox("Dati mancanti", "Per favore, compila tutti i campi obbligatori e accetta l'informativa sulla privacy.");
      setIsSubmitting(false);
      return;
    }

    // Creazione del FormData per inviare i dati, inclusi i file
    const formData = new FormData();
    formData.append("name", quizData.name);
    formData.append("surname", quizData.surname);
    formData.append("company", quizData.company);
    formData.append("city", quizData.city);
    formData.append("phone", quizData.phone);
    formData.append("email", quizData.email);
    formData.append("plan", quizData.plan || "N/A");
    formData.append("color", selectedColor?.name || "N/A");
    formData.append("baule", quizData.baule ? `${quizData.baule.code} (${quizData.baule.dimensions})` : "Nessun baule selezionato");
    formData.append("extras", quizData.extras.map(e => e.label).join(', '));
    formData.append("tannusQty", quizData.tannusQty);
    formData.append("totalPrice", totals.total);

    if (quizData.logoFile) {
      formData.append("logoFile", quizData.logoFile, quizData.logoFile.name);
    }

    try {
      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        setSubmissionStatus("success");
      } else {
        throw new Error("Errore durante l'invio dei dati.");
      }
    } catch (error) {
      console.error("Errore di invio:", error);
      setSubmissionStatus("error");
      showMessageBox("Errore di invio", "C'è stato un problema. Per favore, riprova o contattaci tramite WhatsApp.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==== Quiz helpers ====
  const planOptions = useMemo(
    () => [
      {
        key: "acquisto",
        title: "Acquisto",
        subtitle: "Promo €1990 IVA incl.",
        icon: Euro,
        bullets: ["Miglior prezzo", "Tua per sempre", "Branding incluso"],
      },
      {
        key: "rate",
        title: "Tasso 0",
        subtitle: "€165/mese × 12",
        icon: CreditCard,
        bullets: ["Zero interessi", "12 mesi", "Conferma veloce"],
      },
      {
        key: "noleggio",
        title: "Noleggio",
        subtitle: "€60/mese + IVA",
        icon: Calendar,
        bullets: ["36 mesi", "Furto e danni", "Rinnovi flessibili"],
      },
    ],
    []
  );

  const quizQuestions = [
    { title: "Per iniziare, chi sei?", key: "personalInfo" },
    {
      title: "Che tipo di attività gestisci?",
      key: "type",
      options: ["Ristorante", "Pizzeria", "Sushi", "Bar/Caffetteria", "Gastronomia", "Altro"],
    },
    { title: "Quante consegne fai al giorno?", key: "volume", options: ["0-10", "11-25", "26-50", "50+"] },
    {
      title: "Cosa conta di più per te?",
      key: "priority",
      options: ["Prezzo", "Immagine/Brand", "Autonomia", "Tempi di consegna"],
    },
    { title: "Hai qualche preferenza sul colore?", key: "color", colorOptions: colors },
    { title: "Come preferisci ottenerla?", key: "plan", options: planOptions },
    { title: "Scegli il baule e gli extra", key: "options" },
  ];

  const handleNextStep = () => setQuizStep((s) => s + 1);
  const handlePrevStep = () => setQuizStep((s) => s - 1);
  const handleSummary = () => {
    setFunnelStep("summary");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const onPick = (key, value) => updateQuiz({ [key]: value });

  const ExtraButton = ({ item, checked, onSelect }) => {
    const Icon = item.icon;
    return (
      <button
        type="button"
        onClick={() => onSelect(item)}
        aria-pressed={!!checked}
        className="flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition-colors duration-200 hover:border-white/50 cursor-pointer"
        style={{
          borderColor: checked ? EP_COLOR : "rgba(255,255,255,0.15)",
          backgroundColor: checked ? "rgba(82, 168, 185, 0.2)" : "transparent",
        }}
      >
        <div className="flex items-center gap-2">
          <span
            className="w-6 h-6 rounded-full flex items-center justify-center border"
            style={{
              borderColor: checked ? "transparent" : "rgba(255,255,255,0.2)",
              backgroundColor: checked ? EP_COLOR : "rgba(255,255,255,0.1)",
            }}
          >
            <Icon className="w-3.5 h-3.5" style={{ color: checked ? "#0b0b0b" : "#fff" }} />
          </span>
          <div className="font-semibold text-white/90">{item.label}</div>
        </div>
        <div className="text-sm text-white/70">
          {item.recurring
            ? `Costo iniziale ${money(item.price)} + ${money(item.recurring.yearly)}/anno`
            : `Prezzo: ${money(item.price)}`}
        </div>
      </button>
    );
  };

  const TannusControl = () => (
    <div
      className="flex items-center justify-between gap-3 rounded-xl px-4 py-3"
      style={{ border: "1px solid rgba(255,255,255,0.15)" }}
    >
      <div className="flex items-center gap-3">
        <span
          className="w-6 h-6 rounded-full grid place-items-center border"
          style={{ borderColor: "rgba(255,255,255,0.2)", backgroundColor: "rgba(255,255,255,0.1)" }}
        >
          <EXTRA.TANNUS.icon className="w-3.5 h-3.5 text-white" />
        </span>
        <div className="text-sm font-medium">{EXTRA.TANNUS.label}</div>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => updateQuiz({ tannusQty: Math.max(0, quizData.tannusQty - 1) })}
          className="w-8 h-8 rounded-full flex items-center justify-center text-white/70 hover:text-white border"
          style={{ borderColor: "rgba(255,255,255,0.15)" }}
        >
          <Minus className="w-4 h-4" />
        </button>
        <span className="text-lg font-bold w-4 text-center">{quizData.tannusQty}</span>
        <button
          type="button"
          onClick={() => updateQuiz({ tannusQty: Math.min(4, quizData.tannusQty + 1) })}
          className="w-8 h-8 rounded-full flex items-center justify-center text-white/70 hover:text-white border"
          style={{ borderColor: "rgba(255,255,255,0.15)" }}
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
      <div className="text-sm font-medium">{money(quizData.tannusQty * EXTRA.TANNUS.price)}</div>
    </div>
  );

  const SummarySection = ({ title, value }) => (
    <div className="p-4 md:p-5 rounded-lg border" style={{ borderColor: "rgba(255,255,255,0.15)" }}>
      <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wide">{title}</h3>
      <p className="mt-1 font-medium text-white text-lg">{value}</p>
    </div>
  );

  return (
    <div className="min-h-screen" style={{ backgroundColor: EP_BG, color: "white" }}>
      {/* Top bar */}
      <header className="sticky top-0 z-50 backdrop-blur supports-[backdrop-filter]:bg-white/5 bg-white/5 border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 md:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg border border-white/20 grid place-items-center"
              style={{ backgroundColor: "transparent" }}
            >
              <Bike className="w-4 h-4" />
            </div>
            <div className="font-semibold tracking-tight">E-Power Italia • Delivery</div>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm text-white/80">
            <a href="#configura" className="hover:underline">
              Configura
            </a>
            <a href="#vantaggi" className="hover:underline">
              Vantaggi
            </a>
            <a href="#prezzi" className="hover:underline">
              Prezzi
            </a>
            <a href="#faq" className="hover:underline">
              FAQ
            </a>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFunnelStep("quiz")}
              className="px-3 py-2 rounded-xl border text-sm hover:opacity-90"
              style={{ backgroundColor: EP_COLOR, borderColor: EP_COLOR, color: "#0b0b0b" }}
            >
              Bozza gratuita
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 opacity-10" aria-hidden>
          <div
            className="absolute -top-24 -right-24 w-[520px] h-[520px] rounded-full"
            style={{ background: `radial-gradient(closest-side, ${EP_COLOR}, transparent)` }}
          />
          <div
            className="absolute -bottom-24 -left-24 w-[520px] h-[520px] rounded-full"
            style={{ background: `radial-gradient(closest-side, ${EP_COLOR}, transparent)` }}
          />
        </div>
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-14 md:py-20 grid md:grid-cols-2 gap-10 items-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div
              className="inline-flex items-center gap-2 text-xs font-medium px-2.5 py-1.5 rounded-full"
              style={{ backgroundColor: EP_COLOR, color: "#0b0b0b" }}
            >
              <BadgePercent className="w-3.5 h-3.5" /> Promo fino a fine mese: {money(priceBlock.base)} IVA incl.
            </div>
            <h1 className="text-3xl md:text-5xl font-semibold leading-tight mt-4">
              eBike Delivery <span className="whitespace-nowrap">brandizzata</span> per il tuo ristorante
            </h1>
            <p className="text-white/70 mt-4 text-base md:text-lg">
              Personalizzazione completa (colori + logo inciso), baule coibentato e spedizione gratuita in tutta Italia.
              Vedi una bozza gratis oggi — senza impegno.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setFunnelStep("quiz")}
                className="px-5 py-3 rounded-xl border hover:opacity-90 text-sm md:text-base"
                style={{ backgroundColor: EP_COLOR, borderColor: EP_COLOR, color: "#0b0b0b" }}
              >
                Ottieni bozza gratuita
              </button>
              <a
                href={buildWhatsAppURL("Ciao, sono interessato alla eBike Delivery brandizzata")}
                target="_blank"
                rel="noreferrer"
                className="px-5 py-3 rounded-xl border text-sm md:text-base inline-flex items-center gap-2 hover:bg-white/5"
                style={{ borderColor: "rgba(255,255,255,0.2)" }}
              >
                <MessageCircle className="w-4 h-4" /> Parla su WhatsApp
              </a>
            </div>
            <div className="mt-6 flex items-center gap-6 text-xs text-white/60">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4" /> Garanzia 24 mesi
              </div>
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4" /> Spedizione gratuita
              </div>
              <div className="flex items-center gap-2">
                <Palette className="w-4 h-4" /> Branding completo
              </div>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.6 }}>
            <div
              className="aspect-[4/3] w-full rounded-2xl border overflow-hidden relative grid place-items-center"
              style={{ borderColor: "rgba(255,255,255,0.15)" }}
            >
              <div
                className="absolute inset-0"
                style={{
                  background: `radial-gradient(circle at 30% 20%, rgba(255,255,255,0.08), transparent 60%), radial-gradient(circle at 80% 50%, rgba(255,255,255,0.1), transparent 50%)`,
                }}
              />
              <div className="text-center p-6">
                <div className="text-xs uppercase tracking-wider text-white/60 mb-2">Anteprima</div>
                <div
                  className="mx-auto w-28 h-28 rounded-full border grid place-items-center"
                  style={{ borderColor: "rgba(255,255,255,0.15)" }}
                >
                  <ImageIcon className="w-8 h-8" />
                </div>
                <p className="text-white/70 mt-3">
                  Carica il tuo logo nel form sotto per ricevere una bozza grafica personalizzata.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Main funnel content */}
      <div className="min-h-screen">
        {funnelStep === "quiz" && (
          <>
            {/* Progress bar */}
            <div
              className="sticky top-14 z-40"
              style={{
                backgroundColor: "rgba(41,41,41,0.9)",
                backdropFilter: "blur(6px)",
                borderBottom: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <div className="max-w-6xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between gap-4 text-white">
                <div className="flex items-center gap-2">
                  <StepDot done={quizStep > 0} active={quizStep === 0} />
                  <div className="text-xs">Dati</div>
                  <StepDot done={quizStep > 1} active={quizStep === 1} />
                  <div className="text-xs">Attività</div>
                  <StepDot done={quizStep > 2} active={quizStep === 2} />
                  <div className="text-xs">Volume</div>
                  <StepDot done={quizStep > 3} active={quizStep === 3} />
                  <div className="text-xs">Priorità</div>
                  <StepDot done={quizStep > 4} active={quizStep === 4} />
                  <div className="text-xs">Colore</div>
                  <StepDot done={quizStep > 5} active={quizStep === 5} />
                  <div className="text-xs">Piano</div>
                  <StepDot done={quizStep > 6} active={quizStep === 6} />
                  <div className="text-xs">Extra</div>
                </div>
                <div className="text-xs text-white/60 hidden sm:block">
                  Tempo di compilazione ~ 60 secondi
                </div>
              </div>
            </div>
            <Section id="configura" eyebrow="Configuratore" title="Costruisci la tua eBike in 60 secondi">
              <div
                className="rounded-2xl border p-4 md:p-6 mb-6"
                style={{ borderColor: "rgba(255,255,255,0.15)" }}
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={quizStep}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.5 }}
                  >
                    <div className="text-sm text-white/60 mb-1">
                      Domanda {quizStep + 1} di {quizQuestions.length}
                    </div>
                    <h3 className="text-xl font-semibold mb-3">
                      {quizQuestions[quizStep].title}
                    </h3>
                    {quizQuestions[quizStep].key === "personalInfo" && (
                      <div className="space-y-4">
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm text-white/80">Nome*</label>
                            <input
                              type="text"
                              value={quizData.name}
                              onChange={(e) => updateQuiz({ name: e.target.value })}
                              className="mt-2 w-full rounded-xl px-3 py-2.5 focus:outline-none"
                              placeholder="Mario"
                              style={{
                                backgroundColor: "#1f1f1f",
                                border: "1px solid rgba(255,255,255,0.15)",
                                color: "#fff",
                              }}
                            />
                          </div>
                          <div>
                            <label className="text-sm text-white/80">Cognome*</label>
                            <input
                              type="text"
                              value={quizData.surname}
                              onChange={(e) => updateQuiz({ surname: e.target.value })}
                              className="mt-2 w-full rounded-xl px-3 py-2.5 focus:outline-none"
                              placeholder="Rossi"
                              style={{
                                backgroundColor: "#1f1f1f",
                                border: "1px solid rgba(255,255,255,0.15)",
                                color: "#fff",
                              }}
                            />
                          </div>
                        </div>
                        <div className="input-group">
                          <label className="text-sm text-white/80">
                            Ragione Sociale dell'Attività*
                          </label>
                          <input
                            type="text"
                            value={quizData.company}
                            onChange={(e) => updateQuiz({ company: e.target.value })}
                            className="mt-2 w-full rounded-xl px-3 py-2.5 focus:outline-none"
                            placeholder="Es. Ristorante Carmine Srl"
                            style={{
                              backgroundColor: "#1f1f1f",
                              border: "1px solid rgba(255,255,255,0.15)",
                              color: "#fff",
                            }}
                          />
                        </div>
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm text-white/80">Telefono*</label>
                            <input
                              value={quizData.phone}
                              onChange={(e) => updateQuiz({ phone: e.target.value })}
                              className="mt-2 w-full rounded-xl px-3 py-2.5 focus:outline-none"
                              placeholder="3XX XXXXXXX"
                              style={{
                                backgroundColor: "#1f1f1f",
                                border: "1px solid rgba(255,255,255,0.15)",
                                color: "#fff",
                              }}
                            />
                          </div>
                          <div>
                            <label className="text-sm text-white/80">Email*</label>
                            <input
                              type="email"
                              value={quizData.email}
                              onChange={(e) => updateQuiz({ email: e.target.value })}
                              className="mt-2 w-full rounded-xl px-3 py-2.5 focus:outline-none"
                              placeholder="nome@azienda.it"
                              style={{
                                backgroundColor: "#1f1f1f",
                                border: "1px solid rgba(255,255,255,0.15)",
                                color: "#fff",
                              }}
                            />
                          </div>
                        </div>
                        <div className="input-group">
                          <label className="text-sm text-white/80">Città*</label>
                          <input
                            value={quizData.city}
                            onChange={(e) => updateQuiz({ city: e.target.value })}
                            className="mt-2 w-full rounded-xl px-3 py-2.5 focus:outline-none"
                            placeholder="Es. Salerno"
                            style={{
                              backgroundColor: "#1f1f1f",
                              border: "1px solid rgba(255,255,255,0.15)",
                              color: "#fff",
                            }}
                          />
                        </div>
                        <label className="inline-flex items-center gap-2 text-xs text-white/70">
                          <input
                            type="checkbox"
                            checked={quizData.privacy}
                            onChange={(e) => updateQuiz({ privacy: e.target.checked })}
                            className="rounded"
                          />
                          Acconsento al trattamento dei dati per ricevere preventivo e bozza
                          personalizzata.
                        </label>
                      </div>
                    )}

                    {quizQuestions[quizStep].options &&
                      (quizQuestions[quizStep].key === "plan" ? (
                        <div className="grid sm:grid-cols-3 gap-4">
                          {quizQuestions[quizStep].options.map((opt) => (
                            <OptionCard
                              key={opt.key}
                              active={quizData.plan === opt.key}
                              onSelect={() => onPick("plan", opt.key)}
                              title={opt.title}
                              subtitle={opt.subtitle}
                              icon={opt.icon}
                              bullets={opt.bullets}
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {quizQuestions[quizStep].options.map((opt) => (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => onPick(quizQuestions[quizStep].key, opt)}
                              className="px-3 py-2 rounded-xl border text-sm hover:opacity-90"
                              style={{
                                backgroundColor:
                                  quizData[quizQuestions[quizStep].key] === opt
                                    ? EP_COLOR
                                    : "transparent",
                                borderColor:
                                  quizData[quizQuestions[quizStep].key] === opt
                                    ? EP_COLOR
                                    : "rgba(255,255,255,0.15)",
                              }}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      ))}

                    {quizQuestions[quizStep].colorOptions && (
                      <div className="flex flex-wrap gap-2">
                        {quizQuestions[quizStep].colorOptions.map((opt) => (
                          <div
                            key={opt.value}
                            className="flex-shrink-0"
                            onClick={() => onPick("color", opt.value)}
                          >
                            <div
                              className="w-12 h-12 rounded-full cursor-pointer flex items-center justify-center border"
                              style={{
                                backgroundColor: opt.value,
                                borderColor:
                                  quizData.color === opt.value
                                    ? EP_COLOR
                                    : "rgba(255,255,255,0.2)",
                                borderWidth: quizData.color === opt.value ? "3px" : "1px",
                              }}
                              title={opt.name}
                            >
                              {quizData.color === opt.value && (
                                <Check className="w-5 h-5 text-white" />
                              )}
                            </div>
                            <div className="text-xs text-white/70 text-center mt-1">
                              {opt.name}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {quizQuestions[quizStep].key === "options" && (
                      <div className="space-y-6">
                        {/* Sezione Baule */}
                        <div>
                          <h4 className="text-lg font-semibold text-white/80 mb-3">Baule coibentato (gratuito)</h4>
                          <div className="grid md:grid-cols-3 gap-4">
                            {[...BAULE_COIBENTATI, ...BAULE_NON_COIB].map((baule) => (
                              <button
                                key={baule.code}
                                type="button"
                                onClick={() => updateQuiz({ baule: baule })}
                                className="rounded-xl border p-4 text-left transition-colors hover:border-white/50"
                                style={{
                                  borderColor: quizData.baule?.code === baule.code ? EP_COLOR : "rgba(255,255,255,0.15)",
                                  backgroundColor: quizData.baule?.code === baule.code ? "rgba(82, 168, 185, 0.2)" : "transparent",
                                }}
                              >
                                <div className="font-semibold text-white/90">{baule.code}</div>
                                <div className="text-sm text-white/70">{baule.dimensions}</div>
                                <div className="text-xs text-white/60 mt-1">{baule.insulated ? "Coibentato" : "Non coibentato"}</div>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Sezione Extra */}
                        <div>
                          <h4 className="text-lg font-semibold text-white/80 mb-3">Extra aggiuntivi</h4>
                          <div className="grid md:grid-cols-2 gap-4">
                            <ExtraButton
                              item={EXTRA.GPS_NO_FEE}
                              checked={quizData.extras.some(e => e.key === EXTRA.GPS_NO_FEE.key)}
                              onSelect={toggleExtra}
                            />
                            <ExtraButton
                              item={EXTRA.GPS_CANONE}
                              checked={quizData.extras.some(e => e.key === EXTRA.GPS_CANONE.key)}
                              onSelect={toggleExtra}
                            />
                            <ExtraButton
                              item={EXTRA.AIRTAG}
                              checked={quizData.extras.some(e => e.key === EXTRA.AIRTAG.key)}
                              onSelect={toggleExtra}
                            />
                            <ExtraButton
                              item={EXTRA.INSURANCE}
                              checked={quizData.extras.some(e => e.key === EXTRA.INSURANCE.key)}
                              onSelect={toggleExtra}
                            />
                          </div>
                          <TannusControl />
                        </div>

                        {/* Sezione Logo */}
                        <div>
                          <h4 className="text-lg font-semibold text-white/80 mb-3">Carica il tuo logo</h4>
                          <label className="flex flex-col items-center justify-center w-full h-32 rounded-xl border-2 border-dashed transition-colors cursor-pointer hover:border-white/50" style={{borderColor: "rgba(255,255,255,0.15)"}}>
                            <input type="file" className="hidden" onChange={(e) => handleFile(e.target.files[0])} accept=".png,.jpg,.jpeg,.svg,.pdf,.ai,.eps" />
                            <div className="flex flex-col items-center justify-center pt-5 pb-6 text-white/70">
                              <Upload className="w-8 h-8 mb-2" />
                              {quizData.logoFile ? (
                                <>
                                  <p className="mb-2 text-sm">File selezionato: {quizData.logoFile.name}</p>
                                  <p className="text-xs">Fai clic per cambiarlo</p>
                                </>
                              ) : (
                                <>
                                  <p className="mb-2 text-sm"><span className="font-semibold">Fai clic per caricare</span> o trascina qui</p>
                                  <p className="text-xs text-center">SVG, PDF, AI, EPS, PNG o JPG (max 10MB)</p>
                                </>
                              )}
                            </div>
                          </label>
                        </div>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Navigation buttons */}
              <div className="flex justify-between mt-6">
                <button
                  onClick={handlePrevStep}
                  disabled={quizStep === 0}
                  className="px-4 py-2 rounded-xl text-sm font-semibold inline-flex items-center gap-2"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.1)",
                    borderColor: "rgba(255,255,255,0.15)",
                    borderWidth: "1px",
                    opacity: quizStep === 0 ? 0.5 : 1
                  }}
                >
                  <ChevronDown className="w-4 h-4 rotate-90" /> Indietro
                </button>
                {quizStep < quizQuestions.length - 1 && (
                  <button
                    onClick={handleNextStep}
                    className="px-4 py-2 rounded-xl text-sm font-semibold inline-flex items-center gap-2"
                    style={{
                      backgroundColor: EP_COLOR,
                      color: "#0b0b0b"
                    }}
                  >
                    Avanti <ChevronRight className="w-4 h-4" />
                  </button>
                )}
                {quizStep === quizQuestions.length - 1 && (
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="px-4 py-2 rounded-xl text-sm font-semibold inline-flex items-center gap-2"
                    style={{
                      backgroundColor: EP_COLOR,
                      color: "#0b0b0b",
                      opacity: isSubmitting ? 0.7 : 1,
                      cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {isSubmitting ? 'Invio in corso...' : 'Invia e ricevi bozza'}
                  </button>
                )}
              </div>
            </Section>
          </>
        )}

        {/* Summary/Confirmation screen */}
        {funnelStep === "summary" && (
          <Section id="riepilogo" eyebrow="Riepilogo" title="Grazie per la tua richiesta!">
            {submissionStatus === 'success' && (
              <div className="flex flex-col items-center justify-center p-8 rounded-2xl text-center" style={{backgroundColor: "rgba(82, 168, 185, 0.2)"}}>
                <Check className="w-16 h-16 text-green-500 mb-4" />
                <h3 className="text-2xl font-semibold text-white">Richiesta inviata con successo!</h3>
                <p className="mt-2 text-white/70">A breve un nostro consulente ti contatterà per fornirti una bozza personalizzata e un preventivo dettagliato. Controlla la tua email.</p>
                <a href={buildWhatsAppURL(buildWhatsAppText(quizData, selectedColor?.name, totals))} target="_blank" rel="noreferrer" className="mt-4 px-5 py-3 rounded-xl border text-sm md:text-base inline-flex items-center gap-2 hover:bg-white/5" style={{borderColor: "rgba(255,255,255,0.2)"}}>
                  <MessageCircle className="w-4 h-4" /> Contattaci su WhatsApp
                </a>
              </div>
            )}
            {submissionStatus === 'error' && (
              <div className="flex flex-col items-center justify-center p-8 rounded-2xl text-center" style={{backgroundColor: "rgba(255,0,0,0.2)"}}>
                <Package className="w-16 h-16 text-red-500 mb-4" />
                <h3 className="text-2xl font-semibold text-white">Ops, qualcosa è andato storto!</h3>
                <p className="mt-2 text-white/70">Non siamo riusciti a inviare la tua richiesta in automatico. Per favore, prova a contattarci direttamente su WhatsApp.</p>
                <a href={buildWhatsAppURL(buildWhatsAppText(quizData, selectedColor?.name, totals))} target="_blank" rel="noreferrer" className="mt-4 px-5 py-3 rounded-xl border text-sm md:text-base inline-flex items-center gap-2 hover:bg-white/5" style={{borderColor: "rgba(255,255,255,0.2)"}}>
                  <MessageCircle className="w-4 h-4" /> Contattaci su WhatsApp
                </a>
              </div>
            )}
            {submissionStatus === null && (
              <div className="flex flex-col items-center justify-center p-8 rounded-2xl text-center">
                <h3 className="text-2xl font-semibold text-white">Invio in corso...</h3>
                <p className="mt-2 text-white/70">Stiamo inviando i tuoi dati. Per favore attendi...</p>
              </div>
            )}
          </Section>
        )}
      </div>

      {/* Benefits section */}
      <Section id="vantaggi" eyebrow="Vantaggi esclusivi" title="Perché scegliere E-Power Delivery">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {benefits.map((b, i) => (
            <div key={i} className="rounded-2xl p-6" style={{ backgroundColor: "rgba(255,255,255,0.05)" }}>
              <div className="w-10 h-10 rounded-full grid place-items-center mb-4" style={{ backgroundColor: EP_COLOR, color: "#0b0b0b" }}>
                <b.icon className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-white/90">{b.title}</h3>
              <p className="text-sm text-white/70 mt-1">{b.text}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* FAQ section */}
      <Section id="faq" eyebrow="Domande frequenti" title="Hai ancora dubbi?">
        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className="rounded-2xl border p-5 cursor-pointer"
              style={{ borderColor: "rgba(255,255,255,0.15)" }}
              onClick={() => setOpenFAQ(openFAQ === i ? null : i)}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-white/90">{faq.q}</h3>
                <span className="text-white/60">
                  {openFAQ === i ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </span>
              </div>
              <AnimatePresence>
                {openFAQ === i && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <p className="text-sm text-white/70 mt-3">{faq.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </Section>

      {/* Message Box Modal */}
      <AnimatePresence>
        {isMessageVisible && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={closeMessageBox}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="rounded-xl border p-6 max-w-sm w-full"
              style={{ backgroundColor: EP_BG, borderColor: "rgba(255,255,255,0.15)" }}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full grid place-items-center" style={{backgroundColor: EP_COLOR}}>
                  <Sparkles className="w-4 h-4 text-black" />
                </div>
                <h3 className="text-lg font-semibold">{message.title}</h3>
              </div>
              <p className="mt-3 text-white/70">{message.text}</p>
              <button
                onClick={closeMessageBox}
                className="mt-4 w-full py-2 rounded-xl text-sm font-semibold"
                style={{ backgroundColor: EP_COLOR, color: "#0b0b0b" }}
              >
                Chiudi
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
