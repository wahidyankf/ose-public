"use client";

import { Navigation } from "@/components/Navigation";
import { filterItems } from "@/utils/search";
import {
  Award,
  Briefcase,
  FileCheck,
  GithubIcon,
  Globe,
  GraduationCap,
  Languages,
  Linkedin,
  Mail,
  Star,
  ToggleLeft,
  ToggleRight,
  User,
  Code,
  Package,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  CVEntry,
  cvData,
  parseDate,
  calculateDuration,
  formatDuration,
  calculateTotalDuration,
  getTopSkillsLastFiveYears,
  getTopLanguagesLastFiveYears,
  getTopFrameworksLastFiveYears,
} from "../data";
import { SearchComponent } from "@/components/SearchComponent";
import { HighlightText } from "@/components/HighlightText";
import { Suspense } from "react";
import { parseMarkdownLinks } from "@/utils/markdown";

// Update the type definition for topSkills, topLanguages, and topFrameworks
type TopItem = { name: string; duration: number };

// Add this new component
const ClickableItem = ({
  name,
  duration,
  icon,
  searchTerm,
  handleItemClick,
  showDuration = true,
}: {
  name: string;
  duration: number;
  icon: React.ReactNode;
  searchTerm: string;
  handleItemClick: (item: string) => void;
  showDuration?: boolean;
}) => (
  <button
    onClick={() => handleItemClick(name)}
    className="group flex w-full items-center justify-between rounded-md bg-gray-800 px-2 py-1 text-sm text-green-400 transition-colors duration-200 hover:bg-gray-700"
  >
    <div className="flex items-center">
      {icon}
      <span className="transition-colors duration-200 group-hover:text-white">
        <HighlightText text={name} searchTerm={searchTerm} />
      </span>
    </div>
    {showDuration && (
      <span className="text-xs text-green-300 transition-colors duration-200 group-hover:text-white">
        (
        <HighlightText text={formatDuration(duration)} searchTerm={searchTerm} />)
      </span>
    )}
  </button>
);

// Update the DynamicSkillsComponent
const DynamicSkillsComponent = ({
  skills,
  languages,
  frameworks,
  searchTerm,
  handleItemClick,
}: {
  skills: TopItem[];
  languages: TopItem[];
  frameworks: TopItem[];
  searchTerm: string;
  handleItemClick: (item: string) => void;
}) => (
  <>
    <h4 className="mt-4 mb-2 text-lg font-semibold text-yellow-400">Top Skills Used in The Last 5 Years</h4>
    <ul className="mb-4 grid list-none grid-cols-1 gap-2 sm:grid-cols-2">
      {skills.map(({ name, duration }, index) => (
        <li key={index}>
          <ClickableItem
            name={name}
            duration={duration}
            icon={<Star className="mr-2 h-4 w-4 text-yellow-400" />}
            searchTerm={searchTerm}
            handleItemClick={handleItemClick}
          />
        </li>
      ))}
    </ul>
    <h4 className="mb-2 text-lg font-semibold text-yellow-400">Top Programming Languages Used in The Last 5 Years</h4>
    <ul className="mb-4 grid list-none grid-cols-1 gap-2 sm:grid-cols-2">
      {languages.map(({ name }, index) => (
        <li key={index}>
          <ClickableItem
            name={name}
            duration={0}
            icon={<Code className="mr-2 h-4 w-4 text-yellow-400" />}
            searchTerm={searchTerm}
            handleItemClick={handleItemClick}
            showDuration={false}
          />
        </li>
      ))}
    </ul>
    <h4 className="mb-2 text-lg font-semibold text-yellow-400">Top Frameworks & Libraries Used in The Last 5 Years</h4>
    <ul className="grid list-none grid-cols-1 gap-2 sm:grid-cols-2">
      {frameworks.map(({ name }, index) => (
        <li key={index}>
          <ClickableItem
            name={name}
            duration={0}
            icon={<Package className="mr-2 h-4 w-4 text-yellow-400" />}
            searchTerm={searchTerm}
            handleItemClick={handleItemClick}
            showDuration={false}
          />
        </li>
      ))}
    </ul>
  </>
);

