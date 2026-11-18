import { type CSSProperties, useCallback, useEffect, useRef, useState } from "react";
import {
  AchievementsModal,
  GameProvider,
  prefersReducedMotion,
  SecretBurst,
  Toasts,
  useGame,
  XpHud,
} from "./game";

type Member = {
  number: string;
  initials: string; // shown in the pixel frame when there is no photo (or it fails to load)
  accent: string;
  name: string;
  role: string;
  description: string;
  skills: string[];
  projects: Array<{ title: string; description: string }>;
  photo?: string; // optional, a file in client/public/members/
  // where the face is in the photo (CSS percentages) so the square crop centres it
  photoFocus?: { x: string; y: string };
};

const members: Member[] = [
  {
    number: "01",
    initials: "PS",
    accent: "orange",
    name: "Punnawit (Beam) Surarak",
    role: "Backend, AI integration, database, CI/CD",
    description: "Third-year AI Engineering and Data Science student at Bangkok University.",
    skills: ["Python", "Machine Learning", "Computer Vision", "Full-stack"],
    projects: [
      {
        title: "BU ParkView",
        description: "AI smart parking • Popular Vote Award, BDI Hackathon 2026",
      },
      {
        title: "HIWWHEE — ตลอดกาลไม่มีจริง [Official MV]",
        description: "Cast",
      },
    ],
    photo: "/members/punnawit.jpg",
    photoFocus: { x: "42%", y: "35%" },
  },
  // Keep this list in sync with server/data/portfolio.json (the AI reads that file).
  {
    number: "02",
    initials: "PP",
    accent: "purple",
    name: "Pitchayuth Pitchayakasorn",
    role: "Chat UI and content",
    description:
      "Pitchayuth is responsible for developing the Chat UI and structuring the team content.",
    skills: ["Python", "JavaScript"],
    projects: [{ title: "Idol", description: "performs dance and singing at events" }],
    photo: "/members/pitchayuth.jpg",
  },
];

// Member photo inside the pixel frame. If the image cannot load,
// fall back to the initials so the card never shows a broken image.
function AvatarPhoto({
  src,
  initials,
  focus,
}: {
  src: string;
  initials: string;
  focus?: { x: string; y: string };
}) {
  const [failed, setFailed] = useState(false);
  if (failed) return <strong>{initials}</strong>;
  // CSS defaults (20% / 27%) are used when no focus point is given
  const style = focus ? ({ "--photo-x": focus.x, "--photo-y": focus.y } as CSSProperties) : {};
  return (
    <span className="avatar-photo" style={style}>
      <img src={src} alt="" loading="lazy" onError={() => setFailed(true)} />
    </span>
  );
}

// Fun RPG "skill level" for the stat bars: first listed skill Lv.5, then 4, 3...
// (never below 2). Just for fun - not a real rating.
const skillLevel = (index: number) => Math.max(5 - index, 2);

const highlights = [
  ["02", "Builders"],
  ["01", "Shared quest"],
  ["∞", "Ideas to explore"],
];

function PixelArrow() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path d="M2 7h8V4l4 4-4 4V9H2V7Z" fill="currentColor" />
    </svg>
  );
}

function LeafIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" aria-hidden="true">
      <path d="M2 2h8v2h2v2h2v4h-2v2H8v2H4v-2H2V8H0V4h2V2Z" fill="currentColor" />
      <path d="M4 10h2V8h2V6h2V4h2v2h-2v2H8v2H6v2H4v-2Z" fill="#2A2D4A" />
    </svg>
  );
}

