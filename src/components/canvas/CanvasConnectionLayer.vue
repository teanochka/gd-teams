<script setup lang="ts">
import { computed } from 'vue'
import {
  buildSvgPath,
  routeOrthogonalConnection,
} from '@/components/canvas/connectionRouting'
import type {
  CanvasConnection,
  CanvasElement,
  CanvasElementId,
  CanvasHandlePosition,
  CanvasPoint,
} from '@/types/canvas'

export type DraftCanvasConnection = {
  sourceId: CanvasElementId
  sourceHandle: CanvasHandlePosition
  targetPoint: CanvasPoint
  targetElementId?: CanvasElementId | null
  targetHandle?: CanvasHandlePosition | null
}

const props = defineProps<{
  elements: CanvasElement[]
  connections: CanvasConnection[]
  draftConnection?: DraftCanvasConnection | null
}>()

type ConnectionPath = {
  id: CanvasConnection['id'] | 'draft-connection'
  d: string
  stroke: string
  markerEnd: boolean
  draft?: boolean
}

const elementById = computed(() => {
  return new Map(props.elements.map((element) => [element.id, element]))
})

const toConnectionPath = (connection: CanvasConnection): ConnectionPath | null => {
  const source = elementById.value.get(connection.sourceId)

  if (!source) {
    return null
  }

  const target = connection.targetId !== null && connection.targetId !== undefined
    ? elementById.value.get(connection.targetId)
    : null
  const points = routeOrthogonalConnection({
    source,
    sourceHandle: connection.sourceHandle,
    target,
    targetHandle: connection.targetHandle,
    targetPoint: connection.targetPoint,
    waypoints: connection.data?.waypoints,
  })

  if (!points.length) {
    return null
  }

  return {
    id: connection.id,
    d: buildSvgPath(points),
    stroke: connection.style?.stroke ?? '#202020',
    markerEnd: connection.markerEnd !== 'none',
  }
}

const draftPath = computed<ConnectionPath | null>(() => {
  const draft = props.draftConnection

  if (!draft) {
    return null
  }

  const source = elementById.value.get(draft.sourceId)

  if (!source) {
    return null
  }

  const target = draft.targetElementId !== null && draft.targetElementId !== undefined
    ? elementById.value.get(draft.targetElementId)
    : null
  const points = routeOrthogonalConnection({
    source,
    sourceHandle: draft.sourceHandle,
    target,
    targetHandle: draft.targetHandle,
    targetPoint: draft.targetPoint,
  })

  if (!points.length) {
    return null
  }

  return {
    id: 'draft-connection',
    d: buildSvgPath(points),
    stroke: '#202020',
    markerEnd: true,
    draft: true,
  }
})

const connectionPaths = computed(() => {
  const paths = props.connections
    .map(toConnectionPath)
    .filter((path): path is ConnectionPath => path !== null)

  if (draftPath.value) {
    return [...paths, draftPath.value]
  }

  return paths
})
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
      :class="{ draft: path.draft }"
      :d="path.d"
      :stroke="path.stroke"
      :marker-end="path.markerEnd ? 'url(#canvas-connection-arrow)' : undefined"
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
}

.connection-path.draft {
  stroke-dasharray: 6 5;
}
</style>
