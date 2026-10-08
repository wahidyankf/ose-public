// AI BENCHMARK — per-model and per-price notes in the reader's language.
//
// The dataset keeps each note once, in English, next to the figure it qualifies. The Indonesian
// page renders it through this table, keyed by the English text; a unit test fails when a note in
// the dataset has no entry here, or an entry no note uses, so the two cannot drift apart.

import type { Locale } from "@/features/i18n/core/config";

export const ID_NOTES: Readonly<Record<string, string>> = {
  "Fast mode: $3 / $15.": "Mode Fast: US$3 / US$15.",
  "Cursor only (app, CLI, and SDK); Composer 2 now runs as 2.5.":
    "Hanya di Cursor (aplikasi, CLI, dan SDK); Composer 2 kini dijalankan sebagai 2.5.",
  "Invitation only (Project Glasswing).": "Hanya lewat undangan (Project Glasswing).",
  "Limited rollout in Codex; check your plan.": "Dirilis terbatas di Codex; cek paket Anda.",
  "Prompts over 272K tokens: 2× input, 1.5× output.": "Prompt di atas 272K token: input 2×, output 1,5×.",
  "Promotional price, held at least through 2026-11-21.": "Harga promo, berlaku setidaknya sampai 2026-11-21.",
  "The mini tier that Terra succeeds. Codex CLI only with an API key.":
    "Tingkat mini yang digantikan Terra. Di Codex CLI hanya dengan API key.",
  "The nano tier that Luna succeeds.": "Tingkat nano yang digantikan Luna.",
  "Limited access; no public API price yet.": "Akses terbatas; belum ada harga API publik.",
  "Prompts over 200K tokens: $4 / $18.": "Prompt di atas 200K token: US$4 / US$18.",
  "Promotional through 2026-12-31; $1.50 / $7.50 from 2027-01-01.":
    "Promo sampai 2026-12-31; US$1,50 / US$7,50 mulai 2027-01-01.",
  "Shuts down 2027-05-07.": "Dihentikan pada 2027-05-07.",
  "Prompts of 200K tokens or more: $4 / $12.": "Prompt 200K token atau lebih: US$4 / US$12.",
  "Free on the Z.ai API.": "Gratis di API Z.ai.",
  "DeepSeek says it routes this name to V4.1 Flash from 2026-09-14 until V4.1 Pro launches; its price page still lists V4 Pro.":
    "Menurut DeepSeek, nama ini diarahkan ke V4.1 Flash sejak 2026-09-14 sampai V4.1 Pro rilis; halaman harganya masih mencantumkan V4 Pro.",
  "Peak-hour rate; off-peak is half.": "Tarif jam sibuk; di luar jam sibuk separuhnya.",
  "DeepSeek routes this name to V4.1 Flash; peak-hour rate.":
    "DeepSeek mengarahkan nama ini ke V4.1 Flash; tarif jam sibuk.",
  "Retired by DeepSeek on 2026-09-10; the name is now served by V4.1 Flash.":
    "Dipensiunkan DeepSeek pada 2026-09-10; nama ini kini dilayani V4.1 Flash.",
  "Prompts over 128K tokens: $2 / $12.": "Prompt di atas 128K token: US$2 / US$12.",
  "Prompts of 32K–256K tokens; up to 32K: $0.03 / $0.13; over 256K: $0.20 / $0.80.":
    "Prompt 32K–256K token; sampai 32K: US$0,03 / US$0,13; di atas 256K: US$0,20 / US$0,80.",
  "Prompts over 256K tokens: $1 / $4.": "Prompt di atas 256K token: US$1 / US$4.",
  "Prompts over 256K tokens: $1.20 / $4.80.": "Prompt di atas 256K token: US$1,20 / US$4,80.",
  "Prompts over 256K tokens: $2 / $6.": "Prompt di atas 256K token: US$2 / US$6.",
  "Prompts over 256K tokens cost more.": "Prompt di atas 256K token lebih mahal.",
  "Meta's cheaper Contributor tier, on which Meta may train on submissions.":
    "Tingkat Contributor Meta yang lebih murah; Meta boleh melatih modelnya dengan data yang dikirim.",
  "Prompts over 100K tokens: $0.50 / $2.50.": "Prompt di atas 100K token: US$0,50 / US$2,50.",
  "Moonshot discontinued this model on 2026-08-31; Command Code still serves it.":
    "Moonshot menghentikan model ini pada 2026-08-31; Command Code masih menyediakannya.",
  "Two-week launch promotion from 2026-10-06; $1.36 / $4.18 after.":
    "Promo peluncuran dua minggu sejak 2026-10-06; setelahnya US$1,36 / US$4,18.",
  "Free on OpenCode Zen.": "Gratis di OpenCode Zen.",
  "Tinker serverless inference (beta).": "Inferensi serverless Tinker (beta).",
  "Prompts over 272K tokens: $10 / $45.": "Prompt di atas 272K token: US$10 / US$45.",
  "Free on Command Code while capacity lasts; no API price published.":
    "Gratis di Command Code selama kapasitas tersedia; belum ada harga API yang dipublikasikan.",
  "Free on Command Code and OpenCode Zen for a limited time; no API price published.":
    "Gratis di Command Code dan OpenCode Zen untuk sementara; belum ada harga API yang dipublikasikan.",
  "Free on Command Code for a limited time; no API price published.":
    "Gratis di Command Code untuk sementara; belum ada harga API yang dipublikasikan.",
  "Up to 512K tokens, after a vendor discount with no stated end date.":
    "Sampai 512K token, setelah diskon vendor tanpa tanggal berakhir.",
  "Listed by MiniMax as a legacy model.": "Dicantumkan MiniMax sebagai model lama (legacy).",
  "Xiaomi takes this model offline on 2026-10-21.": "Xiaomi menghentikan model ini pada 2026-10-21.",
  "Free on OpenCode for a limited time; no API price published.":
    "Gratis di OpenCode untuk sementara; belum ada harga API yang dipublikasikan.",
  "Promotional rate with no published end date.": "Tarif promo tanpa tanggal berakhir yang dipublikasikan.",
};

/** The note in the reader's language; English is the dataset's own text. */
export function noteText(note: string, locale: Locale): string {
  return locale === "id" ? (ID_NOTES[note] ?? note) : note;
}