function PixelForest({ variant = "standard" }: { variant?: "hero" | "standard" | "contact" }) {
  return (
    <div className={`pixel-forest ${variant}`} aria-hidden="true">
      <svg
        className="forest-layer forest-far"
        data-parallax="0.018"
        viewBox="0 0 1440 360"
        preserveAspectRatio="xMidYMax slice"
      >
        <g fill="#5B4A7A">
          <rect x="0" y="260" width="1440" height="100" />
          <rect x="40" y="194" width="164" height="96" />
          <rect x="24" y="218" width="208" height="72" />
          <rect x="330" y="212" width="176" height="78" />
          <rect x="820" y="188" width="196" height="102" />
          <rect x="1180" y="206" width="220" height="84" />
        </g>
        <g fill="#8E9AB8">
          <rect x="68" y="170" width="104" height="28" />
          <rect x="356" y="188" width="122" height="28" />
          <rect x="852" y="162" width="132" height="32" />
          <rect x="1214" y="178" width="148" height="34" />
        </g>
      </svg>

      <svg
        className="forest-layer forest-near"
        data-parallax="0.045"
        viewBox="0 0 1440 360"
        preserveAspectRatio="xMidYMax slice"
      >
        <g className="tree tree-left">
          <path fill="#754126" d="M118 104h34v176h-34zM78 142h52v18H78zM142 130h52v18h-52z" />
          <g fill="#B5381A">
            <rect x="42" y="74" width="78" height="62" />
            <rect x="82" y="42" width="96" height="84" />
            <rect x="146" y="72" width="78" height="68" />
          </g>
          <g fill="#FF8A1F">
            <rect x="58" y="54" width="54" height="50" />
            <rect x="116" y="28" width="50" height="58" />
            <rect x="166" y="88" width="42" height="36" />
          </g>
          <g fill="#FFC447">
            <rect x="78" y="66" width="28" height="26" />
            <rect x="138" y="46" width="34" height="28" />
          </g>
        </g>

        <g className="bare-tree">
          <path
            fill="#754126"
            d="M314 116h24v164h-24v-76l-44-44v-22h16v16l28 26v-64zm24 42 38-38V94h18v34l-56 56v-26z"
          />
          <rect x="264" y="130" width="24" height="18" fill="#B5381A" />
          <rect x="374" y="86" width="22" height="18" fill="#FFC447" />
        </g>

        <g className="fence" fill="#8A5530">
          <rect x="432" y="226" width="450" height="18" />
          <rect x="432" y="274" width="450" height="18" />
          <path d="M458 196h24v126h-24zM572 196h24v126h-24zM686 196h24v126h-24zM800 196h24v126h-24z" />
          <g fill="#B8743C">
            <rect x="463" y="202" width="8" height="108" />
            <rect x="577" y="202" width="8" height="108" />
            <rect x="691" y="202" width="8" height="108" />
            <rect x="805" y="202" width="8" height="108" />
          </g>
        </g>

        <g className="lantern">
          <rect x="920" y="116" width="22" height="180" fill="#754126" />
          <rect x="902" y="108" width="58" height="18" fill="#2A2D4A" />
          <rect x="908" y="124" width="46" height="58" fill="#2A2D4A" />
          <rect x="916" y="132" width="30" height="40" fill="#FFC447" />
          <rect x="922" y="138" width="18" height="28" fill="#FFF0B8" />
        </g>

        <g className="tree tree-right">
          <path fill="#754126" d="M1208 96h38v192h-38zM1160 134h62v20h-62zM1236 118h62v20h-62z" />
          <g fill="#B5381A">
            <rect x="1100" y="62" width="92" height="78" />
            <rect x="1160" y="26" width="112" height="100" />
            <rect x="1240" y="60" width="112" height="84" />
          </g>
          <g fill="#FF8A1F">
            <rect x="1122" y="40" width="70" height="62" />
            <rect x="1200" y="8" width="64" height="68" />
            <rect x="1280" y="44" width="58" height="68" />
          </g>
          <g fill="#FFC447">
            <rect x="1146" y="54" width="36" height="32" />
            <rect x="1240" y="30" width="40" height="34" />
            <rect x="1300" y="68" width="30" height="28" />
          </g>
        </g>

        <g className="bushes">
          <path fill="#B5381A" d="M0 286h70v-30h48v30h68v74H0zM1010 294h74v-42h54v42h78v66h-206z" />
          <path fill="#FF8A1F" d="M18 272h44v-24h42v38H18zM1034 278h46v-38h40v48h-86z" />
          <path fill="#FFC447" d="M54 252h26v22H54zM1074 252h28v24h-28z" />
        </g>

        <g className="leaf-pile">
          <rect x="706" y="326" width="150" height="20" fill="#B5381A" />
          <rect x="728" y="308" width="104" height="24" fill="#FF8A1F" />
          <rect x="754" y="294" width="58" height="20" fill="#FFC447" />
          <rect x="780" y="284" width="16" height="14" fill="#FFF0B8" />
        </g>
        <rect y="342" width="1440" height="18" fill="#754126" />
      </svg>
    </div>
  );
}

