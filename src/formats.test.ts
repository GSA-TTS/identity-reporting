import { expect } from "chai";
import { formatSIDropTrailingZeroes } from "./formats";

describe("formats", () => {
  describe("#formatSIDropTrailingZeroes", () => {
    it("formats with an SI prefix", () => {
      expect(formatSIDropTrailingZeroes(1_230_000)).to.eq("1.2M");
    });

    it("drops trailing zeroes", () => {
      expect(formatSIDropTrailingZeroes(1_000.0)).to.eq("1k");
    });
  });
});
