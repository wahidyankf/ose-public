import type { Locale } from "./config";

const translations: Record<Locale, Record<string, string>> = {
  en: {
    readMore: "Read More",
    lastUpdated: "Last updated",
    publishedOn: "Published on",
    author: "Author",
    tags: "Tags",
    categories: "Categories",
    share: "Share",
    relatedContent: "Related Content",
    openSourceProject: "Open-Source Project",
    search: "Search...",
    onThisPage: "On this page",
    previous: "Previous",
    next: "Next",
    noResults: "No results found",
    toggleTheme: "Toggle theme",
    skipToContent: "Skip to content",
    toolsPageTitle: "Tools",
    toolsPageCalcLink: "Cost of Living Calculator",
    toolsPageCalcDesc: "Compare monthly living costs, savings, and the minimum role needed across cities.",
    toolsPageAiBenchLink: "AI Model Benchmark",
    toolsPageAiBenchDesc:
      "Compare coding models by independently measured capability tier and API price, and find OpenCode Go substitutes.",
    breadcrumbHome: "Home",
    breadcrumbCalculator: "Calculator",

    // AI benchmark. Every aiBench* key MUST exist in both locales: a missing key renders as its raw
    // identifier, and the page tests assert no "aiBench" token leaks into rendered text. `{name}`
    // placeholders are filled by `fill()` in `features/ai-benchmark/shell/format.ts`.
    aiBenchTitle: "AI Model Benchmark",
    aiBenchSubtitle:
      "Which coding model is good enough for the job, what it costs, and which OpenCode Go model can stand in for it.",
    aiBenchLastUpdatedLabel: "Last updated",
    aiBenchIndependentOnly:
      "Scores come only from benchmarks run by independent operators. Results that a model's own vendor reports are neither shown nor counted.",
    aiBenchJumpToMethod: "How the score works",

    aiBenchFinderHeading: "Find an OpenCode Go substitute",
    aiBenchFinderIntro:
      "Pick a frontier model to see which OpenCode Go models reach at least its tier, and how their price compares.",
    aiBenchFinderLabel: "Frontier model",
    aiBenchFinderPlaceholder: "Choose a model…",
    aiBenchFinderTarget: "{model} is in the {tier} tier, index {index}, blended price {price}.",
    aiBenchFinderTargetNoPrice: "{model} is in the {tier} tier, index {index}; no public API price.",
    aiBenchFinderMatches: "OpenCode Go models in the same tier or higher:",
    aiBenchFinderNearest: "No OpenCode Go model reaches the {tier} tier yet. The closest options:",
    aiBenchFinderInsufficient:
      "{model} has too few independent results to compare. Its available scores are in the table below.",
    aiBenchFinderNoneCheaper: "None of these is cheaper per token than {model}.",
    aiBenchPriceCheaper: "{ratio}× cheaper per token",
    aiBenchPricePricier: "{ratio}× pricier per token",
    aiBenchPriceSame: "about the same price per token",
    aiBenchPriceUnknown: "price not comparable",

    aiBenchFilterHeading: "Filter",
    aiBenchFilterHarness: "Harness",
    aiBenchFilterHarnessAll: "All harnesses",
    aiBenchFilterTier: "Tier",
    aiBenchFilterTierAll: "All tiers",
    aiBenchFilterReset: "Reset filters",
    aiBenchFilterResultCount: "{count} of {total} models shown",
    aiBenchEmptyStateTitle: "No model matches these filters",
    aiBenchEmptyStateMessage: "Try a different harness or tier, or reset the filters.",

    aiBenchTierMapHeading: "Capability tiers",
    aiBenchTierUltra: "Ultra",
    aiBenchTierPlanning: "Planning & orchestration",
    aiBenchTierExecution: "Execution",
    aiBenchTierFast: "Fast",
    aiBenchTierInsufficient: "Insufficient data",
    aiBenchTierUltraUse: "For the hardest, longest-running work.",
    aiBenchTierPlanningUse: "For planning, review, and orchestrating other agents.",
    aiBenchTierExecutionUse: "For carrying out a well-defined plan.",
    aiBenchTierFastUse: "For quick, well-scoped edits and lookups.",
    aiBenchTierFloor: "Floor: index {index}, set by {anchor}.",
    aiBenchTierFastFloor: "Rated models below the Execution floor.",
    aiBenchTierEmpty: "No model in this tier matches the current filters.",
    aiBenchAnchorBadge: "anchor",
    aiBenchLimitedAccess: "Limited access",
    aiBenchIndexLabel: "Index",
    aiBenchPriceInOut: "{input} / {output} per 1M tokens",
    aiBenchNoPrice: "No public API price",

    aiBenchInsufficientHeading: "Not enough independent data yet ({count} models)",
    aiBenchInsufficientIntro:
      "These models have independent results on fewer than {min} benchmarks, so they get no index or tier yet.",
    aiBenchInsufficientNone: "no independent results yet",

    aiBenchTableHeading: "All models",
    aiBenchTableCaption:
      "Independent benchmark scores, composite index, tier, and API price in USD per 1M tokens. Each score links to its source.",
    aiBenchColModel: "Model",
    aiBenchColTier: "Tier",
    aiBenchColIndex: "Index",
    aiBenchColInput: "Input",
    aiBenchColOutput: "Output",
    aiBenchColBlended: "Blended",
    aiBenchColCostPerTask: "Cost per task",
    aiBenchColHarnesses: "Harnesses",
    aiBenchScoreRunBy: "run by {operator}, {config}",
    aiBenchTableScrollHint: "Scroll sideways to see every column.",

    aiBenchMethodHeading: "How the score works",
    aiBenchMethodBenchmarksIntro:
      "Three coding-agent benchmarks, equally weighted. Only the version listed counts, and each score comes from the first listed source that has it.",
    aiBenchMethodBenchDeepSwe: "Long-horizon changes across real repositories.",
    aiBenchMethodBenchTerminal: "Autonomous work in real shell environments.",
    aiBenchMethodBenchQna: "Answering questions about large, unfamiliar codebases.",
    aiBenchMethodVersion: "version {version}",
    aiBenchMethodWeight: "weight {weight}",
    aiBenchMethodSourceOrderIntro: "Sources, in order of preference:",
    aiBenchMethodIndex:
      "Index: the average of a model's scores on the benchmarks it has. A model needs at least {min} to get an index and a tier.",
    aiBenchMethodTiers:
      "Tiers: each one is defined by a previous-generation anchor model. A model goes in the highest tier whose anchor's index it matches or beats, so a model's tier always follows its index.",
    aiBenchMethodAnchorsIntro: "Tier anchors:",
    aiBenchMethodPrice:
      "Price: the vendor's standard API rate per 1M tokens. Blended = (3 × input + output) ÷ 4, a typical coding-agent mix. Where a vendor publishes no price page, the rate OpenCode lists is used and marked “OpenCode rate”.",
    aiBenchMethodCostPerTask:
      "Cost per task: Artificial Analysis' average spend per benchmark task, where it publishes one.",
    aiBenchMethodCaveat:
      "Operators run models in different harnesses and effort settings (each score names its configuration), and some Anthropic runs were served by another model on a share of attempts. An index averages only the benchmarks a model has, so two indexes built from different benchmarks are not exactly comparable (GPT-5.6 Terra, for one, has no independent SWE-Atlas QnA result); the table shows which scores each index uses. Treat differences of a few points as noise.",
    aiBenchMethodExcluded:
      "Not scored: vendor-reported results, older benchmark versions, SWE-bench Verified and GPQA Diamond (saturated), and SWE-bench Pro (task-quality problems). Space Bunny Free on OpenCode Go is left out because it names no vendor.",
    aiBenchMethodExampleHeading: "Worked example",
    aiBenchMethodExampleIndex: "{model}: ({scores}) ÷ {count} = index {index}.",
    aiBenchMethodExampleCompare:
      "{model} (index {modelScore}) against the {tier} anchor {anchor} (index {anchorScore}): {model} {result}.",
    aiBenchMethodMeets: "reaches that tier",
    aiBenchMethodMisses: "stays below that tier",
    aiBenchOpencodeRate: "OpenCode rate",

    aiBenchSourcesHeading: "Sources and checked dates",
    aiBenchSourcesBenchmarks: "Benchmark results",
    aiBenchSourcesPrices: "API prices",
    aiBenchSourcesChecked: "checked {date}",
    aiBenchSourcesUpdated: "source updated {date}",
    aiBenchSourcesCitedAs: "figures quoted with attribution and a link",
    aiBenchSourcesCitation:
      "Figures are quoted with attribution and a link to each source; see each source for its terms of use.",

    // Calculator — page
    calcTitle: "Cost of Living Calculator",
    calcSubtitle: "Compare cost of living and salary savings across cities",
    ariaTabsNav: "Calculator tabs",
    tabCostOfLiving: "Cost of living",
    tabCostDesc: "Compare monthly living costs across cities",
    tabSavings: "Savings",
    tabSavingsDesc: "See how much you'd save",
    tabMinRole: "Minimum role",
    tabMinRoleDesc: "Find the min role you need",
    dataLastUpdated: "Data last updated",
    estimatesOnly: "Estimates only",

    // Calculator — disclaimers
    disclaimerPension: "Savings are before voluntary pension / retirement contributions.",
    disclaimerClothing: "Clothing and personal care are folded into lifestyle expenses.",
    disclaimerFx:
      "A positive USD savings figure does not mean equal purchasing power — USD uses a nominal FX snapshot, not PPP.",
    disclaimerSnapshot: "Data is a snapshot — verify current figures before making relocation decisions.",
    disclaimerTax:
      "Tax is a simplified effective rate (federal + sub-national for US/CA/CH only) — not a full bracket calculation; excludes filing status, deductions, benefits-in-kind, and contribution caps.",
    disclaimerHealthcare: "Healthcare models out-of-pocket costs only; the funding scheme is shown per country.",
    disclaimerRelocation:
      "Relocation sunk costs are a one-time estimate kept out of monthly savings math; the cash cushion is a reserve you keep, not a sunk cost.",
    disclaimerRoleSalary:
      "Role salary is modeled at the national (country) level — cities inherit their country's p25/median/p75 distribution.",
    disclaimerNonSalary:
      "Non-salary comp (RSU/equity + bonus) is informational total-comp context only, not part of the savings math.",

    // Calculator — geo filters
    labelRegion: "Region",
    labelCountry: "Country",
    labelCity: "City",
    optAllRegions: "All regions",
    optAllCountries: "All countries",
    optAllCities: "All cities",
    clearRegion: "Clear",
    regionAutoAdvisory: "Region updated automatically to match the selected country.",

    // Calculator — region display names (UWT-004). The serialized region KEY stays English
    // (URL stability); only these display labels are localized. MENA/Nordics are expanded.
    regionAsean: "ASEAN",
    regionJapan: "Japan",
    regionEurope: "Europe",
    regionNordics: "Nordics (Northern Europe)",
    regionAmericas: "Americas",
    regionMena: "MENA (Middle East & North Africa)",
    regionAsia: "Asia",
    regionOceania: "Oceania",
    regionAfrica: "Africa",

    // Calculator — controls
    labelAdults: "Adults",
    labelPreschoolKids: "Preschool children",
    labelSchoolKids: "School-age children",
    labelSchoolType: "School type",
    optPublic: "Public",
    optPrivate: "Private",
    schoolTypeHint: "add school-age children to choose",
    // UWT-015: native hover tooltip (title) on the disabled Public/Private buttons so a
    // first-timer learns the prerequisite without relying on the screen-reader-only hint.
    schoolTypeDisabledTitle: "Add a school-age child to enable this option",
    foreignerPublicSchoolNote:
      "Public school isn't open to foreign residents in every country; where it isn't (e.g. UAE, Singapore), the private-school cost is used instead.",
    publicSchoolForeignerFlag: "public n/a → private",
    publicSchoolForeignerFlagBadge: "Private — public not open to foreigners",
    labelArea: "Area",
    optCenter: "City center",
    optRural: "Rural",

    // Calculator — cost-of-living table
    colCountry: "Country",
    colCity: "City",
    colHealthcareScheme: "Healthcare scheme",
    tooltipHealthcareScheme:
      "How healthcare costs are funded in this country: tax-funded, mandatory payroll insurance, or out-of-pocket.",
    colHousing: "Housing",
    colFood: "Food",
    colTransport: "Transport",
    colUtilities: "Utilities",
    colHealthcareOOP: "Healthcare (OOP)",
    colHealthcareOOPPrefix: "Healthcare",
    colChildcare: "Childcare",
    colSchool: "School",
    colLifestyle: "Lifestyle",
    colEssentials: "Essentials",
    colTotal: "Total",
    previewMonthlyEstimate: "estimated monthly essentials",
    // UWT-006: labels the pre-populated min-role preview panel as illustrative.
    previewExampleLabel: "Example",
    colRelocationSunk: "Relocation (sunk)",
    colLiquidityReserve: "Liquidity reserve",
    tooltipRelocationSunk:
      "One-time sunk costs: rental deposit, key money, moving, and visa fees. Not a monthly expense.",
    tooltipLiquidityReserve:
      "Cash cushion you keep on hand — not a sunk cost. Covers first months before salary starts.",
    oopLegend: "OOP = out-of-pocket — healthcare you pay yourself, on top of any tax-funded or insurance coverage.",

    // Calculator — healthcare scheme badges
    healthcareTaxFunded: "tax-funded",
    healthcareMandatoryPayroll: "mandatory payroll insurance",
    healthcareOutOfPocket: "out-of-pocket",

    // Calculator — city detail
    sectionMonthlyExpenses: "Monthly expenses",
    sectionRelocationCosts: "Relocation costs",
    labelHousing: "Housing",
    labelFood: "Food",
    labelTransport: "Transport",
    labelUtilities: "Utilities",
    labelHealthcareOOP: "Healthcare (OOP)",
    labelChildcare: "Childcare",
    labelSchool: "School",
    labelEssentialsSubtotal: "Essentials subtotal",
    labelMonthlyTotal: "Monthly total",
    labelRelocationSunkCost: "One-time relocation sunk cost",
    labelLiquidityReserve: "Liquidity reserve (cash cushion — kept, not spent)",
    backToAllCities: "← Back to all cities",

    // Calculator — savings table
    savingsEmptyStateMessage: "Enter your gross monthly salary to see how much you could save in each city.",
    grossMonthlySalaryLabel: "Gross monthly salary (before tax)",
    salaryCurrencyIndicator: "Currency: USD",
    salaryCurrencyExplanation: "Salaries are compared in USD across all cities.",
    annualGrossLabel: "Annual gross",
    nonSalaryCompNote: "Non-salary comp (RSU/equity + bonus) is informational only — not in savings math.",
    colNet: "Net (monthly)",
    colSavingsEssential: "Savings after essentials ↕",
    colSavingsLifestyle: "Savings after lifestyle",
    colNonSalaryComp: "Typical non-salary comp (info, annual)",
    colTotalComp: "Total comp (info, annual)",
    sortBySavings: "Sort by savings",
    subNationalIndicator: "(fed+state)",

    // Calculator — min-role table
    labelBaselineSource: "How to set your target",
    optSavingsTarget: "Monthly savings target",
    optReferenceRole: "Match a role",
    optMySalary: "My salary",
    hintSavingsTarget: "Enter a monthly savings goal — the table marks the lowest role whose best city reaches it.",
    hintReferenceRole:
      "Pick a role and city as the yardstick — the table marks the lowest role that saves at least as much, no dollar figure needed.",
    hintMySalary:
      "Enter your current gross salary — the table marks the lowest role that saves at least what you do today.",
    labelMonthlySavingsTarget: "Monthly savings target",
    labelTargetCurrency: "Target currency",
    labelRefCity: "Reference city",
    labelRefRole: "Reference role",
    labelMyGrossMonthly: "My gross monthly",
    labelMySalaryCity: "My salary city",
    labelSalaryInputCurrency: "Salary currency",
    labelDisplayCurrency: "Display currency",
    rankBasisNote:
      "Ranking key: essential savings (housing + food + transport + utilities + healthcare + school). Lifestyle excluded — personal preference variable.",
    nonSalaryRankNote: "Non-salary comp (RSU / equity / bonus) is informational only — not used in ranking.",
    noQualifierMessage: "No role reaches this savings bar in any city.",
    minRoleEmptyStateMessage: "Enter a monthly savings target to see which roles reach it in each city.",
    seRolesCaption: "Roles: software-engineering (IC + management)",
    qualifyingDivider: "— roles below do not reach the savings bar —",
    moreBelowBar: "more (city, role) pairs below your bar (not shown)",
    colRole: "Role",
    colTrack: "Track",
    colBestCity: "Best city",
    colP25: "P25 (monthly)",
    colMedian: "Median",
    colP75: "P75",
    colEssentialSavings: "Essential savings",
    colNonSalaryCompInfo: "Non-salary comp",
    minimumMarker: "← min",
    // UWT-010: percentile gloss tooltips for the salary-distribution headers.
    tooltipP25: "25th-percentile monthly salary — a quarter of people in this role earn less.",
    tooltipMedian: "Median (50th-percentile) monthly salary for this role.",
    tooltipP75: "75th-percentile monthly salary — a quarter of people in this role earn more.",
    // UWT-013: expanded Track labels (the table renders these instead of bare "ic"/"mgmt").
    trackIc: "Individual contributor",
    trackMgmt: "Management",
    // UWT-003: gloss for the shortened "Non-salary comp" header.
    tooltipNonSalaryComp: "RSU/equity + bonus — annual total, informational only, not used in savings math.",

    // IA navigation revamp — landing homepage + global nav
    heroHeading: "Learn to build software, the clear way.",
    heroIntro:
      "AyoKoding is an open, bilingual learning hub for software engineering — practical guides, worked examples, and free tools that grow with you.",
    heroCtaLearn: "Start learning",
    heroCtaTools: "Explore tools",
    navLearn: "Learn",
    navTools: "Tools",
    browseTitle: "Browse",
    browseIntro: "Browse every AyoKoding section in one place.",
    sectionBlurbFallback: "Explore this section.",
    toolsTeaserKicker: "Tools",
    toolsTeaserTitle: "Cost of Living Calculator",
    toolsTeaserDesc: "Compare monthly living costs, savings, and the minimum role you need across cities.",
    toolsTeaserCta: "Open the calculator",
    footerLearn: "Learn",
    footerTools: "Tools",
    footerAbout: "About",
    footerBrowseAll: "Browse all",
    footerCalculator: "Cost of Living Calculator",
    footerAiBenchmark: "AI Model Benchmark",
    footerAboutAyokoding: "About AyoKoding",
    footerTerms: "Terms & Conditions",
    footerProject: "Project",
    sectionExploreHeading: "Explore",

    // Mobile nav drawer — preset width control
    mobileNavWidthLabel: "Drawer width",
    // UWT-005 fix (phase-5 rule-15 retest): ties the control to the real, concrete benefit a
    // first-time reader gets from it, rather than leaving "Drawer width" to speak for itself.
    mobileNavWidthHint: "Widen the drawer to read long path or course titles in full",
    mobileNavWidthDefault: "Default",
    mobileNavWidthWide: "Wide",

    // Course-paths feature chrome (DWT-003 fix, phase-5 rule-15 design-tester retest): these
    // static UI strings previously rendered as hardcoded English literals, never routing through
    // `t()`, so they stayed English even when the surrounding page (masthead, hero H1, section
    // headings) correctly rendered `id`. `brd.md`'s own non-goal only defers translating path/
    // course *data* — the feature's own interface chrome was always meant to localize.
    pathsChooseYourPath: "Choose your path",
    pathsCompareAllPaths: "Compare all paths",
    pathsExploreSkillsPaths: "Explore skills paths",
    pathsBrowseCourseLibrary: "Browse the full course library",
    pathsStart: "Start",
    pathsExploreArc: "Explore arc",
    pathsExploreArcRoles: "Explore this arc's roles",
    pathsSyllabus: "Syllabus",
    pathsPrerequisites: "Prerequisites",
    pathsCourseWordCapital: "Course",
    pathsCourseWordLower: "course",
    pathsOfWord: "of",
    pathsOnPathPrefix: "on path",
    pathsViewPath: "View path",
    pathsViewFullPath: "View full path",
    pathsBrowseAllCourses: "Browse all courses",

    // Resizable docs sidebar — drag/keyboard handle accessible name
    resizableSidebarHandleLabel: "Resize panel",

    // Code-block copy button — CodeBlock's copyLabel/copiedLabel/errorLabel (English default)
    copy: "Copy",
    copied: "Copied",
    copyFailed: "Copy failed",
  },
  id: {
    readMore: "Baca Selengkapnya",
    lastUpdated: "Terakhir diperbarui",
    publishedOn: "Dipublikasikan pada",
    author: "Penulis",
    tags: "Tag",
    categories: "Kategori",
    share: "Bagikan",
    relatedContent: "Konten Terkait",
    openSourceProject: "Proyek Open-Source",
    search: "Cari...",
    onThisPage: "Di halaman ini",
    previous: "Sebelumnya",
    next: "Selanjutnya",
    noResults: "Tidak ada hasil",
    toggleTheme: "Ubah tema",
    skipToContent: "Langsung ke konten",
    toolsPageTitle: "Alat",
    toolsPageCalcLink: "Kalkulator Biaya Hidup",
    toolsPageCalcDesc:
      "Bandingkan biaya hidup bulanan, tabungan, dan jabatan minimum yang dibutuhkan di berbagai kota.",
    toolsPageAiBenchLink: "Tolok Ukur Model AI",
    toolsPageAiBenchDesc:
      "Bandingkan model koding berdasarkan tingkat kemampuan yang diukur independen dan harga API, serta cari pengganti di OpenCode Go.",
    breadcrumbHome: "Beranda",
    breadcrumbCalculator: "Kalkulator",

    // AI benchmark. Setiap kunci aiBench* HARUS ada di kedua bahasa: kunci yang hilang muncul
    // sebagai ID mentahnya, dan tes halaman memastikan tidak ada token "aiBench" yang bocor.
    aiBenchTitle: "Tolok Ukur Model AI",
    aiBenchSubtitle:
      "Model koding mana yang cukup untuk pekerjaanmu, berapa biayanya, dan model OpenCode Go mana yang bisa menggantikannya.",
    aiBenchLastUpdatedLabel: "Terakhir diperbarui",
    aiBenchIndependentOnly:
      "Skor hanya berasal dari benchmark yang dijalankan pihak independen. Hasil yang dilaporkan vendor modelnya sendiri tidak ditampilkan dan tidak dihitung.",
    aiBenchJumpToMethod: "Cara skor dihitung",

    aiBenchFinderHeading: "Cari pengganti di OpenCode Go",
    aiBenchFinderIntro:
      "Pilih model frontier untuk melihat model OpenCode Go mana yang setidaknya setingkat, dan bagaimana perbandingan harganya.",
    aiBenchFinderLabel: "Model frontier",
    aiBenchFinderPlaceholder: "Pilih model…",
    aiBenchFinderTarget: "{model} ada di tingkat {tier}, indeks {index}, harga gabungan {price}.",
    aiBenchFinderTargetNoPrice: "{model} ada di tingkat {tier}, indeks {index}; belum ada harga API publik.",
    aiBenchFinderMatches: "Model OpenCode Go di tingkat yang sama atau lebih tinggi:",
    aiBenchFinderNearest: "Belum ada model OpenCode Go yang mencapai tingkat {tier}. Pilihan terdekat:",
    aiBenchFinderInsufficient:
      "{model} belum punya cukup hasil independen untuk dibandingkan. Skor yang ada tercantum di tabel di bawah.",
    aiBenchFinderNoneCheaper: "Tidak ada yang lebih murah per token daripada {model}.",
    aiBenchPriceCheaper: "{ratio}× lebih murah per token",
    aiBenchPricePricier: "{ratio}× lebih mahal per token",
    aiBenchPriceSame: "harga per token kurang lebih sama",
    aiBenchPriceUnknown: "harga tidak bisa dibandingkan",

    aiBenchFilterHeading: "Filter",
    aiBenchFilterHarness: "Harness",
    aiBenchFilterHarnessAll: "Semua harness",
    aiBenchFilterTier: "Tingkat",
    aiBenchFilterTierAll: "Semua tingkat",
    aiBenchFilterReset: "Atur ulang filter",
    aiBenchFilterResultCount: "{count} dari {total} model ditampilkan",
    aiBenchEmptyStateTitle: "Tidak ada model yang cocok dengan filter ini",
    aiBenchEmptyStateMessage: "Coba harness atau tingkat lain, atau atur ulang filter.",

    aiBenchTierMapHeading: "Tingkat kemampuan",
    aiBenchTierUltra: "Ultra",
    aiBenchTierPlanning: "Perencanaan & orkestrasi",
    aiBenchTierExecution: "Eksekusi",
    aiBenchTierFast: "Cepat",
    aiBenchTierInsufficient: "Data belum cukup",
    aiBenchTierUltraUse: "Untuk pekerjaan tersulit dan paling panjang.",
    aiBenchTierPlanningUse: "Untuk perencanaan, review, dan mengorkestrasi agen lain.",
    aiBenchTierExecutionUse: "Untuk menjalankan rencana yang sudah jelas.",
    aiBenchTierFastUse: "Untuk perubahan kecil yang jelas dan pencarian cepat.",
    aiBenchTierFloor: "Batas bawah: indeks {index}, ditetapkan oleh {anchor}.",
    aiBenchTierFastFloor: "Model ber-skor di bawah batas Eksekusi.",
    aiBenchTierEmpty: "Tidak ada model di tingkat ini yang cocok dengan filter saat ini.",
    aiBenchAnchorBadge: "patokan",
    aiBenchLimitedAccess: "Akses terbatas",
    aiBenchIndexLabel: "Indeks",
    aiBenchPriceInOut: "{input} / {output} per 1 juta token",
    aiBenchNoPrice: "Belum ada harga API publik",

    aiBenchInsufficientHeading: "Data independen belum cukup ({count} model)",
    aiBenchInsufficientIntro:
      "Model-model ini punya hasil independen di kurang dari {min} benchmark, jadi belum mendapat indeks maupun tingkat.",
    aiBenchInsufficientNone: "belum ada hasil independen",

    aiBenchTableHeading: "Semua model",
    aiBenchTableCaption:
      "Skor benchmark independen, indeks gabungan, tingkat, dan harga API dalam USD per 1 juta token. Setiap skor tertaut ke sumbernya.",
    aiBenchColModel: "Model",
    aiBenchColTier: "Tingkat",
    aiBenchColIndex: "Indeks",
    aiBenchColInput: "Input",
    aiBenchColOutput: "Output",
    aiBenchColBlended: "Gabungan",
    aiBenchColCostPerTask: "Biaya per tugas",
    aiBenchColHarnesses: "Harness",
    aiBenchScoreRunBy: "dijalankan oleh {operator}, {config}",
    aiBenchTableScrollHint: "Geser ke samping untuk melihat semua kolom.",

    aiBenchMethodHeading: "Cara skor dihitung",
    aiBenchMethodBenchmarksIntro:
      "Tiga benchmark agen koding dengan bobot sama. Hanya versi yang tercantum yang dihitung, dan tiap skor diambil dari sumber pertama dalam daftar yang memilikinya.",
    aiBenchMethodBenchDeepSwe: "Perubahan jangka panjang di repositori nyata.",
    aiBenchMethodBenchTerminal: "Kerja mandiri di lingkungan shell nyata.",
    aiBenchMethodBenchQna: "Menjawab pertanyaan tentang codebase besar yang belum dikenal.",
    aiBenchMethodVersion: "versi {version}",
    aiBenchMethodWeight: "bobot {weight}",
    aiBenchMethodSourceOrderIntro: "Sumber, urut prioritas:",
    aiBenchMethodIndex:
      "Indeks: rata-rata skor model pada benchmark yang dimilikinya. Model butuh setidaknya {min} benchmark untuk mendapat indeks dan tingkat.",
    aiBenchMethodTiers:
      "Tingkat: masing-masing ditentukan oleh satu model patokan generasi sebelumnya. Model masuk ke tingkat tertinggi yang indeks patokannya ia samai atau lampaui, jadi tingkat model selalu mengikuti indeksnya.",
    aiBenchMethodAnchorsIntro: "Model patokan tiap tingkat:",
    aiBenchMethodPrice:
      "Harga: tarif API standar vendor per 1 juta token. Gabungan = (3 × input + output) ÷ 4, campuran yang umum untuk agen koding. Bila vendor tidak menerbitkan halaman harga, tarif yang dicantumkan OpenCode dipakai dan ditandai “tarif OpenCode”.",
    aiBenchMethodCostPerTask:
      "Biaya per tugas: rata-rata biaya per tugas benchmark menurut Artificial Analysis, bila mereka menerbitkannya.",
    aiBenchMethodCaveat:
      "Tiap operator menjalankan model dengan harness dan tingkat effort berbeda (setiap skor menyebut konfigurasinya), dan sebagian run Anthropic dilayani model lain pada sebagian percobaan. Indeks hanya merata-ratakan benchmark yang dimiliki model, jadi dua indeks dari benchmark berbeda tidak sepenuhnya setara (GPT-5.6 Terra, misalnya, belum punya hasil SWE-Atlas QnA independen); tabel menunjukkan skor mana yang dipakai tiap indeks. Anggap selisih beberapa poin sebagai noise.",
    aiBenchMethodExcluded:
      "Tidak dihitung: hasil yang dilaporkan vendor, versi benchmark lama, SWE-bench Verified dan GPQA Diamond (sudah jenuh), serta SWE-bench Pro (masalah kualitas tugas). Space Bunny Free di OpenCode Go tidak dimasukkan karena tidak menyebut vendornya.",
    aiBenchMethodExampleHeading: "Contoh perhitungan",
    aiBenchMethodExampleIndex: "{model}: ({scores}) ÷ {count} = indeks {index}.",
    aiBenchMethodExampleCompare:
      "{model} (indeks {modelScore}) dibandingkan dengan patokan tingkat {tier}, {anchor} (indeks {anchorScore}): {model} {result}.",
    aiBenchMethodMeets: "mencapai tingkat itu",
    aiBenchMethodMisses: "masih di bawah tingkat itu",
    aiBenchOpencodeRate: "tarif OpenCode",

    aiBenchSourcesHeading: "Sumber dan tanggal pengecekan",
    aiBenchSourcesBenchmarks: "Hasil benchmark",
    aiBenchSourcesPrices: "Harga API",
    aiBenchSourcesChecked: "dicek {date}",
    aiBenchSourcesUpdated: "sumber diperbarui {date}",
    aiBenchSourcesCitedAs: "angka dikutip dengan atribusi dan tautan",
    aiBenchSourcesCitation:
      "Angka dikutip dengan atribusi dan tautan ke tiap sumber; lihat masing-masing sumber untuk ketentuan penggunaannya.",

    // Calculator — page
    calcTitle: "Kalkulator Biaya Hidup",
    calcSubtitle: "Bandingkan biaya hidup dan tabungan gaji di berbagai kota",
    ariaTabsNav: "Tab kalkulator",
    tabCostOfLiving: "Biaya hidup",
    tabCostDesc: "Bandingkan biaya hidup bulanan di berbagai kota",
    tabSavings: "Tabungan",
    tabSavingsDesc: "Lihat seberapa banyak yang bisa Anda hemat",
    tabMinRole: "Jabatan minimum",
    tabMinRoleDesc: "Temukan jabatan minimum yang Anda butuhkan",
    dataLastUpdated: "Data terakhir diperbarui",
    estimatesOnly: "Hanya perkiraan",

    // Calculator — disclaimers
    disclaimerPension: "Tabungan sebelum kontribusi pensiun / dana hari tua sukarela.",
    disclaimerClothing: "Pakaian dan perawatan pribadi termasuk dalam pengeluaran gaya hidup.",
    disclaimerFx:
      "Angka tabungan USD positif tidak berarti daya beli yang sama — USD menggunakan snapshot FX nominal, bukan PPP.",
    disclaimerSnapshot: "Data adalah snapshot — verifikasi angka terkini sebelum membuat keputusan relokasi.",
    disclaimerTax:
      "Pajak menggunakan tarif efektif yang disederhanakan (federal + sub-nasional untuk AS/CA/CH saja) — bukan perhitungan bracket penuh; tidak termasuk status pengisian, potongan, tunjangan natura, dan batas kontribusi.",
    disclaimerHealthcare: "Kesehatan memodelkan biaya out-of-pocket saja; skema pendanaan ditampilkan per negara.",
    disclaimerRelocation:
      "Biaya sunk relokasi adalah perkiraan sekali dan tidak termasuk dalam perhitungan tabungan bulanan; cadangan tunai adalah dana yang Anda simpan, bukan biaya.",
    disclaimerRoleSalary:
      "Gaji jabatan dimodelkan di tingkat nasional (negara) — kota mewarisi distribusi p25/median/p75 negaranya.",
    disclaimerNonSalary:
      "Kompensasi non-gaji (RSU/ekuitas + bonus) hanya sebagai konteks informasi total kompensasi, bukan bagian dari perhitungan tabungan.",

    // Calculator — geo filters
    labelRegion: "Wilayah",
    labelCountry: "Negara",
    labelCity: "Kota",
    optAllRegions: "Semua wilayah",
    optAllCountries: "Semua negara",
    optAllCities: "Semua kota",
    clearRegion: "Hapus",
    regionAutoAdvisory: "Wilayah diperbarui otomatis agar sesuai dengan negara yang dipilih.",

    // Calculator — region display names (UWT-004). The serialized region KEY stays English
    // (URL stability); only these display labels are localized. MENA/Nordics are expanded.
    regionAsean: "ASEAN",
    regionJapan: "Jepang",
    regionEurope: "Eropa",
    regionNordics: "Nordik (Eropa Utara)",
    regionAmericas: "Amerika",
    regionMena: "Timur Tengah & Afrika Utara",
    regionAsia: "Asia",
    regionOceania: "Oseania",
    regionAfrica: "Afrika",

    // Calculator — controls
    labelAdults: "Dewasa",
    labelPreschoolKids: "Anak prasekolah",
    labelSchoolKids: "Anak usia sekolah",
    labelSchoolType: "Jenis sekolah",
    optPublic: "Negeri",
    optPrivate: "Swasta",
    schoolTypeHint: "tambahkan anak usia sekolah untuk memilih",
    // UWT-015: native hover tooltip (title) on the disabled Public/Private buttons.
    schoolTypeDisabledTitle: "Tambahkan anak usia sekolah untuk mengaktifkan opsi ini",
    foreignerPublicSchoolNote:
      "Sekolah negeri nggak terbuka buat warga asing di semua negara; di tempat yang nggak (mis. UEA, Singapura), biaya sekolah swasta yang dipakai.",
    publicSchoolForeignerFlag: "negeri n/a → swasta",
    publicSchoolForeignerFlagBadge: "Swasta — negeri tak terbuka untuk WNA",
    labelArea: "Wilayah",
    optCenter: "Pusat kota",
    optRural: "Pedesaan",

    // Calculator — cost-of-living table
    colCountry: "Negara",
    colCity: "Kota",
    colHealthcareScheme: "Skema kesehatan",
    tooltipHealthcareScheme:
      "Bagaimana biaya kesehatan didanai di negara ini: didanai pajak, asuransi penggajian wajib, atau bayar sendiri.",
    colHousing: "Perumahan",
    colFood: "Makanan",
    colTransport: "Transportasi",
    colUtilities: "Utilitas",
    colHealthcareOOP: "Kesehatan (OOP)",
    colHealthcareOOPPrefix: "Kesehatan",
    colChildcare: "Penitipan anak",
    colSchool: "Sekolah",
    colLifestyle: "Gaya hidup",
    colEssentials: "Kebutuhan pokok",
    colTotal: "Total",
    previewMonthlyEstimate: "perkiraan kebutuhan pokok bulanan",
    // UWT-006: labels the pre-populated min-role preview panel as illustrative.
    previewExampleLabel: "Contoh",
    colRelocationSunk: "Relokasi (biaya hangus)",
    colLiquidityReserve: "Cadangan likuiditas",
    tooltipRelocationSunk:
      "Biaya hangus sekali: deposit sewa, uang kunci, pindahan, dan biaya visa. Bukan pengeluaran bulanan.",
    tooltipLiquidityReserve:
      "Dana cadangan yang Anda simpan — bukan biaya hangus. Menutup bulan-bulan awal sebelum gaji mulai.",
    oopLegend:
      "OOP = out-of-pocket — biaya kesehatan yang Anda bayar sendiri, di luar jaminan dari pajak atau asuransi.",

    // Calculator — healthcare scheme badges
    healthcareTaxFunded: "didanai pajak",
    healthcareMandatoryPayroll: "asuransi penggajian wajib",
    healthcareOutOfPocket: "bayar sendiri",

    // Calculator — city detail
    sectionMonthlyExpenses: "Pengeluaran bulanan",
    sectionRelocationCosts: "Biaya relokasi",
    labelHousing: "Perumahan",
    labelFood: "Makanan",
    labelTransport: "Transportasi",
    labelUtilities: "Utilitas",
    labelHealthcareOOP: "Kesehatan (OOP)",
    labelChildcare: "Penitipan anak",
    labelSchool: "Sekolah",
    labelEssentialsSubtotal: "Subtotal kebutuhan pokok",
    labelMonthlyTotal: "Total bulanan",
    labelRelocationSunkCost: "Biaya sunk relokasi sekali",
    labelLiquidityReserve: "Cadangan likuiditas (dana cadangan — disimpan, tidak dibelanjakan)",
    backToAllCities: "← Kembali ke semua kota",

    // Calculator — savings table
    savingsEmptyStateMessage:
      "Masukkan gaji kotor bulanan Anda untuk melihat berapa banyak yang bisa Anda hemat di setiap kota.",
    grossMonthlySalaryLabel: "Gaji kotor bulanan (sebelum pajak)",
    salaryCurrencyIndicator: "Mata uang: USD",
    salaryCurrencyExplanation: "Gaji dibandingkan dalam USD di semua kota.",
    annualGrossLabel: "Total gaji tahunan",
    nonSalaryCompNote:
      "Kompensasi non-gaji (RSU/ekuitas + bonus) hanya informasi — tidak termasuk dalam perhitungan tabungan.",
    colNet: "Bersih (bulanan)",
    colSavingsEssential: "Tabungan setelah kebutuhan pokok ↕",
    colSavingsLifestyle: "Tabungan setelah gaya hidup",
    colNonSalaryComp: "Kompensasi non-gaji tipikal (info, tahunan)",
    colTotalComp: "Total kompensasi (info, tahunan)",
    sortBySavings: "Urutkan berdasarkan tabungan",
    subNationalIndicator: "(federal+negara bagian)",

    // Calculator — min-role table
    labelBaselineSource: "Cara menetapkan target",
    optSavingsTarget: "Target tabungan bulanan",
    optReferenceRole: "Samakan jabatan",
    optMySalary: "Gaji saya",
    hintSavingsTarget:
      "Masukkan target tabungan bulanan — tabel menandai jabatan terendah yang kota terbaiknya mencapainya.",
    hintReferenceRole:
      "Pilih jabatan dan kota sebagai patokan — tabel menandai jabatan terendah yang menabung setidaknya sebanyak itu, tanpa perlu angka.",
    hintMySalary:
      "Masukkan gaji kotor Anda saat ini — tabel menandai jabatan terendah yang menabung setidaknya sebanyak Anda sekarang.",
    labelMonthlySavingsTarget: "Target tabungan bulanan",
    labelTargetCurrency: "Mata uang target",
    labelRefCity: "Kota referensi",
    labelRefRole: "Jabatan referensi",
    labelMyGrossMonthly: "Gaji kotor bulanan saya",
    labelMySalaryCity: "Kota gaji saya",
    labelSalaryInputCurrency: "Mata uang gaji",
    labelDisplayCurrency: "Mata uang tampilan",
    rankBasisNote:
      "Kunci peringkat: tabungan kebutuhan pokok (perumahan + makanan + transportasi + utilitas + kesehatan + sekolah). Gaya hidup dikecualikan — variabel preferensi pribadi.",
    nonSalaryRankNote: "Kompensasi non-gaji (RSU / ekuitas / bonus) hanya informasi — tidak digunakan dalam peringkat.",
    noQualifierMessage: "Tidak ada jabatan yang mencapai target tabungan ini di kota manapun.",
    minRoleEmptyStateMessage:
      "Masukkan target tabungan bulanan untuk melihat jabatan mana yang mencapainya di setiap kota.",
    seRolesCaption: "Jabatan: rekayasa perangkat lunak (IC + manajemen)",
    qualifyingDivider: "— jabatan di bawah tidak mencapai target tabungan —",
    moreBelowBar: "pasangan (kota, jabatan) lain di bawah ambang Anda (tidak ditampilkan)",
    colRole: "Jabatan",
    colTrack: "Jalur",
    colBestCity: "Kota terbaik",
    colP25: "P25 (bulanan)",
    colMedian: "Median",
    colP75: "P75",
    colEssentialSavings: "Tabungan kebutuhan pokok",
    colNonSalaryCompInfo: "Kompensasi non-gaji",
    minimumMarker: "← min",
    // UWT-010: percentile gloss tooltips for the salary-distribution headers.
    tooltipP25: "Gaji bulanan persentil ke-25 — seperempat orang di jabatan ini berpenghasilan lebih rendah.",
    tooltipMedian: "Gaji bulanan median (persentil ke-50) untuk jabatan ini.",
    tooltipP75: "Gaji bulanan persentil ke-75 — seperempat orang di jabatan ini berpenghasilan lebih tinggi.",
    // UWT-013: expanded Track labels (the table renders these instead of bare "ic"/"mgmt").
    trackIc: "Kontributor individu",
    trackMgmt: "Manajemen",
    // UWT-003: gloss for the shortened "Non-salary comp" header.
    tooltipNonSalaryComp:
      "RSU/ekuitas + bonus — total tahunan, hanya informasi, tidak digunakan dalam perhitungan tabungan.",

    // IA navigation revamp — landing homepage + global nav
    heroHeading: "Belajar membangun perangkat lunak, dengan cara yang jelas.",
    heroIntro:
      "AyoKoding adalah pusat belajar terbuka dwibahasa untuk rekayasa perangkat lunak — panduan praktis, contoh nyata, dan alat gratis yang tumbuh bersama Anda.",
    heroCtaLearn: "Mulai belajar",
    heroCtaTools: "Jelajahi alat",
    navLearn: "Belajar",
    navTools: "Alat",
    browseTitle: "Jelajahi",
    browseIntro: "Jelajahi seluruh bagian AyoKoding dalam satu tempat.",
    sectionBlurbFallback: "Jelajahi bagian ini.",
    toolsTeaserKicker: "Alat",
    toolsTeaserTitle: "Kalkulator Biaya Hidup",
    toolsTeaserDesc: "Bandingkan biaya hidup bulanan, tabungan, dan peran minimum yang Anda butuhkan di berbagai kota.",
    toolsTeaserCta: "Buka kalkulator",
    footerLearn: "Belajar",
    footerTools: "Alat",
    footerAbout: "Tentang",
    footerBrowseAll: "Jelajahi semua",
    footerCalculator: "Kalkulator Biaya Hidup",
    footerAiBenchmark: "Tolok Ukur Model AI",
    footerAboutAyokoding: "Tentang AyoKoding",
    footerTerms: "Syarat & Ketentuan",
    footerProject: "Proyek",
    sectionExploreHeading: "Jelajahi",

    // Mobile nav drawer — preset width control
    mobileNavWidthLabel: "Lebar drawer",
    mobileNavWidthHint: "Perlebar drawer untuk membaca judul jalur atau kursus yang panjang secara utuh",
    mobileNavWidthDefault: "Standar",
    mobileNavWidthWide: "Lebar",

    // Course-paths feature chrome (DWT-003 fix, phase-5 rule-15 design-tester retest)
    pathsChooseYourPath: "Pilih jalur Anda",
    pathsCompareAllPaths: "Bandingkan semua jalur",
    pathsExploreSkillsPaths: "Jelajahi jalur keterampilan",
    pathsBrowseCourseLibrary: "Jelajahi seluruh pustaka kursus",
    pathsStart: "Mulai",
    pathsExploreArc: "Jelajahi arc",
    pathsExploreArcRoles: "Jelajahi peran arc ini",
    pathsSyllabus: "Silabus",
    pathsPrerequisites: "Prasyarat",
    pathsCourseWordCapital: "Kursus",
    pathsCourseWordLower: "kursus",
    pathsOfWord: "dari",
    pathsOnPathPrefix: "pada jalur",
    pathsViewPath: "Lihat jalur",
    pathsViewFullPath: "Lihat jalur lengkap",
    pathsBrowseAllCourses: "Jelajahi semua kursus",

    // Resizable docs sidebar — drag/keyboard handle accessible name
    resizableSidebarHandleLabel: "Ubah ukuran panel",

    // Code-block copy button — CodeBlock's copyLabel/copiedLabel/errorLabel
    copy: "Salin",
    copied: "Tersalin",
    copyFailed: "Gagal menyalin",
  },
};

export function t(locale: Locale, key: string): string {
  return translations[locale]?.[key] ?? key;
}
