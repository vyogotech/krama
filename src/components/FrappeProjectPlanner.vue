<script setup lang="ts">
import 'frappe-datatable/dist/frappe-datatable.css'

import { ref, computed, onMounted, watch } from 'vue';
import { format, differenceInCalendarDays, addDays } from 'date-fns'; // Added differenceInCalendarDays, addDays
import type { Task } from '../types'; // Task is now the consolidated one, removed unused Column
import { TASK_TYPES } from '../types'; // This is actually from src/types/types.ts, consider path
import DataTable from 'frappe-datatable';
import { useTaskStore } from '../stores/taskStore';
// import { inject } from "vue"; // Unused
import { eventBus } from '../event-bus/eventBus'; // Used for refreshGantt

// Define a more specific type for Frappe DataTable columns if possible, or use 'any' for now.
// This is a simplified version of what FrappeDataTable might expect.
interface FrappeColumn {
  name: string;
  id?: string;
  width: number;
  sortable?: boolean;
  editable?: boolean;
  format?: (value: any, cell?: any, row?: any, data?: any) => string | HTMLElement; // Adjusted format
  dropdown?: boolean;
  options?: string[];
  align?: 'left' | 'right' | 'center';
  onCellChange?: (cell: any, row: any, data: any, dataTable: any) => void; // Added types
}


const taskStore = useTaskStore();
const tableEl = ref<HTMLElement | null>(null);
let datatable: any = null; // Keep as any for now due to lack of official types for instance
// let lastEditedValue = null; // Unused

const columns: FrappeColumn[] = [ // Explicitly typed
  { name: 'Task Name', width: 200, sortable: false, editable: true, format: (value: string) => value ? value.bold() : '' },
  { name: 'Task Type', id: 'taskType', width: 120, editable: true, dropdown: true, options: TASK_TYPES }, // Adjusted width
  { name: 'Dependencies', id: 'dependencies', width: 100, editable: true }, // Adjusted width
  { 
    name: 'Start Date', 
    id: 'startDate',
    width: 120, // Adjusted width
    editable: true, 
    format: (value: string) => value ? formatDate(value) : '',
    onCellChange: (cell: any, row: any, _data: any, dataTable: any) => {
      const startDate = new Date(cell.content);
      const endDateCell = row.find((c: any) => c.column.name === 'End Date');
      if (endDateCell) {
        const endDate = new Date(endDateCell.content);
        if (endDate && !isNaN(endDate.getTime()) && endDate < startDate) {
          const newEndDate = addDays(startDate, 1); // Default to 1 day duration
          endDateCell.content = format(newEndDate, 'yyyy-MM-dd');
        }
      }
      dataTable.refresh();
    }
  },
  { 
    name: 'End Date', 
    id: 'endDate',
    width: 120, // Adjusted width
    editable: true, 
    format: (value: string) => value ? formatDate(value): '',
    onCellChange: (cell: any, row: any, _data: any, dataTable: any) => {
      const endDate = new Date(cell.content);
      const startDateCell = row.find((c: any) => c.column.name === 'Start Date');
      if (startDateCell) {
        const startDate = new Date(startDateCell.content);
        if (startDate && !isNaN(startDate.getTime()) && startDate > endDate) {
          const newStartDate = addDays(endDate, -1); // Default to 1 day duration
          startDateCell.content = format(newStartDate, 'yyyy-MM-dd');
        }
      }
      dataTable.refresh();
    }
  },
  { name: 'Progress', id: 'progress', width: 80, editable: true, format: (value: number) => `${value || 0}%` }, // Adjusted width
  {
    name: 'Duration (Days)',
    id: 'duration',
    width: 100, // Adjusted width
    align: 'right',
    editable: true,
    format: (_cell: any, row: any, _data: any) => { // Parameters typed
        // Assuming row data is an array where indices correspond to column order
        // This is fragile; Frappe DataTable might provide data object directly in `row` or `data`
        // For now, let's assume row[3] is StartDate, row[4] is EndDate based on current column order
        const startDateString = row.find((c:any) => c.column.id === 'startDate')?.content;
        const endDateString = row.find((c:any) => c.column.id === 'endDate')?.content;

        if (startDateString && endDateString) {
            const start = new Date(startDateString);
            const end = new Date(endDateString);
            if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && end >= start) {
                // console.log(`Duration calc: End ${end}, Start ${start}, Diff: ${differenceInCalendarDays(end, start) + 1}`);
                return (differenceInCalendarDays(end, start) + 1).toString(); // +1 for inclusive days
            }
        }
        return 'N/A';
    },
    onCellChange: (cell: any, row: any, _data: any, dataTable: any) => {
      const duration = parseInt(cell.content, 10);
      if (isNaN(duration) || duration < 0) return;
      
      const startDateCell = row.find((c: any) => c.column.name === 'Start Date');
      const endDateCell = row.find((c: any) => c.column.name === 'End Date');
      
      if (startDateCell && startDateCell.content && endDateCell) {
        const startDate = new Date(startDateCell.content);
        if (!isNaN(startDate.getTime())) {
          const newEndDate = addDays(startDate, duration > 0 ? duration -1 : 0); // duration includes start day
          endDateCell.content = format(newEndDate, 'yyyy-MM-dd');
          dataTable.refresh();
        }
      }
    }
  },
];

