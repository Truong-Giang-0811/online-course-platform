const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;
const YOUTUBE_HOSTS = new Set(["youtube.com", "www.youtube.com", "m.youtube.com", "music.youtube.com", "youtube-nocookie.com", "www.youtube-nocookie.com"]);

// Lấy ID video từ các dạng link YouTube phổ biến; trả về null nếu không phải link YouTube hợp lệ.
export const getYouTubeId = (value) => {
  let url;
  try {
    url = new URL(String(value).trim());
  } catch {
    return null;
  }
  if (!["http:", "https:"].includes(url.protocol)) return null;

  let id = null;
  if (url.hostname === "youtu.be") {
    id = url.pathname.split("/")[1];
  } else if (YOUTUBE_HOSTS.has(url.hostname)) {
    if (url.pathname === "/watch") {
      id = url.searchParams.get("v");
    } else {
      const [, kind, value] = url.pathname.split("/");
      if (["embed", "shorts", "live", "v"].includes(kind)) id = value;
    }
  }
  return id && YOUTUBE_ID.test(id) ? id : null;
};

export const getYouTubeEmbedUrl = (value) => {
  const id = getYouTubeId(value);
  return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
};
