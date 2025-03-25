<script setup lang="ts">
import 'frappe-datatable/dist/frappe-datatable.css'

import { ref, computed, onMounted, watch } from 'vue';
import { format } from 'date-fns';
import type { Task, Column } from '../types';
import { TASK_TYPES } from '../types';
import DataTable from 'frappe-datatable';
import { useTaskStore } from '../stores/taskStore';
import { inject } from "vue";
import { eventBus } from '../event-bus/eventBus';

const taskStore = useTaskStore();
const tableEl = ref<HTMLElement | null>(null);
let datatable: any = null;
let lastEditedValue = null; 

const columns = [
  { name: 'Task Name', width: 200, sortable: false, editable: true, format: (value: string) => value.bold() },
  { name: 'Task Type', width: 50, editable: true, dropdown: true, options: TASK_TYPES },
  { name: 'Dependencies', width: 25, editable: true },
  { 
    name: 'Start Date', 
    width: 40, 
    editable: true, 
    format: (value: string) => formatDate(value),
    onCellChange: (cell, row, data, dataTable) => {
      // Update duration when start date changes
      const startDate = new Date(cell.content);
      const endDateCell = row.find(c => c.column.name === 'End Date');
      const endDate = endDateCell ? new Date(endDateCell.content) : null;
      
      // If we have a valid end date and it's before the new start date, update end date
      if (endDate && !isNaN(endDate) && endDate < startDate) {
        const newEndDate = new Date(startDate);
        newEndDate.setDate(startDate.getDate() + 1); // Default to 1 day duration
        endDateCell.content = newEndDate.toISOString().split('T')[0];
      }
      
      // Force refresh of the data to recalculate duration
      dataTable.refresh();
    }
  },
  { 
    name: 'End Date', 
    width: 40, 
    editable: true, 
    format: (value: string) => formatDate(value),
    onCellChange: (cell, row, data, dataTable) => {
      // Update duration when end date changes
      const endDate = new Date(cell.content);
      const startDateCell = row.find(c => c.column.name === 'Start Date');
      const startDate = startDateCell ? new Date(startDateCell.content) : null;
      
      // If we have a valid start date and it's after the new end date, update start date
      if (startDate && !isNaN(startDate) && startDate > endDate) {
        const newStartDate = new Date(endDate);
        newStartDate.setDate(endDate.getDate() - 1); // Default to 1 day duration
        startDateCell.content = newStartDate.toISOString().split('T')[0];
      }
      
      // Force refresh of the data to recalculate duration
      dataTable.refresh();
    }
  },
  { name: 'Progress', width: 10, editable: true, format: (value: number) => `${value}%` },
  {
    name: 'Duration (Days)',
    id: 'duration',
    width: 10,
    align: 'right',
    editable: true,
    format: (cell, row, data) => {
                const start = new Date(row[5].content);
                const end = new Date(row[6].content);
                console.log(end-start)
                return isNaN(start) || isNaN(end) ? 'N/A' : Math.round((end - start) / (1000 * 60 * 60 * 24));
    },
    onCellChange: (cell, row, data, dataTable) => {
      // Update end date when duration changes
      const duration = parseInt(cell.content);
      if (isNaN(duration)) return;
      
      const startDateCell = row.find(c => c.column.name === 'Start Date');
      const startDate = startDateCell ? new Date(startDateCell.content) : null;
      const endDateCell = row.find(c => c.column.name === 'End Date');
      
      if (startDate && !isNaN(startDate.getTime())) {
        const newEndDate = new Date(startDate);
        newEndDate.setDate(startDate.getDate() + duration);
        endDateCell.content = newEndDate.toISOString().split('T')[0];
        
        // Force refresh of the data
        dataTable.refresh();
      }
    }
  },
];

const columnToTaskMapping = {
  'Task Name': 'name',
  'Task Type': 'taskType',
  'Dependencies': 'dependencies',
  'Start Date': 'startDate',
  'End Date': 'endDate',
  'Duration (Days)': 'duration',
  'Progress': 'progress',
  'Assignee': 'assignee'
};


