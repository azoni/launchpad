/** Lightweight title-based heuristic for "is this an interview event?" + "what company is it?" */

const STRONG_PATTERNS: RegExp[] = [
  /\binterview\b/,
  /\b(phone|tech|technical|coding|recruiter|screening)\s*(call|chat|screen)\b/,
  /\bonsite\b/,
  /\bon[\s-]site\b/,
  /\b(first|second|third|fourth|final)\s*round\b/,
  /\bsystem\s*design\b/,
  /\bbehavioral\b/,
  /\b(intro|screening)\s*(call|chat)\b/,
  /\b(hiring\s*manager|hm\s*chat)\b/,
  /\bvirtual\s*on[\s-]?site\b/,
  /\bcoding\s*(round|challenge|exercise)\b/,
  /\btake[\s-]?home\b/,
];

/** Tokens that are common-but-not-interviews; presence of these vetoes a positive. */
const NEGATIVE_PATTERNS: RegExp[] = [
  /\btech\s*talk\b/,
  /\bcode\s*review\b/,
  /\b1\s*on\s*1\b/, // unless they spelled it "1:1 interview"
  /\bstandup\b/,
  /\bretro\b/,
  /\bplanning\b/,
];

export function looksLikeInterview(title: string | null | undefined): boolean {
  if (!title) return false;
  const t = title.toLowerCase();
  if (NEGATIVE_PATTERNS.some((re) => re.test(t)) && !/\binterview\b/.test(t)) {
    return false;
  }
  return STRONG_PATTERNS.some((re) => re.test(t));
}

/** Try to extract the company name from an interview title. Returns null if no confident guess. */
export function guessCompany(title: string | null | undefined): string | null {
  if (!title) return null;
  const trim = (s: string) => s.replace(/[\s\-—–:|]+$/, "").trim();

  const tries: Array<{ re: RegExp; group: number }> = [
    // "GEICO - Phone Screen Round 2"  /  "GEICO: Final"
    {
      re: /^([A-Za-z][\w&.+ ]{1,40}?)\s*[-:|–—]+\s*(?:phone|tech|technical|coding|system|behavioral|on-?site|intro|screening|final|first|second|third|fourth|recruiter|hiring|virtual|round|interview|screen|chat)\b/i,
      group: 1,
    },
    // "Interview with X" / "Interview - X" / "Interview @ X" / "Interview at X"
    {
      re: /\binterview\s*(?:with|w\/|@|at|-|:|–|—)\s*([A-Za-z][\w&.+ ]{1,40})/i,
      group: 1,
    },
    // "Phone Screen w/ X" / "Screen with X"
    {
      re: /\b(?:phone|tech|technical|behavioral|system|screening|recruiter)?\s*(?:screen|interview|chat|call)\s*(?:w\/|with|@|at|-|:)\s*([A-Za-z][\w&.+ ]{1,40})/i,
      group: 1,
    },
    // "X Interview" / "X Onsite" / "X Loop"
    {
      re: /^([A-Za-z][\w&.+ ]{1,40}?)\s+(?:interview|onsite|on-?site|loop|round)\b/i,
      group: 1,
    },
    // "<...> @ X" or "@ X" anywhere
    { re: /\s@\s*([A-Za-z][\w&.+ ]{1,40})$/i, group: 1 },
  ];

  for (const { re, group } of tries) {
    const m = title.match(re);
    if (m && m[group]) {
      const guess = trim(m[group]);
      // Filter obvious junk
      if (
        guess.length >= 2 &&
        !/^(the|a|an|my|your|with|w\/|and|or|round|final|first)\b/i.test(guess)
      ) {
        return guess;
      }
    }
  }
  return null;
}

/** Used by the suggestions UI: should this event be a candidate? */
export function isSuggestionCandidate(ev: {
  summary: string;
  opportunityId?: string | null;
  dismissedAsInterview?: boolean;
}): boolean {
  if (ev.opportunityId) return false;
  if (ev.dismissedAsInterview) return false;
  return looksLikeInterview(ev.summary);
}
