export function isEmbedded(): boolean {
  if (new URLSearchParams(window.location.search).get("embed") === "1") return true;
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}
