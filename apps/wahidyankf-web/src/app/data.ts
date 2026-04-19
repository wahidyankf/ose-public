export type CVEntry = {
  type: "about" | "work" | "education" | "honor" | "certification" | "language";
  title: string;
  organization: string;
  period: string;
  details: string[];
  links?: { [key: string]: string };
  employmentType?: string;
  location?: string;
  locationType?: string;
  skills?: string[];
  programmingLanguages?: string[];
  frameworks?: string[];
};

export const cvData: CVEntry[] = [
  {
    title: "About Me",
    organization: "",
    period: "",
    details: [
      "Results-oriented software engineering leader with over 4 years of team management and strategic experience in Sharia-compliant fintech and tech startup environments. Proven expertise in delivering transformative projects, including a core banking migration at Hijra Bank (95% reduction in operational costs, equivalent to 30% of monthly revenue), adopting AI tooling to Hijra Bank's engineering team (60% productivity increase for around 3.75% monthly salary budget increase) and driving 50% of financing disbursements through Supply Chain Financing at Alami P2P Lending. Passionate about Islamic finance innovation, technical excellence, and team growth, I thrive on empowering teams to deliver scalable, halal solutions.",
      "As Head of Engineering at Hijra Bank, I lead the product, platform, and data engineering team to ensure it delivers business impact while maintaining 100% compliance with OJK regulations. I dedicated my career to halal and Sharia-compliant and neutral engineering roles (e.g., platform or warehouse systems) that align with Islamic principles. I am a polyglot fluent in Bahasa Indonesia and English, with knowledge of German and Arabic, bringing a global perspective shaped by my overseas experience.",
      "I contribute to the tech community through my blog and YouTube channel, AyoKoding (ayokoding.com), where I share insights on software engineering and Islamic fintech, and seek to leverage my leadership and technical expertise to build innovative, Sharia-compliant, or neutral solutions that create a lasting impact.",
    ],
    links: {
      github: "https://github.com/wahidyankf",
      githubOrg: "https://github.com/organiclever",
      linkedin: "https://www.linkedin.com/in/wahidyan-kresna-fridayoka/",
      website: "https://wahidyankf.com",
      email: "wahidyankf@gmail.com",
    },
    type: "about",
  },
  {
    title: "Head of Engineering - Hijra Bank",
    organization: "Hijra",
    period: "March 2025 - Present",
    employmentType: "Full-time",
    location: "Jakarta, Indonesia",
    locationType: "Hybrid",
    details: [
      "Led engineering team in Hijra Bank (backend, frontend, mobile, SEIT, release, platform, and data engineering) within the Hijra Group's Bank domain, encompassing core banking, transactions, consumer lifecycle, financing, data engineering, and release management. This role included serving as IT Executive Officer for Hijra Bank, responsible for regulatory/compliance stuff such as reporting, ISO 27001:2022 certification audits, and coordinating/complying with internal audit, infosec, and IT government team.",
      "Delivered various banking features, such as partner merchant cash withdrawal with convenience stores (Indomaret, enabling cash withdrawal in 20.000+ stores/400 cities), adoption of the BI SNAP transaction protocol (enabling open banking within the Indonesian border), usage of the BI FAST transfer channel (around 96% cost reduction for interbank transfers), and corporate payroll services.",
      "Successfully embed AI in the engineering lifecycle. Increased productivity by 60% (with around a 3.75% increase in monthly salary budget), measured by GitHub contributions (e.g., code throughput, PR reviews, interactions, and resolutions). This AI adoption enables Hijra Bank's engineering team to do big platform code projects, such as a React Native update, monorepo initiatives, security fixes, AML improvement, data engineering platform revamp, and ISO 27001:2022 certification, while pushing up the user-centric features. Outside of that, it also enables the existing software engineers to do cross-stack work. It also allows release managers and data analysts without active coding experience in Hijra Group to start picking up the daily coding again, improving the team's versatility and collaborations.",
      "Successfully led and stabilized the engineering team by guiding the engineering team through a significant organizational transition, leveraging strategic reprioritization and Extreme Programming methodologies to ensure continued project delivery and team cohesion.",
    ],
    skills: [
      "Engineering Management",
      "Systems Design",
      "Software Engineering",
      "Core Banking",
      "Frontend Engineering",
      "Data Engineering",
      "Backend Engineering",
      "Financing Engineering",
      "Software Testing",
    ],
    programmingLanguages: ["JavaScript", "SQL", "Java", "TypeScript", "Python"],
    frameworks: ["React.js", "React Native", "Next.js", "Spring Boot"],
    type: "work",
  },
  {
    title: "Engineering Manager - Hijra Bank",
    organization: "Hijra",
    period: "July 2024 - February 2025",
    employmentType: "Full-time",
    location: "Indonesia",
    locationType: "Hybrid",
    details: [
      "Led a team of up to 24 engineers (Backend, Frontend, Mobile/React Native, SEIT, and SQA) within the Hijra Group's Bank domain, encompassing core banking, transactions, consumer life-cycle, financing, data engineering, and release management. This role included serving as IT Executive Officer for Hijra Bank, responsible for regulatory reporting, ISO 27001:2022 certification audits, and internal IT governance compliance.",
      "Led Hijra Bank's high-priority core banking migration (Mambu to IBA), achieving a 95% reduction in core banking operational costs, equivalent to 30% of Hijra Group's monthly revenue in under six months. This rapid implementation included product requirements, document finalization, development, and testing, and it established Hijra Bank's first serious automation testing process.",
      "Stabilized Hijra Bank's release train and expanded automation testing to cover all critical business flows. This implementation resulted in 0 hotfixes in production and dramatically reduced regression testing time from over five days to under five hours.",
      "Spearheaded the Financing Originating System (FOS) initiative from concept to implementation (ongoing), aiming to streamline the financing process and reduce Non-Performing Loans (NPLs).",
    ],
    skills: [
      "Engineering Management",
      "Systems Design",
      "Software Engineering",
      "Core Banking",
      "Frontend Engineering",
      "Data Engineering",
      "Backend Engineering",
      "Financing Engineering",
      "Software Testing",
    ],
    programmingLanguages: ["JavaScript", "Python", "SQL", "Java", "TypeScript"],
    frameworks: ["React.js", "React Native", "Next.js", "Spring Boot"],
    type: "work",
  },
  {
    title: "Engineering Manager - Alami P2P Lending and Hijra Bank Financing",
    organization: "Hijra",
    period: "December 2022 - July 2024",
    employmentType: "Full-time",
    location: "Indonesia",
    locationType: "Remote",
    details: [
      "Led the Hijra Group's Financing domain (Bank and Alami P2P lending), Risk Management & Reporting, and Data Engineering teams of up to 25 engineers (BE, FE, Mobile/React Native, SEIT, SQA, and DE), including stabilizing the team through strategic reprioritization after organizational restructuring.",
      "Spearheaded the development of the Bank's financing products (home and commercial financing), product engineering back office, and user onboarding (web and mobile applications), including sales and risk management dashboards. Its foundational work established a key revenue stream for the Hijra Group.",
      "Drove the adoption of Supply Chain Financing (SCF), contributing to 50% of total financing application disbursements in Alami P2P lending.",
      "Optimizing Alami's back-office system reduced the financing application submission-to-disbursement SLA by 25%, from 14 to 10 days.",
      "Led the extraction of the credit engine for cross-group use within Hijra (Bank and Alami), saving hundreds of development hours and eliminating application inconsistencies.",
      "Collaborated with Legal and Compliance teams to ensure 100% compliance with Indonesian Financial Services Authority (OJK) regulations for Hijra Group's P2P Lending and Bank engineering teams. It included AML system implementation, automated regulatory reporting, and back-office governance.",
      "Implemented developer productivity initiatives within the Financing domain, including Trunk-Based Development (TBD) adoption, Kubernetes migration support, CI/CD integration of units, integration, E2E testing, and other quality and infrastructure improvements. These efforts resulted in a faster, easier, and more secure development experience while reducing operational costs.",
      'Transformed manual QA processes to automated testing for the entire QA team (5 members), increasing team delivery and improving workforce stability. Furthermore, a "developer\'s own testing" approach was promoted to solidify this transformation.',
    ],
    skills: [
      "Engineering Management",
      "System Design",
      "Software Engineering",
      "Frontend Engineering",
      "Backend Engineering",
      "Software Testing",
      "Financing Engineering",
      "Data Engineering",
    ],
    programmingLanguages: ["JavaScript", "Java", "Python", "TypeScript", "SQL"],
    frameworks: ["React.js", "Next.js", "React Native", "Spring Boot"],
    type: "work",
  },
  {
    type: "work",
    title: "Engineering Manager",
    organization: "GudangAda",
    period: "July 2022 - December 2022",
    employmentType: "Full-time",
    location: "Indonesia",
    locationType: "Hybrid",
    details: [
      "Led GudangAda's (Gada) 11-member, multinational, distributed engineering team responsible for the Warehouse Management System (WMS).",
      "Launched bin-related WMS features (organizing inventory within warehouse locations) for internally operated warehouses, improving inventory organization and enabling more effective inbound/outbound operations (e.g., First Expired First Out (FEFO) recommendations).",
      "Delivered paperless WMS projects, significantly increasing accuracy and productivity. For example, invoice automation reduced creation and delivery time to partners by several days.",
      "Drove the adoption of a unified web automation framework (Cypress and TypeScript) across Gada's tech team, increasing product iteration velocity by automating previously manual web application E2E testing. The TypeScript introduction also fostered collaboration and code sharing between the QE and FE teams.",
      "Championed FE mono repo adoption within the WMS team, projected to increase FE team productivity by over 20% while improving maintainability and correctness through dependency graph analysis. This initiative also created a foundation for company-wide FE productivity and maintainability improvements.",
      "Spearheaded WMS engineering excellence initiatives, resulting in significantly accelerated testing and boosted developer productivity. Key improvements included mandating QE coverage for critical path positive cases, increasing unit testing adoption, implementing static type checking, modernizing development environments, and Dockerizing database development.",
    ],
    skills: [
      "Engineering Management",
      "Frontend Engineering",
      "Backend Engineering",
      "Software Testing",
      "System Design",
      "Software Engineering",
    ],
    programmingLanguages: ["JavaScript", "Python", "TypeScript", "SQL"],
    frameworks: ["React.js", "Next.js", "Django"],
  },
  {
    type: "work",
    title: "Engineering Manager",
    organization: "Ruangguru",
    period: "November 2021 - July 2022",
    employmentType: "Full-time",
    location: "Indonesia",
    locationType: "Remote",
    details: [
      "Led Skill Academy's (SA) 14-member, distributed engineering team responsible for the Payment, Promotion, and Discovery stream (SA-PPD). Successfully mentored and promoted two engineers to senior roles.",
      "Spearheaded developing and launching a highly successful user reward and OTP system, contributing to over 50% of SA's total transactions with a 99% disbursement success rate (the remaining 1% attributed to user input errors).",
      "Improved partnership utility software, streamlining SA's learning partnerships and contributing hundreds of billion Rupiah in secured partnership contracts.",
      "Led SA-PPD's backend re-architecture project, increasing system load capacity by over 200% and resolving domain coupling issues.",
      "Drove SA's frontend platform team initiative, resulting in a 35% improvement in Android app loading time, more than doubling the Lighthouse performance score for SA's web (from 10 to 50), and establishing CI/CD tooling for the React Native app deployment, saving approximately 2 hours of APK build time per day.",
      "Led SA-PPD's SEO project, increasing organic traffic by over 6 times (Jan-Jun 2022) and saving hundreds of millions of Rupiah per month in ad spending (e.g., over 500 million Rupiah in June 2022). Notably, organic traffic users demonstrated six times greater engagement than paid users.",
      "Spearheaded the development of dynamic landing pages and a public API, enabling SA's marketing UI engineers to save over a hundred engineering efforts monthly.",
      "Served as an advisory member of the SA-FE committee, guiding efforts to address technical debt and improve the developer experience, including ReasonML to TypeScript migration and web and mobile platform enhancements. Also actively participated in Ruangguru's FE hiring committee.",
    ],
    skills: [
      "Engineering Management",
      "System Design",
      "Frontend Engineering",
      "Software Engineering",
      "Software Testing",
    ],
    programmingLanguages: ["JavaScript", "Golang", "ReasonML", "TypeScript", "SQL"],
    frameworks: ["React.js", "Next.js", "ReasonReact"],
  },
  {
    type: "work",
    title: "Technical Lead",
    organization: "Ruangguru",
    period: "August 2021 - October 2021",
    employmentType: "Full-time",
    location: "Jakarta, Indonesia",
    locationType: "Remote",
    details: [
      "Led Skill Academy's payment, promotion, and discovery stream's (SA-PPD) distributed engineering team of 6. In addition, being responsible for the SA-PPD engineering alignment with its stakeholders and its BE & FE engineers' Career Development Plan (CDP).",
      "Led Skill Academy's FE (SA-FE) general technical endeavor by creating its roadmap, alignments with SA streams (e.g., SA-PPD, SA-Learning), and alignments with Ruangguru's FE (RG-FE) platform team. The alignment with SA streams ensured that the SA business grew, and SA-FE could pragmatically chase the RG's engineering excellence principle (e.g., web SEO and performance improvement for SA-PPD, learning journey stabilization for SA-Learning). At the same time, the alignments with the RG-FE team enable the SA-FE squad to benefit from adopting the technological advancement in RG-FE and vice versa (e.g., X-State for the central model adoption). Also responsible for the CDP of every engineer in SA-FE (i.e., seven engineers in total).",
      'Saving hundreds of engineering hours per month by prioritizing eliminating hassle-recurrent jobs in the SA-PPD engineering team (e.g., dynamic ranking, dynamic content adoption). Ensure that the engineering team can focus on what "matters" the most (create delightful products and strive for engineering excellence).',
    ],
    skills: [
      "Engineering Management",
      "System Design",
      "Backend Engineering",
      "Frontend Engineering",
      "Software Engineering",
    ],
    programmingLanguages: ["JavaScript", "Golang", "ReasonML", "TypeScript", "SQL"],
    frameworks: ["React.js", "React Native", "ReasonReact"],
  },
  {
    type: "work",
    title: "Senior Frontend Engineer",
    organization: "Ruangguru",
    period: "September 2019 - October 2021",
    employmentType: "Full-time",
    location: "Jakarta, Indonesia",
    locationType: "Remote",
    details: [
      "Developed most of Skill Academy's (SA) learning journey (using ReasonML) and CMS (using plain React.js) modules during the short inception period. Made sure that this critical project could be launched on time (8 weeks) while making it run-time error-free.",
      'Became frontend engineering lead for SA team (i.e., led 7 FE engineers) and was responsible for all of its client-side platforms (i.e., Web, Mobile, and CMS using ReasonML, TypeScript, Flow, JS, Cordova, React, React Native, Next.js). Made sure the team members could grow and stay happy while ensuring the SA team met the business needs and its technical debt "payment." Also heavily involved in driving SA\'s FE architecture (e.g., FSM-pattern adoption, heavy feature-toggle usage, offline-first architecture, tracking, testing adoption, dynamic rendering).',
      "Worked with various teams and stakeholders during the ideation, screening, execution, and retrospection phase, ensuring that only the most impactful features were shipped into production while keeping the deadline in check. Made SA the top product in the Indonesian market and became one of the most profitable business units in Ruangguru's history. Thus, it became one of Ruangguru's backbones during the COVID-19 pandemic.",
      "I was involved in Ruangguru's FE engineering committee and influenced its road map. One of the results was that Ruangguru's FE team quickly (i.e., about four weeks from the initial discussion) converged the convention and technological stacks for the then-new TypeScript adoption in Ruangguru's FE future projects.",
      "Heavily involved in Ruangguru's new FE engineer hiring. This involvement results in a faster FE engineering hiring process while ensuring only technical and culturally fit candidates pass. I also streamlined the FE team's onboarding process by creating documents and guides, resulting in a faster, more precise, and smoother onboarding for the new engineers while making it more scalable and reproducible.",
    ],
    skills: ["Frontend Engineering", "System Design", "Software Engineering"],
    programmingLanguages: ["JavaScript", "TypeScript", "ReasonML", "SQL", "HTML", "CSS"],
    frameworks: ["React.js", "React Native", "ReasonReact"],
  },
  {
    title: "Frontend Engineer",
    organization: "Ruangguru",
    period: "January 2018 - August 2019",
    employmentType: "Full-time",
    location: "Greater Jakarta Area, Indonesia",
    locationType: "Hybrid",
    details: [
      "Became one of the pioneering engineers in Ruang Belajar's Desktop app development using ReasonML, ReasonReact, and Electron. Heavily involved in its core and primitive UI components development (created more than 50% of it) and routing design, while also helping other engineers (mobile engineers) to pick up React and web technology in general. This project is the first joint project between Ruangguru's frontend and Mobile engineers. Opening up a new possibility of higher app development's velocity in Ruangguru.",
      "Involved in Ruangguru's new frontend engineer hiring process by assessing their computational thinking and React.js problem-solving skills through coding challenges. This involvement results in a faster frontend engineering division's hiring process while ensuring that only the high-quality one passed.",
      "Developed Ruang Kerja CMS question and question-set modules using React and Draft.js. Resulting in well-functioning rich-text editor implementation for question and question-set generation tasks in Ruang Kerja apps.",
      "Developed and set up various internal frontend tooling, including command-line applications to bootstrap new web projects, miscellaneous UI kits, rich text editor, and JavaScript utility functions. Resulting in a higher code sharing and development speed for Ruangguru's engineering team.",
      "Led a team of frontend developers to create Ruang Kerja's company dashboard using React JS stacks, flow-typed, and data visualization tools. Also did end-to-end testing for it using cypress. Resulting in a finely crafted and runtime-error-free dashboard web app.",
      "Became one of the pioneering engineers in Ruang Kerja's React Native app development. Resulting in more efficient engineering resource usage for Ruangguru by expanding the uses of its frontend engineers while theoretically cutting the cost of apps development down almost to 50% without losing any of native apps' development speed.",
    ],
    skills: ["Frontend Engineering", "Software Engineering"],
    programmingLanguages: ["JavaScript", "TypeScript", "ReasonML", "HTML", "CSS"],
    frameworks: ["React.js", "React Native", "ReasonReact"],
    type: "work",
  },
  {
    title: "Junior Frontend Engineer",
    organization: "Ruangguru",
    period: "October 2017 - December 2017",
    employmentType: "Full-time",
    location: "Greater Jakarta Area, Indonesia",
    locationType: "Hybrid",
    details: [
      "Led a team of frontend developers to develop and optimize Ruang Uji's react stacks and deployment. The result was more than 53.86% smaller initial download size (all assets included), 9.52% lower request number, 46.72% faster finish time, 137.10% faster DOMContentLoad time, and 62.49% faster load time than the original angular.js' stacks (2G connection, 256kbps 800ms RTT). I also made subsequent pages load substantially faster by implementing on-point code optimization, aggressive code-splitting, and various images' lazy loading.",
      "Refactored https://ruangguru.com/ assets and code base using IMGIX, AWS S3 bucket, and fastly CDN. The result was a load time speed improvement of more than 300% (from more than 12 seconds average to under 3 seconds) and the advancement of its https://www.webpagetest.org/ average score of B to all A's without sacrificing its assets' apparent quality.",
      "Rewrote and migrated Ruang Uji (https://uji.ruangguru.com) from Angular 1's (AngularJS) stacks to React.js' stacks from scratch. Thus solved the old \"exam event\" problem (e.g., no automatic submission in the background, submission error handler, continuing to the last exam on reload) at Ruang Uji. This project also results in the tech stack's modernization, making it less error-prone.",
      "Automated web apps' bug tracking using sentry (Raven.js) and deployment from Gitlab to AWS S3 and production using Codeship. The result was more precise bug tracking and faster web app integration, deployment, and delivery.",
    ],
    skills: ["Frontend Engineering", "Software Engineering"],
    programmingLanguages: ["JavaScript", "Flow Type", "HTML", "CSS"],
    frameworks: ["React.js"],
    type: "work",
  },
  {
    title: "Certificate of Appreciation: Hijra Group's Exceptional Performer",
    organization: "Hijra Group",
    period: "May 2024",
    details: [
      "Associated with: Engineering Manager - Alami P2P Lending and Hijra Bank Financing at Hijra",
      'Description: Appreciation for "Exceptional Performance" in the performance appraisal cycle 2023, based on Hijra Group\'s CFR 2023.',
    ],
    type: "honor",
  },
  {
    title: "Ruangguru's Chief of The Month: September 2019",
    organization: "Ruangguru",
    period: "September 2019",
    details: [
      "Associated with: Senior Frontend Engineer at Ruangguru",
      "Description: Ruang Guru's Most Performant Employee Award for September 2019",
    ],
    type: "honor",
  },
  {
    title: "Ruangguru's Chief of The Month: August 2018",
    organization: "Ruangguru",
    period: "August 2018",
    details: [
      "Associated with: Frontend Engineer at Ruangguru",
      "Description: Ruang Guru's Most Performant Employee Award for August 2018.",
    ],
    type: "honor",
  },
  {
    title: "Certificate of Completion - System Design Assessment",
    organization: "AlgoExpert",
    period: "December 2021",
    details: ["Credential ID: 524646adaa", "Skills: System Design"],
    links: {
      credential: "https://certificate.algoexpert.io/SE-524646adaa",
    },
    type: "certification",
  },
  {
    title: "Languages",
    organization: "",
    period: "",
    details: [
      "Bahasa Indonesia|Native or bilingual proficiency",
      "English|Full professional proficiency",
      "German|Limited working proficiency",
    ],
    type: "language",
  },
  {
    title: "Bachelor of Engineering (B.Eng.)",
    organization: "Institut Teknologi Bandung",
    period: "July 2005 - July 2011",
    details: ["Field of study: Electrical and Electronics Engineering", "Grade: 3.0"],
    type: "education",
  },
];

