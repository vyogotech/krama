<script setup lang="ts">
import { onMounted, watch, ref, nextTick, computed, onUnmounted, PropType } from 'vue';
import Gantt from 'frappe-gantt';
import { parseISO, format, addDays } from 'date-fns';
// Task type from '../types' is implicitly used by taskStore.tasks.
// Explicit import removed as it's not used for direct annotations in this file.
import { useTaskStore } from '../stores/taskStore';
// import { provide } from "vue"; // provide seems unused
import { eventBus } from '../event-bus/eventBus';

type ZoomLevel = 'Day' | 'Week' | 'Month'; // Matches KramaGantt.vue zoom levels

// Interface for the task object structure that frappe-gantt uses and passes to on_click
interface FrappeGanttTask {
  id: string;
  name: string;
  start: string; // YYYY-MM-DD
  end: string;   // YYYY-MM-DD
  progress: number;
  dependencies?: string; // Comma-separated string
  custom_class?: string;
  // other fields frappe-gantt might add
  [key: string]: any; // Allow other properties
}

const props = defineProps({
  zoomLevel: {
    type: String as PropType<ZoomLevel>,
    required: true,
    default: 'Week'
  }
});

const taskStore = useTaskStore();
const ganttContainer = ref<HTMLElement | null>(null);
const ganttWrapper = ref<HTMLElement | null>(null);
let ganttChart: any = null; // Changed Gantt to any
let resizeObserver: ResizeObserver | null = null;

// Compute the earliest start date from all tasks
const earliestStartDate = computed(() => {
  if (taskStore.tasks.length === 0) return new Date();
  // Initialize with the first task's start date, parsed
  const initialDate = taskStore.tasks[0] ? parseISO(taskStore.tasks[0].startDate) : new Date();
  return taskStore.tasks.reduce((earliest: Date, task) => { // Typed earliest and task
    const taskStart = parseISO(task.startDate);
    return taskStart < earliest ? taskStart : earliest;
  }, initialDate);
});

// Compute the latest end date from all tasks
const latestEndDate = computed(() => {
  if (taskStore.tasks.length === 0) return addDays(new Date(), 7);
  const initialDate = taskStore.tasks[0] ? parseISO(taskStore.tasks[0].endDate) : addDays(new Date(), 7);
  return taskStore.tasks.reduce((latest: Date, task) => { // Typed latest and task
    const taskEnd = parseISO(task.endDate);
    return taskEnd > latest ? taskEnd : latest;
  }, initialDate);
});

const formatTasks = () => {
  // Ensure we have tasks to display
  if (taskStore.tasks.length === 0) {
    return [{
      id: 'placeholder',
      name: 'No tasks available', // Consider using i18n here later
      start: format(new Date(), 'yyyy-MM-dd'),
      end: format(addDays(new Date(), 7), 'yyyy-MM-dd'),
      progress: 0,
      dependencies: ''
    }];
  }
  
  return taskStore.tasks.map(task => ({ // task here is from taskStore.tasks, already typed Task
    id: task.id,
    name: task.name,
    start: format(parseISO(task.startDate), 'yyyy-MM-dd'),
    end: format(parseISO(task.endDate), 'yyyy-MM-dd'),
    progress: task.progress,
    dependencies: task.dependencies?.join(',') || ""
  }));
};

const renderGantt = () => {
  if (ganttContainer.value) {
    // Clear container first in case of re-rendering
    ganttContainer.value.innerHTML = '';
    
    // Format dates for Gantt configuration
    const startDate = format(earliestStartDate.value, 'yyyy-MM-dd');
    const endDate = format(latestEndDate.value, 'yyyy-MM-dd');
    
    // Create and render the Gantt chart with custom date range
    ganttChart = new Gantt(ganttContainer.value, formatTasks(), {
      view_mode: props.zoomLevel, // Use prop for initial view_mode
      language: 'en', // TODO: Make this configurable via props if needed for i18n
      scroll_to: startDate, // Sensible default, might need adjustment based on actual task dates
      // view_mode: "Month", // This was duplicated, removed
      auto_move_label: true,
      update_view_scale: true, // Important for dynamic changes
      // view_mode_select: true, // This adds a dropdown in frappe-gantt, Krama has its own
      lines: "None", // "None" or "Both" or "Horizontal" or "Vertical"
      upper_header_height: 30, // Example value
      // snap_at: 30, // Example value, might relate to snapping behavior not needed for read-only
      start_date: startDate,
      end_date: endDate,
      readonly: true, // As per existing setup, Krama interactions are in the grid
      custom_popup_html: null, // Disable default popup for now
      on_click: (task: FrappeGanttTask) => { // Typed the task parameter
        // Potentially emit an event or select task in store
        // console.log("Gantt task clicked:", task);
        taskStore.selectTask(task.id); // task.id is string, selectTask expects string | null
      },
      // on_date_change: (task, start, end) => { /* For editable charts */ },
      // on_progress_change: (task, progress) => { /* For editable charts */ },
      // on_view_change: (mode) => { /* console.log("Gantt view mode changed to:", mode); */ }
    });
  }
};

