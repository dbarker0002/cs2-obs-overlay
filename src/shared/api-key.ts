const STORAGE_KEY = "cs2-overlay.leetify-api-key";

export function apiKeyFromFragment(hash: string): string | null {
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  const key = params.get("apiKey")?.trim();
  return key || null;
}

export function apiKeyToFragment(apiKey: string): string {
  const trimmed = apiKey.trim();
  if (!trimmed) return "";
  return `#${new URLSearchParams({ apiKey: trimmed }).toString()}`;
}

export function consumeApiKey(): string | undefined {
  const fragmentKey = apiKeyFromFragment(window.location.hash);
  const fragment = new URLSearchParams(window.location.hash.replace(/^#/, ""));

  if (fragment.get("clearKey") === "1") {
    window.localStorage.removeItem(STORAGE_KEY);
  } else if (fragmentKey) {
    window.localStorage.setItem(STORAGE_KEY, fragmentKey);
  }

  if (window.location.hash) {
    window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
  }

  return fragmentKey ?? window.localStorage.getItem(STORAGE_KEY) ?? undefined;
}