export const parseDate = (dateString: string): Date => {
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const [month, year] = dateString.split(" ");
  const monthIndex = months.indexOf(month);
  if (monthIndex === -1) {
    throw new Error(`Invalid month: ${month}`);
  }
  return new Date(parseInt(year), monthIndex);
};

export const calculateDuration = (period: string): number => {
  const [start, end] = period.split(" - ");
  const startDate = parseDate(start);
  const endDate = end === "Present" ? new Date() : parseDate(end);

  // Calculate full months
  const months = (endDate.getFullYear() - startDate.getFullYear()) * 12 + (endDate.getMonth() - startDate.getMonth());

  // Add 1 to include both start and end months
  return months + 1;
};

export const calculateTotalDuration = (periods: { start: Date; end: Date }[]): number => {
  if (periods.length === 0) return 0;

  // Sort periods by start date
  periods.sort((a, b) => a.start.getTime() - b.start.getTime());

  let totalMonths = 0;
  let currentEnd = new Date(0); // Initialize with the earliest possible date

  for (const period of periods) {
    const startDate = period.start > currentEnd ? period.start : currentEnd;
    const endDate = period.end;

    if (startDate < endDate) {
      // Calculate months, always including start and end months
      const monthsDiff =
        (endDate.getFullYear() - startDate.getFullYear()) * 12 + (endDate.getMonth() - startDate.getMonth()) + 1; // Add 1 to include both start and end months

      totalMonths += monthsDiff;
      currentEnd = endDate > currentEnd ? endDate : currentEnd;
    }
  }

  return totalMonths;
};

