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

type RefreshTokenResponse = {
  access: string;
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

const refreshAccessToken = async () => {
  const refresh = localStorage.getItem("refreshToken");

  if (!refresh) {
    return null;
  }

  const response = await fetch(buildUrl("/auth/refresh"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refresh }),
  });

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as RefreshTokenResponse;

  if (!data.access) {
    return null;
  }

  localStorage.setItem("token", data.access);
  return data.access;
};

const sendRequest = async (
  path: string,
  options: RequestOptions,
  accessToken = localStorage.getItem("token"),
) => {
  const headers: Record<string, string> = {};

  if (options.body) {
    headers["Content-Type"] = "application/json";
  }

  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  return fetch(buildUrl(path, options.query), {
    method: options.method ?? "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
};

export const apiRequest = async <T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> => {
  let response = await sendRequest(path, options);

  if (response.status === 401) {
    const refreshedToken = await refreshAccessToken();

    if (refreshedToken) {
      response = await sendRequest(path, options, refreshedToken);
    }
  }

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
