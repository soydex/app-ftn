import React, { useEffect, useMemo, useState } from "react";
import useNotification from "./hooks/useNotification";
import Notification from "./components/Notifications";

import useSimpleNotification from "./hooks/useSimpleNotification";
import SimpleNotification from "./components/Simplenotification";
import { Trash } from "lucide-react";
import StarGithubbutton from "./components/GithubStars";

// ---- Utility: Grapheme segmentation ----
function graphemeCount(input: string): number {
  try {
    // Prefer Intl.Segmenter when available for accurate grapheme clusters (emoji, ZWJ, flags, etc.)
    const intlAny = Intl as unknown as { Segmenter?: typeof Intl.Segmenter };
    if (typeof intlAny.Segmenter !== "undefined") {
      const seg = new intlAny.Segmenter!("en", {
        granularity: "grapheme",
      });
      return Array.from(seg.segment(input)).length;
    }
  } catch {
    // ignore
  }
  // Fallback: count Unicode code points (less accurate than grapheme clustering)
  return Array.from(input).length;
}

// ---- Utility: per-char Unicode checks ----
function isNoncharacter(cp: number): boolean {
  // Noncharacters: U+FDD0..U+FDEF and U+FFFE/FFFF at each plane (i.e., U+xxFFFE/U+xxFFFF)
  if (cp >= 0xfdd0 && cp <= 0xfdef) return true;
  if ((cp & 0xffff) === 0xfffe || (cp & 0xffff) === 0xffff) return true;
  return false;
}

function isControlOrFormat(ch: string): boolean {
  return /[\p{Cc}\p{Cf}]/u.test(ch); // control or format (includes ZWJ/ZWNJ, variation selectors, etc.)
}

function isSurrogate(ch: string): boolean {
  return /[\p{Cs}]/u.test(ch);
}

function isPrivateUse(ch: string): boolean {
  return /[\p{Co}]/u.test(ch);
}

function isUnassigned(ch: string): boolean {
  return /[\p{Cn}]/u.test(ch);
}

function isLetterOrNumberMark(ch: string): boolean {
  return /[\p{L}\p{N}\p{M}]/u.test(ch);
}

function normalizeNFC(s: string): string {
  try {
    return s.normalize("NFC");
  } catch {
    return s;
  }
}
function normalizeNFKC(s: string): string {
  try {
    return s.normalize("NFKC");
  } catch {
    return s;
  }
}