export const formatDuration = (months: number): string => {
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;

  if (years > 0 && remainingMonths > 0) {
    return `${years} year${years > 1 ? "s" : ""} ${remainingMonths} month${remainingMonths > 1 ? "s" : ""}`;
  } else if (years > 0) {
    return `${years} year${years > 1 ? "s" : ""}`;
  } else {
    return `${remainingMonths} month${remainingMonths > 1 ? "s" : ""}`;
  }
};

export const getTopSkillsLastFiveYears = (data: CVEntry[]): { name: string; duration: number }[] => {
  const fiveYearsAgo = new Date();
  fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);

  const allWorkEntries = data.filter((entry): entry is CVEntry & { type: "work" } => entry.type === "work");

  const skillInfo: {
    [key: string]: { count: number; periods: { start: Date; end: Date }[] };
  } = {};

  allWorkEntries.forEach((entry) => {
    if (!entry.period) return;
    const [startStr, endStr] = entry.period.split(" - ");
    if (!startStr || !endStr) return;
    const start = parseDate(startStr);
    const end = endStr === "Present" ? new Date() : parseDate(endStr);

    entry.skills?.forEach((skill) => {
      if (!skillInfo[skill]) {
        skillInfo[skill] = { count: 0, periods: [] };
      }
      if (end >= fiveYearsAgo) {
        skillInfo[skill].count += 1;
      }
      skillInfo[skill].periods.push({ start, end });
    });
  });

  const skillDurations = Object.entries(skillInfo).map(([name, info]) => ({
    name,
    duration: calculateTotalDuration(info.periods),
    count: info.count,
  }));

  return skillDurations
    .sort((a, b) => b.duration - a.duration) // Sort by duration in descending order
    .slice(0, 10)
    .map(({ name, duration }) => ({ name, duration }));
};

