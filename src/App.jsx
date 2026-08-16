import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Plus,
  Send,
  Trash2,
  ArrowLeft,
  Sparkles,
  Loader2,
  PenLine,
  Lightbulb,
  ListChecks,
  BookOpen,
  Home,
  MessageSquare,
  Settings as SettingsIcon,
  LogOut,
  Sun,
  Moon,
  Pencil,
  ChevronRight,
  Camera,
  User,
  X,
} from "lucide-react";
import { watchAuthState, signInWithGoogle, signInWithApple, signOutUser } from "./auth";
import {
  saveConversation,
  deleteConversation as deleteConversationDoc,
  loadAllConversations,
} from "./firestoreChats";

// ---------- Font import (scoped to this artifact) ----------
const FontStyle = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Inter:wght@400;500;600;700&display=swap');
    * { box-sizing: border-box; }
    .font-display { font-family: 'Fraunces', serif; }
    .font-body { font-family: 'Inter', sans-serif; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
    .msg-in { animation: fadeIn 0.25s ease-out; }
    @keyframes pulseDot { 0%, 80%, 100% { opacity: 0.25; } 40% { opacity: 1; } }
    .dot { animation: pulseDot 1.2s infinite; }
    .dot:nth-child(2) { animation-delay: 0.15s; }
    .dot:nth-child(3) { animation-delay: 0.3s; }
    .spin { animation: spin 0.9s linear infinite; }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    ::-webkit-scrollbar { width: 8px; }
    ::-webkit-scrollbar-thumb { background: #2A3B57; border-radius: 8px; }
    ::-webkit-scrollbar-track { background: transparent; }
    textarea:focus, input:focus { outline: none; }
    .card:active { transform: scale(0.98); }
    @keyframes fillBar { from { width: 0%; } to { width: 100%; } }
    .splash-bar { animation: fillBar 2s ease forwards; }
    @keyframes splashIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
    .splash-text { animation: splashIn 0.6s ease-out; }
    @media (prefers-reduced-motion: reduce) {
      .msg-in { animation: none; }
      .dot { animation: none; }
      .spin { animation: none; }
    }
  `}</style>
);

const THEMES = {
  dark: {
    bgApp: "#0D0B14",
    bgRaised: "#18141F",
    bgBubbleUser: "#241D30",
    textPrimary: "#F3EEFB",
    textSecondary: "#9C93B5",
    accent: "#22C55E",
    accentSoft: "rgba(34, 197, 94, 0.14)",
    border: "#2A2438",
  },
  light: {
    bgApp: "#F3EEFB",
    bgRaised: "#FFFFFF",
    bgBubbleUser: "#E6DFFB",
    textPrimary: "#241B35",
    textSecondary: "#786C97",
    accent: "#16A34A",
    accentSoft: "rgba(22, 163, 74, 0.12)",
    border: "#E1D6F5",
  },
};

const COLORS = { ...THEMES.dark };

function applyTheme(name) {
  Object.assign(COLORS, THEMES[name]);
}

const TOOLS = [
  {
    id: "general",
    name: "Ask Anything",
    desc: "General help with anything on your mind",
    icon: Sparkles,
    tint: "#A78BFA",
    system:
      "You are a warm, capable general-purpose assistant. Be genuinely helpful, clear, and concise. If the person seems unsure what they want help with, ask a short clarifying question.",
    suggestions: ["Productivity", "Habits", "Time management", "Motivation"],
  },
  {
    id: "writing",
    name: "Writing Assistant",
    desc: "Draft, edit, and polish any text",
    icon: PenLine,
    tint: "#4ADE80",
    system:
      "You are a skilled writing assistant. Help draft, edit, tighten, and improve tone for whatever the person is writing. Ask what the piece is for and who it's for if that's unclear.",
    suggestions: ["Tone", "Clarity", "Storytelling", "Editing"],
  },
  {
    id: "explain",
    name: "Explain Anything",
    desc: "Break down tricky topics simply",
    icon: Lightbulb,
    tint: "#C4B5FD",
    system:
      "You are a patient explainer. Break down complex or confusing topics into clear, simple language, using everyday analogies. Check the person's familiarity with the topic if it's unclear.",
    suggestions: ["Compound interest", "Blockchain", "Quantum computing", "Inflation"],
  },
  {
    id: "plan",
    name: "Planner",
    desc: "Plan trips, projects, and tasks",
    icon: ListChecks,
    tint: "#8B5CF6",
    system:
      "You are a practical planning assistant. Help turn goals into concrete plans, steps, and timelines. Ask about constraints (time, budget, scope) if they matter and aren't given.",
    suggestions: ["Trip itinerary", "Weekly schedule", "Budget plan", "Project roadmap"],
  },
  {
    id: "study",
    name: "Study Helper",
    desc: "Explain, quiz, and summarize",
    icon: BookOpen,
    tint: "#34D399",
    system:
      "You are a study assistant. Help explain material, summarize notes, and quiz the person to check understanding. Adapt depth to what they say about their level.",
    suggestions: ["Photosynthesis", "The French Revolution", "Newton's laws", "Cellular respiration"],
  },
  {
    id: "scan",
    name: "Scan & Explain",
    desc: "Snap a photo and get it explained",
    icon: Camera,
    tint: "#22C55E",
    system:
      "You are a sharp visual analyst. When shown a photo of an object, document, label, sign, plant, product, or anything else, identify what it is and explain it clearly. Pull out and transcribe any visible text, numbers, or key details. Be concrete and specific rather than generic.",
  },
];

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function titleFromText(text) {
  const clean = text.trim().replace(/\s+/g, " ");
  return clean.length > 42 ? clean.slice(0, 42) + "…" : clean || "New chat";
}

async function callClaude(messages, systemPrompt) {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system: systemPrompt,
      messages: messages.map((m) => {
        if (m.image) {
          return {
            role: m.role,
            content: [
              { type: "image", source: { type: "base64", media_type: m.image.mediaType, data: m.image.data } },
              { type: "text", text: m.content || "What is this? Explain what it is and pull out any key content, text, or details from it." },
            ],
          };
        }
        return { role: m.role, content: m.content };
      }),
    }),
  });
  if (!response.ok) throw new Error("API error " + response.status);
  const data = await response.json();
  return data.reply || "(no response)";
}

function SplashScreen() {
  return (
    <div
      className="font-body"
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        width: "100%",
        maxWidth: 480,
        margin: "0 auto",
        background: COLORS.bgApp,
        color: COLORS.textPrimary,
        padding: "0 32px",
      }}
    >
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <div className="splash-text font-display" style={{ fontSize: 40, fontWeight: 600, lineHeight: 1.12 }}>
          Find your
          <br />
          <span style={{ color: COLORS.accent }}>way, faster</span>
          <br />
          with AI!
        </div>
      </div>

      <div style={{ paddingBottom: "8vh" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <LogoMark size={20} />
          <span className="font-display" style={{ fontSize: 18, fontWeight: 600 }}>
            Go-Soft
          </span>
        </div>
        <div style={{ width: "100%", height: 3, background: COLORS.border, borderRadius: 3, overflow: "hidden" }}>
          <div className="splash-bar" style={{ height: "100%", background: COLORS.accent, borderRadius: 3 }} />
        </div>
      </div>
    </div>
  );
}

function LogoMark({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <rect x="0" y="0" width="32" height="32" rx="8" fill="#000000" stroke={COLORS.accent} strokeWidth="1" />
      <text
        x="16"
        y="14"
        textAnchor="middle"
        fontFamily="Fraunces, serif"
        fontWeight="600"
        fontSize="12"
        fill={COLORS.accent}
      >
        SC
      </text>
      <path
        d="M16 26c-.15 0-.3-.05-.45-.15-.85-.6-5.15-3.6-5.15-6.95 0-1.75 1.4-3.1 3.1-3.1.9 0 1.7.4 2.2 1 .5-.6 1.3-1 2.2-1 1.7 0 3.1 1.35 3.1 3.1 0 3.35-4.3 6.35-5.15 6.95-.15.1-.3.15-.45.15z"
        fill={COLORS.accent}
      />
    </svg>
  );
}

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.5 0 10.4-1.9 14.3-5.1l-6.6-5.6C29.6 35 26.9 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.6 5.1C9.6 39.6 16.3 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.2 5.7l6.6 5.6C41.9 36.3 44 30.6 44 24c0-1.3-.1-2.7-.4-3.5z" />
    </svg>
  );
}

function AppleMark() {
  return (
    <svg width="17" height="17" viewBox="0 0 384 512" aria-hidden="true">
      <path
        fill="currentColor"
        d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5c0 26.2 4.8 53.3 14.4 81.2 12.8 37.6 59 129.3 107.2 127.6 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-84.1 102.6-121.8-65.2-30.7-61.7-90-61.7-91.8zM256.4 88.7c27-32.1 24.5-61.4 23.7-71.9-23.8 1.4-51.5 16.4-67.5 34.9-17.5 19.5-27.9 44.3-25.6 71.1 25.5 2 48.7-10.7 69.4-34.1z"
      />
    </svg>
  );
}

function AuthScreen({ onSignIn, signingIn }) {
  return (
    <div
      className="font-body"
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        width: "100%",
        maxWidth: 480,
        margin: "0 auto",
        background: COLORS.bgApp,
        color: COLORS.textPrimary,
        padding: "0 28px",
      }}
    >
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center" }}>
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 18,
            background: COLORS.accentSoft,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 18,
          }}
        >
          <LogoMark size={30} />
        </div>
        <div className="font-display" style={{ fontSize: 26, fontWeight: 600, marginBottom: 6 }}>
          Welcome to Go-Soft
        </div>
        <p style={{ color: COLORS.textSecondary, fontSize: 13.5, maxWidth: 280, lineHeight: 1.5 }}>
          Sign in to save your chats and pick up right where you left off.
        </p>
      </div>

      <div style={{ paddingBottom: "8vh" }}>
        <button
          onClick={() => onSignIn("google")}
          disabled={!!signingIn}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            padding: "13px 16px",
            borderRadius: 14,
            border: "none",
            background: "#FFFFFF",
            color: "#1F1F1F",
            fontSize: 14.5,
            fontWeight: 600,
            marginBottom: 12,
            cursor: signingIn ? "default" : "pointer",
            opacity: signingIn && signingIn !== "google" ? 0.6 : 1,
          }}
        >
          {signingIn === "google" ? <Loader2 size={17} className="spin" /> : <GoogleMark />}
          Continue with Google
        </button>

        <button
          onClick={() => onSignIn("apple")}
          disabled={!!signingIn}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            padding: "13px 16px",
            borderRadius: 14,
            border: "none",
            background: "#000000",
            color: "#FFFFFF",
            fontSize: 14.5,
            fontWeight: 600,
            marginBottom: 18,
            cursor: signingIn ? "default" : "pointer",
            opacity: signingIn && signingIn !== "apple" ? 0.6 : 1,
          }}
        >
          {signingIn === "apple" ? <Loader2 size={17} className="spin" /> : <AppleMark />}
          Continue with Apple
        </button>

        <p style={{ fontSize: 11, color: COLORS.textSecondary, textAlign: "center", lineHeight: 1.5 }}>
          By continuing, you agree to sign in with your Google or Apple account.
        </p>
      </div>
    </div>
  );
}

function IconChip({ Icon, tint, size = 20 }) {
  return (
    <div
      style={{
        width: 40,
        height: 40,
        borderRadius: 11,
        background: tint + "22",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <Icon size={size} color={tint} />
    </div>
  );
}

export default function App() {
  const [conversations, setConversations] = useState({});
  const [order, setOrder] = useState([]);
  const [currentId, setCurrentId] = useState(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState("home");
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [signingIn, setSigningIn] = useState(null);
  const [showSplash, setShowSplash] = useState(true);
  const [theme, setTheme] = useState("dark");
  const [profileName, setProfileName] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const previousTabRef = useRef("home");
  const [cameraError, setCameraError] = useState(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("go-soft-theme") || "dark";
      applyTheme(saved);
      setTheme(saved);
    } catch (e) {}
  }, []);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    applyTheme(next);
    setTheme(next);
    try {
      localStorage.setItem("go-soft-theme", next);
    } catch (e) {}
  }

  useEffect(() => {
    const t = setTimeout(() => setShowSplash(false), 2200);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const unsubscribe = watchAuthState((firebaseUser) => {
      setUser(firebaseUser);
      setAuthChecked(true);
    });
    return unsubscribe;
  }, []);

  async function handleSignIn(provider) {
    setSigningIn(provider);
    try {
      if (provider === "google") await signInWithGoogle();
      else await signInWithApple();
    } catch (err) {
      console.error("Sign-in failed:", err);
    } finally {
      setSigningIn(null);
    }
  }

  async function handleSignOut() {
    await signOutUser();
    setTab("home");
  }

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const { conversations: convs, order: ids } = await loadAllConversations(user.uid);
        setOrder(ids);
        setConversations(convs);
      } catch (e) {
        console.error("Failed to load conversations:", e);
      }
    })();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    try {
      const saved = localStorage.getItem("go-soft-profile-name-" + user.uid);
      setProfileName(saved || user.name);
    } catch (e) {
      setProfileName(user.name);
    }
  }, [user]);

  function saveProfileName(name) {
    const trimmed = name.trim();
    if (!trimmed || !user) return;
    setProfileName(trimmed);
    setEditingName(false);
    try {
      localStorage.setItem("go-soft-profile-name-" + user.uid, trimmed);
    } catch (e) {}
  }

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [currentId, conversations, loading, tab]);

  const persistConversation = useCallback(
    async (conv) => {
      if (!user) return;
      try {
        await saveConversation(user.uid, conv);
      } catch (e) {
        console.error("Failed to save conversation:", e);
      }
    },
    [user]
  );

  function openTool(tool) {
    setCurrentId(null);
    setInput("");
    setTab("chat");
    pendingToolRef.current = tool;
  }

  const pendingToolRef = useRef(TOOLS[0]);

  function openExistingChat(id) {
    setCurrentId(id);
    setTab("chat");
  }

  async function sendMessage(rawText, image) {
    const text = (rawText ?? input).trim();
    if (!text && !image) return;
    if (loading) return;

    let convId = currentId;
    let conv;

    if (!convId) {
      const tool = pendingToolRef.current || TOOLS[0];
      convId = uid();
      conv = {
        id: convId,
        title: image ? "Photo scan" : titleFromText(text),
        toolId: tool.id,
        system: tool.system,
        createdAt: Date.now(),
        messages: [],
      };
      setCurrentId(convId);
      const newOrder = [convId, ...order];
      setOrder(newOrder);
    } else {
      conv = conversations[convId];
    }

    const userMsg = image ? { role: "user", content: text, image } : { role: "user", content: text };
    const updatedMessages = [...conv.messages, userMsg];
    const updatedConv = { ...conv, messages: updatedMessages };

    setConversations((prev) => ({ ...prev, [convId]: updatedConv }));
    setInput("");
    setLoading(true);

    try {
      const replyText = await callClaude(updatedMessages, conv.system || TOOLS[0].system);
      const assistantMsg = { role: "assistant", content: replyText };
      const finalConv = { ...updatedConv, messages: [...updatedMessages, assistantMsg] };
      setConversations((prev) => ({ ...prev, [convId]: finalConv }));
      persistConversation(finalConv);
    } catch (e) {
      const errMsg = { role: "assistant", content: "Something went wrong reaching the model. Please try again." };
      const finalConv = { ...updatedConv, messages: [...updatedMessages, errMsg] };
      setConversations((prev) => ({ ...prev, [convId]: finalConv }));
      persistConversation(finalConv);
    } finally {
      setLoading(false);
    }
  }

  function handleCapturedPhoto(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      const [, mediaType, base64] = dataUrl.match(/^data:(.+);base64,(.*)$/) || [];
      if (!base64) return;
      if (!currentId) {
        pendingToolRef.current = TOOLS.find((t) => t.id === "scan") || TOOLS[0];
      }
      setTab("chat");
      sendMessage("", { mediaType, data: base64 });
    };
    reader.readAsDataURL(file);
  }

  function openCamera() {
    previousTabRef.current = tab === "camera" ? "home" : tab;
    setCameraError(null);
    setTab("camera");
  }

  function stopCameraStream() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }

  function closeCamera() {
    stopCameraStream();
    setTab(previousTabRef.current || "home");
  }

  useEffect(() => {
    if (tab !== "camera") return;
    let cancelled = false;
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });
       
