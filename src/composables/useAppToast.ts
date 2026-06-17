import { ref } from "vue";

type ToastVariant = "error";

type ToastState = {
  id: number;
  message: string;
  variant: ToastVariant;
};

const toast = ref<ToastState | null>(null);
let toastId = 0;
let hideTimer: ReturnType<typeof setTimeout> | null = null;

export function useAppToast() {
  function showToast(
    message: string,
    variant: ToastVariant = "error",
    duration = 2600,
  ) {
    if (hideTimer) {
      clearTimeout(hideTimer);
      hideTimer = null;
    }

    toast.value = {
      id: toastId + 1,
      message,
      variant,
    };
    toastId += 1;

    hideTimer = setTimeout(() => {
      toast.value = null;
      hideTimer = null;
    }, duration);
  }

  function hideToast() {
    if (hideTimer) {
      clearTimeout(hideTimer);
      hideTimer = null;
    }

    toast.value = null;
  }

  return {
    toast,
    showToast,
    hideToast,
  };
}
