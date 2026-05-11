type DebouncedSaveOptions<TKey extends string> = {
  delay: number
  save: (key: TKey) => Promise<unknown> | unknown
}

export function useDebouncedSave<TKey extends string>({
  delay,
  save,
}: DebouncedSaveOptions<TKey>) {
  const timers = new Map<TKey, ReturnType<typeof setTimeout>>()

  function cancel(key: TKey) {
    const timer = timers.get(key)

    if (!timer) {
      return
    }

    clearTimeout(timer)
    timers.delete(key)
  }

  function schedule(key: TKey) {
    cancel(key)

    timers.set(
      key,
      setTimeout(() => {
        timers.delete(key)
        void save(key)
      }, delay),
    )
  }

  async function flush(key: TKey) {
    cancel(key)

    return save(key)
  }

  function hasPending(key: TKey) {
    return timers.has(key)
  }

  function cancelAll() {
    for (const timer of timers.values()) {
      clearTimeout(timer)
    }

    timers.clear()
  }

  return {
    cancel,
    schedule,
    flush,
    hasPending,
    cancelAll,
  }
}