// const columnToTaskMapping: { [key: string]: keyof Task | null } = { // Unused now, column.id is used
//   'Task Name': 'name',
//   'Task Type': 'taskType',
//   'Dependencies': 'dependencies',
//   'Start Date': 'startDate',
//   'End Date': 'endDate',
//   'Duration (Days)': 'duration',
//   'Progress': 'progress',
//   // 'Assignee': 'assignee'
// };


const showInsertMenu = ref(false);
// const insertPosition = ref<number | null>(null); // Seems unused

function formatDate(dateString: string): string {
  if (!dateString) return '';
  try {
    return format(new Date(dateString), 'MMM dd, yyyy');
  } catch (e) {
    return dateString; // Return original if formatting fails
  }
}

function formatDependencies(dependencies?: string[]): string {
  if (!dependencies || dependencies.length === 0) return '';
  return dependencies.join(', ');
}

const tableData = computed(() => {
  return taskStore.tasks.map((task: Task, index: number) => { // Typed task and index
    return {
        '#': index + 1,
        'indent': task.indent,
        'Task Name': task.name,
        'Task Type': task.taskType,
        'Dependencies': formatDependencies(task.dependencies),
        'Start Date': task.startDate,
        'End Date': task.endDate,
        'Progress': task.progress,
        'duration': task.duration,
    };
  });
});

onMounted(() => {
  initDataTable();
});

// Watch for changes in the task store
watch(() => taskStore.tasks, () => {
  if (datatable) {
    // console.log("Refreshing datatable due to taskStore.tasks change");
    datatable.refresh(tableData.value); // tableData is already computed from taskStore.tasks
    eventBus.emit('refreshGantt'); // Emit event to refresh Gantt chart
  }
}, { deep: true });

