import { describe, expect, it } from "vitest";
import { getYouTubeEmbedUrl, getYouTubeId } from "./youtube";

describe("getYouTubeId", () => {
  it.each([
    ["https://www.youtube.com/watch?v=PkZNo7MFNFg", "PkZNo7MFNFg"],
    ["https://www.youtube.com/watch?v=hdI2bqOjy3c&t=60s", "hdI2bqOjy3c"],
    ["https://youtu.be/pQN-pnXPaVg", "pQN-pnXPaVg"],
    ["https://youtu.be/pQN-pnXPaVg?si=abc", "pQN-pnXPaVg"],
    ["https://m.youtube.com/watch?v=W6NZfCO5SIk", "W6NZfCO5SIk"],
    ["https://www.youtube.com/shorts/hdI2bqOjy3c", "hdI2bqOjy3c"],
    ["https://www.youtube.com/embed/yfoY53QXEnI", "yfoY53QXEnI"],
    ["https://www.youtube.com/live/jS4aFq5-91M", "jS4aFq5-91M"],
  ])("%s → %s", (url, id) => {
    expect(getYouTubeId(url)).toBe(id);
  });

  it.each([
    "youtube.com/watch?v=PkZNo7MFNFg",
    "https://example.com/watch?v=PkZNo7MFNFg",
    "https://www.youtube.com/watch?v=ngan",
    "https://www.youtube.com/channel/UC8butISFwT-Wl7EV0hUK0BQ",
    "javascript:alert(1)",
    "",
  ])("không nhận %s", (url) => {
    expect(getYouTubeId(url)).toBeNull();
  });

  it("tạo link nhúng youtube-nocookie", () => {
    expect(getYouTubeEmbedUrl("https://youtu.be/PkZNo7MFNFg")).toBe("https://www.youtube-nocookie.com/embed/PkZNo7MFNFg");
    expect(getYouTubeEmbedUrl("https://example.com")).toBeNull();
  });
});
