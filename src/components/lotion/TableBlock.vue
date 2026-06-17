<script setup lang="ts">
import { computed, nextTick, ref, watch, type PropType } from "vue";
import { types } from "@dashibase/lotion";
import type { LotionTableData } from "@/types/domain";

defineOptions({
  inheritAttrs: false,
});

type TableDetails = types.Details & {
  table?: LotionTableData;
};

type TableBlock = types.Block & {
  details: TableDetails;
};

type Selection = {
  row: number;
  column: number;
};

type MenuState = {
  type: "row" | "column";
  index: number;
  x: number;
  y: number;
};

type AxisSelection = Pick<MenuState, "type" | "index">;

type ResizeState = {
  type: "row" | "column";
  index: number;
  startPosition: number;
  startSize: number;
};

const defaultColumnWidth = 160;
const defaultRowHeight = 42;
const minColumnWidth = 96;
const minRowHeight = 34;

const props = defineProps({
  block: {
    type: Object as PropType<TableBlock>,
    required: true,
  },
  readonly: {
    type: Boolean,
    default: false,
  },
});

const selectedCell = ref<Selection | null>(null);
const selectedAxis = ref<AxisSelection | null>(null);
const menu = ref<MenuState | null>(null);
const resizeState = ref<ResizeState | null>(null);
let previousBodyUserSelect = "";

function createRows(rowCountValue: number, columnCountValue: number) {
  return Array.from({ length: rowCountValue }, () =>
    Array.from({ length: columnCountValue }, () => ""),
  );
}

function ensureTable() {
  const existingTable = props.block.details.table;

  if (!existingTable) {
    props.block.details.table = {
      rows: createRows(3, 3),
      columnWidths: Array.from({ length: 3 }, () => defaultColumnWidth),
      rowHeights: Array.from({ length: 3 }, () => defaultRowHeight),
    };
    return;
  }

  const nextColumnCount = Math.max(
    existingTable.columnWidths.length,
    ...existingTable.rows.map((row: string[]) => row.length),
    1,
  );
  const nextColumnWidths = Array.from(
    { length: nextColumnCount },
    (_, index) => existingTable.columnWidths[index] ?? defaultColumnWidth,
  );
  const nextRows = existingTable.rows.length
    ? existingTable.rows.map((row: string[]) =>
        Array.from({ length: nextColumnCount }, (_, index) => row[index] ?? ""),
      )
    : createRows(1, nextColumnCount);
  const nextRowHeights = Array.from(
    { length: nextRows.length },
    (_, index) => existingTable.rowHeights[index] ?? defaultRowHeight,
  );

  if (
    nextColumnWidths.length !== existingTable.columnWidths.length ||
    nextColumnWidths.some(
      (width, index) => width !== existingTable.columnWidths[index],
    )
  ) {
    existingTable.columnWidths = nextColumnWidths;
  }

  if (
    nextRows.length !== existingTable.rows.length ||
    nextRows.some(
      (row: string[], rowIndex: number) =>
        row.length !== existingTable.rows[rowIndex]?.length ||
        row.some(
          (cell: string, columnIndex: number) =>
            cell !== existingTable.rows[rowIndex]?.[columnIndex],
        ),
    )
  ) {
    existingTable.rows = nextRows;
  }

  if (
    nextRowHeights.length !== existingTable.rowHeights.length ||
    nextRowHeights.some(
      (height, index) => height !== existingTable.rowHeights[index],
    )
  ) {
    existingTable.rowHeights = nextRowHeights;
  }
}

ensureTable();

