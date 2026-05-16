import type { Component } from "vue";
import CanvasBasicElement from "@/components/canvas/CanvasBasicElement.vue";
import CanvasDocumentCard from "@/components/canvas/document-card/CanvasDocumentCard.vue";
import DecisionBlock from "@/components/canvas/nodes/flowchart/DecisionBlock.vue";
import InputOutputBlock from "@/components/canvas/nodes/flowchart/InputOutputBlock.vue";
import ProcessBlock from "@/components/canvas/nodes/flowchart/ProcessBlock.vue";
import StartEndBlock from "@/components/canvas/nodes/flowchart/StartEndBlock.vue";
import CircleShape from "@/components/canvas/nodes/shapes/CircleShape.vue";
import DiamondShape from "@/components/canvas/nodes/shapes/DiamondShape.vue";
import SquareShape from "@/components/canvas/nodes/shapes/SquareShape.vue";
import StarShape from "@/components/canvas/nodes/shapes/StarShape.vue";
import TrapezoidShape from "@/components/canvas/nodes/shapes/TrapezoidShape.vue";
import TriangleShape from "@/components/canvas/nodes/shapes/TriangleShape.vue";
import ClassNode from "@/components/canvas/nodes/uml/ClassNode.vue";
import ComponentNode from "@/components/canvas/nodes/uml/ComponentNode.vue";
import InterfaceNode from "@/components/canvas/nodes/uml/InterfaceNode.vue";
import NoteNode from "@/components/canvas/nodes/uml/NoteNode.vue";
import PackageNode from "@/components/canvas/nodes/uml/PackageNode.vue";
import StateNode from "@/components/canvas/nodes/uml/StateNode.vue";
import UmlNodeElement from "@/components/canvas/nodes/uml/UmlNodeElement.vue";
import UseCaseNode from "@/components/canvas/nodes/uml/UseCaseNode.vue";
import type { CreateCanvasElementDefaults } from "@/types/canvas";

export type CanvasElementTypeMeta = {
  id: string;
  name: string;
  component: Component;
  defaultWidth: number;
  defaultHeight: number;
  previewBg?: string;
  previewBorder?: string;
  defaultProps?: Record<string, unknown>;
  icon?: string;
};

export type CanvasElementCategory = {
  id: string;
  name: string;
  types: CanvasElementTypeMeta[];
};

const baseElementProps = {
  backgroundColor: "#ffffff",
  borderColor: "#6b7280",
  borderWidth: 1,
};

