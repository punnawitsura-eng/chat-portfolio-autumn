// Small "game layer" for the portfolio: XP, levels, achievements, toasts and
// the Konami-code easter egg. Everything is saved in the visitor's browser
// (localStorage) - nothing is sent to the server.
import {
  createContext,
  type CSSProperties,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

// ---------- rules ----------

export const XP_PER_LEVEL = 50;
const TITLES = ["Visitor", "Explorer", "Adventurer", "Guild Member", "Guild Master"];

export const XP = { chat: 10, inspect: 5, leaf: 3 }; // XP per action
const LEAVES_FOR_BADGE = 5;

// Achievement list (shown in the Achievements window, in this order)
export const ACHIEVEMENTS = [
  { id: "first-contact", name: "First Contact", hint: "Send your first chat message", icon: "!" },
  { id: "curious-mind", name: "Curious Mind", hint: "Ask the AI about both members", icon: "?" },
  { id: "leaf-collector", name: "Leaf Collector", hint: "Collect 5 falling leaves", icon: "*" },
  { id: "night-owl", name: "Night Owl", hint: "Turn on the music", icon: "~" },
  { id: "secret-found", name: "Secret Found", hint: "Find the secret code", icon: "#" },
] as const;
export type AchievementId = (typeof ACHIEVEMENTS)[number]["id"];

// Level 1 starts at 0 XP, level 2 at 50 XP, level 3 at 100 XP, ...
export function levelInfo(xp: number) {
  const level = Math.floor(xp / XP_PER_LEVEL) + 1;
  const title = TITLES[Math.min(level, TITLES.length) - 1];
  return { level, title, into: xp % XP_PER_LEVEL };
}

// ---------- saved state ----------

type GameState = {
  xp: number;
  unlocked: AchievementId[];
  leaves: number; // leaves collected so far
  inspected: string[]; // member names already inspected (XP only once each)
  askedAbout: string[]; // members the visitor asked the AI about
};

const STORAGE_KEY = "abg-game-v1";
const EMPTY: GameState = { xp: 0, unlocked: [], leaves: 0, inspected: [], askedAbout: [] };

function load(): GameState {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    return saved ? { ...EMPTY, ...saved } : EMPTY;
  } catch {
    return EMPTY; // storage blocked or broken: start fresh
  }
}

function save(state: GameState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // storage can be unavailable (private mode); the game still works for this visit
  }
}

export function prefersReducedMotion() {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}

// Which member a chat question mentions (simple name match)
const MEMBER_NAMES: Array<[string, RegExp]> = [
  ["Punnawit", /punnawit|beam|บีม/i],
  ["Pitchayuth", /pitchayuth/i],
];

// ---------- React context ----------

type Toast = { id: number; title: string; text: string; kind: "level" | "badge" };

type Game = {
  state: GameState;
  toasts: Toast[];
  burst: boolean; // Konami leaf burst is playing
  collectLeaf: () => void;
  inspectMember: (name: string) => void;
  chatSent: (message: string) => void;
  musicOn: () => void;
};

const GameContext = createContext<Game | null>(null);

// add an achievement id to the list only once
const withBadge = (list: AchievementId[], id: AchievementId) =>
  list.includes(id) ? list : [...list, id];

export function useGame() {
  const game = useContext(GameContext);
  if (!game) throw new Error("useGame must be used inside <GameProvider>");
  return game;
}

