<script setup lang="ts">
import ProjectPlanner from './components/FrappeProjectPlanner.vue'
import GanttChart from './components/GanttChart.vue';
import { useTaskStore } from './stores/taskStore';
const taskStore = useTaskStore();

</script>

<template>
  <div class="app-container">
    <header class="app-header">
      <h1 class="text-2xl font-bold">Project Planner</h1>
    </header>
    <main class="app-main">
      <div class="flex flex-row space-x-4">
          <div class="border h-full w-full overflow-auto">
          <ProjectPlanner  class="h-full w-full" />
          </div>
      </div>                 
      <div class="flex flex-row space-x-8">
        <div class="order h-full w-full overflow-auto">
          <GanttChart  />
         </div></div>
    </main>

  </div>
</template>

<style>.app-container {
  @apply min-h-screen bg-gray-50 flex flex-col;
  height: 100vh; /* Full viewport height */
}

.app-header {
  @apply bg-white shadow px-6 py-3; /* Reduced padding */
  flex-shrink: 0; /* Prevent header from shrinking */
}

.app-main {
  @apply flex-grow px-4; /* Remove top/bottom padding, keep minimal side padding */
  overflow: hidden; /* Prevent scrollbars on the container itself */
  display: flex;
  flex-direction: column;
}

/* Add this to your ProjectPlanner component or globally */
:deep(.project-planner) {
  @apply h-full flex flex-col;
}
</style>