// Quiet background leaves: 11 per section (a third of the old 32 on screen),
// small (10-16px), slow (24-34s per fall) and see-through (30-50% opacity).
const fallingLeaves = Array.from({ length: 11 }, (_, index) => ({
  id: index,
  x: (index * 37 + 11) % 100,
  delay: -((index * 2.9) % 30),
  duration: 24 + ((index * 7) % 11),
  color: ["#FF8A1F", "#FFC447", "#B5381A", "#FFF0B8"][index % 4],
  size: 10 + (index % 3) * 3,
  opacity: 0.3 + (index % 3) * 0.1,
  rest: 15 + ((index * 23) % 70), // height where the leaf rests when motion is reduced
}));

// One leaves layer per section, drawn behind that section's content.
// "offset" shifts the timing so the sections do not look identical.
// Clicking a leaf collects it (+3 XP): it sparkles, then hides until its next fall.
function FallingLeaves({ offset = 0 }: { offset?: number }) {
  const { collectLeaf } = useGame();
  const [collected, setCollected] = useState<number[]>([]);
  const [sparkles, setSparkles] = useState<Array<{ id: number; x: number; y: number }>>([]);

  const collect = (id: number, event: React.MouseEvent<HTMLElement>) => {
    if (collected.includes(id)) return;
    setCollected((list) => [...list, id]);
    collectLeaf();
    // with reduced motion the leaves don't fall, so bring this one back after 20s
    if (prefersReducedMotion()) {
      window.setTimeout(() => setCollected((list) => list.filter((x) => x !== id)), 20000);
    }
    // sparkle where the visitor clicked, relative to this layer
    const layer = event.currentTarget.parentElement!.getBoundingClientRect();
    const sparkle = { id: Date.now(), x: event.clientX - layer.left, y: event.clientY - layer.top };
    setSparkles((list) => [...list.slice(-3), sparkle]);
    window.setTimeout(() => setSparkles((list) => list.filter((s) => s.id !== sparkle.id)), 700);
  };

  return (
    <div className="falling-leaves" aria-hidden="true">
      {fallingLeaves.map((leaf) => (
        <span
          key={leaf.id}
          className={collected.includes(leaf.id) ? "is-collected" : undefined}
          onPointerDown={(event) => event.stopPropagation()} // don't trigger the hero leaf burst
          onClick={(event) => collect(leaf.id, event)}
          // a collected leaf comes back when its fall starts again
          onAnimationIteration={(event) => {
            if (event.animationName === "leaf-fall") {
              setCollected((list) => list.filter((id) => id !== leaf.id));
            }
          }}
          style={
            {
              "--leaf-x": `${leaf.x}%`,
              "--leaf-delay": `${leaf.delay - offset * 7}s`,
              "--leaf-duration": `${leaf.duration}s`,
              "--leaf-color": leaf.color,
              "--leaf-size": `${leaf.size}px`,
              "--leaf-opacity": leaf.opacity,
              "--leaf-rest": leaf.rest,
            } as CSSProperties
          }
        />
      ))}
      {sparkles.map((s) => (
        <b key={s.id} className="leaf-sparkle" style={{ left: s.x, top: s.y }}>
          <i />
          <i />
          <i />
          <i />
          <em>+3</em>
        </b>
      ))}
    </div>
  );
}

