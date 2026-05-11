const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'

type RequestMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE'

type RequestOptions = {
  method?: RequestMethod
  body?: unknown
  query?: Record<string, string | number | boolean | null | undefined>
}

const buildUrl = (path: string, query?: RequestOptions['query']) => {
  const url = new URL(path, apiBaseUrl)

  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value))
    }
  }

  return url.toString()
}

export const apiRequest = async <T>(path: string, options: RequestOptions = {}): Promise<T> => {
  const response = await fetch(buildUrl(path, options.query), {
    method: options.method ?? 'GET',
    headers: options.body ? { 'Content-Type': 'application/json' } : undefined,
    body: options.body ? JSON.stringify(options.body) : undefined,
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => '')
    const errorBody = errorText
      ? (() => {
          try {
            return JSON.parse(errorText) as { message?: string; error?: string }
          } catch {
            return null
          }
        })()
      : null
    const message =
      errorBody?.message ||
      errorBody?.error ||
      errorText.trim() ||
      `Request failed: ${response.status}`

    throw new Error(message)
  }

  return response.json() as Promise<T>
}
