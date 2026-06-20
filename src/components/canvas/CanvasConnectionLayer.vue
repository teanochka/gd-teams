<script setup lang="ts">
import { computed } from "vue";
import {
  buildSvgPath,
  connectionSegmentHitWidth,
  getConnectionSegments,
  routeOrthogonalConnection,
} from "@/components/canvas/connectionRouting";
import type {
  CanvasConnection,
  CanvasElement,
  CanvasElementId,
  CanvasHandlePosition,
  CanvasPoint,
} from "@/types/canvas";

export type DraftCanvasConnection = {
  sourceId: CanvasElementId;
  sourceHandle: CanvasHandlePosition;
  targetPoint: CanvasPoint;
  targetElementId?: CanvasElementId | null;
  targetHandle?: CanvasHandlePosition | null;
};

export type ConnectionSnapGuide = {
  orientation: "horizontal" | "vertical";
  coordinate: number;
  from: number;
  to: number;
};

const props = defineProps<{
  elements: CanvasElement[];
  connections: CanvasConnection[];
  draftConnection?: DraftCanvasConnection | null;
  selectedConnectionIds?: Set<CanvasElementId>;
  snapGuide?: ConnectionSnapGuide | null;
}>();

const emit = defineEmits<{
  (
    event: "select-connection",
    payload: { connectionId: CanvasElementId; event: MouseEvent },
  ): void;
  (
    event: "segment-drag-start",
    payload: {
      connectionId: CanvasElementId;
      segmentIndex: number;
      event: MouseEvent;
    },
  ): void;
}>();

type ConnectionPath = {
  id: CanvasConnection["id"] | "draft-connection";
  d: string;
  stroke: string;
  markerEnd: boolean;
  points: CanvasPoint[];
  segments: ReturnType<typeof getConnectionSegments>;
  draft?: boolean;
};

const elementById = computed(() => {
  return new Map(props.elements.map((element) => [element.id, element]));
});

const toConnectionPath = (
  connection: CanvasConnection,
): ConnectionPath | null => {
  const source = elementById.value.get(connection.sourceId);

  if (!source) {
    return null;
  }

  const target =
    connection.targetId !== null && connection.targetId !== undefined
      ? elementById.value.get(connection.targetId)
      : null;
  const points = routeOrthogonalConnection({
    source,
    sourceHandle: connection.sourceHandle,
    target,
    targetHandle: connection.targetHandle,
    targetPoint: connection.targetPoint,
    waypoints: connection.data?.waypoints,
  });

  if (!points.length) {
    return null;
  }

  return {
    id: connection.id,
    d: buildSvgPath(points),
    stroke: connection.style?.stroke ?? "#202020",
    markerEnd: connection.markerEnd !== "none",
    points,
    segments: getConnectionSegments(connection.id, points),
  };
};

const draftPath = computed<ConnectionPath | null>(() => {
  const draft = props.draftConnection;

  if (!draft) {
    return null;
  }

  const source = elementById.value.get(draft.sourceId);

  if (!source) {
    return null;
  }

  const target =
    draft.targetElementId !== null && draft.targetElementId !== undefined
      ? elementById.value.get(draft.targetElementId)
      : null;
  const points = routeOrthogonalConnection({
    source,
    sourceHandle: draft.sourceHandle,
    target,
    targetHandle: draft.targetHandle,
    targetPoint: draft.targetPoint,
  });

  if (!points.length) {
    return null;
  }

  return {
    id: "draft-connection",
    d: buildSvgPath(points),
    stroke: "#202020",
    markerEnd: true,
    points,
    segments: [],
    draft: true,
  };
});

const connectionPaths = computed(() => {
  const paths = props.connections
    .map(toConnectionPath)
    .filter((path): path is ConnectionPath => path !== null);

  if (draftPath.value) {
    return [...paths, draftPath.value];
  }

  return paths;
});

const selectedConnectionPaths = computed(() =>
  connectionPaths.value.filter(
    (path) => !path.draft && props.selectedConnectionIds?.has(path.id),
  ),
);

const selectedConnectionSegments = computed(() =>
  selectedConnectionPaths.value.flatMap((path) => {
    const lastSegmentIndex = path.points.length - 2;

    return path.segments
      .filter((segment) => segment.index > 0 && segment.index < lastSegmentIndex)
      .map((segment) => ({
        ...segment,
        d: buildSvgPath([segment.start, segment.end]),
      }));
  }),
);