const categories: CanvasElementCategory[] = [
  {
    id: "base",
    name: "Базовые",
    types: [
      {
        id: "basic-card",
        name: "Карточка",
        component: CanvasBasicElement,
        defaultWidth: 160,
        defaultHeight: 110,
        previewBg: "#ffffff",
        previewBorder: "#d7dce3",
        defaultProps: {
          ...baseElementProps,
          content: "Новый элемент",
          borderRadius: 8,
        },
      },
    ],
  },
  {
    id: "documents",
    name: "Документы",
    types: [
      {
        id: "document-card",
        name: "Карточка документа",
        component: CanvasDocumentCard,
        defaultWidth: 360,
        defaultHeight: 260,
        previewBg: "#f8f8f8",
        previewBorder: "#202020",
      },
    ],
  },
  {
    id: "shapes",
    name: "Фигуры",
    types: [
      {
        id: "circle-shape",
        name: "Круг",
        component: CircleShape,
        defaultWidth: 110,
        defaultHeight: 110,
        previewBg: "#dbeafe",
        previewBorder: "#3b82f6",
        defaultProps: { backgroundColor: "#3b82f6", borderColor: "#1d4ed8" },
      },
      {
        id: "square-shape",
        name: "Квадрат",
        component: SquareShape,
        defaultWidth: 110,
        defaultHeight: 110,
        previewBg: "#d1fae5",
        previewBorder: "#10b981",
        defaultProps: { backgroundColor: "#10b981", borderColor: "#047857" },
      },
      {
        id: "triangle-shape",
        name: "Треугольник",
        component: TriangleShape,
        defaultWidth: 120,
        defaultHeight: 110,
        previewBg: "#fef3c7",
        previewBorder: "#f59e0b",
        defaultProps: { backgroundColor: "#f59e0b", borderColor: "#d97706" },
      },
      {
        id: "diamond-shape",
        name: "Ромб",
        component: DiamondShape,
        defaultWidth: 120,
        defaultHeight: 120,
        previewBg: "#f3e8ff",
        previewBorder: "#8b5cf6",
        defaultProps: { backgroundColor: "#8b5cf6", borderColor: "#7c3aed" },
      },
      {
        id: "star-shape",
        name: "Звезда",
        component: StarShape,
        defaultWidth: 120,
        defaultHeight: 120,
        previewBg: "#fef3c7",
        previewBorder: "#fbbf24",
        defaultProps: { backgroundColor: "#fbbf24", borderColor: "#f59e0b" },
      },
      {
        id: "trapezoid-shape",
        name: "Трапеция",
        component: TrapezoidShape,
        defaultWidth: 140,
        defaultHeight: 100,
        previewBg: "#fee2e2",
        previewBorder: "#ef4444",
        defaultProps: { backgroundColor: "#ef4444", borderColor: "#dc2626" },
      },
    ],
  },
  {
    id: "flowchart",
    name: "Блок-схемы",
    types: [
      {
        id: "flowchart-start-end",
        name: "Начало/конец",
        component: StartEndBlock,
        defaultWidth: 170,
        defaultHeight: 80,
        previewBg: "#f9fafb",
        previewBorder: "#6b7280",
        defaultProps: {
          ...baseElementProps,
          content: "Начало",
          borderRadius: 100,
        },
      },
      {
        id: "flowchart-process",
        name: "Процесс",
        component: ProcessBlock,
        defaultWidth: 170,
        defaultHeight: 80,
        previewBg: "#f9fafb",
        previewBorder: "#6b7280",
        defaultProps: { ...baseElementProps, content: "Процесс" },
      },
      {
        id: "flowchart-input-output",
        name: "Ввод/вывод",
        component: InputOutputBlock,
        defaultWidth: 180,
        defaultHeight: 80,
        previewBg: "#f9fafb",
        previewBorder: "#6b7280",
        defaultProps: { ...baseElementProps, content: "Ввод/вывод" },
      },
      {
        id: "flowchart-decision",
        name: "Решение",
        component: DecisionBlock,
        defaultWidth: 150,
        defaultHeight: 120,
        previewBg: "#f9fafb",
        previewBorder: "#6b7280",
        defaultProps: { ...baseElementProps, content: "Условие?" },
      },
    ],
  },
  {
    id: "uml",
    name: "UML",
    types: [
      {
        id: "uml-class",
        name: "Класс",
        component: ClassNode,
        defaultWidth: 190,
        defaultHeight: 170,
        previewBg: "#f0f9ff",
        previewBorder: "#0284c7",
        defaultProps: {
          ...baseElementProps,
          content: "ClassName",
          fields: [
            { id: "className", value: "ClassName" },
            { id: "attributes", value: "+ attribute: Type" },
            { id: "methods", value: "+ method(): Type" },
          ],
        },
      },
      {
        id: "uml-interface",
        name: "Интерфейс",
        component: InterfaceNode,
        defaultWidth: 180,
        defaultHeight: 140,
        previewBg: "#eef2ff",
        previewBorder: "#6366f1",
        defaultProps: { ...baseElementProps, content: "Interface" },
      },
      {
        id: "uml-use-case",
        name: "Use case",
        component: UseCaseNode,
        defaultWidth: 170,
        defaultHeight: 90,
        previewBg: "#f9fafb",
        previewBorder: "#6b7280",
        defaultProps: { ...baseElementProps, content: "Use case" },
      },
      {
        id: "uml-component",
        name: "Компонент",
        component: ComponentNode,
        defaultWidth: 170,
        defaultHeight: 110,
        previewBg: "#f9fafb",
        previewBorder: "#6b7280",
        defaultProps: { ...baseElementProps, content: "Component" },
      },
      {
        id: "uml-node",
        name: "Узел",
        component: UmlNodeElement,
        defaultWidth: 160,
        defaultHeight: 100,
        previewBg: "#e0e7ff",
        previewBorder: "#6366f1",
        defaultProps: { ...baseElementProps, content: "Node" },
      },
      {
        id: "uml-state",
        name: "Состояние",
        component: StateNode,
        defaultWidth: 160,
        defaultHeight: 90,
        previewBg: "#f9fafb",
        previewBorder: "#6b7280",
        defaultProps: {
          ...baseElementProps,
          content: "State",
          borderRadius: 20,
        },
      },
      {
        id: "uml-package",
        name: "Пакет",
        component: PackageNode,
        defaultWidth: 180,
        defaultHeight: 130,
        previewBg: "#f9fafb",
        previewBorder: "#6b7280",
        defaultProps: { ...baseElementProps, content: "Package" },
      },
      {
        id: "uml-note",
        name: "Заметка",
        component: NoteNode,
        defaultWidth: 170,
        defaultHeight: 120,
        previewBg: "#fffacd",
        previewBorder: "#d4af37",
        defaultProps: {
          backgroundColor: "#fffacd",
          borderColor: "#6b7280",
          borderWidth: 1,
          content: "Note...",
        },
      },
    ],
  },
];

const byType = new Map<string, CanvasElementTypeMeta>();

for (const category of categories) {
  for (const type of category.types) {
    byType.set(type.id, type);
  }
}

export const canvasComponentRegistry = {
  categories,

  getType(typeId: string) {
    return byType.get(typeId);
  },

  getComponent(typeId: string) {
    return byType.get(typeId)?.component ?? CanvasBasicElement;
  },

  getDefaults(typeId: string): CreateCanvasElementDefaults | undefined {
    const meta = byType.get(typeId);

    if (!meta) {
      return undefined;
    }

    return {
      width: meta.defaultWidth,
      height: meta.defaultHeight,
      defaultProps: meta.defaultProps,
    };
  },
};