function initDataTable() {
  if (!tableEl.value || datatable) return; // Prevent re-initialization
  
  datatable = new DataTable(tableEl.value, {
    columns: columns,
    data: tableData.value,
    checkboxColumn: true,
    serialNoColumn: true, // Uses '#' key from data
    layout: 'fluid',
    cellHeight: 28, // Consider making this configurable
    treeView: true, // Assumes data has 'indent'
    // indent: 1.5, // Default is 1.5 rem
    pasteFromClipboard: true,
    events: {
      onRemoveRow: (rowIndex: number) => { // This rowIndex is from the datatable's view
        // It's safer to get the task ID from the store based on the data if possible,
        // or ensure tableData provides the original task ID if rows can be reordered/filtered.
        // For now, assuming rowIndex directly maps to taskStore.tasks index.
        if (taskStore.tasks[rowIndex]) {
          const taskId = taskStore.tasks[rowIndex].id;
          taskStore.deleteTask(taskId);
        }
      }
    },
     getEditor: (_colIndex: number, _rowIndex: number, _value: any, parent: HTMLElement, column: FrappeColumn, _row: any, _data: any) => { // _colIndex marked as unused
      if (column.id === 'startDate' || column.id === 'endDate') {
        const input = document.createElement('input');
        input.type = 'date';
        parent.appendChild(input);

        const parse = (val: string) => val ? val.replace(/\//g, '-') : '';
        const formatVal = (val: string) => val ? val.replace(/-/g, '/') : '';

        return {
            initValue(val: string) {
                input.focus();
                input.value = parse(val);
            },
            setValue(val: string) {
                input.value = parse(val);
            },
            getValue() {
                return formatVal(input.value);
            }
        };
      }
      return undefined; // Use default editor for other columns
    }
  });
// window.datatable = datatable; // Removed for production code

// Custom event listener for cell updates (focusout on input)
// Frappe DataTable might have its own cell update events that are more robust.
// This is a common pattern if direct input manipulation is needed.
  datatable.wrapper.addEventListener('focusout', (e: FocusEvent) => {
    const target = e.target as HTMLElement;
    const editInput = target.closest('.dt-input') as HTMLInputElement | HTMLSelectElement; // Could be input or select

    if (editInput && editInput.parentElement?.parentElement) {
      const cellElement = editInput.parentElement.parentElement as HTMLElement;
      const rowIndexStr = cellElement.dataset.rowIndex;
      let colIndexStr = cellElement.dataset.colIndex;

      if (rowIndexStr && colIndexStr) {
        const rowIndex = parseInt(rowIndexStr, 10);
        let colIndex = parseInt(colIndexStr, 10);

        if (datatable.options.checkboxColumn) colIndex--; // Adjust for checkbox column
        if (datatable.options.serialNoColumn) colIndex--; // Adjust for serial number column

        const column = columns[colIndex];
        if (column && column.id) { // Ensure column and column.id exist
          const taskKey = column.id as keyof Task; // Map column name/id to Task key
          const newValue = editInput.value.trim();

          // console.log(`Focusout: Cell [${rowIndex}, ${taskKey}] updated to: ${newValue}`);
          if (taskStore.tasks[rowIndex]) { // Ensure task exists at this index
            taskStore.updateTaskValue(rowIndex, taskKey, newValue);
            // Optionally highlight:
            // editInput.style.backgroundColor = "#fffa90";
            // setTimeout(() => { editInput.style.backgroundColor = ""; }, 1000);
          }
        }
      }
    }
  });

  datatable.wrapper.addEventListener('click', (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    const rowElement = target.closest('.dt-row') as HTMLElement;
    if (rowElement && rowElement.dataset.rowIndex) {
        const rowIndex = parseInt(rowElement.dataset.rowIndex, 10);
        if (taskStore.tasks[rowIndex]) {
          // datatable.rowmanager.highlightAll(false); // This might not be a public API
          // datatable.rowmanager.highlightRow(rowIndex, true); // This might not be a public API
          taskStore.selectTask(taskStore.tasks[rowIndex].id); // Select by ID
        }
    }
  });
}

function addNewTask() {
  showInsertMenu.value = true;
}

function insertTaskAt(position: number) {
  taskStore.addTask(position);
  // Consider closing menu and refreshing table if needed
  showInsertMenu.value = false;
}

function insertTaskAbove() {
  if (taskStore.selectedRow === null || taskStore.selectedRow === undefined) return;
  insertTaskAt(taskStore.selectedRow);
}

function insertTaskBelow() {
  if (taskStore.selectedRow === null || taskStore.selectedRow === undefined) return;
  insertTaskAt(taskStore.selectedRow + 1);
}

function insertTaskAtTop() {
  insertTaskAt(0); // Insert at the beginning of the array
}

function insertTaskAtBottom() {
  insertTaskAt(taskStore.tasks.length);
}

function deleteTaskHandler() { // Renamed to avoid conflict with imported 'deleteTask' from store if any confusion
  if (taskStore.selectedRow === null || taskStore.selectedRow === undefined) return;
  const taskToDelete = taskStore.tasks[taskStore.selectedRow];
  if (taskToDelete) {
    taskStore.deleteTask(taskToDelete.id);
  }
}

function indentTaskHandler() { // Renamed
  if (taskStore.selectedRow === null || taskStore.selectedRow === undefined) return;
  const taskToIndent = taskStore.tasks[taskStore.selectedRow];
  if (taskToIndent) {
    taskStore.indentTask(taskToIndent.id);
    // Datatable refresh is handled by watcher on taskStore.tasks
  }
}

function unindentTaskHandler() { // Renamed
  if (taskStore.selectedRow === null || taskStore.selectedRow === undefined) return;
  const taskToUnindent = taskStore.tasks[taskStore.selectedRow];
  if (taskToUnindent) {
    taskStore.unindentTask(taskToUnindent.id);
  }
}

// function showInsertOptions(index: number) { // Unused
//   insertPosition.value = index;
//   showInsertMenu.value = true;
// }

function closeInsertMenu() {
  showInsertMenu.value = false;
  // insertPosition.value = null; // insertPosition seems unused
}
</script>

<template>
  <div class="project-planner">
    <div class="toolbar">
      <div class="toolbar-group">
        <button @click="addNewTask" class="toolbar-btn" title="Add Task">
          <svg xmlns="http://www.w3.org/2000/svg" class="icon" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
          </svg>
          <span>Add Task</span>
        </button>
        
        <button @click="insertTaskAbove" class="toolbar-btn" title="Insert Above" :disabled="taskStore.selectedRow === null">
          <svg xmlns="http://www.w3.org/2000/svg" class="icon" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clip-rule="evenodd" />
          </svg>
          <span>Insert Above</span>
        </button>
        
        <button @click="insertTaskBelow" class="toolbar-btn" title="Insert Below" :disabled="taskStore.selectedRow === null">
          <svg xmlns="http://www.w3.org/2000/svg" class="icon" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
          </svg>
          <span>Insert Below</span>
        </button>
              <button @click="indentTaskHandler" class="toolbar-btn" title="Indent Task" :disabled="taskStore.selectedRow === null">
          <svg xmlns="http://www.w3.org/2000/svg" class="icon" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M3 7a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 13a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM8 5a1 1 0 00-1 1v8a1 1 0 001 1h8a1 1 0 001-1V6a1 1 0 00-1-1H8z" clip-rule="evenodd" />
          </svg>
          <span>Indent</span>
        </button>
        
        <button @click="unindentTaskHandler" class="toolbar-btn" title="Unindent Task" :disabled="taskStore.selectedRow === null">
          <svg xmlns="http://www.w3.org/2000/svg" class="icon" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M3 7a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 13a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM13 5a1 1 0 00-1 1v8a1 1 0 001 1h2a1 1 0 001-1V6a1 1 0 00-1-1h-2z" clip-rule="evenodd" />
          </svg>
          <span>Unindent</span>
        </button>
              
      <div class="toolbar-group">
        <button @click="deleteTaskHandler" class="toolbar-btn delete-btn" title="Delete Task" :disabled="taskStore.selectedRow === null">
          <svg xmlns="http://www.w3.org/2000/svg" class="icon" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
          </svg>
          <span>Delete</span>
        </button>
      </div>
      </div>
      
      <!-- <div class="toolbar-group">
  
      </div> -->

    </div>
    
    <div class="split-view">
      <!-- Frappe DataTable container -->
      <div class="datatable-container" >
        <div ref="tableEl" class="datatable" style="height: 300px;overflow:auto;"></div>
      </div>
      
    </div>

    <!-- Insert Task Menu -->
    <div v-if="showInsertMenu" class="insert-menu-overlay" @click="closeInsertMenu">
      <div class="insert-menu" @click.stop>
        <h3 class="insert-menu-title">Insert Task</h3>
        <button @click="insertTaskAtTop" class="insert-menu-btn">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clip-rule="evenodd" />
          </svg>
          At Top
        </button>
        <button v-if="taskStore.selectedRow" @click="insertTaskAbove" class="insert-menu-btn">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L10 6.414l-3.293 3.293a1 1 0 01-1.414 0z" clip-rule="evenodd" />
          </svg>
          Above Selected
        </button>
        <button v-if="taskStore.selectedRow" @click="insertTaskBelow" class="insert-menu-btn">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L10 13.586l3.293-3.293a1 1 0 011.414 0z" clip-rule="evenodd" />
          </svg>
          Below Selected
        </button>
        <button @click="insertTaskAtBottom" class="insert-menu-btn">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
          </svg>
          At Bottom
        </button>
        <button @click="closeInsertMenu" class="insert-menu-btn cancel">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
          </svg>
          Cancel
        </button>

      </div>
    </div>
  </div>
</template>

<style scoped>
.project-planner {
  @apply p-4;
}
.datatable {
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  line-height: 0.75;
  }

.toolbar {
  @apply mb-4 flex items-center justify-between bg-white p-2 rounded-lg shadow;
}

.toolbar-group {
  @apply flex items-center space-x-1 border-r border-gray-200 pr-2 mr-2 last:border-r-0 last:pr-0 last:mr-0;
}

.toolbar-btn {
  @apply flex items-center px-3 py-1.5 rounded text-sm font-medium transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed;
  @apply bg-gray-100 text-gray-700 hover:bg-gray-200;
}

.toolbar-btn.delete-btn {
  @apply bg-red-50 text-red-600 hover:bg-red-100;
}

.toolbar-btn .icon {
  @apply h-5 w-5 mr-1.5;
}

.split-view {
  @apply space-y-4;
}

.datatable-container {
  @apply border border-gray-200 rounded;
  min-height: 300px;
}
.highlighted-row {
    background-color: rgba(0, 123, 255, 0.2); /* Light blue */
    transition: background-color 0.3s ease-in-out;
}

/* Optional: Add a border for better visibility */
.highlighted-row:hover {
    background-color: rgba(0, 123, 255, 0.3);
    border-left: 4px solid #007bff;
}
.datatable {
  width: 100%;
  height: 100%;
}

.action-btn {
  @apply w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 focus:outline-none;
}

.insert-menu-overlay {
  @apply fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50;
}

.insert-menu {
  @apply bg-white rounded-lg shadow-lg p-4 w-64;
}

.insert-menu-title {
  @apply text-lg font-bold mb-3 text-center;
}

.insert-menu-btn {
  @apply w-full py-2 px-4 flex items-center rounded mb-2 hover:bg-gray-100;
}

.insert-menu-btn.cancel {
  @apply bg-gray-200 hover:bg-gray-300 mt-2;
}
</style>