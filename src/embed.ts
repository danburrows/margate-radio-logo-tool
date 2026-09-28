export function isEmbedded(): boolean {
  if (new URLSearchParams(window.location.search).get("embed") === "1") return true;
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

export function embedSnippet(): string {
  const url = new URL(window.location.href);
  url.searchParams.set("embed", "1");
  url.hash = "";
  return `<iframe src="${url.toString()}" title="Margate Radio Post Maker" style="width:100%;height:800px;border:0"></iframe>`;
}
