import { describe, it, expect } from "vitest";
import {
  parseDate,
  calculateDuration,
  formatDuration,
  calculateTotalDuration,
  getTopSkillsLastFiveYears,
  CVEntry,
} from "./data";

describe("data.ts functions", () => {
  describe("parseDate", () => {
    it("should correctly parse a date string", () => {
      const result = parseDate("January 2020");
      expect(result).toEqual(new Date(2020, 0));
    });

    it("should throw an error for invalid month", () => {
      expect(() => parseDate("InvalidMonth 2020")).toThrowError("Invalid month: InvalidMonth");
    });
  });

  describe("calculateDuration", () => {
    it("should calculate duration correctly", () => {
      const result = calculateDuration("January 2020 - December 2020");
      expect(result).toBe(12);
    });

    it('should handle "Present" as end date', () => {
      const result = calculateDuration("January 2020 - Present");
      expect(result).toBeGreaterThan(12);
    });
  });

  describe("formatDuration", () => {
    it("should format duration correctly for years and months", () => {
      expect(formatDuration(15)).toBe("1 year 3 months");
    });

    it("should format duration correctly for only years", () => {
      expect(formatDuration(24)).toBe("2 years");
    });

    it("should format duration correctly for only months", () => {
      expect(formatDuration(5)).toBe("5 months");
    });
  });

  describe("calculateTotalDuration", () => {
    it("should calculate total duration correctly for the entire work experience, ignoring overlaps and counting partial months", () => {
      const periods = [
        { start: new Date(2017, 9, 1), end: new Date() }, // October 2017 to present
      ];
      const result = calculateTotalDuration(periods);
      const currentDate = new Date();
      const expectedMonths = (currentDate.getFullYear() - 2017) * 12 + (currentDate.getMonth() - 9) + 1; // +1 to include both start and end months
      expect(result).toBe(expectedMonths);
    });

    it("should count October 2017 - December 2017 as 3 months (Junior Frontend Engineer)", () => {
      const periods = [
        { start: new Date(2017, 9, 1), end: new Date(2017, 11, 31) }, // October 1, 2017 to December 31, 2017
      ];
      const result = calculateTotalDuration(periods);
      expect(result).toBe(3);
    });

    it("should handle overlapping periods correctly", () => {
      const periods = [
        { start: new Date(2020, 0, 1), end: new Date(2020, 11, 31) }, // Jan 2020 to Dec 2020
        { start: new Date(2020, 6, 1), end: new Date(2021, 5, 30) }, // Jul 2020 to Jun 2021
      ];
      const result = calculateTotalDuration(periods);
      expect(result).toBe(19); // Should be 19 months (Jan 2020 to Jul 2021, inclusive)
    });

    it("should return 0 for empty periods", () => {
      expect(calculateTotalDuration([])).toBe(0);
    });

    it("should count July 2022 - December 2022 as 6 months", () => {
      const periods = [
        { start: new Date(2022, 6, 1), end: new Date(2022, 11, 31) }, // July 1, 2022 to December 31, 2022
      ];
      const result = calculateTotalDuration(periods);
      expect(result).toBe(6);
    });
  });

  describe("getTopSkillsLastFiveYears", () => {
    it("should return top skills from the last five years", () => {
      const mockData: CVEntry[] = [
        {
          title: "Frontend Engineer",
          organization: "PT. Ruangguru Indonesia",
          period: "January 2020 - Present",
          details: [],
          skills: ["JavaScript", "React", "Node.js"],
          type: "work",
          employmentType: "Full-time",
          location: "Jakarta, Indonesia",
          locationType: "Remote",
          programmingLanguages: ["JavaScript", "TypeScript", "ReasonML", "SQL", "HTML", "CSS"],
          frameworks: ["React.js", "React Native", "ReasonReact"],
        },
        {
          title: "Frontend Engineer",
          organization: "PT. Ruangguru Indonesia",
          period: "January 2018 - December 2019",
          details: [],
          skills: ["Python", "Django", "JavaScript"],
          type: "work",
          employmentType: "Full-time",
          location: "Jakarta, Indonesia",
          locationType: "On-site",
          programmingLanguages: ["JavaScript", "Python", "TypeScript"],
          frameworks: ["React.js", "React Native", "ReasonReact"],
        },
      ];

      const result = getTopSkillsLastFiveYears(mockData);
      expect(result.length).toBeLessThanOrEqual(10);
      expect(result[0].name).toBe("JavaScript");
    });
  });
});
