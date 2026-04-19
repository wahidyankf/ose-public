"use client";

import { Navigation } from "@/components/Navigation";
import { filterItems } from "@/utils/search";
import { Github, Globe, Youtube } from "lucide-react";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SearchComponent } from "@/components/SearchComponent";
import { HighlightText } from "@/components/HighlightText";

type Project = {
  title: string;
  description: string;
  details: string[];
  links: {
    [key: string]: string;
  };
};

const projects: Project[] = [
  {
    title: "AyoKoding",
    description:
      "A website to learn about software engineering through books, blogs, and YouTube videos. Created to learn in public and give back to the community.",
    details: [
      "Comprehensive learning resources for software engineering",
      "Public learning platform to share knowledge",
      "Includes a YouTube channel for video content",
    ],
    links: {
      repository: "https://github.com/organiclever/ayokoding",
      website: "https://ayokoding.com/",
      YouTube: "https://www.youtube.com/@AyoKoding",
    },
  },
  {
    title: "Organic Lever",
    description: "A web application focused on team and personal productivity (in progress).",
    details: [
      "Aims to improve team collaboration",
      "Enhances personal productivity",
      "Web-based application for easy access",
    ],
    links: {
      website: "http://organiclever.com/",
    },
  },
  {
    title: "The Organic",
    description: "A repository to showcase open source projects and toy-projects.",
    details: [
      "Collection of various open source contributions",
      "Includes experimental and learning projects",
      "Demonstrates diverse coding skills and interests",
    ],
    links: {
      repository: "https://github.com/organiclever/the-organic",
    },
  },
];

const LinkIcon = ({ type }: { type: string }) => {
  switch (type.toLowerCase()) {
    case "repository":
      return <Github className="mr-1 inline-block h-4 w-4" />;
    case "youtube":
      return <Youtube className="mr-1 inline-block h-4 w-4" />;
    default:
      return <Globe className="mr-1 inline-block h-4 w-4" />;
  }
};

function ProjectsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialSearchTerm = searchParams.get("search") || "";
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);

  useEffect(() => {
    setSearchTerm(initialSearchTerm);
  }, [initialSearchTerm]);

  const updateURL = (term: string) => {
    const newURL = term ? `/personal-projects?search=${encodeURIComponent(term)}` : "/personal-projects";
    router.push(newURL, { scroll: false });
  };

  const filteredProjects = filterItems(projects, searchTerm, ["title", "description", "details", "links"]);

  return (
    <div className="mx-auto w-full max-w-4xl flex-grow">
      <h1 className="mb-8 text-center text-2xl font-bold text-yellow-400 sm:text-3xl md:text-4xl">Personal Projects</h1>

      <SearchComponent
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        updateURL={updateURL}
        placeholder="Search projects..."
      />

      {filteredProjects.length > 0 ? (
        filteredProjects.map((project, index) => (
          <div id={`project-${index}`} key={index} className="mb-8 rounded-lg border border-green-400 p-4">
            <h2 className="mb-2 text-xl text-yellow-400 sm:text-2xl md:text-3xl">
              <HighlightText text={project.title} searchTerm={searchTerm} />
            </h2>
            <p className="mb-2 text-green-300">
              <HighlightText text={project.description} searchTerm={searchTerm} />
            </p>
            <ul className="mb-2 list-inside list-disc text-green-200">
              {project.details.map((detail: string, index: number) => (
                <li key={index} className="mb-1">
                  <HighlightText text={detail} searchTerm={searchTerm} />
                </li>
              ))}
            </ul>
            <div className="mt-4">
              {Object.entries(project.links).map(([key, value]) => (
                <a
                  key={key}
                  href={value as string}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mr-4 inline-flex items-center text-yellow-400 underline decoration-yellow-400 transition-all duration-200 hover:text-green-400 hover:decoration-green-400"
                >
                  <LinkIcon type={key} />
                  <HighlightText text={key.charAt(0).toUpperCase() + key.slice(1)} searchTerm={searchTerm} />
                </a>
              ))}
            </div>
          </div>
        ))
      ) : (
        <p className="text-center text-yellow-400">No projects found matching your search.</p>
      )}
    </div>
  );
}

export default function Projects() {
  return (
    <main className="flex min-h-screen flex-col bg-gray-900 p-4 pb-20 text-green-400 sm:p-8 md:p-12 lg:ml-80 lg:p-16 lg:pb-0">
      <Navigation />
      <div className="mx-auto w-full max-w-4xl flex-grow">
        <Suspense fallback={<div>Loading...</div>}>
          <ProjectsContent />
        </Suspense>
      </div>
    </main>
  );
}