export const getTopLanguagesLastFiveYears = (data: CVEntry[]): { name: string; duration: number }[] => {
  const fiveYearsAgo = new Date();
  fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);

  const allWorkEntries = data.filter((entry): entry is CVEntry & { type: "work" } => entry.type === "work");

  const languageInfo: {
    [key: string]: { count: number; periods: { start: Date; end: Date }[] };
  } = {};

  allWorkEntries.forEach((entry) => {
    if (!entry.period) return;
    const [startStr, endStr] = entry.period.split(" - ");
    if (!startStr || !endStr) return;
    const start = parseDate(startStr);
    const end = endStr === "Present" ? new Date() : parseDate(endStr);

    entry.programmingLanguages?.forEach((lang) => {
      if (!languageInfo[lang]) {
        languageInfo[lang] = { count: 0, periods: [] };
      }
      if (end >= fiveYearsAgo) {
        languageInfo[lang].count += 1;
      }
      languageInfo[lang].periods.push({ start, end });
    });
  });

  const languageDurations = Object.entries(languageInfo).map(([name, info]) => ({
    name,
    duration: calculateTotalDuration(info.periods),
    count: info.count,
  }));

  return languageDurations
    .sort((a, b) => b.duration - a.duration) // Sort by duration in descending order
    .slice(0, 10)
    .map(({ name, duration }) => ({ name, duration }));
};

