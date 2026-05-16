<script setup lang="ts">
import { computed } from 'vue'
import type { LotionBlock, LotionTableData } from '@/types/domain'

const props = defineProps<{
  block: LotionBlock
}>()

const table = computed<LotionTableData | null>(() => {
  return props.block.details.table ?? null
})
</script>

<template>
  <div v-if="table" class="canvas-card-table-wrap">
    <table class="canvas-card-table">
      <tbody>
        <tr v-for="(row, rowIndex) in table.rows" :key="rowIndex">
          <td v-for="(cell, cellIndex) in row" :key="cellIndex">
            <span v-if="cell" v-html="cell" />
            <span v-else>&nbsp;</span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
  <div v-else class="canvas-card-empty">Таблица не заполнена</div>
</template>

<style scoped>
.canvas-card-table-wrap {
  max-width: 100%;
  overflow: hidden;
  border: 1px solid #d8dce3;
  border-radius: 6px;
}

.canvas-card-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
  color: #242424;
  font-size: 11px;
  line-height: 1.3;
}

.canvas-card-table td {
  min-width: 0;
  padding: 5px 6px;
  border: 1px solid #e2e5ea;
  vertical-align: top;
  overflow-wrap: anywhere;
}

.canvas-card-table tr:first-child td {
  border-top: 0;
}

.canvas-card-table tr:last-child td {
  border-bottom: 0;
}

.canvas-card-table td:first-child {
  border-left: 0;
}

.canvas-card-table td:last-child {
  border-right: 0;
}

.canvas-card-empty {
  display: grid;
  place-items: center;
  min-height: 56px;
  border: 1px dashed #cfd4dc;
  border-radius: 6px;
  color: #7a828e;
  font-size: 12px;
}
</style>
