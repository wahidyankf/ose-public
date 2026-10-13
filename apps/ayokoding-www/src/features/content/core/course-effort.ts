/**
 * The estimated-hours formula (plan ayokoding-learn-revamp-03, tech-docs/004). Pure — no IO;
 * the shell scanner (`course-effort-scan.ts`) collects the counts from disk.
 *
 * Rates: 200 prose words per minute (below the 238 wpm adult non-fiction mean in Brysbaert
 * 2019, because technical text read by a learner is slower) and 10 code lines per minute (one
 * line every six seconds, leaving time to read the annotation next to it). Named constants so
 * a later plan can change them in one place.
 */

export const PROSE_WORDS_PER_MINUTE = 200;
export const CODE_LINES_PER_MINUTE = 10;

export interface CourseEffortCounts {
  proseWords: number;
  inlineCodeLines: number;
  codeFileLines: number;
}

/** Whole hours, at least 1. Code shown twice (inline + file) counts once via `max`. */
export function estimateCourseHours(counts: CourseEffortCounts): number {
  const codeLines = Math.max(counts.inlineCodeLines, counts.codeFileLines);
  const minutes = counts.proseWords / PROSE_WORDS_PER_MINUTE + codeLines / CODE_LINES_PER_MINUTE;
  return Math.max(1, Math.round(minutes / 60));
}

const WORD_PATTERN = /[A-Za-z0-9][A-Za-z0-9'\u2019-]*/g;
const FENCE_PATTERN = /```[\s\S]*?(?:```|$)/g;

/** Split one rendered page body into prose words and inline code lines (fenced blocks). */
export function countPageEffort(body: string): { proseWords: number; inlineCodeLines: number } {
  let inlineCodeLines = 0;
  const prose = body.replace(FENCE_PATTERN, (block) => {
    for (const line of block.split("\n")) {
      if (line.trim().length > 0 && !line.trimStart().startsWith("```")) {
        inlineCodeLines += 1;
      }
    }
    return " ";
  });
  const words = prose.match(WORD_PATTERN);
  return { proseWords: words ? words.length : 0, inlineCodeLines };
}
