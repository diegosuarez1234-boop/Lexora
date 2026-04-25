import { useState, useRef, useEffect } from "react";
import { useUser, SignIn } from "@clerk/react";

const STRIPE_BASIC = "https://buy.stripe.com/00w3cveUa26ceWQ3xA3Ru02";
const STRIPE_PRO   = "https://buy.stripe.com/14A7sL6nEaCI01Wfgi3Ru01";
const FREE_LIMIT   = 5;
const STORAGE_KEY  = "lurix_usage";
const HISTORY_KEY  = "lurix_chats";

const loadChats = () => {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]"); } catch { return []; }
};
const saveChats = (chats) => {
  try { localStorage.setItem(HISTORY_KEY, JSON.stringify(chats.slice(0, 30))); } catch {}
};

const T = {
  es: {
    tagline:      "Asistente legal con IA",
    lang:         "EN",
    placeholder:  "Pregunta algo o sube un contrato PDF…",
    thinking:     "Analizando…",
    newChat:      "Nueva consulta",
    disclaimer:   "Lurix brinda orientación informativa. Consulta un abogado licenciado.",
    jurisdiction: "Jurisdicción",
    jurisdictions:["Puerto Rico"],
    freeLeft:     (n) => `${n} de 5 gratis`,
    freeUsed:     "Límite gratuito alcanzado",
    viewPlans:    "Ver planes",
    welcome:      "Hola, soy Lurix — tu asistente legal con IA.\n\nPuedo ayudarte con consultas legales, leer tus contratos, explicarte tus derechos, y orientarte sobre qué tipo de abogado necesitas.\n\n¿En qué puedo ayudarte hoy?",
    suggestions:  [
      "¿Qué hago si me despiden sin causa?",
      "¿Cuáles son mis derechos como inquilino?",
      "¿Cómo registro una LLC en Puerto Rico?",
      "Recibí una carta de cobro agresiva, ¿qué hago?",
    ],
    tryAsking:    "Preguntas frecuentes",
    uploadBtn:    "Subir contrato PDF",
    uploadDrag:   "Arrastra tu PDF aquí o",
    uploadClick:  "haz click para seleccionar",
    uploadHint:   "Contratos, acuerdos, NDA, términos de servicio…",
    uploadReading:"Leyendo PDF…",
    uploadReady:  (name, pages) => `${name} · ${pages} pág.`,
    uploadError:  "No se pudo leer el PDF. Intenta pegar el texto.",
    removeFile:   "Quitar",
    pdfContext:   (name) => `He subido el contrato **${name}**. Por favor analízalo completamente: resumen, obligaciones, cláusulas de riesgo, cláusulas favorables, qué negociar, y tu recomendación final.`,
    historyTitle: "Historial",
    noHistory:    "Aquí aparecerán tus consultas anteriores.",
    today:        "Hoy",
    yesterday:    "Ayer",
    older:        "Anteriores",
    deleteChat:   "Borrar",
    paywallBadge:  "Has usado tus 5 consultas gratis",
    paywallTitle:  "Elige tu plan",
    paywallSub:    "Continúa consultando sin límites. Cancela cuando quieras.",
    planFreeName:  "Gratis",
    planFreePrice: "$0",
    planFreePer:   "",
    planFreeFeats: ["5 consultas al mes","Consultas legales básicas","Sin historial guardado"],
    planFreeCta:   "Plan actual",
    planBasicName: "Personal",
    planBasicBadge:"Más popular",
    planBasicPrice:"$15",
    planBasicOld:  "$19",
    planBasicPer:  "/mes",
    planBasicFeats:["Consultas ilimitadas","Análisis de contratos PDF","Historial guardado","Soporte por email"],
    planBasicCta:  "Comenzar por $15/mes",
    planProName:   "Profesional",
    planProBadge:  "Para negocios",
    planProPrice:  "$45",
    planProOld:    "$49",
    planProPer:    "/mes",
    planProFeats:  ["Todo lo de Personal","Acceso prioritario","Ideal para agentes y negocios","Múltiples usuarios","Soporte dedicado"],
    planProCta:    "Comenzar por $45/mes",
    paywallNote:   "Pago seguro con Stripe · Cancela cuando quieras · Sin contratos",
    lockedInput:   "Suscríbete para continuar…",
    savings:       "Ahorras $4/mes vs precio normal",
    savingsPro:    "Ahorras $4/mes vs precio normal",
  },
  en: {
    tagline:      "AI-powered legal assistant",
    lang:         "ES",
    placeholder:  "Ask anything or upload a PDF contract…",
    thinking:     "Analyzing…",
    newChat:      "New chat",
    disclaimer:   "Lurix provides informational guidance only. Consult a licensed attorney.",
    jurisdiction: "Jurisdiction",
    jurisdictions:["Puerto Rico"],
    freeLeft:     (n) => `${n} of 5 free`,
    freeUsed:     "Free limit reached",
    viewPlans:    "View plans",
    welcome:      "Hi, I'm Lurix — your AI legal assistant.\n\nI can help with legal questions, read your contracts, explain your rights, and guide you on what type of lawyer you need.\n\nWhat can I help you with today?",
    suggestions:  [
      "What are my rights if I'm fired without cause?",
      "What are my rights as a tenant?",
      "How do I register an LLC in Puerto Rico?",
      "I got an aggressive debt collection letter. Help!",
    ],
    tryAsking:    "Frequent questions",
    uploadBtn:    "Upload PDF contract",
    uploadDrag:   "Drag your PDF here or",
    uploadClick:  "click to select",
    uploadHint:   "Contracts, agreements, NDA, terms of service…",
    uploadReading:"Reading PDF…",
    uploadReady:  (name, pages) => `${name} · ${pages} p.`,
    uploadError:  "Could not read PDF. Try pasting the text.",
    removeFile:   "Remove",
    pdfContext:   (name) => `I've uploaded the contract **${name}**. Please analyze it fully: summary, obligations, risk clauses, favorable clauses, what to negotiate, and your final recommendation.`,
    historyTitle: "History",
    noHistory:    "Your past consultations will appear here.",
    today:        "Today",
    yesterday:    "Yesterday",
    older:        "Older",
    deleteChat:   "Delete",
    paywallBadge:  "You've used your 5 free consultations",
    paywallTitle:  "Choose your plan",
    paywallSub:    "Keep consulting without limits. Cancel anytime.",
    planFreeName:  "Free",
    planFreePrice: "$0",
    planFreePer:   "",
    planFreeFeats: ["5 consultations/month","Basic legal questions","No saved history"],
    planFreeCta:   "Current plan",
    planBasicName: "Personal",
    planBasicBadge:"Most popular",
    planBasicPrice:"$15",
    planBasicOld:  "$19",
    planBasicPer:  "/mo",
    planBasicFeats:["Unlimited consultations","PDF contract analysis","Saved chat history","Email support"],
    planBasicCta:  "Start for $15/mo",
    planProName:   "Professional",
    planProBadge:  "For businesses",
    planProPrice:  "$45",
    planProOld:    "$49",
    planProPer:    "/mo",
    planProFeats:  ["Everything in Personal","Priority access","Ideal for agents & businesses","Multiple users","Dedicated support"],
    planProCta:    "Start for $45/mo",
    paywallNote:   "Secure payment via Stripe · Cancel anytime · No contracts",
    lockedInput:   "Subscribe to continue…",
    savings:       "Save $4/mo vs regular price",
    savingsPro:    "Save $4/mo vs regular price",
  },
};

