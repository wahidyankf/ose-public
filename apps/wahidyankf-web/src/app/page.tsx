"use client";

import { Briefcase, FolderOpen, Github, Linkedin, Mail, Star, Code, Package } from "lucide-react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  cvData,
  getTopSkillsLastFiveYears,
  getTopLanguagesLastFiveYears,
  getTopFrameworksLastFiveYears,
  formatDuration,
} from "@/app/data";
import { Navigation } from "@/components/Navigation";
import { useState, useEffect } from "react";
import { filterItems } from "@/utils/search";
import { SearchComponent } from "@/components/SearchComponent";
import { HighlightText } from "@/components/HighlightText";
import { Suspense } from "react";
import { parseMarkdownLinks } from "@/utils/markdown";

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialSearchTerm = searchParams.get("search") || "";
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);

  const aboutMe = cvData.find((entry) => entry.type === "about");
  const topSkills = getTopSkillsLastFiveYears(cvData);
  const topLanguages = getTopLanguagesLastFiveYears(cvData);
  const topFrameworks = getTopFrameworksLastFiveYears(cvData);

  const filteredSkills = filterItems(
    topSkills.map((item) => ({ ...item, duration: item.duration.toString() })),
    searchTerm,
    ["name"],
  );
  const filteredLanguages = filterItems(
    topLanguages.map((item) => ({
      ...item,
      duration: item.duration.toString(),
    })),
    searchTerm,
    ["name"],
  );
  const filteredFrameworks = filterItems(
    topFrameworks.map((item) => ({
      ...item,
      duration: item.duration.toString(),
    })),
    searchTerm,
    ["name"],
  );

  useEffect(() => {
    setSearchTerm(initialSearchTerm);
  }, [initialSearchTerm]);

  const updateURL = (term: string) => {
    const newURL = term ? `/?search=${encodeURIComponent(term)}` : "/";
    router.push(newURL, { scroll: false });
  };

  const filteredAboutMe = aboutMe
    ? {
        ...aboutMe,
        details:
          filterItems([{ details: aboutMe.details.join("\n") }], searchTerm, ["details"])[0]?.details.split("\n") || [],
      }
    : null;

  const handleItemClick = (item: string) => {
    router.push(`/cv?search=${encodeURIComponent(item)}&scrollTop=true`);
  };

  return (
    <main className="flex min-h-screen flex-col bg-gray-900 p-4 pb-20 text-green-400 sm:p-8 md:p-12 lg:ml-80 lg:p-16 lg:pb-0">
      <Navigation />
      <div className="mx-auto w-full max-w-4xl flex-grow">
        <h1 className="mb-8 text-center text-2xl font-bold text-yellow-400 sm:text-3xl md:text-4xl">
          Welcome to My Portfolio
        </h1>

        <SearchComponent
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          updateURL={updateURL}
          placeholder="Search skills, languages, or frameworks..."
        />

        {/* About Me section */}
        <section className="mb-8 rounded-lg border border-green-400 p-4">
          <h2 className="mb-4 text-xl text-yellow-400 sm:text-2xl md:text-3xl">About Me</h2>
          {filteredAboutMe && filteredAboutMe.details.length > 0 ? (
            filteredAboutMe.details.map((detail: string, index: number) => (
              <p key={index} className="mb-4 text-green-300">
                {parseMarkdownLinks(detail, searchTerm)}
              </p>
            ))
          ) : (
            <p className="text-center text-yellow-400">No matching content in the About Me section.</p>
          )}
        </section>

        {/* Skills & Expertise section */}
        <section className="mb-8 rounded-lg border border-green-400 p-4">
          <h2 className="mb-4 text-xl text-yellow-400 sm:text-2xl md:text-3xl">Skills & Expertise</h2>
          <div className="space-y-4">
            {/* Top Skills */}
            <div>
              <h3 className="mb-2 text-lg font-semibold text-green-300">Top Skills Used in The Last 5 Years</h3>
              <div className="flex flex-wrap gap-2">
                {filteredSkills.map(({ name, duration }) => (
                  <button
                    key={name}
                    onClick={() => handleItemClick(name)}
                    className="group flex items-center rounded-md bg-gray-800 px-2 py-1 text-sm text-green-400 transition-colors duration-200 hover:bg-gray-700"
                  >
                    <Star className="mr-2 h-4 w-4 text-yellow-400" />
                    <span className="mr-2 transition-colors duration-200 group-hover:text-white">
                      <HighlightText text={name} searchTerm={searchTerm} />
                    </span>
                    <span className="text-xs text-green-300 transition-colors duration-200 group-hover:text-white">
                      ({formatDuration(Number(duration))})
                    </span>
                  </button>
                ))}
              </div>
            </div>
            {/* Top Programming Languages */}
            <div>
              <h3 className="mb-2 text-lg font-semibold text-green-300">
                Top Programming Languages Used in The Last 5 Years
              </h3>
              <div className="flex flex-wrap gap-2">
                {filteredLanguages.map(({ name }) => (
                  <button
                    key={name}
                    onClick={() => handleItemClick(name)}
                    className="group flex items-center rounded-md bg-gray-800 px-2 py-1 text-sm text-green-400 transition-colors duration-200 hover:bg-gray-700"
                  >
                    <Code className="mr-2 h-4 w-4 text-yellow-400" />
                    <span className="transition-colors duration-200 group-hover:text-white">
                      <HighlightText text={name} searchTerm={searchTerm} />
                    </span>
                  </button>
                ))}
              </div>
            </div>
            {/* Top Frameworks & Libraries */}
            <div>
              <h3 className="mb-2 text-lg font-semibold text-green-300">
                Top Frameworks & Libraries Used in The Last 5 Years
              </h3>
              <div className="flex flex-wrap gap-2">
                {filteredFrameworks.map(({ name }) => (
                  <button
                    key={name}
                    onClick={() => handleItemClick(name)}
                    className="group flex items-center rounded-md bg-gray-800 px-2 py-1 text-sm text-green-400 transition-colors duration-200 hover:bg-gray-700"
                  >
                    <Package className="mr-2 h-4 w-4 text-yellow-400" />
                    <span className="transition-colors duration-200 group-hover:text-white">
                      <HighlightText text={name} searchTerm={searchTerm} />
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Quick Links section */}
        <section className="mb-8 rounded-lg border border-green-400 p-4">
          <h2 className="mb-4 text-xl text-yellow-400 sm:text-2xl md:text-3xl">Quick Links</h2>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/cv"
              className="flex items-center text-yellow-400 transition-colors duration-200 hover:text-green-400"
            >
              <Briefcase className="mr-2 h-5 w-5" />
              View My CV
            </Link>
            <Link
              href="/personal-projects"
              className="flex items-center text-yellow-400 transition-colors duration-200 hover:text-green-400"
            >
              <FolderOpen className="mr-2 h-5 w-5" />
              Browse My Personal Projects
            </Link>
          </div>
        </section>

        {/* Connect With Me section */}
        <section className="mb-8 rounded-lg border border-green-400 p-4">
          <h2 className="mb-4 text-xl text-yellow-400 sm:text-2xl md:text-3xl">Connect With Me</h2>
          <div className="flex flex-wrap gap-4">
            {aboutMe?.links &&
              Object.entries(aboutMe.links).map(([key, value]) => (
                <a
                  key={key}
                  href={value}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-yellow-400 transition-colors duration-200 hover:text-green-400"
                >
                  {key === "github" && <Github className="mr-2 h-5 w-5" />}
                  {key === "linkedin" && <Linkedin className="mr-2 h-5 w-5" />}
                  {key === "email" && <Mail className="mr-2 h-5 w-5" />}
                  {key.charAt(0).toUpperCase() + key.slice(1)}
                </a>
              ))}
          </div>
        </section>
      </div>
    </main>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HomeContent />
    </Suspense>
  );
}
