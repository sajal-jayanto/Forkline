import { describe, expect, it } from "@jest/globals";
import { createSlug, toAmount, toCents } from "../src/utils.js";

describe("createSlug", () => {
  it("lowercases, trims and hyphenates", () => {
    expect(createSlug("  Chicken Burger  ")).toBe("chicken-burger");
  });

  it("strips special characters and collapses hyphens", () => {
    expect(createSlug("Fish & Chips -- Large!")).toBe("fish-chips-large");
  });
});

describe("money helpers", () => {
  it("converts an amount to cents", () => {
    expect(toCents("12.34")).toBe(1234);
  });

  it("converts cents to an amount", () => {
    expect(toAmount(1234)).toBe("12.34");
  });
});
