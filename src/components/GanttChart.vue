<script setup lang="ts">
import { onMounted, watch, ref, nextTick, computed, onUnmounted } from 'vue';
import Gantt from 'frappe-gantt';
import { parseISO, format, addDays } from 'date-fns';
import type { Task } from '../types';
import { useTaskStore } from '../stores/taskStore';
import { provide } from "vue";
import { eventBus } from '../event-bus/eventBus';

const taskStore = useTaskStore();
const ganttContainer = ref(null);
const ganttWrapper = ref(null);
let ganttChart: Gantt | null = null;
let resizeObserver: ResizeObserver | null = null;

// Compute the earliest start date from all tasks
const earliestStartDate = computed(() => {
  if (taskStore.tasks.length === 0) return new Date();
  
  return taskStore.tasks.reduce((earliest, task) => {
    const taskStart = parseISO(task.startDate);
    return taskStart < earliest ? taskStart : earliest;
  }, parseISO(taskStore.tasks[0].startDate));
});

// Compute the latest end date from all tasks
const latestEndDate = computed(() => {
  if (taskStore.tasks.length === 0) return addDays(new Date(), 7);
  
  return taskStore.tasks.reduce((latest, task) => {
    const taskEnd = parseISO(task.endDate);
    return taskEnd > latest ? taskEnd : latest;
  }, parseISO(taskStore.tasks[0].endDate));
});

const formatTasks = () => {
  // Ensure we have tasks to display
  if (taskStore.tasks.length === 0) {
    return [{
      id: 'placeholder',
      name: 'No tasks available',
      start: format(new Date(), 'yyyy-MM-dd'),
      end: format(addDays(new Date(), 7), 'yyyy-MM-dd'),
      progress: 0,
      dependencies: ''
    }];
  }
  
  return taskStore.tasks.map(task => ({
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
      view_mode: 'Week',
      language: 'en',
      scroll_to: startDate,
      view_mode: "Month",
      auto_move_label: true,
      update_view_scale: true,
      view_mode_select: true,
      lines: "None",
      upper_header_height: 30,
      snap_at: 30,
      start_date: startDate,  // Set the start date to the earliest task start date
      end_date: endDate,      // Set the end date to the latest task end date
      readonly: true,
    });
  }
};

// Handle resize to make the chart responsive
const handleResize = () => {
  if (ganttChart) {
    ganttChart.refresh(formatTasks());
    
    // Force a resize event after a slight delay to ensure proper rendering
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 100);
  }
};

// Create a ResizeObserver to watch for container size changes
const setupResizeObserver = () => {
  if (ganttWrapper.value && !resizeObserver) {
    resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(ganttWrapper.value);
  }
};

onMounted(async () => {
  // Ensure DOM is fully rendered before initializing Gantt
  await nextTick();
  renderGantt();
  setupResizeObserver();
  eventBus.on('refreshGantt', refreshGantt);
  // Initial resize handling
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  // Clean up event listeners and observers
    eventBus.off('refreshGantt', refreshGantt);
  window.removeEventListener('resize', handleResize);
  if (resizeObserver) {
    resizeObserver.disconnect();
    resizeObserver = null;
  }
});

// Watch for changes to tasks and re-render the chart
// watch(() => taskStore.tasks, () => {
//   if (ganttChart) {
//     // Completely re-render the chart to apply new date boundaries
//     renderGantt();
//   }
// }, { deep: true });

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