function Fireflies({ className = "" }: { className?: string }) {
  const positions = [
    ["8%", "18%"],
    ["24%", "42%"],
    ["41%", "12%"],
    ["62%", "34%"],
    ["78%", "8%"],
    ["91%", "46%"],
  ];
  return (
    <div className={`fireflies ${className}`} aria-hidden="true">
      {Array.from({ length: 6 }, (_, index) => (
        <span
          key={index}
          style={
            {
              "--firefly-x": positions[index][0],
              "--firefly-y": positions[index][1],
              "--firefly-delay": `${index * -0.37}s`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}

// Soft autumn chiptune: 72 BPM, A minor pentatonic, chords Am - F - C - G.
const BPM = 72;
const EIGHTH = 60 / BPM / 2;
const SCALE = [440, 523.25, 587.33, 659.25, 783.99, 880];
const CHORDS = [
  { notes: [220, 261.63, 329.63], bass: 110 },
  { notes: [174.61, 220, 261.63], bass: 87.31 },
  { notes: [196, 261.63, 329.63], bass: 130.81 },
  { notes: [196, 246.94, 293.66], bass: 98 },
];
const MELODY: Array<Array<number | null>> = [
  [0, null, 2, null, 3, null, 2, null],
  [1, null, 0, null, 2, null, null, null],
  [3, null, 4, null, 3, null, 2, null],
  [2, null, 1, null, 0, null, null, null],
];

function MusicToggle() {
  const { musicOn } = useGame();
  const [enabled, setEnabled] = useState(false);
  const [volume, setVolume] = useState(0.14);
  const volumeRef = useRef(volume);
  const engine = useRef<{ ctx: AudioContext; master: GainNode } | null>(null);

  useEffect(() => {
    if (!enabled) return;
    const ctx = new AudioContext();
    const master = ctx.createGain();
    master.gain.value = 0;
    const delay = ctx.createDelay();
    delay.delayTime.value = EIGHTH * 3;
    const feedback = ctx.createGain();
    feedback.gain.value = 0.3;
    const lowpass = ctx.createBiquadFilter();
    lowpass.type = "lowpass";
    lowpass.frequency.value = 1800;
    master.connect(ctx.destination);
    master.connect(delay);
    delay.connect(lowpass);
    lowpass.connect(feedback);
    feedback.connect(delay);
    lowpass.connect(ctx.destination);
    engine.current = { ctx, master };
    void ctx.resume();
    master.gain.linearRampToValueAtTime(volumeRef.current * 2.5, ctx.currentTime + 0.5);

    const tone = (freq: number, start: number, dur: number, type: OscillatorType, gain: number) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, start);
      g.gain.linearRampToValueAtTime(gain, start + 0.03);
      g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
      osc.connect(g);
      g.connect(master);
      osc.start(start);
      osc.stop(start + dur + 0.05);
    };

    const scheduleStep = (time: number, s: number) => {
      const bar = Math.floor(s / 8) % CHORDS.length;
      const pos = s % 8;
      const chord = CHORDS[bar];
      if (pos === 0) {
        chord.notes.forEach((f) => tone(f, time, EIGHTH * 8, "sine", 0.05));
        tone(chord.bass, time, EIGHTH * 4, "triangle", 0.09);
      }
      if (pos === 4) tone(chord.bass, time, EIGHTH * 3, "triangle", 0.06);
      const n = MELODY[bar][pos];
      if (n !== null) tone(SCALE[n], time, EIGHTH * 1.8, "triangle", 0.1);
    };

    let step = 0;
    let next = ctx.currentTime + 0.1;
    const timer = window.setInterval(() => {
      while (next < ctx.currentTime + 0.2) {
        scheduleStep(next, step);
        next += EIGHTH;
        step += 1;
      }
    }, 50);

    return () => {
      window.clearInterval(timer);
      engine.current = null;
      void ctx.close();
    };
  }, [enabled]);

  useEffect(() => {
    volumeRef.current = volume;
    const e = engine.current;
    if (e) e.master.gain.setTargetAtTime(volume * 2.5, e.ctx.currentTime, 0.05);
  }, [volume]);

  return (
    <div className={`music-control ${enabled ? "is-on" : ""}`}>
      <button
        type="button"
        aria-pressed={enabled}
        aria-label={`Music ${enabled ? "on" : "off"}`}
        onClick={() => {
          if (!enabled) musicOn(); // "Night Owl" achievement
          setEnabled(!enabled);
        }}
      >
        <span className="pixel-speaker" aria-hidden="true">
          <i />
        </span>
        <span>Music {enabled ? "on" : "off"}</span>
      </button>
      {enabled && (
        <label>
          <span className="sr-only">Music volume</span>
          <input
            type="range"
            min="0.03"
            max="0.22"
            step="0.01"
            value={volume}
            onChange={(event) => setVolume(Number(event.target.value))}
          />
        </label>
      )}
    </div>
  );
}

function Spark({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" aria-hidden="true">
      <path d="M8 0h4v6h6v8h-6v6H8v-6H2V6h6V0Z" fill="currentColor" />
    </svg>
  );
}

// created_at comes from the server (history) or is set in the browser for new messages
type ChatMessage = { role: "user" | "assistant"; content: string; created_at: string };

// "14:05" for today, "13 Nov, 14:05" for older messages
function formatTime(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const time = date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  if (date.toDateString() === new Date().toDateString()) return time;
  return `${date.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}, ${time}`;
}

// backend URL (empty in dev: Vite proxies /api). Trailing "/" removed so we never build "//api".
const API_URL = (import.meta.env.VITE_API_URL ?? "").replace(/\/+$/, "");
const STORAGE_KEY = "chat-conversation";
const CHAT_ERROR = "The guild could not answer. Please try again in a moment.";
// shown when the backend cannot be reached at all (not running, or still waking up)
const CHAT_OFFLINE =
  "Can't reach the guild's server right now. It may be starting up - please try again in a minute.";
// "Quest" buttons: one click sends a suggested question
const QUESTS = ["Who is Punnawit?", "What awards did the group win?", "What is the tech stack?"];

function ChatDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { chatSent } = useGame();
  const closeButton = useRef<HTMLButtonElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  // typewriter: the AI reply being "typed" and how many characters are shown so far
  const [typingMsg, setTypingMsg] = useState<ChatMessage | null>(null);
  const [shown, setShown] = useState(0);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [conversationId, setConversationId] = useState<string | null>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (!open) return;
    closeButton.current?.focus();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [open, onClose]);

  // load the saved conversation when the dialog opens
  useEffect(() => {
    if (!open || !conversationId || messages.length > 0) return;
    fetch(`${API_URL}/api/history/${conversationId}`)
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => setMessages(data.messages as ChatMessage[]))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // reveal the reply 2 characters every 20ms, then stop
  useEffect(() => {
    if (!typingMsg) return;
    if (shown >= typingMsg.content.length) {
      setTypingMsg(null);
      return;
    }
    const timer = window.setTimeout(() => setShown((n) => n + 2), 20);
    return () => window.clearTimeout(timer);
  }, [typingMsg, shown]);

  // keep the newest text in view (instant while typing so it doesn't jump)
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: typingMsg ? "auto" : "smooth", block: "end" });
  }, [messages, busy, shown, typingMsg]);

  const send = async (text: string) => {
    const message = text.trim();
    if (!message || busy) return;
    setError("");
    setInput("");
    // show the question right away, stamped with the time it was sent
    setMessages((current) => [
      ...current,
      { role: "user", content: message, created_at: new Date().toISOString() },
    ]);
    setBusy(true);
    try {
      const res = await fetch(`${API_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, conversationId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        // the server sends a friendly { error } text, e.g. "Too many requests" on 429.
        // No text + 502/503/504 means a proxy could not reach the backend.
        setError(data.error || (res.status >= 502 ? CHAT_OFFLINE : CHAT_ERROR));
        return;
      }
      if (data.conversationId && data.conversationId !== conversationId) {
        setConversationId(data.conversationId);
        try {
          localStorage.setItem(STORAGE_KEY, data.conversationId);
        } catch {
          // storage can be unavailable in privacy modes
        }
      }
      const reply: ChatMessage = {
        role: "assistant",
        content: data.reply,
        created_at: new Date().toISOString(),
      };
      setMessages((current) => [...current, reply]);
      // typewriter effect, unless the visitor prefers reduced motion
      if (!prefersReducedMotion()) {
        setShown(0);
        setTypingMsg(reply);
      }
      chatSent(message); // +10 XP and chat achievements
    } catch {
      // network problem (server down, offline)
      setError(CHAT_OFFLINE);
    } finally {
      setBusy(false);
    }
  };

  const newChat = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    setConversationId(null);
    setMessages([]);
    setTypingMsg(null);
    setError("");
  };

  if (!open) return null;

  return (
    <div className="chat-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="chat-window pixel-box"
        role="dialog"
        aria-modal="true"
        aria-labelledby="chat-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="chat-heading">
          <div>
            <p className="eyebrow">Campfire link established</p>
            <h2 id="chat-title">Ask the guild</h2>
          </div>
          <button
            ref={closeButton}
            className="icon-button"
            type="button"
            onClick={onClose}
            aria-label="Close chat"
          >
            ×
          </button>
        </div>

        <div className="chat-log" aria-live="polite">
          {messages.length === 0 && (
            <p className="chat-hint">Ask about our team, our skills or our projects.</p>
          )}
          {messages.map((m, i) => {
            const typing = m === typingMsg;
            return (
              <div
                key={i}
                className={`chat-msg ${m.role}${typing ? " is-typing" : ""}`}
                // click a reply that is still typing to show all of it at once
                onClick={typing ? () => setTypingMsg(null) : undefined}
                title={typing ? "Click to skip" : undefined}
              >
                <span className="sr-only">{m.role === "user" ? "You: " : "Guild AI: "}</span>
                {typing ? (
                  <>
                    {/* screen readers get the whole reply; the eye sees it being typed */}
                    <span aria-hidden="true">{m.content.slice(0, shown)}</span>
                    <span className="sr-only">{m.content}</span>
                  </>
                ) : (
                  m.content
                )}
                <time className="chat-time" dateTime={m.created_at}>
                  {formatTime(m.created_at)}
                </time>
              </div>
            );
          })}
          {busy && (
            <div className="chat-msg assistant chat-typing" aria-label="The guild is typing">
              <span className="chat-typing-label">typing</span>
              <i />
              <i />
              <i />
            </div>
          )}
          <div ref={endRef} />
        </div>

        {error && (
          <p className="chat-error" role="alert">
            {error}
          </p>
        )}

        <div className="chat-quests" aria-label="Quest questions">
          <span className="label">Quests</span>
          {QUESTS.map((q) => (
            <button type="button" key={q} onClick={() => send(q)} disabled={busy}>
              {q}
            </button>
          ))}
        </div>

        <form
          className="chat-form"
          onSubmit={(event) => {
            event.preventDefault();
            void send(input);
          }}
        >
          <label className="sr-only" htmlFor="chat-input">
            Your message
          </label>
          <input
            id="chat-input"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Ask the guild..."
            maxLength={2000}
            autoComplete="off"
          />
          <button className="pixel-button" type="submit" disabled={busy || !input.trim()}>
            Send
          </button>
        </form>
        {messages.length > 0 && (
          <button className="chat-new" type="button" onClick={newChat}>
            Start a new chat
          </button>
        )}
      </section>
    </div>
  );
}

// The game state (XP, achievements) wraps the whole site so every part can use it.
export default function App() {
  return (
    <GameProvider>
      <Site />
    </GameProvider>
  );
}

function Site() {
  const { inspectMember } = useGame();
  const [chatOpen, setChatOpen] = useState(false);
  const [badgesOpen, setBadgesOpen] = useState(false);
  // "Select a character": the member card the visitor clicked last
  const [selected, setSelected] = useState<string | null>(null);
  // stable close functions: the dialogs move focus when these change,
  // and this component re-renders on every XP change
  const closeChat = useCallback(() => setChatOpen(false), []);
  const closeBadges = useCallback(() => setBadgesOpen(false), []);
  const [bursts, setBursts] = useState<Array<{ id: number; x: number; y: number }>>([]);

  useEffect(() => {
    let frame = 0;
    const updateParallax = () => {
      document.querySelectorAll<HTMLElement>("[data-parallax]").forEach((layer) => {
        const parent = layer.closest<HTMLElement>("section");
        if (!parent) return;
        const rect = parent.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > window.innerHeight) return;
        const speed = Number(layer.dataset.parallax ?? 0);
        const offset = (rect.top + rect.height / 2 - window.innerHeight / 2) * speed;
        layer.style.setProperty("--parallax-offset", `${offset}px`);
      });
      frame = 0;
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(updateParallax);
    };
    updateParallax();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  const dropLeaves = (event: React.PointerEvent<HTMLElement>) => {
    if ((event.target as HTMLElement).closest("button, a, .dialogue-box")) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    if (event.clientY < bounds.top + bounds.height * 0.5) return;
    const burst = {
      id: Date.now(),
      x: event.clientX - bounds.left,
      y: event.clientY - bounds.top,
    };
    setBursts((current) => [...current.slice(-2), burst]);
    window.setTimeout(
      () => setBursts((current) => current.filter((item) => item.id !== burst.id)),
      1500,
    );
  };

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>

      <header className="topbar">
        <a className="brand" href="#top" aria-label="Autumn Byte Guild, home">
          <span className="brand-mark" aria-hidden="true">
            AB
          </span>
          <span>Autumn Byte Guild</span>
        </a>
        <nav aria-label="Main navigation">
          <a href="#about">About us</a>
          <a href="#members">Members</a>
          <a href="#contact">Contact</a>
        </nav>
        <button
          className="pixel-button topbar-button"
          type="button"
          onClick={() => setChatOpen(true)}
        >
          Chat with our AI
          <PixelArrow />
        </button>
        <XpHud onOpenAchievements={() => setBadgesOpen(true)} />
      </header>

      <main id="main">
        <section
          className="hero pixel-scene"
          id="top"
          aria-labelledby="hero-title"
          onPointerDown={dropLeaves}
        >
          <FallingLeaves offset={0} />
          <PixelForest variant="hero" />
          <Fireflies className="hero-fireflies" />
          <div className="leaf-bursts" aria-hidden="true">
            {bursts.map((burst) => (
              <span
                className="leaf-burst"
                key={burst.id}
                style={{ left: burst.x, top: burst.y } as CSSProperties}
              >
                {Array.from({ length: 9 }, (_, index) => (
                  <i
                    key={index}
                    style={
                      {
                        "--burst-x": `${(index - 4) * 23}px`,
                        "--burst-y": `${-72 + (index % 3) * 32}px`,
                        "--burst-rotate": `${index * 55}deg`,
                      } as CSSProperties
                    }
                  />
                ))}
              </span>
            ))}
          </div>
          <div className="pixel-squirrel" aria-hidden="true">
            <span />
          </div>
          <div className="scene-label" aria-hidden="true">
            <span>Quest 01</span>
            <span>Autumn campus</span>
          </div>
          <div className="hero-inner">
            <div className="dialogue-box hero-dialogue">
              <p className="speaker">
                <span aria-hidden="true">◆</span> Party introduction
              </p>
              <h1 id="hero-title">
                <span className="type-line type-line-one">Hi, we&apos;re</span>
                <span className="type-line type-line-title-two">Autumn Byte Guild.</span>
              </h1>
              <p className="hero-concept type-line type-line-two">
                Two minds building thoughtful AI, one quest at a time.
              </p>
              <p className="type-line type-line-three">
                Ask us anything, or scroll to meet the team.
              </p>
              <button className="pixel-button" type="button" onClick={() => setChatOpen(true)}>
                Chat with our AI
                <PixelArrow />
              </button>
            </div>
          </div>
          <a className="scroll-cue" href="#about">
            Scroll to continue
            <span aria-hidden="true">↓</span>
          </a>
        </section>

        <section className="about-section" id="about" aria-labelledby="about-title">
          <FallingLeaves offset={1} />
          <PixelForest />
          <Fireflies className="section-fireflies" />
          <div className="section-shell">
            <div className="section-intro light">
              <p className="eyebrow">Chapter 01 / Our guild</p>
              <h2 id="about-title">
                Different skills.
                <br />
                One shared quest.
              </h2>
              <p>
                We are a two-person AI Engineering team exploring how intelligent systems can feel
                practical, human and genuinely useful. We combine engineering, interface design and
                storytelling to take ideas from first sketch to working demo.
              </p>
            </div>

            <div className="highlight-grid" aria-label="Team highlights">
              {highlights.map(([value, label]) => (
                <div className="highlight-card pixel-box" key={label}>
                  <span>{value}</span>
                  <p>{label}</p>
                </div>
              ))}
            </div>

            <article className="project-panel pixel-box">
              <div className="project-art" aria-hidden="true">
                {/* little pixel chat: visitor bubble on the right, AI bubbles on the left */}
                <div className="project-screen chat-screen">
                  <span className="pixel-bubble bubble-ai" />
                  <span className="pixel-bubble bubble-user" />
                  <span className="pixel-bubble bubble-ai bubble-ai-two" />
                </div>
              </div>
              <div className="project-copy">
                <p className="eyebrow">Shared project / Featured</p>
                <h3>Chat AI with group portfolio</h3>
                <p>A website where visitors chat with an AI that knows our team.</p>
                <div className="tag-row" aria-label="Project technologies">
                  <span>React</span>
                  <span>Express</span>
                  <span>PostgreSQL</span>
                  <span>Gemini AI</span>
                </div>
              </div>
              <span className="project-index" aria-hidden="true">
                01
              </span>
            </article>
          </div>
        </section>

        <section className="members-section" id="members" aria-labelledby="members-title">
          <FallingLeaves offset={2} />
          <PixelForest />
          <Fireflies className="section-fireflies" />
          <div className="section-shell">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Chapter 02 / Party select</p>
                <h2 id="members-title">Meet the team</h2>
              </div>
              <p>
                Two paths, one build. Select a character to inspect their skills and completed
                quests.
              </p>
            </div>

            <div className="member-grid">
              {members.map((member) => (
                // Clicking anywhere on a card selects that character (+5 XP the first time).
                // Keyboard users use the "Select" button, whose click bubbles up to here.
                <article
                  className={`member-card ${member.accent}${selected === member.name ? " is-selected" : ""}`}
                  key={member.number}
                  onClick={() => {
                    setSelected(member.name);
                    inspectMember(member.name);
                  }}
                >
                  <div className="member-top">
                    <div className="avatar" aria-hidden="true">
                      {member.photo ? (
                        <AvatarPhoto
                          src={member.photo}
                          initials={member.initials}
                          focus={member.photoFocus}
                        />
                      ) : (
                        <strong>{member.initials}</strong>
                      )}
                      <span className="avatar-spark s-one" />
                      <span className="avatar-spark s-two" />
                      {/* sparks come after the photo so they are drawn on top of it */}
                    </div>
                    <span className="member-number">Player {member.number}</span>
                    <button
                      type="button"
                      className="member-select"
                      aria-pressed={selected === member.name}
                    >
                      {selected === member.name ? "Selected" : "Select"}
                    </button>
                  </div>
                  <div className="member-body">
                    <h3>
                      {member.name}
                      <LeafIcon />
                    </h3>
                    <p className="member-role">{member.role}</p>
                    <p className="member-description">{member.description}</p>
                    <div className="member-divider" />
                    <p className="label">Stats</p>
                    <ul className="stat-list">
                      {member.skills.map((skill, index) => {
                        const level = skillLevel(index);
                        return (
                          <li key={skill}>
                            <span className="stat-name">{skill}</span>
                            <span className="stat-bar" aria-hidden="true">
                              <i style={{ width: `${level * 20}%` }} />
                            </span>
                            <span className="stat-level">Lv.{level}</span>
                          </li>
                        );
                      })}
                    </ul>
                    <p className="stat-note">Stats are just for fun, not a real rating.</p>
                    <p className="label quests-label">Completed quests</p>
                    <div className="quest-list">
                      {member.projects.length === 0 && (
                        <p className="member-description">To be added.</p>
                      )}
                      {member.projects.map((project) => (
                        <div className="quest" key={project.title}>
                          <span aria-hidden="true">›</span>
                          <div>
                            <h4>{project.title}</h4>
                            <p>{project.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section
          className="contact-section pixel-scene"
          id="contact"
          aria-labelledby="contact-title"
        >
          <FallingLeaves offset={3} />
          <PixelForest variant="contact" />
          <Fireflies className="contact-fireflies" />
          <div className="scene-label" aria-hidden="true">
            <span>Final checkpoint</span>
            <span>Dusk camp</span>
          </div>
          <Spark className="contact-spark spark-one" />
          <Spark className="contact-spark spark-two" />
          <div className="contact-inner">
            <div className="dialogue-box contact-box">
              <p className="speaker">
                <span aria-hidden="true">◆</span> Send a signal
              </p>
              <h2 id="contact-title">Let’s start a new quest.</h2>
              <p>Have a project, an idea or just a good question? Our campfire is always open.</p>
              <div className="contact-links">
                <a href="mailto:autumnbyteguild@gmail.com">
                  <span>Email</span>
                  autumnbyteguild@gmail.com
                </a>
                <a
                  href="https://github.com/punnawitsura-eng/chat-portfolio-autumn"
                  target="_blank"
                  rel="noreferrer"
                >
                  <span>GitHub</span>
                  github.com/punnawitsura-eng/chat-portfolio-autumn
                </a>
              </div>
              <button className="pixel-button" type="button" onClick={() => setChatOpen(true)}>
                Chat with our AI
                <PixelArrow />
              </button>
            </div>
          </div>
        </section>
      </main>

      <MusicToggle />
      <ChatDialog open={chatOpen} onClose={closeChat} />
      <AchievementsModal open={badgesOpen} onClose={closeBadges} />
      <Toasts />
      <SecretBurst />
    </>
  );
}