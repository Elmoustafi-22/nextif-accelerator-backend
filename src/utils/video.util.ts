/**
 * Transforms standard YouTube or Vimeo URLs into their embeddable versions.
 * Supports:
 * - YouTube: watch?v=, youtu.be/, live/, shorts/, embed/
 * - Vimeo: vimeo.com/, player.vimeo.com/video/
 * 
 * It can also extract the URL if the user accidentally pastes a full <iframe> tag.
 * 
 * @param input The original video URL or iframe tag
 * @returns The embeddable URL if recognized, otherwise the original input
 */
export const transformToEmbedUrl = (input: string): string => {
  if (!input) return "";

  // 1. If user pasted a full iframe tag, extract the src attribute
  const srcMatch = input.match(/src=["']([^"']+)["']/);
  const url = srcMatch ? srcMatch[1] : input;

  if (!url) return "";

  // 2. YouTube Patterns (Standard, Embed, Live, Shorts, youtu.be)
  // Extracts the 11-character ID
  const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|live\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const youtubeMatch = url.match(youtubeRegex);
  if (youtubeMatch && youtubeMatch[1]) {
    return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
  }

  // 3. Vimeo Patterns
  // Extracts the numeric ID
  const vimeoRegex = /(?:https?:\/\/)?(?:www\.)?(?:vimeo\.com\/|player\.vimeo\.com\/video\/)([0-9]+)(?:\/[a-zA-Z0-9]+)?/;
  const vimeoMatch = url.match(vimeoRegex);
  if (vimeoMatch && vimeoMatch[1]) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  }

  return url;
};
