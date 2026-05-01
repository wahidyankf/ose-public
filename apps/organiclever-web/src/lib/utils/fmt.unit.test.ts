import { describe, it, expect } from "vitest";
import { fmtTime, fmtKg, fmtSpec } from "./fmt";

describe("fmtTime", () => {
  it("formats 0 seconds as '0s'", () => {
    expect(fmtTime(0)).toBe("0s");
  });

  it("formats seconds below 60 as Ns", () => {
    expect(fmtTime(45)).toBe("45s");
    expect(fmtTime(1)).toBe("1s");
    expect(fmtTime(59)).toBe("59s");
  });

  it("formats exactly 60 seconds as '1:00'", () => {
    expect(fmtTime(60)).toBe("1:00");
  });

  it("formats 90 seconds as '1:30'", () => {
    expect(fmtTime(90)).toBe("1:30");
  });

  it("formats 125 seconds as '2:05' (zero-pads seconds)", () => {
    expect(fmtTime(125)).toBe("2:05");
  });

  it("formats 3600 seconds as '60:00'", () => {
    expect(fmtTime(3600)).toBe("60:00");
  });
});

describe("fmtKg", () => {
  it("formats values below 1000 as plain numbers", () => {
    expect(fmtKg(850)).toBe("850");
    expect(fmtKg(0)).toBe("0");
    expect(fmtKg(999)).toBe("999");
  });

  it("formats 1000 as '1k' (trims .0)", () => {
    expect(fmtKg(1000)).toBe("1k");
  });

  it("formats 1500 as '1.5k'", () => {
    expect(fmtKg(1500)).toBe("1.5k");
  });

  it("formats 2000 as '2k'", () => {
    expect(fmtKg(2000)).toBe("2k");
  });
});

describe("fmtSpec", () => {
  describe("reps mode", () => {
    it("formats sets × reps with weight", () => {
      expect(
        fmtSpec({
          type: "reps",
          targetSets: 3,
          targetReps: 10,
          targetWeight: "8 kg",
          targetDuration: null,
          bilateral: false,
        }),
      ).toBe("3 × 10 @ 8 kg");
    });

    it("formats sets × reps without weight", () => {
      expect(
        fmtSpec({
          type: "reps",
          targetSets: 3,
          targetReps: 10,
          targetWeight: null,
          targetDuration: null,
          bilateral: false,
        }),
      ).toBe("3 × 10");
    });

    it("appends LR suffix for bilateral exercises with weight", () => {
      expect(
        fmtSpec({
          type: "reps",
          targetSets: 3,
          targetReps: 20,
          targetWeight: "8 kg",
          targetDuration: null,
          bilateral: true,
        }),
      ).toBe("3 × 20 LR @ 8 kg");
    });

    it("appends LR suffix for bilateral exercises without weight", () => {
      expect(
        fmtSpec({
          type: "reps",
          targetSets: 4,
          targetReps: 12,
          targetWeight: null,
          targetDuration: null,
          bilateral: true,
        }),
      ).toBe("4 × 12 LR");
    });
  });

  describe("duration mode", () => {
    it("formats sets × formatted duration", () => {
      expect(
        fmtSpec({
          type: "duration",
          targetSets: 2,
          targetReps: 0,
          targetWeight: null,
          targetDuration: 90,
          bilateral: false,
        }),
      ).toBe("2 × 1:30");
    });

    it("formats duration less than 60 seconds as Ns", () => {
      expect(
        fmtSpec({
          type: "duration",
          targetSets: 3,
          targetReps: 0,
          targetWeight: null,
          targetDuration: 45,
          bilateral: false,
        }),
      ).toBe("3 × 45s");
    });
  });

  describe("oneoff mode", () => {
    it("formats as '1 set' regardless of other fields", () => {
      expect(
        fmtSpec({
          type: "oneoff",
          targetSets: 1,
          targetReps: 0,
          targetWeight: null,
          targetDuration: null,
          bilateral: false,
        }),
      ).toBe("1 set");
    });
  });
});
