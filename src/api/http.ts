const ensureTrailingSlash = (value: string) =>
  value.endsWith("/") ? value : `${value}/`;

const resolveApiBaseUrl = () => {
  const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL;

  if (configuredBaseUrl) {
    if (/^https?:\/\//i.test(configuredBaseUrl)) {
      return ensureTrailingSlash(configuredBaseUrl);
    }

    return ensureTrailingSlash(
      new URL(configuredBaseUrl, window.location.origin).toString(),
    );
  }

  return ensureTrailingSlash(
    new URL("/api", window.location.origin).toString(),
  );
};

const apiBaseUrl = resolveApiBaseUrl();

type RequestMethod = "GET" | "POST" | "PATCH" | "DELETE";

type RequestOptions = {
  method?: RequestMethod;
  body?: unknown;
  query?: Record<string, string | number | boolean | null | undefined>;
};

const buildUrl = (path: string, query?: RequestOptions["query"]) => {
  const url = new URL(path.replace(/^\//, ""), apiBaseUrl);

  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  }

  return url.toString();
};

export const apiRequest = async <T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> => {
  const token = localStorage.getItem("token");
  const headers: Record<string, string> = {};

  if (options.body) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(buildUrl(path, options.query), {
    method: options.method ?? "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    const errorBody = errorText
      ? (() => {
          try {
            return JSON.parse(errorText) as {
              message?: string;
              error?: string;
            };
          } catch {
            return null;
          }
        })()
      : null;
    const message =
      errorBody?.message ||
      errorBody?.error ||
      errorText.trim() ||
      `Request failed: ${response.status}`;

    throw new Error(message);
  }

  return response.json() as Promise<T>;
};