export const getTopFrameworksLastFiveYears = (data: CVEntry[]): { name: string; duration: number }[] => {
  const fiveYearsAgo = new Date();
  fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);

  const allWorkEntries = data.filter((entry): entry is CVEntry & { type: "work" } => entry.type === "work");

  const frameworkInfo: {
    [key: string]: { count: number; periods: { start: Date; end: Date }[] };
  } = {};

  allWorkEntries.forEach((entry) => {
    if (!entry.period) return;
    const [startStr, endStr] = entry.period.split(" - ");
    if (!startStr || !endStr) return;
    const start = parseDate(startStr);
    const end = endStr === "Present" ? new Date() : parseDate(endStr);

    entry.frameworks?.forEach((framework) => {
      if (!frameworkInfo[framework]) {
        frameworkInfo[framework] = { count: 0, periods: [] };
      }
      if (end >= fiveYearsAgo) {
        frameworkInfo[framework].count += 1;
      }
      frameworkInfo[framework].periods.push({ start, end });
    });
  });

  const frameworkDurations = Object.entries(frameworkInfo).map(([name, info]) => ({
    name,
    duration: calculateTotalDuration(info.periods),
    count: info.count,
  }));

  return frameworkDurations
    .sort((a, b) => b.duration - a.duration) // Sort by duration in descending order
    .slice(0, 10)
    .map(({ name, duration }) => ({ name, duration }));
};

