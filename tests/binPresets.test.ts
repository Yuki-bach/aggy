import { describe, it, expect } from "vitest";
import { fillByStep, fillByQuartile } from "../src/lib/binPresets";

describe("fillByStep - bin generation", () => {
  it("snaps boundaries to multiples of step", () => {
    const bins = fillByStep({ min: 12, max: 87, q1: 0, median: 0, q3: 0 }, 10);
    // start = 10, end = 80, last bin opens to +∞ from 80
    expect(bins[0]).toMatchObject({ min: 10, max: 20 });
    expect(bins.at(-1)).toMatchObject({ min: 80, max: null });
  });

  it("returns one open-ended bin when min and max round to the same step", () => {
    // Both min and max land in the [20, 30) bucket → start === end, the loop emits
    // nothing and only the open-ended tail bin remains.
    const bins = fillByStep({ min: 22, max: 25, q1: 0, median: 0, q3: 0 }, 10);
    expect(bins).toHaveLength(1);
    expect(bins[0]).toMatchObject({ min: 20, max: null });
  });

  it("covers values at the upper boundary via the open last bin", () => {
    // max=90 is exactly the start of the final bucket; without the open tail
    // it would be missed because BinDef.max is exclusive.
    const bins = fillByStep({ min: 0, max: 90, q1: 0, median: 0, q3: 0 }, 10);
    const last = bins.at(-1)!;
    expect(last.min).toBe(90);
    expect(last.max).toBeNull();
  });

  it("returns [] for non-positive step (defensive)", () => {
    expect(fillByStep({ min: 0, max: 10, q1: 0, median: 0, q3: 0 }, 0)).toEqual([]);
    expect(fillByStep({ min: 0, max: 10, q1: 0, median: 0, q3: 0 }, -5)).toEqual([]);
  });

  it("handles negative ranges symmetrically", () => {
    const bins = fillByStep({ min: -23, max: 17, q1: 0, median: 0, q3: 0 }, 10);
    expect(bins[0].min).toBe(-30);
    expect(bins.at(-1)).toMatchObject({ min: 10, max: null });
  });
});

describe("fillByQuartile - bin generation", () => {
  it("produces 4 bins covering (-∞, +∞) via open ends", () => {
    const bins = fillByQuartile({ min: 0, max: 100, q1: 25, median: 50, q3: 75 });
    expect(bins).toHaveLength(4);
    expect(bins[0]).toMatchObject({ code: "Q1", min: null, max: 25 });
    expect(bins[1]).toMatchObject({ code: "Q2", min: 25, max: 50 });
    expect(bins[2]).toMatchObject({ code: "Q3", min: 50, max: 75 });
    expect(bins[3]).toMatchObject({ code: "Q4", min: 75, max: null });
  });

  it("preserves quartile boundaries even when adjacent quartiles collapse", () => {
    // Heavily skewed data where q1 == median can occur; the bins still need to be
    // shaped (Q2 becomes empty by construction, but Q1/Q3/Q4 must remain valid).
    const bins = fillByQuartile({ min: 0, max: 100, q1: 10, median: 10, q3: 50 });
    expect(bins[1].min).toBe(10);
    expect(bins[1].max).toBe(10);
  });
});