// Update the CVEntryComponent
const CVEntryComponent = ({
  entry,
  searchTerm,
  topSkills,
  topLanguages,
  topFrameworks,
  handleItemClick,
}: {
  entry: CVEntry;
  searchTerm: string;
  topSkills?: TopItem[];
  topLanguages?: TopItem[];
  topFrameworks?: TopItem[];
  handleItemClick: (item: string) => void;
}) => (
  <div className="mb-4 rounded-lg border border-green-400 p-4">
    <h3 className="mb-2 text-lg text-yellow-400 sm:text-xl md:text-2xl">
      <HighlightText text={entry.title} searchTerm={searchTerm} />
    </h3>
    {entry.type === "education" && entry.organization && (
      <p className="mb-2 text-green-300">
        <HighlightText text={entry.organization} searchTerm={searchTerm} />
      </p>
    )}
    {entry.period && (
      <p className="mb-2 text-green-300">
        <HighlightText text={entry.period} searchTerm={searchTerm} />
        {entry.type === "work" && (
          <span className="ml-2 text-yellow-400">
            (
            <HighlightText text={formatDuration(calculateDuration(entry.period))} searchTerm={searchTerm} />)
          </span>
        )}
      </p>
    )}
    {entry.type === "work" && entry.employmentType && entry.location && entry.locationType && (
      <p className="mb-2 text-green-200">
        <HighlightText
          text={`${entry.employmentType} | ${entry.location} | ${entry.locationType}`}
          searchTerm={searchTerm}
        />
      </p>
    )}
    {entry.type === "work" ? (
      <ul className="mb-2 list-inside list-disc text-green-200">
        {entry.details.map((detail, index) => (
          <li key={index} className="mb-1">
            {parseMarkdownLinks(detail, searchTerm)}
          </li>
        ))}
      </ul>
    ) : (
      entry.details.map((detail, index) => (
        <p key={index} className="mb-2 text-green-200">
          {parseMarkdownLinks(detail, searchTerm)}
        </p>
      ))
    )}
    {entry.type === "work" && (
      <>
        {entry.skills && (
          <div className="mt-2">
            <h4 className="text-md font-semibold text-yellow-400">Skills:</h4>
            <ul className="mb-2 grid list-none grid-cols-2 gap-2">
              {entry.skills.map((skill, index) => (
                <li key={index}>
                  <ClickableItem
                    name={skill}
                    duration={0}
                    icon={<Star className="mr-2 h-4 w-4 text-yellow-400" />}
                    searchTerm={searchTerm}
                    handleItemClick={handleItemClick}
                    showDuration={false}
                  />
                </li>
              ))}
            </ul>
          </div>
        )}
        {entry.programmingLanguages && (
          <div className="mt-2">
            <h4 className="text-md font-semibold text-yellow-400">Programming Languages:</h4>
            <ul className="mb-2 grid list-none grid-cols-2 gap-2">
              {entry.programmingLanguages.map((lang, index) => (
                <li key={index}>
                  <ClickableItem
                    name={lang}
                    duration={0}
                    icon={<Code className="mr-2 h-4 w-4 text-yellow-400" />}
                    searchTerm={searchTerm}
                    handleItemClick={handleItemClick}
                    showDuration={false}
                  />
                </li>
              ))}
            </ul>
          </div>
        )}
        {entry.frameworks && (
          <div className="mt-2">
            <h4 className="text-md font-semibold text-yellow-400">Frameworks:</h4>
            <ul className="mb-2 grid list-none grid-cols-2 gap-2">
              {entry.frameworks.map((framework, index) => (
                <li key={index}>
                  <ClickableItem
                    name={framework}
                    duration={0}
                    icon={<Package className="mr-2 h-4 w-4 text-yellow-400" />}
                    searchTerm={searchTerm}
                    handleItemClick={handleItemClick}
                    showDuration={false}
                  />
                </li>
              ))}
            </ul>
          </div>
        )}
      </>
    )}
    {entry.type === "about" && topSkills && topLanguages && topFrameworks && (
      <DynamicSkillsComponent
        skills={topSkills}
        languages={topLanguages}
        frameworks={topFrameworks}
        searchTerm={searchTerm}
        handleItemClick={handleItemClick}
      />
    )}
    {entry.links && (
      <div className="mt-4 flex flex-wrap gap-4">
        {Object.entries(entry.links).map(([key, value]) => (
          <a
            key={key}
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center text-yellow-400 transition-colors duration-200 hover:text-green-400"
          >
            {key === "github" && <GithubIcon className="mr-1 h-4 w-4" />}
            {key === "githubOrg" && <GithubIcon className="mr-1 h-4 w-4" />}
            {key === "linkedin" && <Linkedin className="mr-1 h-4 w-4" />}
            {key === "website" && <Globe className="mr-1 h-4 w-4" />}
            {key === "email" && <Mail className="mr-1 h-4 w-4" />}
            {key === "credential" && <FileCheck className="mr-1 h-4 w-4" />}
            <HighlightText
              text={
                key === "github"
                  ? "GitHub"
                  : key === "githubOrg"
                    ? "GitHub (Org)"
                    : key === "linkedin"
                      ? "LinkedIn"
                      : key === "website"
                        ? "Website"
                        : key === "email"
                          ? "Email"
                          : key === "credential"
                            ? "View Credential"
                            : key
              }
              searchTerm={searchTerm}
            />
          </a>
        ))}
      </div>
    )}
  </div>
);

