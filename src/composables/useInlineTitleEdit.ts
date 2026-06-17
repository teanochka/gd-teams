import { computed, nextTick, onBeforeUnmount, ref, unref, watch } from "vue";
import type { ComputedRef, Ref } from "vue";

type MaybeRef<T> = Ref<T> | ComputedRef<T>;

type UseInlineTitleEditOptions = {
  isEditing: MaybeRef<boolean>;
  isBusy?: MaybeRef<boolean>;
  onCommit: () => void | Promise<void>;
};

export function useInlineTitleEdit(options: UseInlineTitleEditOptions) {
  const inputRef = ref<HTMLInputElement | null>(null);
  const isBusy = computed(() => unref(options.isBusy) ?? false);

  const focusInput = async () => {
    await nextTick();
    inputRef.value?.focus();
    inputRef.value?.select();
  };

  const handleDocumentPointerDown = (event: PointerEvent) => {
    if (!unref(options.isEditing) || isBusy.value) {
      return;
    }

    const target = event.target;

    if (!(target instanceof Node)) {
      return;
    }

    if (inputRef.value?.contains(target)) {
      return;
    }

    void options.onCommit();
  };

  watch(
    () => unref(options.isEditing),
    (value) => {
      if (value) {
        document.addEventListener("pointerdown", handleDocumentPointerDown);
        void focusInput();
        return;
      }

      document.removeEventListener("pointerdown", handleDocumentPointerDown);
    },
    { immediate: true },
  );

  onBeforeUnmount(() => {
    document.removeEventListener("pointerdown", handleDocumentPointerDown);
  });

  return {
    inputRef,
    focusInput,
  };
}