const SYSTEM = (lang, juris, docText, docName) => {
  const base = `You are Lurix, a specialized AI legal assistant for everyday people.
Language: ${lang === "es" ? "ALWAYS respond in Spanish" : "ALWAYS respond in English"}
Jurisdiction: ${juris}
Be warm, direct, plain language. Actionable steps. Cite laws when helpful.
Use **bold** for key terms, bullet points for lists.
End with brief italic disclaimer to consult a licensed attorney.`;
  if (!docText) return base;
  return `${base}

The user uploaded a legal document: "${docName}".
--- DOCUMENT ---
${docText}
--- END ---
Reference the document specifically in all answers. For full analysis use: Summary · Obligations · Risk clauses · Favorable clauses · What to negotiate · Final recommendation`;
};

const loadPdfJs = () => new Promise((resolve, reject) => {
  if (window.pdfjsLib) { resolve(window.pdfjsLib); return; }
  const s = document.createElement("script");
  s.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
  s.onload = () => {
    window.pdfjsLib.GlobalWorkerOptions.workerSrc =
      "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
    resolve(window.pdfjsLib);
  };
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
  return {
    text: raw.length > 14000 ? raw.slice(0, 14000) + "\n[...truncado...]" : raw,
    pages: n,
  };
};

// Close button SVG — reusable
const CloseIcon = ({ size = 11, color = "#6b7280" }) => (
  <svg width={size} height={size} viewBox="0 0 11 11" fill="none">
    <line x1="2" y1="2" x2="9" y2="9" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="9" y1="2" x2="2" y2="9" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

// Check icon
const CheckIcon = () => (
  <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
    <polyline points="1,4.5 3.5,7 8,2" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// X icon for feature unavailable
const CrossIcon = () => (
  <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
    <line x1="2" y1="2" x2="7" y2="7" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="7" y1="2" x2="2" y2="7" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

function Paywall({ t, onClose }) {
  return (
    <div style={{ position:"fixed", inset:0, zIndex:1000, background:"rgba(0,0,0,0.5)", display:"flex", alignItems:"flex-start", justifyContent:"center", padding:20, overflowY:"auto" }}>
      <div className="paywall-inner" style={{ background:"#fff", borderRadius:24, padding:"36px 32px", maxWidth:620, width:"100%", boxShadow:"0 32px 80px rgba(0,0,0,0.18)", animation:"modalIn .25s ease", position:"relative", margin:"auto" }}>

        {/* X close button */}
        <button
          onClick={onClose}
          style={{ position:"absolute", top:16, right:16, width:32, height:32, borderRadius:"50%", background:"#f3f4f6", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", transition:"background .15s" }}
          onMouseOver={e => e.currentTarget.style.background="#e5e7eb"}
          onMouseOut={e => e.currentTarget.style.background="#f3f4f6"}
        >
          <CloseIcon />
        </button>

        {/* Header */}
        <div style={{ textAlign:"center", marginBottom:28, paddingRight:20, paddingLeft:20 }}>
          <div style={{ display:"inline-flex", alignItems:"center", gap:6, background:"#fffbeb", border:"1px solid #fde68a", borderRadius:20, padding:"4px 12px", fontSize:12, color:"#92400e", fontWeight:600, marginBottom:14 }}>
            {t.paywallBadge}
          </div>
          <h2 style={{ fontSize:24, fontWeight:800, color:"#111827", marginBottom:6, letterSpacing:"-.4px" }}>{t.paywallTitle}</h2>
          <p style={{ fontSize:14, color:"#6b7280" }}>{t.paywallSub}</p>
        </div>

        {/* Plans — 3 columns on desktop, stacked on mobile */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(150px, 1fr))", gap:12, marginBottom:20 }}>

          {/* Free */}
          <div style={{ border:"1px solid #e5e7eb", borderRadius:16, padding:"20px 16px", opacity:.85 }}>
            <div style={{ fontSize:11, fontWeight:700, color:"#9ca3af", letterSpacing:1, textTransform:"uppercase", marginBottom:8 }}>{t.planFreeName}</div>
            <div style={{ fontSize:28, fontWeight:800, color:"#111827", marginBottom:2 }}>{t.planFreePrice}</div>
            <div style={{ fontSize:11, color:"#9ca3af", marginBottom:16 }}>&nbsp;</div>
            <div style={{ display:"flex", flexDirection:"column", gap:6, marginBottom:18 }}>
              {t.planFreeFeats.map((f, i) => (
                <div key={i} style={{ display:"flex", gap:7, fontSize:12, color: i === 2 ? "#dc2626" : "#374151", alignItems:"center" }}>
                  <span style={{ flexShrink:0 }}>{i === 2 ? <CrossIcon /> : <CheckIcon />}</span>{f}
                </div>
              ))}
            </div>
            <div style={{ textAlign:"center", padding:"9px", borderRadius:10, border:"1px solid #e5e7eb", background:"#f9f9f8", color:"#9ca3af", fontSize:12, fontWeight:600 }}>
              {t.planFreeCta}
            </div>
          </div>

          {/* Personal — FEATURED */}
          <div style={{ border:"2px solid #111827", borderRadius:16, padding:"20px 16px", position:"relative", boxShadow:"0 4px 20px rgba(0,0,0,0.08)" }}>
            <div style={{ position:"absolute", top:-12, left:"50%", transform:"translateX(-50%)", background:"#111827", color:"#fff", fontSize:10, fontWeight:700, padding:"4px 12px", borderRadius:20, whiteSpace:"nowrap", letterSpacing:.5 }}>
              {t.planBasicBadge}
            </div>
            <div style={{ fontSize:11, fontWeight:700, color:"#6b7280", letterSpacing:1, textTransform:"uppercase", marginBottom:8 }}>{t.planBasicName}</div>
            <div style={{ display:"flex", alignItems:"baseline", gap:6, marginBottom:2 }}>
              <span style={{ fontSize:28, fontWeight:800, color:"#111827" }}>{t.planBasicPrice}</span>
              <span style={{ fontSize:13, color:"#9ca3af", textDecoration:"line-through" }}>{t.planBasicOld}</span>
            </div>
            <div style={{ fontSize:11, color:"#9ca3af", marginBottom:4 }}>{t.planBasicPer}</div>
            <div style={{ fontSize:11, color:"#16a34a", fontWeight:600, marginBottom:14, background:"#f0fdf4", padding:"3px 8px", borderRadius:20, display:"inline-block" }}>
              {t.savings}
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:6, marginBottom:18 }}>
              {t.planBasicFeats.map((f, i) => (
                <div key={i} style={{ display:"flex", gap:7, fontSize:12, color:"#374151", alignItems:"center" }}>
                  <span style={{ flexShrink:0 }}><CheckIcon /></span>{f}
                </div>
              ))}
            </div>
            <a href={STRIPE_BASIC} target="_blank" rel="noreferrer" style={{ display:"block", textAlign:"center", padding:"11px", borderRadius:10, background:"#111827", color:"#fff", fontSize:13, fontWeight:700, textDecoration:"none", letterSpacing:"-.2px" }}>
              {t.planBasicCta}
            </a>
          </div>

          {/* Professional */}
          <div style={{ border:"1px solid #e5e7eb", borderRadius:16, padding:"20px 16px", position:"relative" }}>
            <div style={{ position:"absolute", top:-12, left:"50%", transform:"translateX(-50%)", background:"#6b7280", color:"#fff", fontSize:10, fontWeight:700, padding:"4px 12px", borderRadius:20, whiteSpace:"nowrap" }}>
              {t.planProBadge}
            </div>
            <div style={{ fontSize:11, fontWeight:700, color:"#6b7280", letterSpacing:1, textTransform:"uppercase", marginBottom:8 }}>{t.planProName}</div>
            <div style={{ display:"flex", alignItems:"baseline", gap:6, marginBottom:2 }}>
              <span style={{ fontSize:28, fontWeight:800, color:"#111827" }}>{t.planProPrice}</span>
              <span style={{ fontSize:13, color:"#9ca3af", textDecoration:"line-through" }}>{t.planProOld}</span>
            </div>
            <div style={{ fontSize:11, color:"#9ca3af", marginBottom:4 }}>{t.planProPer}</div>
            <div style={{ fontSize:11, color:"#16a34a", fontWeight:600, marginBottom:14, background:"#f0fdf4", padding:"3px 8px", borderRadius:20, display:"inline-block" }}>
              {t.savingsPro}
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:6, marginBottom:18 }}>
              {t.planProFeats.map((f, i) => (
                <div key={i} style={{ display:"flex", gap:7, fontSize:12, color:"#374151", alignItems:"center" }}>
                  <span style={{ flexShrink:0 }}><CheckIcon /></span>{f}
                </div>
              ))}
            </div>
            <a href={STRIPE_PRO} target="_blank" rel="noreferrer" style={{ display:"block", textAlign:"center", padding:"11px", borderRadius:10, border:"1px solid #e5e7eb", background:"transparent", color:"#111827", fontSize:13, fontWeight:600, textDecoration:"none" }}>
              {t.planProCta}
            </a>
          </div>
        </div>

        <p style={{ textAlign:"center", fontSize:11, color:"#9ca3af" }}>{t.paywallNote}</p>
      </div>
    </div>
  );
}

function FreeBar({ used, total }) {
  const pct = Math.min((used / total) * 100, 100);
  const color = pct >= 100 ? "#dc2626" : pct >= 60 ? "#f59e0b" : "#22c55e";
  return (
    <div style={{ width:"100%", height:3, background:"#f3f4f6", borderRadius:2, overflow:"hidden" }}>
      <div style={{ width:`${pct}%`, height:"100%", background:color, borderRadius:2, transition:"width .4s ease" }} />
    </div>
  );
}

export default function App() {
  const { user, isSignedIn } = useUser();
  const [lang, setLang]               = useState("es");
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [jurIdx, setJurIdx]           = useState(0);
  const [messages, setMessages]       = useState([]);
  const [input, setInput]             = useState("");
  const [loading, setLoading]         = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showPaywall, setShowPaywall] = useState(false);
  const isPro = user?.publicMetadata?.isPro === true;
  const [usageCount, setUsageCount]   = useState(() => {
    try { return parseInt(localStorage.getItem(STORAGE_KEY) || "0", 10); } catch { return 0; }
  });

  const [savedChats, setSavedChats]     = useState(() => loadChats());
  const [activeChatId, setActiveChatId] = useState(null);

  const [pdfFile, setPdfFile]             = useState(null);
  const [pdfStatus, setPdfStatus]         = useState("idle");
  const [showUploadZone, setShowUploadZone] = useState(false);

  const bottomRef   = useRef(null);
  const inputRef    = useRef(null);
  const fileRef     = useRef(null);
  const pdfAnalyzed = useRef(false);

  const t        = T[lang];
  const juris    = t.jurisdictions[jurIdx];
  const freeLeft = Math.max(0, FREE_LIMIT - usageCount);
  const isLocked = !isPro && usageCount >= FREE_LIMIT;
  const needsSignIn = isLocked && !isSignedIn;
  const needsPlans  = isLocked && isSignedIn && !isPro;
  const hasChatted = messages.filter(m => m.role === "user").length > 0;

  useEffect(() => {
    if (isSignedIn) setShowSignInModal(false);
  }, [isSignedIn]);

  useEffect(() => {
    setMessages([{ role:"assistant", content:t.welcome, id:"welcome" }]);
  }, [lang]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:"smooth" }); }, [messages, loading]);

  useEffect(() => {
    if (!hasChatted) return;
    const userMsgs = messages.filter(m => m.role === "user" && !m.silent);
    if (userMsgs.length === 0) return;
    const title = userMsgs[0].content.slice(0, 50) + (userMsgs[0].content.length > 50 ? "…" : "");
    const chatId = activeChatId || Date.now().toString();
    if (!activeChatId) setActiveChatId(chatId);
    const updated = { id:chatId, title, messages, date: Date.now(), lang, juris };
    setSavedChats(prev => {
      const filtered = prev.filter(c => c.id !== chatId);
      const next = [updated, ...filtered];
      saveChats(next);
      return next;
    });
  }, [messages]);

  const bumpUsage = () => {
    const next = usageCount + 1;
    setUsageCount(next);
    try { localStorage.setItem(STORAGE_KEY, String(next)); } catch {}
  };

  const fmt = (text) => text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em style='color:#6b7280;font-size:12px'>$1</em>")
    .replace(/^---$/gm, "<hr style='border:none;border-top:1px solid #f3f4f6;margin:12px 0'/>")
    .replace(/^## (.*$)/gm, "<div style='font-weight:700;color:#111827;margin:16px 0 6px;font-size:14px'>$1</div>")
    .replace(/^### (.*$)/gm, "<div style='font-weight:600;color:#374151;margin:12px 0 4px;font-size:13px'>$1</div>")
    .replace(/^- (.*$)/gm, "<div style='display:flex;gap:8px;margin:4px 0'><span style='color:#d1d5db;flex-shrink:0;font-size:9px;margin-top:5px'>●</span><span>$1</span></div>")
    .replace(/\n/g, "<br/>");

  const processPdf = async (file) => {
    if (!file || file.type !== "application/pdf") return;
    setShowUploadZone(false);
    setPdfStatus("reading");
    try {
      const { text, pages } = await extractPdf(file);
      setPdfFile({ text, name: file.name, pages });
      setPdfStatus("ready");
    } catch {
      setPdfStatus("error");
      setTimeout(() => setPdfStatus("idle"), 3000);
    }
  };

  const removePdf = () => {
    setPdfFile(null);
    setPdfStatus("idle");
    pdfAnalyzed.current = false;
    if (fileRef.current) fileRef.current.value = "";
  };

  useEffect(() => {
    if (pdfStatus === "ready" && pdfFile && !pdfAnalyzed.current) {
      pdfAnalyzed.current = true;
      sendMessage(t.pdfContext(pdfFile.name), true);
    }
    if (pdfStatus === "idle") pdfAnalyzed.current = false;
  }, [pdfStatus, pdfFile]);

  const sendMessage = async (text, silent = false) => {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;
    if (isLocked) { setShowPaywall(true); return; }
    const userMsg = { role:"user", content:msg, id:Date.now(), silent };
    setMessages(prev => [...prev, userMsg]);
    if (!silent) setInput("");
    setLoading(true);
    bumpUsage();
    const history = [...messages, userMsg].filter(m => m.id !== "welcome").map(m => ({ role:m.role, content:m.content }));
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST",
        headers:{
          "Content-Type":"application/json",
          "x-api-key": import.meta.env.VITE_ANTHROPIC_API_KEY || "",
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
          model:"claude-sonnet-4-20250514",
          max_tokens:1000,
          system: SYSTEM(lang, juris, pdfFile?.text || "", pdfFile?.name || ""),
          messages: history,
        }),
      });
      const data = await res.json();
      const reply = data.content?.filter(b => b.type === "text").map(b => b.text).join("\n") || "Error.";
      setMessages(prev => [...prev, { role:"assistant", content:reply, id:Date.now() }]);
    } catch {
      setMessages(prev => [...prev, { role:"assistant", content:lang === "es" ? "Error de conexión." : "Connection error.", id:Date.now() }]);
    }
    setLoading(false);
    setTimeout(() => inputRef.current?.focus(), 80);
  };

  const loadChat = (chat) => {
    setMessages(chat.messages);
    setActiveChatId(chat.id);
    setLang(chat.lang || "es");
    removePdf();
  };

  const deleteChat = (id, e) => {
    e.stopPropagation();
    setSavedChats(prev => { const next = prev.filter(c => c.id !== id); saveChats(next); return next; });
    if (activeChatId === id) startNewChat();
  };

  const startNewChat = () => {
    setMessages([{ role:"assistant", content:t.welcome, id:"welcome" }]);
    setActiveChatId(null);
    removePdf();
    setInput("");
  };

  const groupChats = () => {
    const now = Date.now();
    const DAY = 86400000;
    const groups = { today:[], yesterday:[], older:[] };
    savedChats.forEach(c => {
      const diff = now - c.date;
      if (diff < DAY) groups.today.push(c);
      else if (diff < 2 * DAY) groups.yesterday.push(c);
      else groups.older.push(c);
    });
    return groups;
  };

  const groups = groupChats();

  // Scale icon — no emoji, pure SVG
  const ScaleIcon = () => (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <line x1="8" y1="2" x2="8" y2="14" stroke="#fff" strokeWidth="1.4" strokeLinecap="round"/>
      <line x1="3" y1="14" x2="13" y2="14" stroke="#fff" strokeWidth="1.4" strokeLinecap="round"/>
      <line x1="8" y1="4" x2="2" y2="7" stroke="#fff" strokeWidth="1.4" strokeLinecap="round"/>
      <line x1="8" y1="4" x2="14" y2="7" stroke="#fff" strokeWidth="1.4" strokeLinecap="round"/>
      <path d="M2 7 Q2 10 5 10 Q8 10 8 7" stroke="#fff" strokeWidth="1.2" fill="none"/>
      <path d="M8 7 Q8 10 11 10 Q14 10 14 7" stroke="#fff" strokeWidth="1.2" fill="none"/>
    </svg>
  );

  const PaperclipIcon = () => (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <path d="M13.5 7.5L7 14a4.5 4.5 0 01-6.36-6.36l7-7a3 3 0 014.24 4.24L5.5 11.5a1.5 1.5 0 01-2.12-2.12L9 4" stroke="#6b7280" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );

  const SendIcon = ({ locked }) => (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      {locked ? (
        <>
          <rect x="4" y="7" width="8" height="7" rx="1.5" stroke="#fff" strokeWidth="1.4"/>
          <path d="M5.5 7V5a2.5 2.5 0 015 0v2" stroke="#fff" strokeWidth="1.4" strokeLinecap="round"/>
        </>
      ) : (
        <path d="M8 13V3M4 7l4-4 4 4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      )}
    </svg>
  );

  const MenuIcon = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <line x1="2" y1="4" x2="14" y2="4" stroke="#9ca3af" strokeWidth="1.4" strokeLinecap="round"/>
      <line x1="2" y1="8" x2="14" y2="8" stroke="#9ca3af" strokeWidth="1.4" strokeLinecap="round"/>
      <line x1="2" y1="12" x2="14" y2="12" stroke="#9ca3af" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  );

  const EditIcon = () => (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
      <path d="M9.5 2.5l2 2L4 12H2v-2L9.5 2.5z" stroke="#374151" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );

  const GlobeIcon = () => (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
      <circle cx="7" cy="7" r="5.5" stroke="#6b7280" strokeWidth="1.3"/>
      <path d="M7 1.5C7 1.5 5 4 5 7s2 5.5 2 5.5M7 1.5C7 1.5 9 4 9 7s-2 5.5-2 5.5M1.5 7h11" stroke="#6b7280" strokeWidth="1.3"/>
    </svg>
  );

  const canUsePdf = isPro || isSignedIn; // PDF only for paid/signed-in users

  const renderInput = () => (
    <div
      onDragOver={e => { if (!canUsePdf) return; e.preventDefault(); e.currentTarget.querySelector('.drop-hint')?.style && (e.currentTarget.querySelector('.drop-hint').style.display='flex'); }}
      onDragLeave={e => { e.currentTarget.querySelector('.drop-hint')?.style && (e.currentTarget.querySelector('.drop-hint').style.display='none'); }}
      onDrop={e => { e.preventDefault(); if (!canUsePdf) return; e.currentTarget.querySelector('.drop-hint')?.style && (e.currentTarget.querySelector('.drop-hint').style.display='none'); processPdf(e.dataTransfer.files[0]); }}
    >
      {pdfStatus === "reading" && (
        <div style={{ display:"flex", alignItems:"center", gap:8, padding:"9px 14px", background:"#f9f9f8", border:"1px solid #e5e7eb", borderRadius:10, marginBottom:10 }}>
          <div style={{ width:13, height:13, border:"2px solid #e5e7eb", borderTop:"2px solid #374151", borderRadius:"50%", animation:"spin .8s linear infinite" }} />
          <span style={{ fontSize:13, color:"#6b7280" }}>{t.uploadReading}</span>
        </div>
      )}
      {pdfStatus === "ready" && pdfFile && (
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"8px 14px", background:"#f0fdf4", border:"1px solid #bbf7d0", borderRadius:10, marginBottom:10 }}>
          <span style={{ fontSize:13, color:"#065f46", fontWeight:500 }}>{t.uploadReady(pdfFile.name, pdfFile.pages)}</span>
          <button onClick={removePdf} style={{ fontSize:11, color:"#9ca3af", background:"transparent", border:"none", cursor:"pointer", fontFamily:"inherit" }}>{t.removeFile} ✕</button>
        </div>
      )}
      {pdfStatus === "error" && (
        <div style={{ padding:"8px 14px", background:"#fef2f2", border:"1px solid #fecaca", borderRadius:10, marginBottom:10, fontSize:13, color:"#dc2626" }}>{t.uploadError}</div>
      )}
      {showUploadZone && canUsePdf && (
        <div
          onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor="#374151"; e.currentTarget.style.background="#f3f4f6"; }}
          onDragLeave={e => { e.currentTarget.style.borderColor="#d1d5db"; e.currentTarget.style.background="#fafafa"; }}
          onDrop={e => { e.preventDefault(); e.currentTarget.style.borderColor="#d1d5db"; e.currentTarget.style.background="#fafafa"; processPdf(e.dataTransfer.files[0]); }}
          onClick={() => fileRef.current?.click()}
          style={{ border:"2px dashed #d1d5db", borderRadius:12, padding:"20px 16px", textAlign:"center", cursor:"pointer", background:"#fafafa", marginBottom:10, transition:"all .2s" }}
        >
          <div style={{ fontSize:13, color:"#374151" }}>
            {t.uploadDrag} <span style={{ fontWeight:600, textDecoration:"underline" }}>{t.uploadClick}</span>
          </div>
          <div style={{ fontSize:11, color:"#9ca3af", marginTop:5 }}>{t.uploadHint}</div>
          <input ref={fileRef} type="file" accept="application/pdf" onChange={e => processPdf(e.target.files[0])} style={{ display:"none" }} />
        </div>
      )}
      <div
        style={{ display:"flex", gap:8, alignItems:"flex-end", background:"#fff", border:`1.5px solid ${isLocked ? "#fecaca" : "#e5e7eb"}`, borderRadius:16, padding:"10px 10px 10px 14px", transition:"border-color .2s", boxShadow:"0 2px 8px rgba(0,0,0,0.06)" }}
        onFocusCapture={e => { if (!isLocked) e.currentTarget.style.borderColor="#374151"; }}
        onBlurCapture={e => e.currentTarget.style.borderColor=isLocked ? "#fecaca" : "#e5e7eb"}
      >
        <button
          onClick={() => canUsePdf ? setShowUploadZone(v => !v) : setShowPaywall(true)}
          title={canUsePdf ? t.uploadBtn : (lang === "es" ? "Disponible en plan Personal" : "Available in Personal plan")}
          style={{ width:32, height:32, borderRadius:8, background:showUploadZone ? "#111827" : "transparent", border:"1px solid #e5e7eb", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, transition:"all .15s", opacity: canUsePdf ? 1 : 0.4 }}
          onMouseOver={e => { if (canUsePdf && !showUploadZone) e.currentTarget.style.background="#f3f4f6"; }}
          onMouseOut={e => { if (!showUploadZone) e.currentTarget.style.background="transparent"; }}
        >
          <PaperclipIcon />
        </button>
        <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); isLocked ? setShowPaywall(true) : sendMessage(); }}} placeholder={isLocked ? t.lockedInput : t.placeholder} rows={1} disabled={isLocked || loading} style={{ flex:1, background:"transparent", border:"none", color:isLocked ? "#9ca3af" : "#111827", fontSize:14, resize:"none", outline:"none", fontFamily:"inherit", lineHeight:1.5, maxHeight:120, paddingTop:2, cursor:isLocked ? "not-allowed" : "text" }} onInput={e => { e.target.style.height="auto"; e.target.style.height=Math.min(e.target.scrollHeight, 120) + "px"; }} />
        <button onClick={() => isLocked ? setShowPaywall(true) : sendMessage()} disabled={!isLocked && (loading || !input.trim())} style={{ width:34, height:34, borderRadius:9, background:isLocked ? "#dc2626" : (!input.trim() || loading ? "#f3f4f6" : "#111827"), border:"none", cursor:(!isLocked && (!input.trim() || loading)) ? "not-allowed" : "pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, transition:"background .15s" }}>
          <SendIcon locked={isLocked} />
        </button>
      </div>
      <div style={{ textAlign:"center", marginTop:7, fontSize:11, color:"#d1d5db" }}>{t.disclaimer}</div>
    </div>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'DM Sans',system-ui,sans-serif;background:#f9f9f8}
        ::-webkit-scrollbar{width:4px}
        ::-webkit-scrollbar-thumb{background:#e5e7eb;border-radius:2px}
        textarea::placeholder{color:#9ca3af}
        .si:hover{background:#f3f4f6!important}
        .sq:hover{background:#f3f4f6!important;border-color:#d1d5db!important}
        .ch:hover .del{opacity:1!important}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:none}}
        @keyframes modalIn{from{opacity:0;transform:translateY(12px)scale(.97)}to{opacity:1;transform:none}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
        .mi{animation:fadeUp .18s ease}

        /* Mobile responsive */
        @media(max-width:640px){
          .sidebar{
            position:fixed!important;
            top:0;left:0;bottom:0;
            z-index:200;
            width:82vw!important;
            min-width:260px!important;
            max-width:320px!important;
            transform:translateX(-100%);
            transition:transform .28s cubic-bezier(.4,0,.2,1)!important;
            box-shadow:8px 0 32px rgba(0,0,0,0.18);
          }
          .sidebar.open{
            transform:translateX(0)!important;
          }
          .sidebar-overlay.visible{
            display:block!important;
          }
          .paywall-inner{
            max-height:88vh!important;
            overflow-y:auto!important;
            -webkit-overflow-scrolling:touch!important;
            border-radius:20px!important;
            padding:24px 16px!important;
          }
          h1{ font-size:22px!important; }
        }
        .sidebar-overlay{
          display:none;
          position:fixed;
          inset:0;
          background:rgba(0,0,0,0.45);
          z-index:199;
          backdrop-filter:blur(2px);
          -webkit-backdrop-filter:blur(2px);
        }
      `}</style>

      {showPaywall && <Paywall t={t} onClose={() => { setShowPaywall(false); }} />}

      {showSignInModal && (
        <div style={{ position:"fixed", inset:0, zIndex:1000, background:"rgba(0,0,0,0.5)", display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
          <div style={{ background:"#fff", borderRadius:20, padding:"0 0 28px", maxWidth:400, width:"100%", position:"relative", overflow:"hidden" }}>
            {/* Back arrow header */}
            <div style={{ display:"flex", alignItems:"center", padding:"14px 16px 0", borderBottom:"1px solid #f3f4f6", marginBottom:4 }}>
              <button onClick={() => setShowSignInModal(false)} style={{ display:"flex", alignItems:"center", gap:6, background:"transparent", border:"none", cursor:"pointer", color:"#374151", fontSize:13, fontWeight:500, fontFamily:"inherit", padding:"6px 0" }}>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M11 4L6 9l5 5" stroke="#374151" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {lang === "es" ? "Volver" : "Back"}
              </button>
            </div>
            <div style={{ padding:"0 20px" }}>
              <SignIn routing="hash" />
            </div>
          </div>
        </div>
      )}

      <div style={{ display:"flex", height:"100vh", background:"#f9f9f8", fontFamily:"'DM Sans',system-ui,sans-serif" }}>

        {/* Mobile overlay - only when sidebar open */}
        <div
          className={`sidebar-overlay${sidebarOpen ? " visible" : ""}`}
          onClick={() => setSidebarOpen(false)}
        />

        {/* SIDEBAR */}
        <div className={`sidebar${sidebarOpen ? " open" : ""}`} style={{ width:sidebarOpen ? "240px" : "0", minWidth:sidebarOpen ? "240px" : "0", overflow:"hidden", background:"#fff", borderRight:"1px solid #e5e7eb", display:"flex", flexDirection:"column", transition:"all .22s ease", flexShrink:0 }}>

          {/* Logo */}
          <div style={{ padding:"18px 18px 12px", borderBottom:"1px solid #f3f4f6" }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:2 }}>
              <div style={{ width:34, height:34, borderRadius:8, overflow:"hidden", flexShrink:0 }}>
                <img src="/logo.png" alt="Lurix" style={{ width:"100%", height:"100%", objectFit:"contain" }} />
              </div>
              <span style={{ fontSize:17, fontWeight:800, color:"#111827", letterSpacing:"-.4px" }}>Lurix</span>
            </div>
            <div style={{ fontSize:11, color:"#9ca3af", paddingLeft:40 }}>{t.tagline}</div>
          </div>

          {/* New chat */}
          <div style={{ padding:"10px 10px 4px" }}>
            <button onClick={startNewChat} style={{ width:"100%", display:"flex", alignItems:"center", gap:8, padding:"9px 12px", borderRadius:8, border:"1px solid #e5e7eb", cursor:"pointer", background:"transparent", color:"#374151", fontSize:13, fontWeight:500, textAlign:"left", fontFamily:"inherit", transition:"all .15s" }}
              onMouseOver={e => e.currentTarget.style.background="#f3f4f6"}
              onMouseOut={e => e.currentTarget.style.background="transparent"}
            >
              <EditIcon />{t.newChat}
            </button>
          </div>

          {/* History */}
          <div style={{ flex:1, overflowY:"auto", padding:"4px 10px" }}>
            {savedChats.length === 0 ? (
              <div style={{ padding:"12px", fontSize:12, color:"#d1d5db", textAlign:"center", lineHeight:1.5 }}>{t.noHistory}</div>
            ) : (
              Object.entries({ [t.today]:groups.today, [t.yesterday]:groups.yesterday, [t.older]:groups.older }).map(([label, chats]) =>
                chats.length > 0 && (
                  <div key={label} style={{ marginBottom:8 }}>
                    <div style={{ fontSize:10, color:"#9ca3af", fontWeight:700, letterSpacing:.5, textTransform:"uppercase", padding:"6px 4px 3px" }}>{label}</div>
                    {chats.map(c => (
                      <div key={c.id} onClick={() => loadChat(c)} className="ch si" style={{ position:"relative", padding:"7px 10px", borderRadius:7, cursor:"pointer", background:activeChatId === c.id ? "#f3f4f6" : "transparent", marginBottom:1, display:"flex", alignItems:"center", justifyContent:"space-between", gap:6 }}>
                        <span style={{ fontSize:12, color:activeChatId === c.id ? "#111827" : "#6b7280", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", flex:1 }}>{c.title}</span>
                        <button onClick={(e) => deleteChat(c.id, e)} className="del" style={{ opacity:0, fontSize:10, color:"#9ca3af", background:"transparent", border:"none", cursor:"pointer", padding:"2px 4px", borderRadius:4, flexShrink:0, transition:"opacity .15s", fontFamily:"inherit" }}>✕</button>
                      </div>
                    ))}
                  </div>
                )
              )
            )}
          </div>

          {/* Free usage bar - only show when not locked */}
          {!isPro && !isLocked && (
            <div style={{ padding:"10px 14px 8px", borderTop:"1px solid #f3f4f6" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:5 }}>
                <span style={{ fontSize:11, color:"#6b7280" }}>{t.freeLeft(freeLeft)}</span>
                <button onClick={() => setShowPaywall(true)} style={{ fontSize:11, color:"#111827", fontWeight:600, background:"transparent", border:"none", cursor:"pointer", fontFamily:"inherit" }}>{t.viewPlans}</button>
              </div>
              <FreeBar used={usageCount} total={FREE_LIMIT} />
            </div>
          )}

          {/* Jurisdiction */}
          <div style={{ padding:"10px 12px", borderTop:"1px solid #f3f4f6" }}>
            <div style={{ fontSize:10, color:"#9ca3af", letterSpacing:.5, textTransform:"uppercase", marginBottom:5 }}>{t.jurisdiction}</div>
            <select value={jurIdx} onChange={e => setJurIdx(Number(e.target.value))} style={{ width:"100%", background:"#f9f9f8", border:"1px solid #e5e7eb", color:"#374151", borderRadius:8, padding:"6px 8px", fontSize:12, cursor:"pointer", outline:"none", fontFamily:"inherit" }}>
              {t.jurisdictions.map((j, i) => <option key={i} value={i}>{j}</option>)}
            </select>
          </div>

          {/* Language toggle */}
          <div style={{ padding:"8px 12px 4px", borderTop:"1px solid #f3f4f6" }}>
            <button onClick={() => setLang(lang === "es" ? "en" : "es")} style={{ width:"100%", display:"flex", alignItems:"center", justifyContent:"center", gap:6, padding:"6px", borderRadius:8, border:"1px solid #e5e7eb", background:"transparent", color:"#6b7280", fontSize:12, cursor:"pointer", fontFamily:"inherit" }}>
              <GlobeIcon /> {lang === "es" ? "Switch to English" : "Cambiar a Español"}
            </button>
          </div>

          {/* Sign In button when not logged in */}
          {!isSignedIn && (
            <div style={{ padding:"8px 12px 14px", borderTop:"1px solid #f3f4f6" }}>
              <button
                onClick={() => setShowSignInModal(true)}
                style={{ width:"100%", display:"flex", alignItems:"center", justifyContent:"center", gap:8, padding:"9px 12px", borderRadius:10, border:"none", background:"#111827", color:"#fff", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit", transition:"background .15s" }}
                onMouseOver={e => e.currentTarget.style.background="#374151"}
                onMouseOut={e => e.currentTarget.style.background="#111827"}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 8a3 3 0 100-6 3 3 0 000 6zM2 12a5 5 0 0110 0" stroke="#fff" strokeWidth="1.3" strokeLinecap="round"/></svg>
                {lang === "es" ? "Iniciar sesión" : "Sign in"}
              </button>
            </div>
          )}

          {/* User profile */}
          {isSignedIn && user && (
            <div style={{ padding:"8px 12px 14px", borderTop:"1px solid #f3f4f6", position:"relative" }}>
              <button
                onClick={() => setShowUserMenu(v => !v)}
                style={{ width:"100%", display:"flex", alignItems:"center", gap:10, padding:"8px 10px", borderRadius:10, border:"none", background:"transparent", cursor:"pointer", fontFamily:"inherit", transition:"background .15s" }}
                onMouseOver={e => e.currentTarget.style.background="#f3f4f6"}
                onMouseOut={e => e.currentTarget.style.background="transparent"}
              >
                <div style={{ width:32, height:32, borderRadius:"50%", background:"#111827", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, fontSize:12, fontWeight:700, color:"#fff" }}>
                  {user.firstName ? user.firstName[0].toUpperCase() : user.emailAddresses?.[0]?.emailAddress?.[0]?.toUpperCase() || "U"}
                </div>
                <div style={{ flex:1, textAlign:"left", overflow:"hidden" }}>
                  <div style={{ fontSize:12, fontWeight:600, color:"#111827", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                    {user.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : user.emailAddresses?.[0]?.emailAddress}
                  </div>
                  <div style={{ fontSize:10, color: isPro ? "#16a34a" : "#9ca3af" }}>
                    {isPro ? (lang === "es" ? "Plan Pro" : "Pro plan") : (lang === "es" ? "Plan gratuito" : "Free plan")}
                  </div>
                </div>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 5l4 4 4-4" stroke="#9ca3af" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>

              {showUserMenu && (
                <div style={{ position:"absolute", bottom:"100%", left:12, right:12, background:"#fff", border:"1px solid #e5e7eb", borderRadius:12, padding:"6px", boxShadow:"0 -4px 20px rgba(0,0,0,0.08)", zIndex:100 }}>
                  <div style={{ padding:"8px 10px", fontSize:11, color:"#9ca3af", borderBottom:"1px solid #f3f4f6", marginBottom:4 }}>
                    {user.emailAddresses?.[0]?.emailAddress}
                  </div>
                  <button onClick={() => { setShowPaywall(true); setShowUserMenu(false); }} style={{ width:"100%", display:"flex", alignItems:"center", gap:8, padding:"8px 10px", borderRadius:8, border:"none", background:"transparent", cursor:"pointer", fontFamily:"inherit", fontSize:13, color:"#374151", textAlign:"left" }}
                    onMouseOver={e => e.currentTarget.style.background="#f3f4f6"}
                    onMouseOut={e => e.currentTarget.style.background="transparent"}
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1.5" y="1.5" width="11" height="11" rx="2.5" stroke="#6b7280" strokeWidth="1.3"/><path d="M4.5 7h5M7 4.5v5" stroke="#6b7280" strokeWidth="1.3" strokeLinecap="round"/></svg>
                    {lang === "es" ? "Ver planes" : "View plans"}
                  </button>
                  <button onClick={() => { setLang(lang === "es" ? "en" : "es"); setShowUserMenu(false); }} style={{ width:"100%", display:"flex", alignItems:"center", gap:8, padding:"8px 10px", borderRadius:8, border:"none", background:"transparent", cursor:"pointer", fontFamily:"inherit", fontSize:13, color:"#374151", textAlign:"left" }}
                    onMouseOver={e => e.currentTarget.style.background="#f3f4f6"}
                    onMouseOut={e => e.currentTarget.style.background="transparent"}
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="5.5" stroke="#6b7280" strokeWidth="1.3"/><path d="M7 1.5C7 1.5 5 4 5 7s2 5.5 2 5.5M7 1.5C7 1.5 9 4 9 7s-2 5.5-2 5.5M1.5 7h11" stroke="#6b7280" strokeWidth="1.3"/></svg>
                    {lang === "es" ? "Switch to English" : "Cambiar a Español"}
                  </button>
                  <a href="mailto:hello@trylurix.com" style={{ width:"100%", display:"flex", alignItems:"center", gap:8, padding:"8px 10px", borderRadius:8, border:"none", background:"transparent", cursor:"pointer", fontFamily:"inherit", fontSize:13, color:"#374151", textDecoration:"none" }}
                    onMouseOver={e => e.currentTarget.style.background="#f3f4f6"}
                    onMouseOut={e => e.currentTarget.style.background="transparent"}
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1.5" y="3" width="11" height="8" rx="1.5" stroke="#6b7280" strokeWidth="1.3"/><path d="M1.5 4.5l5.5 3.5 5.5-3.5" stroke="#6b7280" strokeWidth="1.3" strokeLinecap="round"/></svg>
                    Support
                  </a>
                  <div style={{ borderTop:"1px solid #f3f4f6", marginTop:4, paddingTop:4 }}>
                    <button onClick={() => { window.Clerk?.signOut().then(() => window.location.reload()); setShowUserMenu(false); }} style={{ width:"100%", display:"flex", alignItems:"center", gap:8, padding:"8px 10px", borderRadius:8, border:"none", background:"transparent", cursor:"pointer", fontFamily:"inherit", fontSize:13, color:"#dc2626", textAlign:"left" }}
                      onMouseOver={e => e.currentTarget.style.background="#fef2f2"}
                      onMouseOut={e => e.currentTarget.style.background="transparent"}
                    >
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5 7h7M9.5 4.5L12 7l-2.5 2.5M5 2.5H3a1 1 0 00-1 1v7a1 1 0 001 1h2" stroke="#dc2626" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      {lang === "es" ? "Cerrar sesión" : "Log out"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* MAIN */}
        <div style={{ flex:1, display:"flex", flexDirection:"column", minWidth:0, background:"#f9f9f8" }}>

          {/* Top bar */}
          <div style={{ height:50, borderBottom:"1px solid #e5e7eb", background:"#fff", display:"flex", alignItems:"center", padding:"0 18px", gap:10, flexShrink:0 }}>
            <button onClick={() => setSidebarOpen(o => !o)} style={{ background:"transparent", border:"none", cursor:"pointer", padding:"4px 6px", borderRadius:6, lineHeight:1 }}>
              <MenuIcon />
            </button>
            {!hasChatted && <div style={{ flex:1, textAlign:"center", fontSize:14, fontWeight:600, color:"#111827" }}>Lurix</div>}
            <div style={{ flex: hasChatted ? 1 : 0 }} />
            {isPro
              ? <div style={{ fontSize:11, color:"#16a34a", background:"#f0fdf4", border:"1px solid #bbf7d0", borderRadius:20, padding:"3px 10px" }}>Pro activo</div>
              : needsPlans
                ? <button onClick={() => setShowPaywall(true)} style={{ fontSize:11, color:"#dc2626", background:"#fef2f2", border:"1px solid #fecaca", borderRadius:20, padding:"3px 10px", cursor:"pointer", fontFamily:"inherit" }}>{t.freeUsed}</button>
                : null
            }
          </div>

          {/* LANDING STATE — centered like ChatGPT */}
          {!hasChatted && (
            <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"0 20px" }}>
              <div style={{ width:64, height:64, borderRadius:16, overflow:"hidden", marginBottom:20 }}>
                <img src="/logo.png" alt="Lurix" style={{ width:"100%", height:"100%", objectFit:"contain" }} />
              </div>
              <h1 style={{ fontSize:28, fontWeight:700, color:"#111827", marginBottom:8, letterSpacing:"-.5px" }}>
                {lang === "es" ? "¿En qué puedo ayudarte?" : "How can I help you?"}
              </h1>
              <p style={{ fontSize:14, color:"#6b7280", marginBottom:32, textAlign:"center", maxWidth:400, lineHeight:1.6 }}>
                {lang === "es" ? "Tu asistente legal con IA para Puerto Rico." : "Your AI legal assistant for Puerto Rico."}
              </p>
              <div style={{ width:"100%", maxWidth:640, display:"flex", flexDirection:"column", gap:8, marginBottom:24 }}>
                {t.suggestions.map((s, i) => (
                  <button key={i} onClick={() => sendMessage(s)} className="sq" style={{ padding:"12px 16px", borderRadius:12, border:"1px solid #e5e7eb", background:"#fff", color:"#374151", fontSize:13, cursor:"pointer", textAlign:"left", fontFamily:"inherit", transition:"all .15s" }}>{s}</button>
                ))}
              </div>
              {/* Input centered */}
              <div style={{ width:"100%", maxWidth:640 }}>
                {renderInput()}
              </div>
            </div>
          )}

          {/* CHAT STATE — messages + input at bottom */}
          {hasChatted && (
            <>
              <div style={{ flex:1, overflowY:"auto" }}>
                <div style={{ width:"100%", padding:"32px 40px 20px" }}>

                  {/* Chat messages */}
                  {messages.filter(m => m.id !== "welcome").map((m, i) => {
                    if (m.silent) return null;
                    return (
                      <div key={m.id ?? i} className="mi" style={{ marginBottom:24 }}>
                        {m.role === "user"
                          ? <div style={{ display:"flex", justifyContent:"flex-end" }}>
                              <div style={{ maxWidth:"78%", background:"#111827", color:"#f9f9f8", padding:"10px 16px", borderRadius:"18px 18px 4px 18px", fontSize:14, lineHeight:1.65 }}>{m.content}</div>
                            </div>
                          : <div style={{ display:"flex", gap:12, alignItems:"flex-start" }}>
                              <div style={{ width:32, height:32, borderRadius:"50%", overflow:"hidden", flexShrink:0 }}>
                                <img src="/logo.png" alt="Lurix" style={{ width:"100%", height:"100%", objectFit:"contain" }} />
                              </div>
                              <div style={{ flex:1 }}>
                                <div style={{ fontSize:12, fontWeight:600, color:"#111827", marginBottom:5 }}>Lurix</div>
                                <div style={{ fontSize:14, color:"#374151", lineHeight:1.8 }} dangerouslySetInnerHTML={{ __html:fmt(m.content) }} />
                              </div>
                            </div>
                        }
                      </div>
                    );
                  })}

                  {needsSignIn && (
                    <div className="mi" style={{ background:"#fff", borderRadius:16, border:"1px solid #e5e7eb", marginBottom:20, overflow:"hidden" }}>
                      <div style={{ display:"flex", alignItems:"center", padding:"12px 16px", borderBottom:"1px solid #f3f4f6" }}>
                        <button onClick={startNewChat} style={{ display:"flex", alignItems:"center", gap:6, background:"transparent", border:"none", cursor:"pointer", color:"#374151", fontSize:13, fontWeight:500, fontFamily:"inherit", padding:"4px 0" }}>
                          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                            <path d="M11 4L6 9l5 5" stroke="#374151" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          {lang === "es" ? "Volver" : "Back"}
                        </button>
                      </div>
                      <div style={{ padding:"24px", textAlign:"center" }}>
                        <div style={{ width:48, height:48, background:"#f3f4f6", borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px" }}>
                          <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M12 12a5 5 0 100-10 5 5 0 000 10zM20 21a8 8 0 10-16 0" stroke="#6b7280" strokeWidth="1.5" strokeLinecap="round"/></svg>
                        </div>
                        <div style={{ fontSize:17, fontWeight:700, color:"#111827", marginBottom:6 }}>
                          {lang === "es" ? "Crea tu cuenta gratis" : "Create your free account"}
                        </div>
                        <div style={{ fontSize:13, color:"#6b7280", marginBottom:24, lineHeight:1.6 }}>
                          {lang === "es" ? "Has usado tus 5 consultas gratis. Crea una cuenta para continuar." : "You've used your 5 free consultations. Sign up to continue."}
                        </div>
                        <div style={{ display:"flex", justifyContent:"center" }}>
                          <SignIn routing="hash" appearance={{ elements: { rootBox: { width:"100%", maxWidth:400 } } }} />
                        </div>
                      </div>
                    </div>
                  )}

                  {needsPlans && (
                    <div className="mi" style={{ textAlign:"center", padding:"32px 24px", background:"#fff", borderRadius:16, border:"1px solid #e5e7eb", marginBottom:20 }}>
                      <div style={{ fontSize:17, fontWeight:700, color:"#111827", marginBottom:6 }}>
                        {lang === "es" ? `Bienvenido${user?.firstName ? `, ${user.firstName}` : ""}` : `Welcome${user?.firstName ? `, ${user.firstName}` : ""}`}
                      </div>
                      <div style={{ fontSize:13, color:"#6b7280", marginBottom:20 }}>
                        {lang === "es" ? "Elige un plan para seguir consultando sin límites." : "Choose a plan to keep consulting without limits."}
                      </div>
                      <button onClick={() => setShowPaywall(true)} style={{ padding:"12px 32px", borderRadius:10, background:"#111827", color:"#fff", border:"none", fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
                        {lang === "es" ? "Ver planes" : "View plans"}
                      </button>
                    </div>
                  )}

                  {loading && (
                    <div className="mi" style={{ marginBottom:22 }}>
                      <div style={{ display:"flex", gap:12, alignItems:"flex-start" }}>
                        <div style={{ width:32, height:32, borderRadius:"50%", overflow:"hidden", flexShrink:0 }}>
                          <img src="/logo.png" alt="Lurix" style={{ width:"100%", height:"100%", objectFit:"contain" }} />
                        </div>
                        <div style={{ display:"flex", alignItems:"center", gap:6, paddingTop:7 }}>
                          {[0,1,2].map(d => <div key={d} style={{ width:6, height:6, borderRadius:"50%", background:"#d1d5db", animation:`pulse 1.2s ease ${d * .2}s infinite` }}/>)}
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={bottomRef} />
                </div>
              </div>

              {/* Input at bottom when chatting */}
              <div style={{ background:"#fff", borderTop:"1px solid #e5e7eb", padding:"12px 24px 16px", flexShrink:0 }}>
                <div style={{ width:"100%" }}>
                  {renderInput()}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}