const StickyHeader = ({ children }: { children: React.ReactNode }) => (
  <div className="sticky top-0 z-10 mb-4 bg-gray-900 py-2">{children}</div>
);

// Update the CVSection component
const CVSection = ({
  title,
  entries,
  icon,
  searchTerm,
  topSkills,
  topLanguages,
  topFrameworks,
  handleItemClick,
}: {
  title: string;
  entries: CVEntry[];
  icon: React.ReactNode;
  searchTerm: string;
  topSkills?: TopItem[];
  topLanguages?: TopItem[];
  topFrameworks?: TopItem[];
  handleItemClick: (item: string) => void;
}) => {
  return (
    <div className="mb-8">
      <StickyHeader>
        <h2 className="flex items-center text-xl text-yellow-400 sm:text-2xl md:text-3xl">
          {icon}
          <span className="ml-2">
            <HighlightText text={title} searchTerm={searchTerm} />
          </span>
        </h2>
      </StickyHeader>
      {entries.map((entry, index) => (
        <CVEntryComponent
          key={index}
          entry={entry}
          searchTerm={searchTerm}
          topSkills={topSkills}
          topLanguages={topLanguages}
          topFrameworks={topFrameworks}
          handleItemClick={handleItemClick}
        />
      ))}
    </div>
  );
};

const isWithinLastFiveYears = (endDate: string): boolean => {
  const date = endDate === "Present" ? new Date() : parseDate(endDate);
  const fiveYearsAgo = new Date();
  fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);
  return date >= fiveYearsAgo;
};

