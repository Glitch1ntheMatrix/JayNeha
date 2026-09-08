export function norm(s: string | null | undefined): string {
  return String(s || "")
    .toLowerCase()
    .replace(/[^a-z ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length || !b.length) return Math.max(a.length, b.length);
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(
        prev[j] + 1,
        cur[j - 1] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
    prev = cur;
  }
  return prev[b.length];
}

// close enough for a single word: allows typos, dropped/doubled letters, short nicknames
function wordClose(a: string, b: string): boolean {
  if (!a || !b) return false;
  if (a === b) return true;
  if (a.length >= 4 && b.length >= 4 && (a.indexOf(b) === 0 || b.indexOf(a) === 0)) return true;
  const tol = Math.min(a.length, b.length) <= 4 ? 1 : Math.min(a.length, b.length) <= 7 ? 2 : 3;
  return levenshtein(a, b) <= tol;
}

// The invite code is the real key; the typed name only needs to be
// recognisably the same person so a shared household code can disambiguate.
export function nameClose(typed: string, actual: string): boolean {
  const t = norm(typed);
  const a = norm(actual);
  if (!t) return false;
  if (t === a) return true;
  if (a.indexOf(t) === 0 || t.indexOf(a) === 0) return true;
  const tw = t.split(" ").filter(Boolean);
  const aw = a.split(" ").filter(Boolean);
  if (tw.some((x) => aw.some((y) => wordClose(x, y)))) return true;
  return levenshtein(t, a) <= Math.max(2, Math.round(Math.max(t.length, a.length) * 0.3));
}