// Handle resize to make the chart responsive
const handleResize = () => {
  if (ganttChart && ganttContainer.value && ganttContainer.value.offsetWidth > 0) {
    // Frappe-gantt typically refreshes on window resize.
    // If direct refresh is needed:
    // ganttChart.refresh(formatTasks());
  }
};

// Create a ResizeObserver to watch for container size changes
const setupResizeObserver = () => {
  if (ganttWrapper.value && !resizeObserver) {
    resizeObserver = new ResizeObserver(handleResize); // handleResize might need to trigger gantt refresh
    resizeObserver.observe(ganttWrapper.value);
  }
};

// Helper function to refresh or re-render the Gantt chart
function refreshGanttChart() {
  if (ganttChart && ganttContainer.value) {
    // Option 1: Full re-render (safer if date ranges or tasks drastically change)
    // ganttContainer.value.innerHTML = ''; // Clear previous
    // renderGantt();

    // Option 2: Refresh with new tasks (might be sufficient for task data changes)
     ganttChart.refresh(formatTasks());
  } else if (ganttContainer.value) {
    // If chart doesn't exist but container does, try to render it.
    renderGantt();
  }
}

onMounted(async () => {
  await nextTick();
  renderGantt();
  setupResizeObserver();
  // eventBus.on('refreshGantt', refreshGantt); // 'refreshGantt' was not defined, replaced with refreshGanttChart
  eventBus.on('refreshGantt', refreshGanttChart);
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  eventBus.off('refreshGantt', refreshGanttChart);
  window.removeEventListener('resize', handleResize);
  if (resizeObserver) {
    resizeObserver.disconnect();
    resizeObserver = null;
  }
  if (ganttChart) {
    // ganttChart.destroy(); // If frappe-gantt has a destroy method
    ganttChart = null;
  }
});

// Watch for changes to tasks from the store
watch(() => taskStore.tasks, () => {
  if (ganttChart) {
    // Update date range for Gantt chart if necessary
    // This is important if tasks are added/removed or dates change significantly
    // const newStartDate = format(earliestStartDate.value, 'yyyy-MM-dd');
    // const newEndDate = format(latestEndDate.value, 'yyyy-MM-dd');
    // ganttChart.setup_date_values(); // May need to re-setup dates, or full re-render

    refreshGanttChart(); // Re-render or refresh
  }
}, { deep: true });

// Watch for zoomLevel prop changes
watch(() => props.zoomLevel, (newZoomLevel) => {
  if (ganttChart && newZoomLevel) {
    ganttChart.change_view_mode(newZoomLevel);
  }
});

</script>

<template>
  <div ref="ganttWrapper" class="gantt-wrapper">
    <div class="gantt-container z-20">
      <div ref="ganttContainer" class="gantt-chart z-10"></div>
    </div>
  </div>
</template>

<style>
/* Global styles for Frappe Gantt */


</style>

<style scoped>
.gantt-wrapper {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow-x: auto;
  display: flex;
  flex-direction: column;
}


.gantt-container {
  flex: 1;
  width: 100%;
  height: 100%;
  overflow-x: auto;
  background-color: white;
  border: 1px solid #ddd;
  border-radius: 5px;
  margin: 0;
  padding: 0;
}

.gantt-chart {
  width: 100%;
  height: 100%;
}



</style>