const WorkExperienceSection = ({
  entries,
  searchTerm,
  showRecentOnly,
  setShowRecentOnly,
  handleItemClick,
}: {
  entries: CVEntry[];
  searchTerm: string;
  showRecentOnly: boolean;
  setShowRecentOnly: (value: boolean) => void;
  handleItemClick: (item: string) => void;
}) => {
  const groupedEntries = entries.reduce(
    (acc, entry) => {
      const bucket = (acc[entry.organization] ??= []);
      bucket.push(entry);
      return acc;
    },
    {} as Record<string, CVEntry[]>,
  );

  // Sort entries within each organization by date (most recent first)
  Object.values(groupedEntries).forEach((orgEntries) => {
    orgEntries.sort((a, b) => {
      const dateA = parseDate(a.period.split(" - ")[0]);
      const dateB = parseDate(b.period.split(" - ")[0]);
      return dateB.getTime() - dateA.getTime();
    });
  });

  // Sort organizations by the most recent job
  const sortedOrganizations = Object.keys(groupedEntries).sort((a, b) => {
    const dateA = parseDate(groupedEntries[a][0].period.split(" - ")[0]);
    const dateB = parseDate(groupedEntries[b][0].period.split(" - ")[0]);
    return dateB.getTime() - dateA.getTime();
  });

  // Calculate total duration for each organization and overall
  const organizationDurations = sortedOrganizations.reduce(
    (acc, org) => {
      const periods = groupedEntries[org].map((entry) => ({
        start: parseDate(entry.period.split(" - ")[0]),
        end: entry.period.split(" - ")[1] === "Present" ? new Date() : parseDate(entry.period.split(" - ")[1]),
      }));
      const totalMonths = calculateTotalDuration(periods);
      acc[org] = formatDuration(totalMonths);
      return acc;
    },
    {} as Record<string, string>,
  );

  const allPeriods = entries.map((entry) => ({
    start: parseDate(entry.period.split(" - ")[0]),
    end: entry.period.split(" - ")[1] === "Present" ? new Date() : parseDate(entry.period.split(" - ")[1]),
  }));
  const totalWorkExperience = formatDuration(calculateTotalDuration(allPeriods));

  const filteredOrganizations = sortedOrganizations.filter((org) =>
    groupedEntries[org].some((entry) => {
      const [, endDate] = entry.period.split(" - ");
      return !showRecentOnly || isWithinLastFiveYears(endDate);
    }),
  );

  return (
    <div className="mb-8">
      <StickyHeader>
        <div className="flex items-center justify-between">
          <h2 className="flex items-center text-xl text-yellow-400 sm:text-2xl md:text-3xl">
            <Briefcase className="mr-2 h-6 w-6" />
            <HighlightText text="Work Experience" searchTerm={searchTerm} />
          </h2>
          <div className="flex items-center">
            <span className="mr-2 text-sm text-green-300">Show recent only (≤5 years)</span>
            <button
              onClick={() => setShowRecentOnly(!showRecentOnly)}
              className="text-yellow-400 transition-colors duration-200 hover:text-green-400"
            >
              {showRecentOnly ? <ToggleRight className="h-6 w-6" /> : <ToggleLeft className="h-6 w-6" />}
            </button>
          </div>
        </div>
        <div className="mt-2 text-sm text-green-300">
          Total: <HighlightText text={totalWorkExperience} searchTerm={searchTerm} />
        </div>
      </StickyHeader>
      {filteredOrganizations.map((organization) => (
        <div key={organization} className="mb-6 rounded-lg border border-green-400 p-4">
          <h3 className="mb-2 flex items-center justify-between text-lg text-yellow-400 sm:text-xl md:text-2xl">
            <span>
              <HighlightText text={organization} searchTerm={searchTerm} />
            </span>
            <span className="text-sm text-green-300">
              Total: <HighlightText text={organizationDurations[organization]} searchTerm={searchTerm} />
            </span>
          </h3>
          {groupedEntries[organization]
            .filter((entry) => {
              const [, endDate] = entry.period.split(" - ");
              return !showRecentOnly || isWithinLastFiveYears(endDate);
            })
            .map((entry, index) => (
              <CVEntryComponent key={index} entry={entry} searchTerm={searchTerm} handleItemClick={handleItemClick} />
            ))}
        </div>
      ))}
    </div>
  );
};