export function getLanguagesAndFrameworks(data: CVEntry[]): {
  languages: { name: string; duration: number }[];
  frameworks: { name: string; duration: number }[];
} {
  const fiveYearsAgo = new Date();
  fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);

  const workEntries = data.filter((entry): entry is CVEntry & { type: "work" } => entry.type === "work");
  const languageInfo: {
    [key: string]: { periods: { start: Date; end: Date }[] };
  } = {};
  const frameworkInfo: {
    [key: string]: { periods: { start: Date; end: Date }[] };
  } = {};

  workEntries.forEach((entry) => {
    if (!entry.period) return;
    const [startStr, endStr] = entry.period.split(" - ");
    if (!startStr || !endStr) return;
    const start = parseDate(startStr);
    const end = endStr === "Present" ? new Date() : parseDate(endStr);

    // Only consider entries that end after or during the last 5 years
    if (end >= fiveYearsAgo) {
      entry.programmingLanguages?.forEach((lang) => {
        if (!languageInfo[lang]) {
          languageInfo[lang] = { periods: [] };
        }
        languageInfo[lang].periods.push({
          start: start < fiveYearsAgo ? fiveYearsAgo : start,
          end,
        });
      });

      entry.frameworks?.forEach((framework) => {
        if (!frameworkInfo[framework]) {
          frameworkInfo[framework] = { periods: [] };
        }
        frameworkInfo[framework].periods.push({
          start: start < fiveYearsAgo ? fiveYearsAgo : start,
          end,
        });
      });
    }
  });

  const languages = Object.entries(languageInfo)
    .map(([name, info]) => ({
      name,
      duration: calculateTotalDuration(info.periods),
    }))
    .sort((a, b) => b.duration - a.duration);

  const frameworks = Object.entries(frameworkInfo)
    .map(([name, info]) => ({
      name,
      duration: calculateTotalDuration(info.periods),
    }))
    .sort((a, b) => b.duration - a.duration);

  return { languages, frameworks };
}