function isSafeExtended(ch: string): boolean {
  // Caractères ASCII sûrs étendus
  if (/[a-zA-Z0-9 _.!@#$%^&*()+={}|:;"'<>,?/~`-]/.test(ch)) return true;

  // Symboles mathématiques courants
  if (/[×÷±≈≠≤≥∞√∑∫∏]/.test(ch)) return true;

  // Flèches et formes géométriques basiques
  if (/[←→↑↓↔↕⇐⇒⇑⇓⇔⇕◀▶▲▼■□●○★☆♦♠♥♣]/.test(ch)) return true;

  // Certains émojis courants
  const safeEmojis = [
    "😀",
    "😃",
    "😄",
    "😁",
    "😆",
    "😊",
    "🙂",
    "🔥",
    "💯",
    "⭐️",
    "✨",
    "🎮",
    "🎯",
    "🏆",
    "👑",
    "💎",
    "⚡️",
    "🌟",
  ];
  if (safeEmojis.includes(ch)) return true;

  return false;
}

function stripDisallowedUltraSafe(s: string): string {
  // Ultra-safe: ASCII letters, numbers, underscore only
  const kept = Array.from(s)
    .map((ch) => (/[a-zA-Z0-9_]/.test(ch) ? ch : " "))
    .join("");
  return kept.replace(/\s+/g, " ").trim();
}

function stripDisallowedBalanced(s: string): string {
  // Balanced: Extended safe characters
  const kept = Array.from(s)
    .map((ch) => (isLetterOrNumberMark(ch) || isSafeExtended(ch) ? ch : " "))
    .join("");
  return kept.replace(/\s+/g, " ").trim();
}

function stripDisallowedPermissive(s: string): string {
  // Permissive: Allow most, but strip control/format, surrogates, etc.
  const kept = Array.from(s)
    .map((ch) => {
      if (
        isControlOrFormat(ch) ||
        isSurrogate(ch) ||
        isPrivateUse(ch) ||
        isUnassigned(ch) ||
        isNoncharacter(ch.codePointAt(0)!)
      ) {
        return " ";
      }
      return ch;
    })
    .join("");
  return kept.replace(/\s+/g, " ").trim();
}

function countVisibleChars(s: string): number {
  return graphemeCount(s);
}

function additionalValidations(username: string): Issue[] {
  const issues: Issue[] = [];

  // Vérifier les patterns suspects
  if (/^[_.-]+$/.test(username)) {
    issues.push({
      id: "only-special",
      label: "Pseudo composé uniquement de caractères spéciaux",
      severity: "warn",
      hint: "Ajoute des lettres ou chiffres",
    });
  }

  // Vérifier l'usurpation d'identité potentielle
  if (/^(epic|fortnite|admin|mod|staff)/i.test(username)) {
    issues.push({
      id: "impersonation",
      label: "Risque d'usurpation d'identité",
      severity: "error",
      hint: "Évite les termes officiels Epic/Fortnite",
    });
  }

  return issues;
}

type Severity = "ok" | "warn" | "error";

interface Issue {
  id: string;
  label: string;
  severity: Severity;
  hint?: string;
}

function evaluateUsername(
  raw: string,
  mode: "ultra-safe" | "balanced" | "permissive"
) {
  const original = raw ?? "";
  const nfc = normalizeNFC(original);
  const nfkc = normalizeNFKC(original);
  const graphemes = countVisibleChars(original);

  const issues: Issue[] = [];

  // Length rules (Epic public rule: 3–16 chars, we measure as graphemes)
  if (graphemes < 3)
    issues.push({
      id: "len-min",
      label: "Moins de 3 caractères visibles",
      severity: "error",
      hint: "Allonge ton pseudo à ≥ 3 caractères.",
    });
  if (graphemes > 16)
    issues.push({
      id: "len-max",
      label: "Plus de 16 caractères visibles",
      severity: "error",
      hint: "Raccourcis à ≤ 16 caractères.",
    });

  // Leading/trailing spaces
  if (/^\s/.test(original))
    issues.push({
      id: "leading-space",
      label: "Espace au début",
      severity: "warn",
      hint: "Évite les espaces en tête.",
    });
  if (/\s$/.test(original))
    issues.push({
      id: "trailing-space",
      label: "Espace à la fin",
      severity: "warn",
      hint: "Évite les espaces en fin.",
    });

  // Double spaces
  if (/\s{2,}/.test(original))
    issues.push({
      id: "multi-space",
      label: "Espaces consécutifs",
      severity: "warn",
      hint: "Remplace par un seul espace.",
    });

  // Normalization changes
  if (original !== nfc)
    issues.push({
      id: "nfc",
      label: "Normalisation NFC modifierait le pseudo",
      severity: "warn",
      hint: "Utilise la forme NFC pour éviter les soucis d’égalité.",
    });
  if (original !== nfkc)
    issues.push({
      id: "nfkc",
      label: "NFKC simplifierait des caractères",
      severity: "warn",
      hint: "Certains ‘styles’ seront aplatis (ex: lettres en double graisse).",
    });

  // Per-character checks
  const perChar = Array.from(original).map((ch, i) => {
    const cp = ch.codePointAt(0)!;
    const flags: Issue[] = [];
    if (isControlOrFormat(ch))
      flags.push({
        id: `ctrl-${i}`,
        label: "Caractère de contrôle/format",
        severity: "error",
        hint: "Évite ZWJ, retours chariot, etc.",
      });
    if (isSurrogate(ch))
      flags.push({
        id: `sur-${i}`,
        label: "Surrogat UTF-16 isolé",
        severity: "error",
        hint: "Caractère invalide isolé.",
      });
    if (isPrivateUse(ch))
      flags.push({
        id: `pua-${i}`,
        label: "Zone d’usage privé",
        severity: "warn",
        hint: "Peut s’afficher en ‘?’ selon les plateformes.",
      });
    if (isUnassigned(ch))
      flags.push({
        id: `unassigned-${i}`,
        label: "Point de code non assigné",
        severity: "error",
        hint: "Risque élevé d’affichage en ‘?’",
      });
    if (isNoncharacter(cp))
      flags.push({
        id: `nonchar-${i}`,
        label: "Non-caractère Unicode",
        severity: "error",
        hint: "Réservé, ne pas utiliser.",
      });

    let safe: boolean;
    if (mode === "ultra-safe") {
      safe = /[a-zA-Z0-9_]/.test(ch);
    } else if (mode === "balanced") {
      safe = isLetterOrNumberMark(ch) || isSafeExtended(ch);
    } else {
      // permissive
      safe = !(
        isControlOrFormat(ch) ||
        isSurrogate(ch) ||
        isPrivateUse(ch) ||
        isUnassigned(ch) ||
        isNoncharacter(cp)
      );
    }
    if (!safe) {
      flags.push({
        id: `odd-${i}`,
        label: "Symbole potentiellement non pris en charge (mode conservateur)",
        severity: "warn",
        hint: "Pour une compatibilité maximale, limite-toi à lettres/chiffres/_ . - et espace.",
      });
    }

    return {
      index: i,
      char: ch,
      cp,
      hex: "U+" + cp.toString(16).toUpperCase().padStart(4, "0"),
      issues: flags,
    };
  });

  // Additional validations
  issues.push(...additionalValidations(original));

  // Aggregate severity
  const worst: Severity =
    perChar.some((c) => c.issues.some((i) => i.severity === "error")) ||
    issues.some((i) => i.severity === "error")
      ? "error"
      : perChar.some((c) => c.issues.some((i) => i.severity === "warn")) ||
        issues.some((i) => i.severity === "warn")
      ? "warn"
      : "ok";

  // Suggestion based on mode
  let sanitized: string;
  if (mode === "ultra-safe") {
    sanitized = stripDisallowedUltraSafe(nfkc);
  } else if (mode === "balanced") {
    sanitized = stripDisallowedBalanced(nfkc);
  } else {
    sanitized = stripDisallowedPermissive(nfkc);
  }

  return {
    original,
    nfc,
    nfkc,
    graphemes,
    issues,
    perChar,
    worst,
    sanitized,
  };
}

// ---- UI Components ----
function Badge({
  children,
  tone = "default",
}: {
  children: React.ReactNode;
  tone?: "default" | "error" | "warn" | "ok";
}) {
  const map: Record<string, string> = {
    default: "bg-gray-200 text-gray-800",
    error: "bg-red-100 text-red-800",
    warn: "bg-yellow-100 text-yellow-800",
    ok: "bg-green-100 text-green-800",
  };
  return (
    <span
      className={`px-2 py-0.5 rounded-full text-xs font-medium ${map[tone]}`}
    >
      {children}
    </span>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/60 shadow-sm p-4 relative">
      {children}
    </div>
  );
}

export default function App() {
  const { notification, showNotification, hideNotification } =
    useNotification();

  const {
    notification: simpleNotification,
    showNotification: showSimpleNotification,
    hideNotification: hideSimpleNotification,
  } = useSimpleNotification();

  const [value, setValue] = useState<string>(
    () => localStorage.getItem("ftn_name") ?? ""
  );
  const [mode, setMode] = useState<"ultra-safe" | "balanced" | "permissive">(
    "balanced"
  );
  const [history, setHistory] = useState<string[]>(() =>
    JSON.parse(localStorage.getItem("ftn_history") || "[]")
  );

  const result = useMemo(() => evaluateUsername(value, mode), [value, mode]);

  useEffect(() => {
    localStorage.setItem("ftn_name", value);
  }, [value]);

  useEffect(() => {
    if (result.worst === "ok" && value && !history.includes(value)) {
      const newHistory = [value, ...history.slice(0, 9)];
      setHistory(newHistory);
      localStorage.setItem("ftn_history", JSON.stringify(newHistory));
    }
  }, [result.worst, value, history]);

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-slate-50 to-slate-100 dark:from-gray-950 dark:to-gray-900 text-gray-900 dark:text-gray-100 relative">
      <Notification notification={notification} onClose={hideNotification} />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <header className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              Fortnite Pseudo Checker — Client‑Only
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Vérifie localement qu’un pseudo est compatible (Unicode/longueur)
              et minimise le risque d’afficher un « ? ».
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge tone={result.worst === "ok" ? "ok" : result.worst}>
              {result.worst.toUpperCase()}
            </Badge>
          </div>
        </header>

        <main className="mt-6 space-y-6">
          <Card>
            <label className="block text-sm font-medium mb-2">Ton pseudo</label>
            <input
              className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white/80 dark:bg-gray-950 px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Ex: FaZe Nova★彡"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              maxLength={16}
              minLength={3}
            />
            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
              <Badge>Graphemes: {result.graphemes}</Badge>
              <Badge>NFC {value === result.nfc ? "OK" : "différent"}</Badge>
              <Badge>NFKC {value === result.nfkc ? "OK" : "différent"}</Badge>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                disabled={!value}
                className="px-3 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 active:scale-[.99] disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => {
                  setValue(result.nfc);
                  showNotification("NFC appliqué.", "success");
                  showSimpleNotification("NFC appliqué.", "success");
                }}
              >
                Appliquer NFC
              </button>
              <button
                disabled={!value}
                className="px-3 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 active:scale-[.99] disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => {
                  setValue(result.nfkc);
                  showSimpleNotification("NFKC appliqué.", "success");
                  showNotification("NFKC appliqué.", "success");
                }}
              >
                Appliquer NFKC (compat)
              </button>
              <button
                disabled={!value}
                className="px-3 py-2 rounded-xl bg-gray-900 text-white hover:bg-black active:scale-[.99] disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => {
                  if (!value) {
                    showNotification("Le champ est vide.", "error");
                    showSimpleNotification("Le champ est vide.", "error");
                    return;
                  }
                  navigator.clipboard.writeText(value);
                  showNotification(
                    "Pseudo copié dans le presse-papiers.",
                    "success"
                  );
                  showSimpleNotification(
                    "Pseudo copié dans le presse-papiers.",
                    "success"
                  );
                }}
              >
                Copier
              </button>
              <button
                disabled={!value}
                className="px-3 py-2 rounded-xl bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 active:scale-[.99] disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => {
                  setValue("");
                  showSimpleNotification("Champ réinitialisé.", "warning");
                  showNotification("Champ réinitialisé.", "warning");
                }}
              >
                Réinitialiser
              </button>
            </div>
            <SimpleNotification
              notification={simpleNotification}
              onClose={hideSimpleNotification}
            />
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Diagnostic</h2>
              <div className="flex items-center space-x-3">
                <label className="flex items-center">
                  <span className="mr-2">Mode :</span>
                  <select
                    className="rounded-md border border-gray-300 dark:border-gray-700 bg-white/80 dark:bg-gray-950 px-2 py-1 outline-none focus:ring-2 focus:ring-indigo-500 hover:bg-white dark:hover:bg-gray-900"
                    value={mode}
                    onChange={(e) =>
                      setMode(
                        e.target.value as
                          | "ultra-safe"
                          | "balanced"
                          | "permissive"
                      )
                    }
                  >
                    <option value="ultra-safe">Ultra-sûr</option>
                    <option value="balanced" selected>Équilibré</option>
                    <option value="permissive">Permissif</option>
                  </select>
                </label>
              </div>
            </div>

            {result.issues.length === 0 ? (
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Aucun problème global détecté.
              </p>
            ) : (
              <ul className="mt-3 space-y-2">
                {result.issues.map((i) => (
                  <li key={i.id} className="flex items-start gap-2">
                    <Badge tone={i.severity}>{i.severity.toUpperCase()}</Badge>
                    <div>
                      <div className="font-medium">{i.label}</div>
                      {i.hint && (
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {i.hint}
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {mode !== "ultra-safe" && (
              <div className="mt-4 p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 text-sm">
                <div className="font-medium mb-1">
                  Suggestion (mode conservateur) :
                </div>
                <div className="font-mono break-all">
                  {result.sanitized || "(vide)"}
                </div>
                {result.sanitized && (
                  <div className="mt-2 flex gap-2">
                    <button
                      className="px-3 py-2 rounded-xl bg-indigo-600 text-white"
                      onClick={() => {
                        setValue(result.sanitized);
                        showNotification(
                          "Pseudo remplacé par la version conservatrice.",
                          "success"
                        );
                      }}
                    >
                      Remplacer
                    </button>
                    <button
                      className="px-3 py-2 rounded-xl bg-gray-900 text-white"
                      onClick={() => {
                        navigator.clipboard.writeText(result.sanitized);
                        showNotification(
                          "Suggestion copiée dans le presse-papiers.",
                          "success"
                        );
                      }}
                    >
                      Copier
                    </button>
                  </div>
                )}
              </div>
            )}
          </Card>

          <Card>
            <h2 className="font-semibold">Analyse caractère par caractère</h2>
            <div className="overflow-x-auto mt-3">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-600 dark:text-gray-400">
                    <th className="py-2 pr-4">#</th>
                    <th className="py-2 pr-4">Car.</th>
                    <th className="py-2 pr-4">Code point</th>
                    <th className="py-2 pr-4">Observations</th>
                  </tr>
                </thead>
                <tbody>
                  {result.perChar.length === 0 ? (
                    <tr>
                      <td className="py-2 text-gray-500" colSpan={4}>
                        Saisis un pseudo pour voir le détail.
                      </td>
                    </tr>
                  ) : (
                    result.perChar.map((c) => (
                      <tr
                        key={c.index}
                        className="border-t border-gray-200 dark:border-gray-800"
                      >
                        <td className="py-2 pr-4 align-top text-gray-500">
                          {c.index}
                        </td>
                        <td className="py-2 pr-4 align-top font-mono">
                          {c.char}
                        </td>
                        <td className="py-2 pr-4 align-top font-mono">
                          {c.hex}
                        </td>
                        <td className="py-2 pr-4 align-top">
                          {c.issues.length === 0 ? (
                            <Badge tone="ok">OK</Badge>
                          ) : (
                            <ul className="space-y-1">
                              {c.issues.map((i) => (
                                <li
                                  key={i.id}
                                  className="flex items-center gap-2"
                                >
                                  <Badge tone={i.severity}>
                                    {i.severity.toUpperCase()}
                                  </Badge>
                                  <span>{i.label}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          <Card>
            <h2 className="font-semibold">Notes</h2>
            <ul className="mt-2 text-sm list-disc pl-5 space-y-1 text-gray-700 dark:text-gray-300">
              <li>
                Fortnite/Epic utilise l’Unicode (UTF‑8) côté plateforme. Cet
                outil travaille en Unicode natif du navigateur et vérifie la
                longueur en « caractères visibles » (grappes de graphèmes) avec{" "}
                <code>Intl.Segmenter</code> si disponible.
              </li>
              <li>
                Les règles publiques incluent un nom d’affichage de 3 à 16
                caractères. Le reste (symboles exacts acceptés) n’est pas publié
                en détail ; le mode « conservateur » vise une compatibilité
                maximale.
              </li>
              <li>
                Les caractères de contrôle/format, non-caractères, zones
                privées, non assignés sont marqués à éviter (risque d’affichage
                en « ? » ou de rejet).
              </li>
              <li>
                La normalisation NFC/NFKC aide à éviter des surprises d’égalité
                et d’apparence (ex : variantes de largeur/compatibilité, lettres
                stylisées).
              </li>
            </ul>
          </Card>

          <Card>
            <h2 className="font-semibold">Historique des pseudos validés</h2>
            <button
              className="mt-2 text-sm text-gray-600 dark:text-gray-400 absolute top-4 right-4"
              onClick={() => {setHistory([]);
                localStorage.setItem("ftn_history", JSON.stringify([]));
              showNotification("Historique effacé.", "warning");
              }}
            >
              <Trash className="w-4 h-4 hover:text-red-500" />
            </button>
            {history.length === 0 ? (
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Aucun pseudo validé encore.
              </p>
            ) : (
              <ul className="mt-2 space-y-1">
                {history.map((item, index) => (
                  <li key={index} className="flex items-center justify-between">
                    <span className="font-mono text-sm">{item}</span>
                    <button
                      className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 rounded"
                      onClick={() => setValue(item)}
                    >
                      Utiliser
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </main>

        <footer className="mt-8 text-xs text-gray-500">
          client‑only — aucune donnée envoyée. made by soydex EN/FR
        </footer>
      </div>
      <StarGithubbutton />
    </div>
  );
}
