import { getCompletionLabel } from "../../lib/utils/utils";

describe("getCompletionLabel", () => {
  it('returns "No tasks yet" when there are zero total tasks', () => {
    expect(getCompletionLabel(0, 0)).toBe("No tasks yet");
  });

  it("returns a rounded percentage when there are tasks", () => {
    expect(getCompletionLabel(4, 2)).toBe("50%");
    expect(getCompletionLabel(3, 1)).toBe("33%");
  });

  it('returns 0% (not "No tasks yet") when total > 0 but none completed', () => {
    expect(getCompletionLabel(5, 0)).toBe("0%");
  });
});
