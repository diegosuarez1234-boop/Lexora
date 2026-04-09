import { useState, useRef, useEffect } from "react";

const STRIPE_BASIC = "https://buy.stripe.com/TU_LINK_BASICO";
const STRIPE_PRO   = "https://buy.stripe.com/TU_LINK_PRO";
const FREE_LIMIT   = 5;
const STORAGE_KEY  = "lexora_usage";
const LOCKOUT_KEY  = "lexora_lockout";
const HISTORY_KEY  = "lexora_chats";
const HOURS_24     = 24 * 60 * 60 * 1000;

// ── Persist helpers ───────────────────────────────────────────────────────────
const loadChats = () => { try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]"); } catch { return []; } };
const saveChats = (c) => { try { localStorage.setItem(HISTORY_KEY, JSON.stringify(c.slice(0, 50))); } catch {} };

// ── Check if user is in 24h lockout ──────────────────────────────────────────
const getLockoutInfo = () => {
  try {
    const raw = localStorage.getItem(LOCKOUT_KEY);
    if (!raw) return { locked: false, remaining: 0 };
    const { lockedAt } = JSON.parse(raw);
    const elapsed = Date.now() - lockedAt;
    if (elapsed >= HOURS_24) {
      localStorage.removeItem(LOCKOUT_KEY);
      localStorage.setItem(STORAGE_KEY, "0");
      return { locked: false, remaining: 0 };
    }
    return { locked: true, remaining: HOURS_24 - elapsed };
  } catch { return { locked: false, remaining: 0 }; }
};

const setLockout = () => {
  try { localStorage.setItem(LOCKOUT_KEY, JSON.stringify({ lockedAt: Date.now() })); } catch {}
};