const isSelected = (path: ConnectionPath) => {
  return !path.draft && Boolean(props.selectedConnectionIds?.has(path.id));
};

const onConnectionMouseDown = (path: ConnectionPath, event: MouseEvent) => {
  if (path.draft || event.button !== 0) {
    return;
  }

  event.preventDefault();
  event.stopPropagation();
  emit("select-connection", { connectionId: path.id, event });
};

const onSegmentMouseDown = (
  segment: { connectionId: CanvasElementId; index: number },
  event: MouseEvent,
) => {
  if (event.button !== 0) {
    return;
  }

  event.preventDefault();
  event.stopPropagation();
  emit("segment-drag-start", {
    connectionId: segment.connectionId,
    segmentIndex: segment.index,
    event,
  });
};
</script>

<template>
  <svg class="connection-layer" aria-hidden="true">
    <defs>
      <marker
        id="canvas-connection-arrow"
        viewBox="0 0 10 10"
        refX="9"
        refY="5"
        markerWidth="6"
        markerHeight="6"
        orient="auto-start-reverse"
      >
        <path d="M 0 0 L 10 5 L 0 10 z" fill="#202020" />
      </marker>
    </defs>
    <path
      v-for="path in connectionPaths"
      :key="path.id"
      class="connection-path"
      :class="{ draft: path.draft, selected: isSelected(path) }"
      :d="path.d"
      :stroke="path.stroke"
      :marker-end="path.markerEnd ? 'url(#canvas-connection-arrow)' : undefined"
    />
    <path
      v-for="path in selectedConnectionPaths"
      :key="`selected-${path.id}`"
      class="connection-selected-path"
      :d="path.d"
    />
    <path
      v-for="path in connectionPaths.filter((item) => !item.draft)"
      :key="`hit-${path.id}`"
      class="connection-hit-path"
      :d="path.d"
      :stroke-width="connectionSegmentHitWidth"
      @mousedown="onConnectionMouseDown(path, $event)"
    />
    <path
      v-for="segment in selectedConnectionSegments"
      :key="`segment-${segment.connectionId}-${segment.index}`"
      class="connection-segment-hit-path"
      :class="segment.orientation"
      :d="segment.d"
      :stroke-width="connectionSegmentHitWidth + 4"
      @mousedown="onSegmentMouseDown(segment, $event)"
    />
    <line
      v-if="snapGuide"
      class="connection-snap-guide"
      :x1="snapGuide.orientation === 'horizontal' ? snapGuide.from : snapGuide.coordinate"
      :y1="snapGuide.orientation === 'horizontal' ? snapGuide.coordinate : snapGuide.from"
      :x2="snapGuide.orientation === 'horizontal' ? snapGuide.to : snapGuide.coordinate"
      :y2="snapGuide.orientation === 'horizontal' ? snapGuide.coordinate : snapGuide.to"
    />
  </svg>
</template>

<style scoped>
.connection-layer {
  position: absolute;
  inset: 0;
  z-index: 1;
  width: 2200px;
  height: 1400px;
  overflow: visible;
  pointer-events: none;
}

.connection-path {
  fill: none;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 2;
  pointer-events: none;
}

.connection-path.selected {
  stroke-width: 2.5;
}

.connection-path.draft {
  stroke-dasharray: 6 5;
}

.connection-selected-path {
  fill: none;
  pointer-events: none;
  stroke: #0f62fe;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 6;
  stroke-opacity: 0.16;
}

.connection-hit-path,
.connection-segment-hit-path {
  fill: none;
  pointer-events: stroke;
  stroke: transparent;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.connection-hit-path {
  cursor: pointer;
}

.connection-segment-hit-path {
  cursor: grab;
}

.connection-segment-hit-path.horizontal {
  cursor: ns-resize;
}

.connection-segment-hit-path.vertical {
  cursor: ew-resize;
}

.connection-snap-guide {
  pointer-events: none;
  stroke: #0f62fe;
  stroke-dasharray: 5 4;
  stroke-linecap: round;
  stroke-width: 1.5;
}
</style>