const table = computed(() => props.block.details.table as LotionTableData);
const columnCount = computed(() => table.value.columnWidths.length);
const rowCount = computed(() => table.value.rows.length);
const tableWidth = computed(() =>
  table.value.columnWidths.reduce((total, width) => total + width, 0),
);
const tableHeight = computed(() =>
  table.value.rowHeights.reduce((total, height) => total + height, 0),
);
const selectedAxisFrame = computed(() => {
  if (!selectedAxis.value) {
    return null;
  }

  if (selectedAxis.value.type === "column") {
    return {
      left: table.value.columnWidths
        .slice(0, selectedAxis.value.index)
        .reduce((total, width) => total + width, 40),
      top: 0,
      width: table.value.columnWidths[selectedAxis.value.index] ?? 0,
      height: tableHeight.value,
    };
  }

  return {
    left: 40,
    top: table.value.rowHeights
      .slice(0, selectedAxis.value.index)
      .reduce((total, height) => total + height, 0),
    width: tableWidth.value,
    height: table.value.rowHeights[selectedAxis.value.index] ?? 0,
  };
});

watch(
  () => props.block.id,
  () => {
    ensureTable();
    selectedCell.value = null;
    selectedAxis.value = null;
    menu.value = null;
  },
);

function selectCell(row: number, column: number) {
  selectedCell.value = { row, column };
  selectedAxis.value = null;
  menu.value = null;
}

function isColumnSelected(column: number) {
  return (
    selectedAxis.value?.type === "column" && selectedAxis.value.index === column
  );
}

function isRowSelected(row: number) {
  return selectedAxis.value?.type === "row" && selectedAxis.value.index === row;
}

function isCellSelected(row: number, column: number) {
  return (
    selectedCell.value?.row === row && selectedCell.value.column === column
  );
}

function addRow(index = rowCount.value) {
  table.value.rows.splice(
    index,
    0,
    Array.from({ length: columnCount.value }, () => ""),
  );
  table.value.rowHeights.splice(index, 0, defaultRowHeight);
}

function addColumn(index = columnCount.value) {
  table.value.columnWidths.splice(index, 0, defaultColumnWidth);

  for (const row of table.value.rows) {
    row.splice(index, 0, "");
  }
}

function duplicateRow(index: number) {
  const row =
    table.value.rows[index] ??
    Array.from({ length: columnCount.value }, () => "");
  const rowHeight = table.value.rowHeights[index] ?? defaultRowHeight;

  table.value.rows.splice(index + 1, 0, [...row]);
  table.value.rowHeights.splice(index + 1, 0, rowHeight);
}

function duplicateColumn(index: number) {
  const columnWidth = table.value.columnWidths[index] ?? defaultColumnWidth;

  table.value.columnWidths.splice(index + 1, 0, columnWidth);

  for (const row of table.value.rows) {
    row.splice(index + 1, 0, row[index] ?? "");
  }
}

function clearRow(index: number) {
  const row = table.value.rows[index];

  if (!row) {
    return;
  }

  table.value.rows[index] = row.map(() => "");
}

function clearColumn(index: number) {
  for (const row of table.value.rows) {
    row[index] = "";
  }
}

function deleteRow(index: number) {
  if (rowCount.value <= 1) {
    clearRow(index);
    selectedAxis.value = { type: "row", index };
    menu.value = null;
    return;
  }

  table.value.rows.splice(index, 1);
  table.value.rowHeights.splice(index, 1);
  selectedCell.value = null;
  selectedAxis.value = null;
  menu.value = null;
}

function deleteColumn(index: number) {
  if (columnCount.value <= 1) {
    clearColumn(index);
    selectedAxis.value = { type: "column", index };
    menu.value = null;
    return;
  }

  table.value.columnWidths.splice(index, 1);

  for (const row of table.value.rows) {
    row.splice(index, 1);
  }

  selectedCell.value = null;
  selectedAxis.value = null;
  menu.value = null;
}

function openMenu(type: "row" | "column", index: number, event: MouseEvent) {
  event.preventDefault();
  event.stopPropagation();
  selectedCell.value = null;
  selectedAxis.value = { type, index };
  menu.value = {
    type,
    index,
    x: event.clientX,
    y: event.clientY,
  };
}