const formatCountdown = (ms) => {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${h}h ${m}m ${s}s`;
};

// ── Translations ──────────────────────────────────────────────────────────────
const T = {
  es: {
    tagline:      "Asistente legal con IA · Puerto Rico",
    lang:         "EN",
    placeholder:  "Pregunta algo, sube un PDF o pide que redacte un contrato…",
    thinking:     "Analizando…",
    newChat:      "Nuevo Chat",
    searchPlaceholder: "Buscar conversaciones…",
    disclaimer:   "Lexora brinda orientación informativa. Consulta un abogado licenciado.",
    freeLeft:     (n) => `${n} de 5 gratis`,
    freeUsed:     "Límite gratuito alcanzado",
    viewPlans:    "⭐ Ver planes",
    welcome:      "Hola, soy **Lexora** — tu asistente legal con IA especializado en Puerto Rico.\n\nPuedo ayudarte con:\n- Consultas legales bajo las leyes de PR\n- Análisis de contratos (sube un PDF)\n- **Redactar contratos** — dime qué necesitas\n- Explicarte tus derechos\n- Orientarte sobre qué tipo de abogado necesitas\n\n¿En qué puedo ayudarte hoy?",
    suggestions:  [
      "¿Qué hago si me despiden sin causa en PR?",
      "Redacta un contrato de arrendamiento en PR",
      "¿Cuáles son mis derechos como inquilino en PR?",
      "Redacta un acuerdo de confidencialidad (NDA)",
    ],
    tryAsking:    "Preguntas frecuentes",
    uploadBtn:    "Subir contrato PDF",
    uploadDrag:   "Arrastra tu PDF aquí o",
    uploadClick:  "haz click para seleccionar",
    uploadHint:   "Contratos, acuerdos, NDA, términos de servicio…",
    uploadReading:"Leyendo PDF…",
    uploadReady:  (name, pages) => `📄 ${name} · ${pages} pág.`,
    uploadError:  "No se pudo leer el PDF. Intenta pegar el texto.",
    removeFile:   "Quitar",
    pdfContext:   (name) => `He subido el contrato **${name}**. Por favor analízalo completamente: resumen, obligaciones, cláusulas de riesgo 🚨, cláusulas favorables ✅, qué negociar 💡, y tu recomendación final ⚖️.`,
    noHistory:    "Tus conversaciones aparecerán aquí.",
    today:        "Hoy", yesterday: "Ayer", older: "Anteriores",
    legalNotice:  "⚠️ Aviso Legal",
    legalText:    "Lexora es una herramienta informativa con IA. NO es un abogado licenciado, NO provee asesoría legal certificada, NO redacta documentos con validez legal oficial, y NO puede representarte en corte. Para asuntos legales formales, consulta siempre un abogado licenciado en Puerto Rico.",
    // Lockout
    lockedTitle:  "Límite diario alcanzado",
    lockedSub:    "Has usado tus 5 consultas gratuitas de hoy.",
    lockedTimer:  "Podrás usar Lexora de nuevo en:",
    lockedOr:     "— o suscríbete para acceso ilimitado —",
    // Paywall
    paywallBadge: "Has usado tus 5 consultas gratis",
    paywallTitle: "Elige tu plan",
    paywallSub:   "Continúa consultando sin límites. Cancela cuando quieras.",
    planFreeName: "Gratis", planFreePrice:"$0",
    planFreeFeats:["5 consultas al día","Consultas básicas","Sin historial guardado"],
    planFreeCta:  "Plan actual",
    planBasicName:"Personal", planBasicBadge:"Más popular 🔥",
    planBasicPrice:"$15", planBasicOld:"$19", planBasicPer:"/mes",
    planBasicFeats:["Consultas ilimitadas","Análisis de PDFs","Redacción de contratos","Historial guardado","Soporte por email"],
    planBasicCta: "Comenzar por $15/mes",
    planProName:  "Profesional", planProBadge:"Para negocios",
    planProPrice: "$45", planProOld:"$49", planProPer:"/mes",
    planProFeats: ["Todo lo de Personal","Acceso prioritario","Múltiples usuarios","Soporte dedicado"],
    planProCta:   "Comenzar por $45/mes",
    paywallNote:  "🔒 Pago seguro con Stripe · Cancela cuando quieras",
    alreadySub:   "Ya tengo suscripción",
    lockedInput:  "Límite alcanzado — suscríbete para continuar…",
    savings:      "Ahorras $4/mes",
    // Auth
    signIn:       "Iniciar sesión",
    signInSub:    "Inicia sesión para guardar tu historial y acceder desde cualquier dispositivo.",
    signInGoogle: "Continuar con Google",
    signInSkip:   "Continuar sin cuenta",
    signedInAs:   "Sesión iniciada como",
    signOut:      "Cerrar sesión",
  },
  en: {
    tagline:      "AI Legal Assistant · Puerto Rico",
    lang:         "ES",
    placeholder:  "Ask anything, upload a PDF, or ask to draft a contract…",
    thinking:     "Analyzing…",
    newChat:      "New Chat",
    searchPlaceholder: "Search conversations…",
    disclaimer:   "Lexora provides informational guidance only. Consult a licensed attorney.",
    freeLeft:     (n) => `${n} of 5 free`,
    freeUsed:     "Daily limit reached",
    viewPlans:    "⭐ View plans",
    welcome:      "Hi, I'm **Lexora** — your AI legal assistant specialized in Puerto Rico.\n\nI can help you with:\n- Legal questions under PR law\n- Contract analysis (upload a PDF)\n- **Draft contracts** — just tell me what you need\n- Explain your rights\n- Guide you on what type of lawyer you need\n\nWhat can I help you with today?",
    suggestions:  [
      "What are my rights if fired without cause in PR?",
      "Draft a lease agreement for Puerto Rico",
      "What are my tenant rights in PR?",
      "Draft a Non-Disclosure Agreement (NDA)",
    ],
    tryAsking:    "Frequent questions",
    uploadBtn:    "Upload PDF contract",
    uploadDrag:   "Drag your PDF here or",
    uploadClick:  "click to select",
    uploadHint:   "Contracts, agreements, NDA, terms of service…",
    uploadReading:"Reading PDF…",
    uploadReady:  (name, pages) => `📄 ${name} · ${pages} p.`,
    uploadError:  "Could not read PDF. Try pasting the text.",
    removeFile:   "Remove",
    pdfContext:   (name) => `I uploaded the contract **${name}**. Please analyze it fully: summary, obligations, risk clauses 🚨, favorable clauses ✅, what to negotiate 💡, and your final recommendation ⚖️.`,
    noHistory:    "Your conversations will appear here.",
    today:        "Today", yesterday: "Yesterday", older: "Older",
    legalNotice:  "⚠️ Legal Notice",
    legalText:    "Lexora is an AI informational tool. It is NOT a licensed attorney, does NOT provide certified legal advice, does NOT draft legally binding documents, and CANNOT represent you in court. For formal legal matters, always consult a licensed attorney in Puerto Rico.",
    lockedTitle:  "Daily limit reached",
    lockedSub:    "You've used your 5 free daily consultations.",
    lockedTimer:  "You can use Lexora again in:",
    lockedOr:     "— or subscribe for unlimited access —",
    paywallBadge: "You've used your 5 free consultations",
    paywallTitle: "Choose your plan",
    paywallSub:   "Keep consulting without limits. Cancel anytime.",
    planFreeName: "Free", planFreePrice:"$0",
    planFreeFeats:["5 consultations/day","Basic questions","No saved history"],
    planFreeCta:  "Current plan",
    planBasicName:"Personal", planBasicBadge:"Most popular 🔥",
    planBasicPrice:"$15", planBasicOld:"$19", planBasicPer:"/mo",
    planBasicFeats:["Unlimited consultations","PDF analysis","Contract drafting","Saved history","Email support"],
    planBasicCta: "Start for $15/mo",
    planProName:  "Professional", planProBadge:"For businesses",
    planProPrice: "$45", planProOld:"$49", planProPer:"/mo",
    planProFeats: ["Everything in Personal","Priority access","Multiple users","Dedicated support"],
    planProCta:   "Start for $45/mo",
    paywallNote:  "🔒 Secure payment via Stripe · Cancel anytime",
    alreadySub:   "I already have a subscription",
    lockedInput:  "Limit reached — subscribe to continue…",
    savings:      "Save $4/mo",
    signIn:       "Sign in",
    signInSub:    "Sign in to save your history and access from any device.",
    signInGoogle: "Continue with Google",
    signInSkip:   "Continue without account",
    signedInAs:   "Signed in as",
    signOut:      "Sign out",
  },
};

// ── Logo ──────────────────────────────────────────────────────────────────────
const LexoraLogo = ({ size = 32 }) => (
  <div style={{ width:size, height:size, borderRadius: size * 0.25, background:"#111827", display:"flex", alignItems:"center", justifyContent:"center", fontSize: size * 0.5, flexShrink:0 }}>
    ⚖️
  </div>
);

// ── System prompt ─────────────────────────────────────────────────────────────
const SYSTEM = (lang, docText, docName) => {
  const base = `You are Lexora, a specialized AI legal assistant focused exclusively on Puerto Rico law.
Language: ${lang === "es" ? "ALWAYS respond in Spanish" : "ALWAYS respond in English"}
Jurisdiction: Puerto Rico — apply PR Civil Code, PR Labor Laws, CRIM, Act 22/60, and all relevant PR regulations.

You can:
1. Answer legal questions under Puerto Rico law
2. Analyze contracts and legal documents
3. DRAFT CONTRACTS — when asked to write/draft/redact/crear a contract, write a COMPLETE professional contract template with all clauses, parties section, terms, payment terms, dispute resolution, signatures section and date fields. Mark variable fields with [BRACKETS]. Add disclaimer that this is a template for reference only.

Be warm, direct, plain language. Use **bold** for key terms. Use bullet points for lists.
End with: *⚖️ Orientación informativa — consulta un abogado licenciado en Puerto Rico.*`;
  if (!docText) return base;
  return `${base}\n\nUser uploaded: "${docName}"\n--- DOCUMENT ---\n${docText}\n--- END ---\nReference this document in all answers.`;
};

// ── PDF.js ────────────────────────────────────────────────────────────────────
const loadPdfJs = () => new Promise((resolve, reject) => {
  if (window.pdfjsLib) { resolve(window.pdfjsLib); return; }
  const s = document.createElement("script");
  s.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
  s.onload = () => { window.pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js"; resolve(window.pdfjsLib); };
  s.onerror = reject;
  document.head.appendChild(s);
});

const extractPdf = async (file) => {
  const lib = await loadPdfJs();
  const pdf = await lib.getDocument({ data: await file.arrayBuffer() }).promise;
  const n = pdf.numPages;
  const pages = [];
  for (let i = 1; i <= Math.min(n, 60); i++) {
    const pg = await pdf.getPage(i);
    const ct = await pg.getTextContent();
    pages.push(ct.items.map(x => x.str).join(" "));
  }
  const raw = pages.join("\n\n");
  return { text: raw.length > 14000 ? raw.slice(0, 14000) + "\n[truncado]" : raw, pages: n };
};

// ── 24h Lockout Screen ────────────────────────────────────────────────────────
function LockoutScreen({ t, remaining, onSubscribe }) {
  const [countdown, setCountdown] = useState(remaining);
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1000) { clearInterval(timer); window.location.reload(); return 0; }
        return prev - 1000;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div style={{ position:"fixed", inset:0, zIndex:999, background:"#f9f9f8", display:"flex", alignItems:"center", justifyContent:"center", padding:24 }}>
      <div style={{ maxWidth:460, width:"100%", textAlign:"center" }}>
        <LexoraLogo size={56} />
        <div style={{ marginTop:24, marginBottom:8 }}>
          <div style={{ fontSize:22, fontWeight:800, color:"#111827", letterSpacing:"-.4px", marginBottom:8 }}>{t.lockedTitle}</div>
          <div style={{ fontSize:14, color:"#6b7280", marginBottom:28 }}>{t.lockedSub}</div>
        </div>

        {/* Countdown */}
        <div style={{ background:"#111827", borderRadius:16, padding:"24px 32px", marginBottom:24 }}>
          <div style={{ fontSize:12, color:"rgba(255,255,255,0.5)", letterSpacing:1, textTransform:"uppercase", marginBottom:8 }}>{t.lockedTimer}</div>
          <div style={{ fontSize:36, fontWeight:800, color:"white", fontVariantNumeric:"tabular-nums", letterSpacing:2 }}>
            {formatCountdown(countdown)}
          </div>
        </div>

        <div style={{ fontSize:12, color:"#9ca3af", marginBottom:20 }}>{t.lockedOr}</div>

        {/* Plans */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:16 }}>
          <a href={STRIPE_BASIC} target="_blank" rel="noreferrer" style={{ display:"block", padding:"14px 12px", borderRadius:14, background:"#111827", color:"white", textDecoration:"none", textAlign:"center" }}>
            <div style={{ fontSize:11, color:"rgba(255,255,255,0.6)", marginBottom:4 }}>{t.planBasicName}</div>
            <div style={{ fontSize:22, fontWeight:800 }}>{t.planBasicPrice}<span style={{ fontSize:12, fontWeight:400, color:"rgba(255,255,255,0.6)" }}>{t.planBasicPer}</span></div>
            <div style={{ fontSize:11, color:"#4ade80", marginTop:4 }}>{t.savings}</div>
          </a>
          <a href={STRIPE_PRO} target="_blank" rel="noreferrer" style={{ display:"block", padding:"14px 12px", borderRadius:14, border:"1px solid #e5e7eb", color:"#111827", textDecoration:"none", textAlign:"center" }}>
            <div style={{ fontSize:11, color:"#6b7280", marginBottom:4 }}>{t.planProName}</div>
            <div style={{ fontSize:22, fontWeight:800 }}>{t.planProPrice}<span style={{ fontSize:12, fontWeight:400, color:"#9ca3af" }}>{t.planProPer}</span></div>
            <div style={{ fontSize:11, color:"#16a34a", marginTop:4 }}>{t.savings}</div>
          </a>
        </div>
        <div style={{ fontSize:11, color:"#9ca3af" }}>{t.paywallNote}</div>
      </div>
    </div>
  );
}

// ── Paywall Modal ─────────────────────────────────────────────────────────────
function Paywall({ t, onClose }) {
  return (
    <div style={{ position:"fixed", inset:0, zIndex:1000, background:"rgba(0,0,0,0.5)", backdropFilter:"blur(6px)", display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div style={{ background:"#fff", borderRadius:24, padding:"36px 32px", maxWidth:580, width:"100%", boxShadow:"0 32px 80px rgba(0,0,0,0.18)", animation:"modalIn .25s ease", position:"relative" }}>

        {/* X close button — just closes modal, does NOT unlock */}
        <button onClick={onClose} style={{ position:"absolute", top:16, right:16, width:32, height:32, borderRadius:"50%", border:"1px solid #e5e7eb", background:"#f9f9f8", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, color:"#9ca3af", fontFamily:"inherit", lineHeight:1 }}>✕</button>

        <div style={{ textAlign:"center", marginBottom:28 }}>
          <div style={{ display:"inline-flex", alignItems:"center", gap:6, background:"#fef9c3", border:"1px solid #fde68a", borderRadius:20, padding:"4px 12px", fontSize:12, color:"#92400e", fontWeight:600, marginBottom:14 }}>⚠️ {t.paywallBadge}</div>
          <h2 style={{ fontSize:22, fontWeight:800, color:"#111827", marginBottom:6 }}>{t.paywallTitle}</h2>
          <p style={{ fontSize:14, color:"#6b7280" }}>{t.paywallSub}</p>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1.1fr 1fr", gap:12, marginBottom:20 }}>
          {/* Free */}
          <div style={{ border:"1px solid #e5e7eb", borderRadius:16, padding:"18px 14px", opacity:.75 }}>
            <div style={{ fontSize:11, fontWeight:700, color:"#9ca3af", letterSpacing:1, textTransform:"uppercase", marginBottom:8 }}>{t.planFreeName}</div>
            <div style={{ fontSize:24, fontWeight:800, color:"#111827", marginBottom:14 }}>{t.planFreePrice}</div>
            <div style={{ display:"flex", flexDirection:"column", gap:5, marginBottom:16 }}>
              {t.planFreeFeats.map((f,i) => <div key={i} style={{ display:"flex", gap:7, fontSize:12, color:i===2?"#dc2626":"#374151" }}><span style={{ color:i===2?"#dc2626":"#d1d5db" }}>{i===2?"✗":"✓"}</span>{f}</div>)}
            </div>
            <div style={{ textAlign:"center", padding:9, borderRadius:10, border:"1px solid #e5e7eb", background:"#f9f9f8", color:"#9ca3af", fontSize:12 }}>{t.planFreeCta}</div>
          </div>
          {/* Personal */}
          <div style={{ border:"2px solid #111827", borderRadius:16, padding:"18px 14px", position:"relative", transform:"scale(1.02)", boxShadow:"0 8px 24px rgba(0,0,0,0.1)" }}>
            <div style={{ position:"absolute", top:-12, left:"50%", transform:"translateX(-50%)", background:"#111827", color:"#fff", fontSize:10, fontWeight:700, padding:"4px 12px", borderRadius:20, whiteSpace:"nowrap" }}>{t.planBasicBadge}</div>
            <div style={{ fontSize:11, fontWeight:700, color:"#6b7280", letterSpacing:1, textTransform:"uppercase", marginBottom:8 }}>{t.planBasicName}</div>
            <div style={{ display:"flex", alignItems:"baseline", gap:5, marginBottom:2 }}>
              <span style={{ fontSize:24, fontWeight:800, color:"#111827" }}>{t.planBasicPrice}</span>
              <span style={{ fontSize:12, color:"#9ca3af", textDecoration:"line-through" }}>{t.planBasicOld}</span>
            </div>
            <div style={{ fontSize:11, color:"#9ca3af", marginBottom:4 }}>{t.planBasicPer}</div>
            <div style={{ fontSize:11, color:"#16a34a", fontWeight:600, marginBottom:12, background:"#f0fdf4", padding:"2px 8px", borderRadius:20, display:"inline-block" }}>💚 {t.savings}</div>
            <div style={{ display:"flex", flexDirection:"column", gap:5, marginBottom:16 }}>
              {t.planBasicFeats.map((f,i) => <div key={i} style={{ display:"flex", gap:7, fontSize:12, color:"#374151" }}><span style={{ color:"#22c55e" }}>✓</span>{f}</div>)}
            </div>
            <a href={STRIPE_BASIC} target="_blank" rel="noreferrer" style={{ display:"block", textAlign:"center", padding:10, borderRadius:10, background:"#111827", color:"#fff", fontSize:13, fontWeight:700, textDecoration:"none" }}>{t.planBasicCta}</a>
          </div>
          {/* Pro */}
          <div style={{ border:"1px solid #e5e7eb", borderRadius:16, padding:"18px 14px", position:"relative" }}>
            <div style={{ position:"absolute", top:-12, left:"50%", transform:"translateX(-50%)", background:"#6b7280", color:"#fff", fontSize:10, fontWeight:700, padding:"4px 12px", borderRadius:20, whiteSpace:"nowrap" }}>{t.planProBadge}</div>
            <div style={{ fontSize:11, fontWeight:700, color:"#6b7280", letterSpacing:1, textTransform:"uppercase", marginBottom:8 }}>{t.planProName}</div>
            <div style={{ display:"flex", alignItems:"baseline", gap:5, marginBottom:2 }}>
              <span style={{ fontSize:24, fontWeight:800, color:"#111827" }}>{t.planProPrice}</span>
              <span style={{ fontSize:12, color:"#9ca3af", textDecoration:"line-through" }}>{t.planProOld}</span>
            </div>
            <div style={{ fontSize:11, color:"#9ca3af", marginBottom:4 }}>{t.planProPer}</div>
            <div style={{ fontSize:11, color:"#16a34a", fontWeight:600, marginBottom:12, background:"#f0fdf4", padding:"2px 8px", borderRadius:20, display:"inline-block" }}>💚 {t.savings}</div>
            <div style={{ display:"flex", flexDirection:"column", gap:5, marginBottom:16 }}>
              {t.planProFeats.map((f,i) => <div key={i} style={{ display:"flex", gap:7, fontSize:12, color:"#374151" }}><span style={{ color:"#22c55e" }}>✓</span>{f}</div>)}
            </div>
            <a href={STRIPE_PRO} target="_blank" rel="noreferrer" style={{ display:"block", textAlign:"center", padding:10, borderRadius:10, border:"1px solid #e5e7eb", background:"transparent", color:"#111827", fontSize:13, fontWeight:600, textDecoration:"none" }}>{t.planProCta}</a>
          </div>
        </div>
        <p style={{ textAlign:"center", fontSize:11, color:"#9ca3af", marginBottom:14 }}>{t.paywallNote}</p>
        {/* This button ONLY closes the modal — does NOT grant access */}
        <button onClick={onClose} style={{ width:"100%", padding:9, borderRadius:10, border:"1px solid #e5e7eb", background:"transparent", color:"#9ca3af", fontSize:13, cursor:"pointer", fontFamily:"inherit" }}>
          {t.alreadySub}
        </button>
        <p style={{ textAlign:"center", fontSize:10, color:"#d1d5db", marginTop:8 }}>
          {t.lang === "EN" ? "If you have a subscription, contact support to activate your account." : "Si tienes una suscripción activa, contacta soporte para activar tu cuenta."}
        </p>
      </div>
    </div>
  );
}

// ── Google Sign In Modal ───────────────────────────────────────────────────────
// NOTE: This is the UI. To make Google Auth work for real, you'll need to
// integrate Firebase Auth or Supabase (we'll do that in the next step).
function SignInModal({ t, onSkip, onSignIn }) {
  return (
    <div style={{ position:"fixed", inset:0, zIndex:1001, background:"rgba(0,0,0,0.45)", backdropFilter:"blur(6px)", display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div style={{ background:"#fff", borderRadius:20, padding:"36px 32px", maxWidth:400, width:"100%", boxShadow:"0 24px 60px rgba(0,0,0,0.15)", animation:"modalIn .25s ease", textAlign:"center" }}>
        <LexoraLogo size={48} />
        <h2 style={{ fontSize:20, fontWeight:800, color:"#111827", margin:"16px 0 8px" }}>{t.signIn}</h2>
        <p style={{ fontSize:13, color:"#6b7280", lineHeight:1.6, marginBottom:28 }}>{t.signInSub}</p>

        {/* Google Sign In Button */}
        <button onClick={onSignIn} style={{ width:"100%", display:"flex", alignItems:"center", justifyContent:"center", gap:12, padding:"12px 20px", borderRadius:12, border:"1px solid #e5e7eb", background:"#fff", cursor:"pointer", fontSize:14, fontWeight:600, color:"#374151", fontFamily:"inherit", marginBottom:12, transition:"all .15s", boxShadow:"0 1px 3px rgba(0,0,0,0.08)" }}
          onMouseOver={e=>e.currentTarget.style.background="#f9f9f8"}
          onMouseOut={e=>e.currentTarget.style.background="#fff"}
        >
          {/* Google logo */}
          <svg width="18" height="18" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.2l6.7-6.7C35.6 2.2 30.1 0 24 0 14.6 0 6.6 5.4 2.7 13.3l7.8 6C12.3 13 17.7 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4 6.9-10 6.9-17z"/>
            <path fill="#FBBC05" d="M10.5 28.6A14.5 14.5 0 0 1 9.5 24c0-1.6.3-3.2.8-4.7l-7.8-6A24 24 0 0 0 0 24c0 3.9.9 7.5 2.7 10.7l7.8-6.1z"/>
            <path fill="#34A853" d="M24 48c6.1 0 11.2-2 14.9-5.4l-7.5-5.8c-2 1.4-4.6 2.2-7.4 2.2-6.3 0-11.7-4.3-13.5-10l-7.8 6C6.6 42.6 14.6 48 24 48z"/>
          </svg>
          {t.signInGoogle}
        </button>

        <button onClick={onSkip} style={{ width:"100%", padding:"10px", borderRadius:12, border:"none", background:"transparent", color:"#9ca3af", fontSize:13, cursor:"pointer", fontFamily:"inherit" }}>
          {t.signInSkip}
        </button>
      </div>
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [lang, setLang]               = useState("es");
  const [messages, setMessages]       = useState([]);
  const [input, setInput]             = useState("");
  const [loading, setLoading]         = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth > 768);
  const [showPaywall, setShowPaywall] = useState(false);
  const [isPro, setIsPro]             = useState(false);
  const [showSignIn, setShowSignIn]   = useState(false);
  const [user, setUser]               = useState(null); // { name, email, photo }
  const [legalOpen, setLegalOpen]     = useState(false);
  const [savedChats, setSavedChats]   = useState(() => loadChats());
  const [activeChatId, setActiveChatId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [pdfFile, setPdfFile]         = useState(null);
  const [pdfStatus, setPdfStatus]     = useState("idle");
  const [showUploadZone, setShowUploadZone] = useState(false);

  const [usageCount, setUsageCount] = useState(() => {
    try { return parseInt(localStorage.getItem(STORAGE_KEY) || "0", 10); } catch { return 0; }
  });

  // 24h lockout state
  const [lockoutInfo, setLockoutInfo] = useState(() => getLockoutInfo());

  const bottomRef   = useRef(null);
  const inputRef    = useRef(null);
  const fileRef     = useRef(null);
  const pdfAnalyzed = useRef(false);

  const t          = T[lang];
  const freeLeft   = Math.max(0, FREE_LIMIT - usageCount);
  const isLocked   = !isPro && (lockoutInfo.locked || usageCount >= FREE_LIMIT);
  const hasChatted = messages.filter(m => m.role === "user").length > 0;
  const isMobile   = window.innerWidth <= 768;

  const filteredChats = searchQuery.trim()
    ? savedChats.filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase()))
    : savedChats;

  useEffect(() => {
    setMessages([{ role:"assistant", content:t.welcome, id:"welcome" }]);
  }, [lang]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:"smooth" }); }, [messages, loading]);

  // Auto-save chat
  useEffect(() => {
    if (!hasChatted) return;
    const userMsgs = messages.filter(m => m.role === "user" && !m.silent);
    if (userMsgs.length === 0) return;
    const title = userMsgs[0].content.slice(0, 55) + (userMsgs[0].content.length > 55 ? "…" : "");
    const chatId = activeChatId || Date.now().toString();
    if (!activeChatId) setActiveChatId(chatId);
    const updated = { id:chatId, title, messages, date:Date.now(), lang };
    setSavedChats(prev => { const next = [updated, ...prev.filter(c=>c.id!==chatId)]; saveChats(next); return next; });
  }, [messages]);

  const bumpUsage = () => {
    const next = usageCount + 1;
    setUsageCount(next);
    try { localStorage.setItem(STORAGE_KEY, String(next)); } catch {}
    if (next >= FREE_LIMIT && !isPro) {
      setLockout();
      setLockoutInfo(getLockoutInfo());
      setTimeout(() => setShowPaywall(true), 800);
    }
  };

  const fmt = (text) => text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em style='color:#6b7280;font-size:12px'>$1</em>")
    .replace(/^---$/gm, "<hr style='border:none;border-top:1px solid #f3f4f6;margin:12px 0'/>")
    .replace(/^## (.*$)/gm, "<div style='font-weight:700;color:#111827;margin:16px 0 6px;font-size:14px'>$1</div>")
    .replace(/^### (.*$)/gm, "<div style='font-weight:600;color:#374151;margin:10px 0 4px;font-size:13px'>$1</div>")
    .replace(/^- (.*$)/gm, "<div style='display:flex;gap:8px;margin:4px 0'><span style='color:#d1d5db;flex-shrink:0;font-size:9px;margin-top:5px'>●</span><span>$1</span></div>")
    .replace(/\n/g, "<br/>");

  // PDF
  const processPdf = async (file) => {
    if (!file || file.type !== "application/pdf") return;
    setShowUploadZone(false); setPdfStatus("reading");
    try {
      const { text, pages } = await extractPdf(file);
      setPdfFile({ text, name:file.name, pages }); setPdfStatus("ready");
    } catch { setPdfStatus("error"); setTimeout(()=>setPdfStatus("idle"), 3000); }
  };
  const removePdf = () => { setPdfFile(null); setPdfStatus("idle"); pdfAnalyzed.current=false; if(fileRef.current) fileRef.current.value=""; };

  useEffect(() => {
    if (pdfStatus==="ready" && pdfFile && !pdfAnalyzed.current) {
      pdfAnalyzed.current=true;
      sendMessage(t.pdfContext(pdfFile.name), true);
    }
    if (pdfStatus==="idle") pdfAnalyzed.current=false;
  }, [pdfStatus, pdfFile]);

  // Send message
  const sendMessage = async (text, silent=false) => {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;
    if (isLocked) { setShowPaywall(true); return; }
    const userMsg = { role:"user", content:msg, id:Date.now(), silent };
    setMessages(prev=>[...prev, userMsg]);
    if (!silent) setInput("");
    setLoading(true);
    bumpUsage();
    const history = [...messages, userMsg].filter(m=>m.id!=="welcome").map(m=>({role:m.role,content:m.content}));
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({
          model:"claude-sonnet-4-20250514",
          max_tokens:1000,
          system: SYSTEM(lang, pdfFile?.text||"", pdfFile?.name||""),
          messages: history,
        }),
      });
      const data = await res.json();
      const reply = data.content?.filter(b=>b.type==="text").map(b=>b.text).join("\n") || "Error.";
      setMessages(prev=>[...prev, {role:"assistant",content:reply,id:Date.now()}]);
    } catch {
      setMessages(prev=>[...prev, {role:"assistant",content:lang==="es"?"Error de conexión.":"Connection error.",id:Date.now()}]);
    }
    setLoading(false);
    setTimeout(()=>inputRef.current?.focus(), 80);
  };

  // History
  const startNewChat = () => {
    setMessages([{role:"assistant",content:t.welcome,id:"welcome"}]);
    setActiveChatId(null); removePdf(); setInput(""); setSearchQuery("");
    if (isMobile) setSidebarOpen(false);
  };
  const loadChat = (chat) => {
    setMessages(chat.messages); setActiveChatId(chat.id); setLang(chat.lang||"es"); removePdf();
    if (isMobile) setSidebarOpen(false);
  };
  const deleteChat = (id, e) => {
    e.stopPropagation();
    setSavedChats(prev=>{ const next=prev.filter(c=>c.id!==id); saveChats(next); return next; });
    if (activeChatId===id) startNewChat();
  };

  const groupChats = () => {
    const now=Date.now(), DAY=86400000;
    const g={today:[],yesterday:[],older:[]};
    filteredChats.forEach(c=>{ const d=now-c.date; if(d<DAY) g.today.push(c); else if(d<2*DAY) g.yesterday.push(c); else g.older.push(c); });
    return g;
  };
  const groups = groupChats();

  // Google Sign In (UI only — connect Firebase/Supabase for real auth)
  const handleGoogleSignIn = () => {
    // ⚡ PLACEHOLDER: Replace with real Google OAuth
    // When you add Firebase: import { signInWithGoogle } from './firebase'
    // For now, shows demo user
    setUser({ name:"Diego Suárez", email:"diegosuarez@gmail.com", photo:null });
    setShowSignIn(false);
  };

  // Show 24h lockout screen
  if (lockoutInfo.locked && !isPro) {
    return (
      <>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700;800&display=swap'); *{box-sizing:border-box;margin:0;padding:0} body{font-family:'DM Sans',system-ui,sans-serif} @keyframes modalIn{from{opacity:0;transform:translateY(12px)scale(.97)}to{opacity:1;transform:none}}`}</style>
        <LockoutScreen t={t} remaining={lockoutInfo.remaining} onSubscribe={()=>setShowPaywall(true)} />
        {showPaywall && <Paywall t={t} onClose={()=>{ setShowPaywall(false); setIsPro(true); setLockoutInfo({locked:false,remaining:0}); }} />}
      </>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        html,body,#root{height:100%;margin:0;padding:0}
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'DM Sans',system-ui,sans-serif;background:#f9f9f8}
        ::-webkit-scrollbar{width:4px}
        ::-webkit-scrollbar-thumb{background:#e5e7eb;border-radius:2px}
        textarea::placeholder,input::placeholder{color:#9ca3af}
        .si:hover{background:#f3f4f6!important}
        .sq:hover{background:#f3f4f6!important;border-color:#d1d5db!important}
        .ch:hover .del{opacity:1!important}
        .ch:hover{background:#f3f4f6!important}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:none}}
        @keyframes modalIn{from{opacity:0;transform:translateY(12px)scale(.97)}to{opacity:1;transform:none}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
        .mi{animation:fadeUp .18s ease}
        @media(max-width:768px){
          .main-content{padding:16px 12px 12px!important}
          .msg-max{max-width:92%!important}
        }
      `}</style>

      {showPaywall && <Paywall t={t} onClose={()=>{ setShowPaywall(false); }} />}
      {showSignIn && <SignInModal t={t} onSkip={()=>setShowSignIn(false)} onSignIn={handleGoogleSignIn} />}

      <div style={{ display:"flex", height:"100vh", width:"100vw", background:"#f9f9f8", overflow:"hidden" }}>

        {/* ── SIDEBAR ── */}
        <div style={{ width:sidebarOpen?"260px":"0", minWidth:sidebarOpen?"260px":"0", overflow:"hidden", background:"#fff", borderRight:"1px solid #e5e7eb", display:"flex", flexDirection:"column", transition:"all .22s ease", flexShrink:0 }}>

          {/* Logo + brand */}
          <div style={{ padding:"16px 16px 12px", borderBottom:"1px solid #f3f4f6", flexShrink:0 }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:2 }}>
              <LexoraLogo size={34} />
              <div>
                <div style={{ fontSize:17, fontWeight:800, color:"#111827", letterSpacing:"-.4px" }}>Lexora</div>
                <div style={{ fontSize:10, color:"#9ca3af" }}>{t.tagline}</div>
              </div>
            </div>
          </div>

          {/* New Chat */}
          <div style={{ padding:"10px 12px 6px", flexShrink:0 }}>
            <button onClick={startNewChat} style={{ width:"100%", display:"flex", alignItems:"center", gap:9, padding:"9px 12px", borderRadius:9, border:"1px solid #e5e7eb", cursor:"pointer", background:"transparent", color:"#374151", fontSize:13, fontWeight:600, textAlign:"left", fontFamily:"inherit", transition:"all .15s" }}
              onMouseOver={e=>{e.currentTarget.style.background="#f3f4f6";e.currentTarget.style.borderColor="#d1d5db"}}
              onMouseOut={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.borderColor="#e5e7eb"}}
            >
              <span>✏️</span> {t.newChat}
            </button>
          </div>

          {/* Search */}
          <div style={{ padding:"4px 12px 8px", flexShrink:0 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, background:"#f9f9f8", border:"1px solid #e5e7eb", borderRadius:9, padding:"7px 12px" }}>
              <span style={{ color:"#9ca3af", fontSize:13, flexShrink:0 }}>🔍</span>
              <input value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} placeholder={t.searchPlaceholder}
                style={{ flex:1, background:"transparent", border:"none", outline:"none", fontSize:12, color:"#374151", fontFamily:"inherit" }} />
              {searchQuery && <button onClick={()=>setSearchQuery("")} style={{ background:"transparent", border:"none", cursor:"pointer", color:"#9ca3af", fontSize:12, padding:0 }}>✕</button>}
            </div>
          </div>

          {/* Legal notice */}
          <div style={{ margin:"0 12px 8px", flexShrink:0 }}>
            <button onClick={()=>setLegalOpen(o=>!o)} style={{ width:"100%", padding:"8px 12px", borderRadius:9, border:"1px solid #fde68a", background:"#fffbeb", cursor:"pointer", fontFamily:"inherit", textAlign:"left" }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                <span style={{ fontSize:11, fontWeight:700, color:"#92400e" }}>{t.legalNotice}</span>
                <span style={{ fontSize:11, color:"#92400e" }}>{legalOpen?"▲":"▼"}</span>
              </div>
              {legalOpen && <div style={{ fontSize:11, color:"#78350f", marginTop:6, lineHeight:1.5 }}>{t.legalText}</div>}
            </button>
          </div>

          {/* Chat history */}
          <div style={{ flex:1, overflowY:"auto", padding:"0 10px" }}>
            {filteredChats.length===0
              ? <div style={{ padding:12, fontSize:12, color:"#d1d5db", textAlign:"center" }}>{searchQuery?"No se encontraron conversaciones":t.noHistory}</div>
              : Object.entries({[t.today]:groups.today,[t.yesterday]:groups.yesterday,[t.older]:groups.older}).map(([label,chats])=>
                  chats.length>0 && (
                    <div key={label} style={{ marginBottom:8 }}>
                      <div style={{ fontSize:10, color:"#9ca3af", fontWeight:700, letterSpacing:.5, textTransform:"uppercase", padding:"6px 4px 3px" }}>{label}</div>
                      {chats.map(c=>(
                        <div key={c.id} onClick={()=>loadChat(c)} className="ch" style={{ position:"relative", padding:"7px 10px", borderRadius:8, cursor:"pointer", background:activeChatId===c.id?"#f3f4f6":"transparent", marginBottom:1, display:"flex", alignItems:"center", justifyContent:"space-between", gap:6, transition:"background .1s" }}>
                          <span style={{ fontSize:12, color:activeChatId===c.id?"#111827":"#6b7280", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", flex:1 }}>{c.title}</span>
                          <button onClick={(e)=>deleteChat(c.id,e)} className="del" style={{ opacity:0, fontSize:10, color:"#9ca3af", background:"transparent", border:"none", cursor:"pointer", padding:"2px 4px", borderRadius:4, flexShrink:0, transition:"opacity .15s", fontFamily:"inherit" }}>✕</button>
                        </div>
                      ))}
                    </div>
                  )
                )
            }
          </div>

          {/* Free bar */}
          {!isPro && (
            <div style={{ padding:"8px 14px 6px", borderTop:"1px solid #f3f4f6", flexShrink:0 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:5 }}>
                <span style={{ fontSize:11, color:"#6b7280" }}>{t.freeLeft(freeLeft)}</span>
                <button onClick={()=>setShowPaywall(true)} style={{ fontSize:11, color:"#111827", fontWeight:600, background:"transparent", border:"none", cursor:"pointer", fontFamily:"inherit" }}>{t.viewPlans}</button>
              </div>
              <div style={{ width:"100%", height:3, background:"#f3f4f6", borderRadius:2, overflow:"hidden" }}>
                <div style={{ width:`${Math.min(((FREE_LIMIT-freeLeft)/FREE_LIMIT)*100,100)}%`, height:"100%", background:freeLeft===0?"#dc2626":freeLeft<=1?"#f59e0b":"#22c55e", borderRadius:2, transition:"width .4s" }} />
              </div>
            </div>
          )}

          {/* User / Sign In */}
          <div style={{ padding:"8px 12px 14px", borderTop:"1px solid #f3f4f6", flexShrink:0 }}>
            {user ? (
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"8px 10px", borderRadius:9, background:"#f9f9f8" }}>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <div style={{ width:26, height:26, borderRadius:"50%", background:"#111827", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, color:"white", fontWeight:700 }}>
                    {user.name.charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontSize:11, fontWeight:600, color:"#374151" }}>{user.name}</div>
                    <div style={{ fontSize:10, color:"#9ca3af" }}>{user.email}</div>
                  </div>
                </div>
                <button onClick={()=>setUser(null)} style={{ fontSize:11, color:"#9ca3af", background:"transparent", border:"none", cursor:"pointer", fontFamily:"inherit" }}>✕</button>
              </div>
            ) : (
              <button onClick={()=>setShowSignIn(true)} style={{ width:"100%", display:"flex", alignItems:"center", justifyContent:"center", gap:8, padding:"8px", borderRadius:9, border:"1px solid #e5e7eb", background:"transparent", color:"#374151", fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"inherit", transition:"all .15s" }}
                onMouseOver={e=>{e.currentTarget.style.background="#f3f4f6"}}
                onMouseOut={e=>{e.currentTarget.style.background="transparent"}}
              >
                <svg width="14" height="14" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.2l6.7-6.7C35.6 2.2 30.1 0 24 0 14.6 0 6.6 5.4 2.7 13.3l7.8 6C12.3 13 17.7 9.5 24 9.5z"/><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4 6.9-10 6.9-17z"/><path fill="#FBBC05" d="M10.5 28.6A14.5 14.5 0 0 1 9.5 24c0-1.6.3-3.2.8-4.7l-7.8-6A24 24 0 0 0 0 24c0 3.9.9 7.5 2.7 10.7l7.8-6.1z"/><path fill="#34A853" d="M24 48c6.1 0 11.2-2 14.9-5.4l-7.5-5.8c-2 1.4-4.6 2.2-7.4 2.2-6.3 0-11.7-4.3-13.5-10l-7.8 6C6.6 42.6 14.6 48 24 48z"/></svg>
                {t.signIn} con Google
              </button>
            )}
            <button onClick={()=>setLang(lang==="es"?"en":"es")} style={{ width:"100%", padding:"6px", borderRadius:8, border:"1px solid #e5e7eb", background:"transparent", color:"#6b7280", fontSize:12, cursor:"pointer", fontFamily:"inherit", marginTop:6 }}>
              🌐 {lang==="es"?"Switch to English":"Cambiar a Español"}
            </button>
          </div>
        </div>

        {/* ── MAIN ── */}
        <div style={{ flex:1, display:"flex", flexDirection:"column", minWidth:0, height:"100vh" }}>

          {/* Topbar */}
          <div style={{ height:50, borderBottom:"1px solid #e5e7eb", background:"#fff", display:"flex", alignItems:"center", padding:"0 18px", gap:10, flexShrink:0 }}>
            <button onClick={()=>setSidebarOpen(o=>!o)} style={{ background:"transparent", border:"none", cursor:"pointer", color:"#9ca3af", fontSize:17, padding:"4px 6px", borderRadius:6, lineHeight:1 }}>☰</button>
            <div style={{ flex:1 }} />
            {isPro
              ? <div style={{ fontSize:11, color:"#16a34a", background:"#f0fdf4", border:"1px solid #bbf7d0", borderRadius:20, padding:"3px 10px" }}>✓ Pro</div>
              : isLocked
                ? <button onClick={()=>setShowPaywall(true)} style={{ fontSize:11, color:"#dc2626", background:"#fef2f2", border:"1px solid #fecaca", borderRadius:20, padding:"3px 10px", cursor:"pointer", fontFamily:"inherit" }}>🔒 {t.freeUsed}</button>
                : <div style={{ fontSize:11, color:freeLeft<=1?"#f59e0b":"#6b7280", background:"#f9f9f8", border:`1px solid ${freeLeft<=1?"#fde68a":"#e5e7eb"}`, borderRadius:20, padding:"3px 10px" }}>
                    {freeLeft<=1?"⚠️ ":""}{t.freeLeft(freeLeft)}
                  </div>
            }
          </div>

          {/* Messages */}
          <div style={{ flex:1, overflowY:"auto" }}>
            <div style={{ maxWidth:700, margin:"0 auto", padding:"32px 24px 20px", width:"100%" }}>

              <div className="mi" style={{ marginBottom:28 }}>
                <div style={{ display:"flex", gap:12, alignItems:"flex-start" }}>
                  <LexoraLogo size={30} />
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:12, fontWeight:600, color:"#111827", marginBottom:5 }}>Lexora</div>
                    <div style={{ fontSize:14, color:"#374151", lineHeight:1.8 }} dangerouslySetInnerHTML={{ __html:fmt(t.welcome) }} />
                  </div>
                </div>
              </div>

              {!hasChatted && (
                <div style={{ marginBottom:28 }}>
                  <div style={{ fontSize:11, color:"#9ca3af", letterSpacing:.5, textTransform:"uppercase", marginBottom:10 }}>{t.tryAsking}</div>
                  <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                    {t.suggestions.map((s,i) => (
                      <button key={i} onClick={()=>sendMessage(s)} className="sq" style={{ padding:"10px 14px", borderRadius:10, border:"1px solid #e5e7eb", background:"#fff", color:"#374151", fontSize:13, cursor:"pointer", textAlign:"left", fontFamily:"inherit", transition:"all .15s" }}>{s}</button>
                    ))}
                  </div>
                </div>
              )}

              {messages.filter(m=>m.id!=="welcome").map((m,i) => {
                if (m.silent) return null;
                return (
                  <div key={m.id??i} className="mi" style={{ marginBottom:22 }}>
                    {m.role==="user"
                      ? <div style={{ display:"flex", justifyContent:"flex-end" }}>
                          <div style={{ maxWidth:"78%", background:"#111827", color:"#f9f9f8", padding:"10px 16px", borderRadius:"18px 18px 4px 18px", fontSize:14, lineHeight:1.65 }}>{m.content}</div>
                        </div>
                      : <div style={{ display:"flex", gap:12, alignItems:"flex-start" }}>
                          <LexoraLogo size={30} />
                          <div style={{ flex:1 }}>
                            <div style={{ fontSize:12, fontWeight:600, color:"#111827", marginBottom:5 }}>Lexora</div>
                            <div style={{ fontSize:14, color:"#374151", lineHeight:1.8 }} dangerouslySetInnerHTML={{ __html:fmt(m.content) }} />
                          </div>
                        </div>
                    }
                  </div>
                );
              })}

              {isLocked && hasChatted && !lockoutInfo.locked && (
                <div className="mi" style={{ textAlign:"center", padding:28, background:"#fffbeb", borderRadius:16, border:"1px solid #fde68a", marginBottom:20 }}>
                  <div style={{ fontSize:22, marginBottom:8 }}>⚠️</div>
                  <div style={{ fontSize:15, fontWeight:700, color:"#92400e", marginBottom:4 }}>{t.paywallBadge}</div>
                  <div style={{ fontSize:13, color:"#6b7280", marginBottom:16 }}>{t.paywallSub}</div>
                  <button onClick={()=>setShowPaywall(true)} style={{ padding:"11px 28px", borderRadius:10, background:"#111827", color:"white", border:"none", fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
                    {lang==="es"?"Ver planes →":"View plans →"}
                  </button>
                </div>
              )}

              {loading && (
                <div className="mi" style={{ marginBottom:22 }}>
                  <div style={{ display:"flex", gap:12, alignItems:"flex-start" }}>
                    <LexoraLogo size={30} />
                    <div style={{ display:"flex", alignItems:"center", gap:6, paddingTop:7 }}>
                      {[0,1,2].map(d=><div key={d} style={{ width:6, height:6, borderRadius:"50%", background:"#d1d5db", animation:`pulse 1.2s ease ${d*.2}s infinite` }}/>)}
                    </div>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          </div>

          {/* Input */}
          <div style={{ background:"#fff", borderTop:"1px solid #e5e7eb", padding:"12px 24px 16px", flexShrink:0 }}>
            <div style={{ maxWidth:700, margin:"0 auto" }}>
              {showUploadZone && (
                <div onDragOver={e=>{e.preventDefault();e.currentTarget.style.borderColor="#374151";e.currentTarget.style.background="#f3f4f6"}}
                  onDragLeave={e=>{e.currentTarget.style.borderColor="#d1d5db";e.currentTarget.style.background="#fafafa"}}
                  onDrop={e=>{e.preventDefault();e.currentTarget.style.borderColor="#d1d5db";e.currentTarget.style.background="#fafafa";processPdf(e.dataTransfer.files[0]);}}
                  onClick={()=>fileRef.current?.click()}
                  style={{ border:"2px dashed #d1d5db", borderRadius:12, padding:"18px 16px", textAlign:"center", cursor:"pointer", background:"#fafafa", marginBottom:10, transition:"all .2s" }}
                >
                  <div style={{ fontSize:22, marginBottom:6 }}>📄</div>
                  <div style={{ fontSize:13, color:"#374151" }}>{t.uploadDrag} <span style={{ fontWeight:600, textDecoration:"underline" }}>{t.uploadClick}</span></div>
                  <div style={{ fontSize:11, color:"#9ca3af", marginTop:4 }}>{t.uploadHint}</div>
                  <input ref={fileRef} type="file" accept="application/pdf" onChange={e=>processPdf(e.target.files[0])} style={{ display:"none" }} />
                </div>
              )}
              {pdfStatus==="reading" && (
                <div style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 14px", background:"#f9f9f8", border:"1px solid #e5e7eb", borderRadius:10, marginBottom:10 }}>
                  <div style={{ width:13, height:13, border:"2px solid #e5e7eb", borderTop:"2px solid #374151", borderRadius:"50%", animation:"spin .8s linear infinite" }} />
                  <span style={{ fontSize:13, color:"#6b7280" }}>{t.uploadReading}</span>
                </div>
              )}
              {pdfStatus==="ready" && pdfFile && (
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"8px 14px", background:"#f0fdf4", border:"1px solid #bbf7d0", borderRadius:10, marginBottom:10 }}>
                  <span style={{ fontSize:13, color:"#065f46", fontWeight:500 }}>{t.uploadReady(pdfFile.name, pdfFile.pages)}</span>
                  <button onClick={removePdf} style={{ fontSize:11, color:"#9ca3af", background:"transparent", border:"none", cursor:"pointer", fontFamily:"inherit" }}>{t.removeFile} ✕</button>
                </div>
              )}
              {pdfStatus==="error" && (
                <div style={{ padding:"8px 14px", background:"#fef2f2", border:"1px solid #fecaca", borderRadius:10, marginBottom:10, fontSize:13, color:"#dc2626" }}>⚠️ {t.uploadError}</div>
              )}

              <div style={{ display:"flex", gap:8, alignItems:"flex-end", background:"#f9f9f8", border:`1px solid ${isLocked?"#fecaca":"#e5e7eb"}`, borderRadius:14, padding:"10px 10px 10px 14px", transition:"border-color .2s" }}
                onFocusCapture={e=>{ if(!isLocked) e.currentTarget.style.borderColor="#374151"; }}
                onBlurCapture={e=>e.currentTarget.style.borderColor=isLocked?"#fecaca":"#e5e7eb"}
              >
                <button onClick={()=>setShowUploadZone(v=>!v)} title={t.uploadBtn}
                  style={{ width:32, height:32, borderRadius:8, background:showUploadZone?"#111827":"transparent", border:"1px solid #e5e7eb", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontSize:15, flexShrink:0, transition:"all .15s", color:showUploadZone?"#fff":"#6b7280" }}
                  onMouseOver={e=>{ if(!showUploadZone) e.currentTarget.style.background="#f3f4f6"; }}
                  onMouseOut={e=>{ if(!showUploadZone) e.currentTarget.style.background="transparent"; }}
                >📎</button>
                <textarea ref={inputRef} value={input} onChange={e=>setInput(e.target.value)}
                  onKeyDown={e=>{ if(e.key==="Enter"&&!e.shiftKey){ e.preventDefault(); isLocked?setShowPaywall(true):sendMessage(); }}}
                  placeholder={isLocked?t.lockedInput:t.placeholder}
                  rows={1} disabled={isLocked||loading}
                  style={{ flex:1, background:"transparent", border:"none", color:isLocked?"#9ca3af":"#111827", fontSize:14, resize:"none", outline:"none", fontFamily:"inherit", lineHeight:1.5, maxHeight:120, paddingTop:2, cursor:isLocked?"not-allowed":"text" }}
                  onInput={e=>{ e.target.style.height="auto"; e.target.style.height=Math.min(e.target.scrollHeight,120)+"px"; }}
                />
                <button onClick={()=>isLocked?setShowPaywall(true):sendMessage()} disabled={!isLocked&&(loading||!input.trim())}
                  style={{ width:34, height:34, borderRadius:9, background:isLocked?"#dc2626":(!input.trim()||loading?"#f3f4f6":"#111827"), border:"none", cursor:(!isLocked&&(!input.trim()||loading))?"not-allowed":"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, transition:"background .15s" }}>
                  <span style={{ color:isLocked?"#fff":(!input.trim()||loading?"#d1d5db":"#fff"), fontSize:16, lineHeight:1 }}>{isLocked?"🔒":"↑"}</span>
                </button>
              </div>
              <div style={{ textAlign:"center", marginTop:7, fontSize:11, color:"#d1d5db" }}>{t.disclaimer}</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
