import { describe, expect, it } from "vitest";
import { resolveLessonPathContext } from "@/features/learning-progress/core/lesson-path-context";
import { manifestFixture } from "../course-paths/manifest-fixture";

const softwareEngineerPathId = "careers/immediately-effective/software-engineer";

const softwareEngineer = manifestFixture({
  pathId: softwareEngineerPathId,
  courses: ["extending-neovim", "just-enough-lua"],
});

const accounting = manifestFixture({
  pathId: "skills/conventional-accounting",
  courses: ["sql-essentials"],
});

const interviewReady = manifestFixture({
  pathId: "careers/interview-ready/software-engineer",
  phases: [
    {
      id: "foundations",
      title: "Foundations",
      kind: "core",
      outcome: { can: "start the path" },
      courses: ["just-enough-python"],
    },
    { id: "depth", title: "Depth", kind: "extension", courses: ["capstone-secure-service"] },
  ],
});

const manifests = [softwareEngineer, accounting, interviewReady];

describe("resolveLessonPathContext", () => {
  it("resolves the URL path when its manifest contains the course", () => {
    expect(
      resolveLessonPathContext({
        pathParam: softwareEngineerPathId,
        manifests,
        courseId: "extending-neovim",
        lastPath: null,
      }),
    ).toEqual({ manifest: softwareEngineer, source: "url" });
  });

  it("resolves the URL path for a course in an extension phase", () => {
    expect(
      resolveLessonPathContext({
        pathParam: "careers/interview-ready/software-engineer",
        manifests,
        courseId: "capstone-secure-service",
        lastPath: null,
      }),
    ).toEqual({ manifest: interviewReady, source: "url" });
  });

  it("returns null for an unknown URL path", () => {
    expect(
      resolveLessonPathContext({
        pathParam: "careers/does-not-exist/software-engineer",
        manifests,
        courseId: "extending-neovim",
        lastPath: null,
      }),
    ).toBeNull();
  });

  it("returns null, without falling back to memory, when the URL path does not contain the course", () => {
    expect(
      resolveLessonPathContext({
        pathParam: accounting.pathId,
        manifests,
        courseId: "extending-neovim",
        lastPath: { pathId: softwareEngineerPathId, courseId: "extending-neovim" },
      }),
    ).toBeNull();
  });

  it("remembers the last path for the same course when the URL has no path", () => {
    expect(
      resolveLessonPathContext({
        pathParam: null,
        manifests,
        courseId: "extending-neovim",
        lastPath: { pathId: softwareEngineerPathId, courseId: "extending-neovim" },
      }),
    ).toEqual({ manifest: softwareEngineer, source: "remembered" });
  });

  it("ignores the remembered path of another course", () => {
    expect(
      resolveLessonPathContext({
        pathParam: null,
        manifests,
        courseId: "extending-neovim",
        lastPath: { pathId: softwareEngineerPathId, courseId: "just-enough-lua" },
      }),
    ).toBeNull();
  });

  it("ignores a remembered path that no manifest has", () => {
    expect(
      resolveLessonPathContext({
        pathParam: null,
        manifests,
        courseId: "extending-neovim",
        lastPath: { pathId: "careers/does-not-exist/software-engineer", courseId: "extending-neovim" },
      }),
    ).toBeNull();
  });

  it("ignores a remembered path whose manifest does not contain the course", () => {
    expect(
      resolveLessonPathContext({
        pathParam: null,
        manifests,
        courseId: "extending-neovim",
        lastPath: { pathId: accounting.pathId, courseId: "extending-neovim" },
      }),
    ).toBeNull();
  });

  it("returns null when there is neither a URL path nor a remembered path", () => {
    expect(
      resolveLessonPathContext({ pathParam: null, manifests, courseId: "extending-neovim", lastPath: null }),
    ).toBeNull();
  });
});