function runMenuAction(action: string) {
  if (!menu.value) {
    return;
  }

  const { type, index } = menu.value;

  if (type === "row") {
    if (action === "insert-before") addRow(index);
    if (action === "insert-after") addRow(index + 1);
    if (action === "duplicate") duplicateRow(index);
    if (action === "clear") clearRow(index);
    if (action === "delete") deleteRow(index);
  } else {
    if (action === "insert-before") addColumn(index);
    if (action === "insert-after") addColumn(index + 1);
    if (action === "duplicate") duplicateColumn(index);
    if (action === "clear") clearColumn(index);
    if (action === "delete") deleteColumn(index);
  }

  menu.value = null;
}

function startResize(
  type: "row" | "column",
  index: number,
  event: PointerEvent,
) {
  if (props.readonly) {
    return;
  }

  event.preventDefault();
  event.stopPropagation();
  resizeState.value = {
    type,
    index,
    startPosition: type === "column" ? event.clientX : event.clientY,
    startSize:
      type === "column"
        ? (table.value.columnWidths[index] ?? defaultColumnWidth)
        : (table.value.rowHeights[index] ?? defaultRowHeight),
  };
  previousBodyUserSelect = document.body.style.userSelect;
  document.body.style.userSelect = "none";
  window.addEventListener("pointermove", handleResizeMove);
  window.addEventListener("pointerup", stopResize, { once: true });
}

function handleResizeMove(event: PointerEvent) {
  const state = resizeState.value;

  if (!state) {
    return;
  }

  const currentPosition =
    state.type === "column" ? event.clientX : event.clientY;
  const delta = currentPosition - state.startPosition;

  if (state.type === "column") {
    table.value.columnWidths[state.index] = Math.max(
      minColumnWidth,
      state.startSize + delta,
    );
    return;
  }

  table.value.rowHeights[state.index] = Math.max(
    minRowHeight,
    state.startSize + delta,
  );
}

function stopResize() {
  resizeState.value = null;
  document.body.style.userSelect = previousBodyUserSelect;
  window.removeEventListener("pointermove", handleResizeMove);
}

function onSet() {
  ensureTable();
}

function onUnset() {
  props.block.details.value = getTextContent();
}

function getTextContent() {
  return table.value.rows.map((row) => row.join("\t")).join("\n");
}

function getHtmlContent() {
  return getTextContent();
}

function moveToStart() {
  void nextTick(() => {
    const firstCell = document.querySelector<HTMLElement>(
      `[data-table-block="${props.block.id}"] .cell-editor`,
    );
    firstCell?.focus();
  });
}

function moveToEnd() {
  void nextTick(() => {
    const cells = document.querySelectorAll<HTMLElement>(
      `[data-table-block="${props.block.id}"] .cell-editor`,
    );
    cells[cells.length - 1]?.focus();
  });
}

defineExpose({
  onSet,
  onUnset,
  getTextContent,
  getHtmlContent,
  moveToStart,
  moveToEnd,
});
</script>

