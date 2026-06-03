import { describe, expect, it } from "vitest";
import { rewindDialogOptions } from "../RewindDialog.js";

describe("RewindDialog helpers", () => {
  it("uses a two-option confirmation", () => {
    expect(rewindDialogOptions()).toEqual(["Yes", "No"]);
  });
});
