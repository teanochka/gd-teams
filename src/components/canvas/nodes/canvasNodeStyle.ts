import type { CSSProperties } from "vue";
import type { CanvasElement } from "@/types/canvas";

type BlockStyleOptions = {
  backgroundColor?: string;
  borderColor?: string;
  borderRadius?: number | string;
};

export const toCssSize = (
  value: number | string | undefined,
  fallback: string,
) => {
  if (value === undefined) {
    return fallback;
  }

  return typeof value === "number" ? `${value}px` : value;
};

export const getBlockStyle = (
  element: CanvasElement,
  options: BlockStyleOptions = {},
): CSSProperties => {
  const style: CSSProperties = {
    backgroundColor:
      element.backgroundColor ?? options.backgroundColor ?? "#ffffff",
    borderColor: element.borderColor ?? options.borderColor ?? "#6b7280",
    borderWidth: `${element.borderWidth ?? 1}px`,
    borderRadius: toCssSize(
      element.borderRadius,
      toCssSize(options.borderRadius, "0px"),
    ),
  };

  if (element.shadowColor || element.shadowBlur) {
    style.boxShadow = `${element.shadowOffsetX ?? 0}px ${element.shadowOffsetY ?? 5}px ${element.shadowBlur ?? 10}px ${element.shadowColor ?? "#00000040"}`;
  }

  return style;
};

export const getTextStyle = (
  element: CanvasElement,
  defaultTextAlign: "left" | "center" | "right" = "center",
): CSSProperties => ({
  color: element.textColor ?? "#202020",
  fontSize: element.fontSize ? `${element.fontSize}px` : undefined,
  fontWeight: element.fontWeight ? String(element.fontWeight) : undefined,
  textAlign: element.textAlign ?? defaultTextAlign,
});

export const hasSvgShadow = (element: CanvasElement) => {
  return Boolean(element.shadowColor || element.shadowBlur);
};

export const getSvgShadowId = (element: CanvasElement, prefix: string) => {
  return `${prefix}-${String(element.id).replace(/[^a-zA-Z0-9_-]/g, "-")}`;
};

export const getSvgDropShadow = (element: CanvasElement): CSSProperties => {
  if (!hasSvgShadow(element)) {
    return {};
  }

  return {
    filter: `drop-shadow(${element.shadowOffsetX ?? 0}px ${element.shadowOffsetY ?? 5}px ${element.shadowBlur ?? 10}px ${element.shadowColor ?? "#00000040"})`,
  };
};

export const updateField = (
  fields: CanvasElement["fields"] | undefined,
  fieldId: string,
  value: string,
) => {
  const nextFields = fields ? [...fields] : [];
  const index = nextFields.findIndex((field) => field.id === fieldId);

  if (index === -1) {
    nextFields.push({ id: fieldId, value });
    return nextFields;
  }

  nextFields[index] = { id: fieldId, value };
  return nextFields;
};