const showInsertMenu = ref(false);
const insertPosition = ref<number | null>(null);

function formatDate(date: string) {
  return format(new Date(date), 'MMM dd, yyyy');
}

function formatDependencies(dependencies: string[]): string {
  return dependencies.join(', ');
}
// Then use it in your computed property
const tableData = computed(() => {
  return taskStore.tasks.map((task, index) => {
    // Start with the non-mapped fields
    const rowData = {
      '#': index + 1,
      'indent': task.indent,
      'Actions': '',
    };
    
    // Add all the mapped fields
    Object.entries(columnToTaskMapping).forEach(([colName, propName]) => {
      // Special handling for dependencies which need formatting
      if (colName === 'Dependencies') {
        rowData[colName] = formatDependencies(task[propName]);
      } else {
        rowData[colName] = task[propName];
      }
    });
    
    return rowData;
  });
});

// Initialize and update DataTable
onMounted(() => {
  initDataTable();
});


const updateGantt = () => {
  eventBus.emit('refreshGantt', taskStore.task);
};
// Watch for changes in the task store
watch(() => taskStore.tasks, () => {
  if (datatable) {
    datatable.refresh(tableData.value);
  }
}, { deep: true });

function initDataTable() {
  if (!tableEl.value) return;
  
  datatable = new DataTable(tableEl.value, {
    columns: columns,
    data: tableData.value,
    checkboxColumn: true,
    serialNoColumn: true,
    layout: 'fluid',
    cellHeight: 28,
    treeView: true,
    indent: 1.5,
    pasteFromClipboard: true,
    //dynamicRowHeight: true,
    events: {
      onRemoveRow(rowIndex: number) {
        const taskId = taskStore.tasks[rowIndex].id;
        taskStore.deleteTask(taskId);
      }
    },
     getEditor1(colIndex, rowIndex, value, parent, column, row, data) {
      //show calendar control only for date columns
      if (column.name != 'Start Date' && column.name != 'End Date')  return;
      						const $input = document.createElement('input');
						$input.type = 'date';
						parent.appendChild($input);

						const parse = value => value.replace(/\//g, '-');
						const format = value => value.replace(/\-/g, '/');

						return {
							initValue(value) {
								$input.focus();
								$input.value = parse(value);
							},
							setValue(value) {
								$input.value = parse(value);
							},
							getValue() {
								return format($input.value);
							}
						}
    }
  });
window.datatable = datatable;

datatable.wrapper.addEventListener('input', function (e) {
    let editCell = e.target.closest('.dt-cell__edit');
    if (editCell) {
        lastEditedValue = editCell.textContent.trim(); // Capture latest input value
    }
});
datatable.wrapper.addEventListener('focusout', function(e) {
    let editCell = e.target.closest('.dt-input'); // Check if it's an edit cell
  //" data-row-index="1" data-col-index="2" 
   if (editCell) {
      debugger;
        const rootElement= editCell.parentElement.parentElement;
        let rowIndex = rootElement.dataset.rowIndex;
        let colIndex = rootElement.dataset.colIndex -1;
        let newValue = editCell?.value?.trim() || '';
        console.log(`Cell [${rowIndex}, ${colIndex}] updated to: ${newValue}`);
        // Call your function to sync state
        //get column name from colIndex
        //if checkbox column is present, then colIndex is off by 1
        if (datatable.options.checkboxColumn) {
            colIndex = colIndex - 1;
        }
        let colname=columns[colIndex].name;
        console.log(`Column Name: ${colname}`);
        //how to we map this to Task type?
        colname = columnToTaskMapping[colname];
        console.log(`Mapped Column Name: ${colname}`);
        //updateTableState(rowIndex, colname, newValue);
        taskStore.updateTaskValue(rowIndex, colname, newValue);
        // Highlight the edited cell (optional)
        editCell.style.backgroundColor = "#fffa90"; // Light yellow highlight
        setTimeout(() => editCell.style.backgroundColor = "", 1000); // Remove after 1 sec
   }
});

datatable.wrapper.addEventListener('focusout', function(e) {
    let rowElement = e.target.closest('.dt-row');
    if (rowElement) {
        let rowIndex = rowElement.dataset.rowIndex;
    }
});


datatable.wrapper.addEventListener('click', function(e) {
    let rowElement = e.target.closest('.dt-row');
    if (rowElement) {
        let rowIndex = rowElement.dataset.rowIndex;

        // Remove highlight from all rows
        datatable.rowmanager.highlightAll(false) 
        datatable.rowmanager.highlightRow(rowIndex, true);
        // Add highlight to the clicked row
        taskStore.selectedRow =parseInt(rowIndex);
    }
});


}

function addNewTask() {
  showInsertMenu.value = true;
}

function insertTaskAt(position: number) {
  taskStore.addTask(position);
}

function insertTaskAbove() {
  if (!taskStore.selectedRow) return;
  debugger;
  insertTaskAt(taskStore.selectedRow);
}

function insertTaskBelow() {
  if (!taskStore.selectedRow) return;  
  insertTaskAt(taskStore.selectedRow+1);
}

function insertTaskAtTop() {
  insertTaskAt(1);
}

function insertTaskAtBottom() {
  insertTaskAt(taskStore.tasks.length);
}

function deleteTask() {
  if (!taskStore.selectedRow) return;
  taskStore.deleteTask(taskStore.selectedRow);
}

function indentTask() {
  if (!taskStore.selectedRow) return;
  taskStore.indentTask(taskStore.selectedRow);
  // Update tree view in datatable
  if (datatable) {
    datatable.refresh(tableData.value);
  }
}

function unindentTask() {
  if (!taskStore.selectedRow) return;
  taskStore.unindentTask(taskStore.selectedRow);
  
  // Update tree view in datatable
  if (datatable) {
    datatable.refresh(tableData.value);
  }
}

function showInsertOptions(index: number) {
  insertPosition.value = index;
  showInsertMenu.value = true;
}

function closeInsertMenu() {
  showInsertMenu.value = false;
  insertPosition.value = null;
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
        
        <button @click="insertTaskAbove" class="toolbar-btn" title="Insert Above" :disabled="!taskStore.selectedRow">
          <svg xmlns="http://www.w3.org/2000/svg" class="icon" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clip-rule="evenodd" />
          </svg>
          <span>Insert Above</span>
        </button>
        
        <button @click="insertTaskBelow" class="toolbar-btn" title="Insert Below" :disabled="!taskStore.selectedRow">
          <svg xmlns="http://www.w3.org/2000/svg" class="icon" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
          </svg>
          <span>Insert Below</span>
        </button>
              <button @click="indentTask" class="toolbar-btn" title="Indent Task" :disabled="!taskStore.selectedRow">
          <svg xmlns="http://www.w3.org/2000/svg" class="icon" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M3 7a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 13a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM8 5a1 1 0 00-1 1v8a1 1 0 001 1h8a1 1 0 001-1V6a1 1 0 00-1-1H8z" clip-rule="evenodd" />
          </svg>
          <span>Indent</span>
        </button>
        
        <button @click="unindentTask" class="toolbar-btn" title="Unindent Task" :disabled="!taskStore.selectedRow">
          <svg xmlns="http://www.w3.org/2000/svg" class="icon" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M3 7a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 13a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM13 5a1 1 0 00-1 1v8a1 1 0 001 1h2a1 1 0 001-1V6a1 1 0 00-1-1h-2z" clip-rule="evenodd" />
          </svg>
          <span>Unindent</span>
        </button>
              
      <div class="toolbar-group">
        <button @click="deleteTask" class="toolbar-btn delete-btn" title="Delete Task" :disabled="!taskStore.selectedRow">
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