// In the main CV component, update the type of topSkills
function CVContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialSearchTerm = searchParams.get("search") || "";
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [showRecentOnly, setShowRecentOnly] = useState(false);

  useEffect(() => {
    setSearchTerm(initialSearchTerm);
  }, [initialSearchTerm]);

  useEffect(() => {
    const shouldScrollTop = searchParams.get("scrollTop") === "true";
    if (shouldScrollTop) {
      window.scrollTo(0, 0);
      // Remove the scrollTop parameter from the URL
      const newURL = new URL(window.location.href);
      newURL.searchParams.delete("scrollTop");
      router.replace(newURL.toString(), { scroll: false });
    }
  }, [searchParams, router]);

  const updateURL = (term: string) => {
    const newURL = term ? `/cv?search=${encodeURIComponent(term)}` : "/cv";
    router.push(newURL, { scroll: false });
  };

  const handleItemClick = (item: string) => {
    setSearchTerm(item);
    updateURL(item);
    window.scrollTo(0, 0);
  };

  const filteredEntries =
    filterItems(cvData, searchTerm, [
      "title",
      "organization",
      "details",
      "skills",
      "programmingLanguages",
      "frameworks",
    ]) || []; // Provide an empty array as fallback

  const topSkills = getTopSkillsLastFiveYears(cvData);
  const topLanguages = getTopLanguagesLastFiveYears(cvData);
  const topFrameworks = getTopFrameworksLastFiveYears(cvData);

  const aboutEntry = filteredEntries.find((entry) => entry.type === "about") || null;
  const workEntries = filteredEntries.filter((entry) => entry.type === "work");
  const honorEntries = filteredEntries.filter((entry) => entry.type === "honor");
  const licenseEntries = filteredEntries.filter((entry) => entry.type === "certification");
  const languageEntries = filteredEntries.filter((entry) => entry.type === "language");
  const educationEntries = filteredEntries.filter((entry) => entry.type === "education");

  return (
    <main className="flex min-h-screen flex-col bg-gray-900 p-4 pb-20 text-green-400 sm:p-8 md:p-12 lg:ml-80 lg:p-16 lg:pb-0">
      <Navigation />
      <div className="mx-auto w-full max-w-4xl flex-grow">
        <h1 className="mb-8 text-center text-2xl font-bold text-yellow-400 sm:text-3xl md:text-4xl">
          Curriculum Vitae
        </h1>

        <SearchComponent
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          updateURL={updateURL}
          placeholder="Search CV entries..."
        />

        {filteredEntries.length > 0 ? (
          <>
            {aboutEntry && (
              <div id="highlights">
                <CVSection
                  title="Highlights"
                  entries={[aboutEntry]}
                  icon={<User className="h-6 w-6" />}
                  searchTerm={searchTerm}
                  topSkills={topSkills}
                  topLanguages={topLanguages}
                  topFrameworks={topFrameworks}
                  handleItemClick={handleItemClick}
                />
              </div>
            )}
            <div id="work">
              <WorkExperienceSection
                entries={workEntries}
                searchTerm={searchTerm}
                showRecentOnly={showRecentOnly}
                setShowRecentOnly={setShowRecentOnly}
                handleItemClick={handleItemClick}
              />
            </div>
            <div id="honors">
              <CVSection
                title="Honors & Awards"
                entries={honorEntries}
                icon={<Award className="h-6 w-6" />}
                searchTerm={searchTerm}
                handleItemClick={handleItemClick}
              />
            </div>
            <div id="licenses">
              <CVSection
                title="Licenses & Certifications"
                entries={licenseEntries}
                icon={<FileCheck className="h-6 w-6" />}
                searchTerm={searchTerm}
                handleItemClick={handleItemClick}
              />
            </div>
            {languageEntries.length > 0 && (
              <div id="languages">
                <CVSection
                  title="Languages"
                  entries={languageEntries}
                  icon={<Languages className="h-6 w-6" />}
                  searchTerm={searchTerm}
                  handleItemClick={handleItemClick}
                />
              </div>
            )}
            <div id="education">
              <CVSection
                title="Education"
                entries={educationEntries}
                icon={<GraduationCap className="h-6 w-6" />}
                searchTerm={searchTerm}
                handleItemClick={handleItemClick}
              />
            </div>
          </>
        ) : (
          <p className="text-center text-yellow-400">No CV entries found matching your search.</p>
        )}
      </div>
    </main>
  );
}

export default function CV() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CVContent />
    </Suspense>
  );
}