<template>
  <div
    class="table-block"
    :data-table-block="block.id"
    @click.self="menu = null"
  >
    <div class="table-scroll">
      <div class="table-stage" :style="{ width: `${tableWidth + 76}px` }">
        <div
          class="table-top-controls"
          :style="{ width: `${tableWidth + 40}px` }"
        >
          <div class="table-corner" />
          <div
            v-for="(_, columnIndex) in table.columnWidths"
            :key="`column-control-${columnIndex}`"
            class="column-control"
            :class="{
              active:
                selectedCell?.column === columnIndex ||
                isColumnSelected(columnIndex),
            }"
            :style="{ width: `${table.columnWidths[columnIndex]}px` }"
          >
            <button
              v-if="
                selectedCell?.column === columnIndex ||
                isColumnSelected(columnIndex)
              "
              class="axis-menu-button"
              type="button"
              @click="openMenu('column', columnIndex, $event)"
            >
              <span class="axis-menu-line" aria-hidden="true" />
            </button>
            <span
              class="column-resize-handle"
              @pointerdown="startResize('column', columnIndex, $event)"
            />
          </div>
        </div>

        <div class="table-body">
          <div class="table-grid">
            <div
              v-if="selectedAxisFrame"
              class="selected-axis-frame"
              :style="{
                left: `${selectedAxisFrame.left}px`,
                top: `${selectedAxisFrame.top}px`,
                width: `${selectedAxisFrame.width}px`,
                height: `${selectedAxisFrame.height}px`,
              }"
            />
            <div
              v-for="(row, rowIndex) in table.rows"
              :key="`row-${rowIndex}`"
              class="table-row"
              :style="{ height: `${table.rowHeights[rowIndex]}px` }"
            >
              <div
                class="row-control"
                :class="{
                  active:
                    selectedCell?.row === rowIndex || isRowSelected(rowIndex),
                }"
              >
                <button
                  v-if="
                    selectedCell?.row === rowIndex || isRowSelected(rowIndex)
                  "
                  class="axis-menu-button"
                  type="button"
                  @click="openMenu('row', rowIndex, $event)"
                >
                  <span class="axis-menu-line vertical" aria-hidden="true" />
                </button>
                <span
                  class="row-resize-handle"
                  @pointerdown="startResize('row', rowIndex, $event)"
                />
              </div>

              <div
                v-for="(_, columnIndex) in table.columnWidths"
                :key="`${rowIndex}-${columnIndex}`"
                class="table-cell"
                :class="{
                  selected: isCellSelected(rowIndex, columnIndex),
                  'selected-row': isRowSelected(rowIndex),
                  'selected-column': isColumnSelected(columnIndex),
                }"
                :style="{ width: `${table.columnWidths[columnIndex]}px` }"
                @click="selectCell(rowIndex, columnIndex)"
              >
                <textarea
                  v-model="row[columnIndex]"
                  class="cell-editor"
                  :readonly="readonly"
                  @keydown.stop
                />
                <span
                  class="cell-column-resize-handle"
                  @pointerdown="startResize('column', columnIndex, $event)"
                />
                <span
                  class="cell-row-resize-handle"
                  @pointerdown="startResize('row', rowIndex, $event)"
                />
              </div>
            </div>

            <button
              class="add-row-button"
              type="button"
              :style="{ width: `${tableWidth}px` }"
              @click="addRow()"
            >
              +
            </button>
          </div>

          <button
            class="add-column-button"
            type="button"
            :style="{ height: `${tableHeight}px` }"
            @click="addColumn()"
          >
            +
          </button>
        </div>
      </div>
    </div>

    <div
      v-if="menu"
      class="table-menu"
      :style="{ left: `${menu.x}px`, top: `${menu.y}px` }"
    >
      <button type="button" @click="runMenuAction('insert-before')">
        {{ menu.type === "row" ? "Вставить выше" : "Вставить слева" }}
      </button>
      <button type="button" @click="runMenuAction('insert-after')">
        {{ menu.type === "row" ? "Вставить ниже" : "Вставить справа" }}
      </button>
      <button type="button" @click="runMenuAction('duplicate')">
        Дублировать
      </button>
      <button type="button" @click="runMenuAction('clear')">Очистить</button>
      <button class="danger" type="button" @click="runMenuAction('delete')">
        Удалить
      </button>
    </div>
  </div>
</template>

<style scoped>
.table-block {
  position: relative;
  width: 100%;
  padding: 14px 0 18px;
}

.table-scroll {
  overflow-x: auto;
}

.table-stage {
  min-width: max-content;
}

.table-top-controls,
.table-body,
.table-row {
  display: flex;
}

.table-body {
  align-items: flex-start;
}

.table-grid {
  position: relative;
  flex: 0 0 auto;
}

.table-corner,
.row-control {
  position: relative;
  flex: 0 0 40px;
  width: 40px;
}