const KONAMI = [
  "arrowup", "arrowup", "arrowdown", "arrowdown",
  "arrowleft", "arrowright", "arrowleft", "arrowright", "b", "a",
];

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GameState>(load);
  const stateRef = useRef(state); // latest state, so actions never use stale values
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [burst, setBurst] = useState(false);

  const showToast = useCallback((toast: Omit<Toast, "id">) => {
    const id = Date.now() + Math.random();
    setToasts((list) => [...list.slice(-2), { ...toast, id }]);
    window.setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), 3200);
  }, []);

  // Every action goes through here: change the state, save it,
  // then show a toast for a new level or a newly unlocked achievement.
  const update = useCallback(
    (change: (s: GameState) => GameState) => {
      const before = stateRef.current;
      const after = change(before);
      stateRef.current = after;
      setState(after);
      save(after);

      const oldLevel = levelInfo(before.xp).level;
      const now = levelInfo(after.xp);
      if (now.level > oldLevel) {
        showToast({ kind: "level", title: `Level up! Lv.${now.level}`, text: now.title });
      }
      for (const id of after.unlocked) {
        if (!before.unlocked.includes(id)) {
          const badge = ACHIEVEMENTS.find((a) => a.id === id);
          if (badge) showToast({ kind: "badge", title: "Achievement unlocked", text: badge.name });
        }
      }
    },
    [showToast],
  );

  const collectLeaf = useCallback(
    () =>
      update((s) => {
        const leaves = s.leaves + 1;
        const unlocked =
          leaves >= LEAVES_FOR_BADGE ? withBadge(s.unlocked, "leaf-collector") : s.unlocked;
        return { ...s, xp: s.xp + XP.leaf, leaves, unlocked };
      }),
    [update],
  );

  // XP only the first time each member card is inspected
  const inspectMember = useCallback(
    (name: string) =>
      update((s) =>
        s.inspected.includes(name)
          ? s
          : { ...s, xp: s.xp + XP.inspect, inspected: [...s.inspected, name] },
      ),
    [update],
  );

  const chatSent = useCallback(
    (message: string) =>
      update((s) => {
        const askedAbout = [...s.askedAbout];
        for (const [name, pattern] of MEMBER_NAMES) {
          if (pattern.test(message) && !askedAbout.includes(name)) askedAbout.push(name);
        }
        let unlocked = withBadge(s.unlocked, "first-contact");
        if (MEMBER_NAMES.every(([name]) => askedAbout.includes(name))) {
          unlocked = withBadge(unlocked, "curious-mind");
        }
        return { ...s, xp: s.xp + XP.chat, askedAbout, unlocked };
      }),
    [update],
  );

  const musicOn = useCallback(
    () => update((s) => ({ ...s, unlocked: withBadge(s.unlocked, "night-owl") })),
    [update],
  );

  // Konami code: up up down down left right left right B A
  useEffect(() => {
    let position = 0;
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (target.closest("input, textarea")) return; // don't react while typing
      const key = event.key.toLowerCase();
      position = key === KONAMI[position] ? position + 1 : key === KONAMI[0] ? 1 : 0;
      if (position === KONAMI.length) {
        position = 0;
        update((s) => ({ ...s, unlocked: withBadge(s.unlocked, "secret-found") }));
        setBurst(true);
        window.setTimeout(() => setBurst(false), 1800);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [update]);

  return (
    <GameContext.Provider
      value={{ state, toasts, burst, collectLeaf, inspectMember, chatSent, musicOn }}
    >
      {children}
    </GameContext.Provider>
  );
}

// ---------- UI pieces ----------

// XP bar shown in the top bar: level, title, progress and the Achievements button
export function XpHud({ onOpenAchievements }: { onOpenAchievements: () => void }) {
  const { state } = useGame();
  const { level, title, into } = levelInfo(state.xp);
  return (
    <div className="xp-hud">
      <span className="xp-level">
        Lv.{level} <b>{title}</b>
      </span>
      <span
        className="xp-bar"
        role="progressbar"
        aria-label="Experience to next level"
        aria-valuemin={0}
        aria-valuemax={XP_PER_LEVEL}
        aria-valuenow={into}
      >
        <i style={{ width: `${(into / XP_PER_LEVEL) * 100}%` }} />
      </span>
      <span className="xp-count">
        {into}/{XP_PER_LEVEL} XP
      </span>
      <button type="button" className="xp-badges" onClick={onOpenAchievements}>
        Achievements {state.unlocked.length}/{ACHIEVEMENTS.length}
      </button>
    </div>
  );
}

// Pop-up messages for level-ups and new achievements
export function Toasts() {
  const { toasts } = useGame();
  return (
    <div className="game-toasts" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`game-toast ${t.kind}`}>
          <strong>{t.title}</strong>
          <span>{t.text}</span>
        </div>
      ))}
    </div>
  );
}

// Window that lists all achievements, locked and unlocked
export function AchievementsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state } = useGame();
  const closeButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeButton.current?.focus();
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="chat-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="badge-window pixel-box"
        role="dialog"
        aria-modal="true"
        aria-labelledby="badge-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="chat-heading">
          <div>
            <p className="eyebrow">Quest log</p>
            <h2 id="badge-title">Achievements</h2>
          </div>
          <button
            ref={closeButton}
            className="icon-button"
            type="button"
            onClick={onClose}
            aria-label="Close achievements"
          >
            ×
          </button>
        </div>
        <p className="badge-summary">
          {state.unlocked.length} of {ACHIEVEMENTS.length} unlocked · {state.xp} XP total ·{" "}
          {state.leaves} leaves collected
        </p>
        <ul className="badge-grid">
          {ACHIEVEMENTS.map((badge) => {
            const done = state.unlocked.includes(badge.id);
            return (
              <li key={badge.id} className={`badge ${done ? "unlocked" : "locked"}`}>
                <span className="badge-icon" aria-hidden="true">
                  {done ? badge.icon : "?"}
                </span>
                <span>
                  <strong>{badge.name}</strong>
                  <small>{done ? "Unlocked" : `Locked · ${badge.hint}`}</small>
                </span>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

// Short burst of autumn leaves for the Konami code (hidden with reduced motion)
const BURST_LEAVES = Array.from({ length: 24 }, (_, i) => ({
  angle: (i / 24) * 360,
  distance: 140 + (i % 4) * 60,
  color: ["#FF8A1F", "#FFC447", "#B5381A", "#FFF0B8"][i % 4],
}));

export function SecretBurst() {
  const { burst } = useGame();
  if (!burst) return null;
  return (
    <div className="secret-burst" aria-hidden="true">
      {BURST_LEAVES.map((leaf, i) => (
        <i
          key={i}
          style={
            {
              "--burst-angle": `${leaf.angle}deg`,
              "--burst-distance": `${leaf.distance}px`,
              "--leaf-color": leaf.color,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