.column-control {
  position: relative;
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  border-top: 1px solid transparent;
  border-left: 1px solid transparent;
  background: transparent;
}

.row-control {
  display: grid;
  place-items: center;
  border-top: 1px solid transparent;
}

.column-control.active,
.row-control.active {
  background: #eef4ff;
}

.axis-menu-button {
  display: grid;
  place-items: center;
  padding: 0;
  border: 0;
  border-radius: 3px;
  background: #ffffff;
  color: #344054;
  font: inherit;
  font-size: 15px;
  line-height: 1;
}

.column-control .axis-menu-button {
  position: absolute;
  bottom: -6px;
  left: 50%;
  z-index: 6;
  width: 20px;
  height: 12px;
  transform: translateX(-50%);
}

.row-control .axis-menu-button {
  position: absolute;
  top: 50%;
  right: -6px;
  z-index: 6;
  width: 12px;
  height: 20px;
  transform: translateY(-50%);
}

.axis-menu-line {
  display: block;
  width: 10px;
  height: 2px;
  border-radius: 999px;
  background: currentColor;
}

.axis-menu-line.vertical {
  transform: rotate(90deg);
}

.table-cell {
  position: relative;
  flex: 0 0 auto;
  min-height: 100%;
  border-top: 1px solid #d9dde3;
  border-left: 1px solid #d9dde3;
  background: #ffffff;
}

.table-row:last-of-type .table-cell {
  border-bottom: 1px solid #d9dde3;
}

.table-cell:last-child {
  border-right: 1px solid #d9dde3;
}

.table-cell.selected {
  box-shadow: inset 0 0 0 2px #2f6fed;
}

.table-cell.selected-row,
.table-cell.selected-column {
  background: #eaf2ff;
}

.selected-axis-frame {
  position: absolute;
  z-index: 4;
  border: 2px solid #2f6fed;
  pointer-events: none;
}

.cell-editor {
  display: block;
  width: 100%;
  height: 100%;
  min-height: 100%;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  padding: 8px 10px;
  outline: 0;
  resize: none;
  overflow: hidden;
  white-space: pre-wrap;
}

.column-resize-handle {
  position: absolute;
  top: 0;
  right: -4px;
  z-index: 2;
  width: 8px;
  height: 100%;
  cursor: col-resize;
}

.row-resize-handle {
  position: absolute;
  left: 0;
  bottom: -4px;
  z-index: 2;
  width: 100%;
  height: 8px;
  cursor: row-resize;
}

.cell-column-resize-handle {
  position: absolute;
  top: 0;
  right: -4px;
  z-index: 3;
  width: 8px;
  height: 100%;
  cursor: col-resize;
}

.cell-row-resize-handle {
  position: absolute;
  left: 0;
  bottom: -4px;
  z-index: 3;
  width: 100%;
  height: 8px;
  cursor: row-resize;
}

.add-column-button,
.add-row-button {
  display: grid;
  place-items: center;
  border: 1px solid #d0d5dd;
  border-radius: 6px;
  background: #ffffff;
  color: #475467;
  font: inherit;
  font-size: 18px;
  line-height: 1;
}

.add-column-button {
  width: 28px;
  margin-left: 8px;
}

.add-row-button {
  height: 28px;
  margin-top: 8px;
  margin-left: 40px;
}

.add-column-button:hover,
.add-row-button:hover,
.axis-menu-button:hover {
  background: #f8f9fb;
}

.table-menu {
  position: fixed;
  z-index: 1000;
  display: grid;
  min-width: 180px;
  padding: 6px;
  border: 1px solid #d0d5dd;
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 12px 32px rgba(15, 23, 42, 0.16);
}

.table-menu button {
  height: 34px;
  padding: 0 10px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: #1f2328;
  font: inherit;
  font-size: 14px;
  text-align: left;
}

.table-menu button:hover {
  background: #f2f4f7;
}

.table-menu button.danger {
  color: #b42318;
}
</style>
