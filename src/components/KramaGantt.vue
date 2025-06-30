<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue'; // Removed 'effectScope'
import type { Task } from '../types/Task';
import { useTaskStore } from '../stores/taskStore';
import { useI18n } from 'vue-i18n'; // Import useI18n
import GanttChart from './GanttChart.vue'; // Import the GanttChart component

// import FrappeProjectPlanner from './FrappeProjectPlanner.vue'; // Placeholder for future integration

// --- Type Definitions ---
interface ProjectDataProp {
  id: string;
  name: string;
  status: string; // PS-01 Project Status
  tasks: Task[];
  // Potentially other project-level fields like resources, settings etc.
}

// --- Utility Functions ---
// For a robust solution, a library like lodash's isEqual or a more thorough custom deep comparison function would be better.
function simpleDeepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  // Basic deep clone for plain objects and arrays, does not handle Date, RegExp, Map, Set etc.
  return JSON.parse(JSON.stringify(obj));
}

function simpleIsEqual(obj1: any, obj2: any): boolean {
  // Basic equality check, susceptible to key order for objects and does not handle complex types well.
  return JSON.stringify(obj1) === JSON.stringify(obj2);
}

// --- Props ---
const props = defineProps<{
  projectData: ProjectDataProp;
  locale?: string; // For AF-02 Internationalization
  translations?: object; // For AF-02 Internationalization
}>();

// --- Emits ---
const emit = defineEmits<{
  (e: 'project-updated', data: ProjectDataProp): void; // For CT-02 Save/Export & IH-02 Data Change Events
  // (e: 'save-requested', saveHandler: () => Promise<void>): void; // Example for IH-03 Configurable Save
}>();

// --- Store ---
const taskStore = useTaskStore();

// --- I18n ---
const { t, locale: i18nLocale, mergeLocaleMessage } = useI18n(); // Removed setLocaleMessage

// --- Computed Properties ---
const displayedTasks = computed(() => taskStore.tasks); // For displaying tasks in the grid/list

// --- State for Dirty Checking (CT-02) ---
let pristineProjectData: ProjectDataProp | null = null; // Stores a snapshot of the data when last loaded/saved
const hasChanges = ref(false); // True if current data differs from pristineProjectData

// --- Project Status (PS-01, PS-02) ---
// Local ref for project status, initialized from prop and updated by UI.
// This status is part of the `ProjectDataProp` that gets saved.
const currentProjectStatus = ref(props.projectData.status);

// --- Helper Functions ---
// Builds the current state of project data from all relevant sources (props, local refs, store).
function getCurrentProjectData(): ProjectDataProp {
  return {
    id: props.projectData.id, // ID and Name are generally from the initial prop, not edited by Krama directly.
    name: props.projectData.name,
    status: currentProjectStatus.value,
    tasks: taskStore.tasks.map((task: Task) => simpleDeepClone(task)) // Typed task, Use deep clone for tasks from store
  };
}

// Checks if the current project data differs from the pristine snapshot.
function checkForChanges() {
  if (!pristineProjectData) {
    hasChanges.value = false; // Should not happen after mount if pristineProjectData is set.
    return;
  }
  const currentData = getCurrentProjectData();
  hasChanges.value = !simpleIsEqual(currentData, pristineProjectData);
}

// --- Lifecycle Hooks & Watchers ---
onMounted(() => {
  // Initialize the task store with tasks from the projectData prop.
  // This uses the store's `setTasks` action which also handles history reset.
  taskStore.setTasks(props.projectData.tasks.map((task: Task) => simpleDeepClone(task))); // Typed task

  // Initialize currentProjectStatus from the prop.
  currentProjectStatus.value = props.projectData.status;

  // Set the initial "pristine" state after the store and local refs are initialized.
  pristineProjectData = simpleDeepClone(getCurrentProjectData());

  checkForChanges(); // Perform an initial check (should result in `hasChanges = false`).

  // Handle initial locale and translations from props
  if (props.locale) {
    i18nLocale.value = props.locale;
  }
  if (props.translations && props.locale) {
    // Merge initial translations for the specified locale.
    // This assumes props.translations is an object structured like { en: { ... }, fr: { ... } }
    // For simplicity, if props.locale is 'en', and props.translations.en exists, merge it.
    // A more robust solution would iterate over props.translations keys.
    const messagesForLocale = (props.translations as any)[props.locale];
    if (messagesForLocale) {
      mergeLocaleMessage(props.locale, messagesForLocale);
    }
  } else if (props.translations) {
    // If translations are provided without a specific locale prop, merge them all.
    Object.keys(props.translations).forEach(lang => {
      mergeLocaleMessage(lang, (props.translations as any)[lang]);
    });
  }
});

// Watch for external changes to the entire projectData prop.
watch(() => props.projectData, (newData) => {
  taskStore.setTasks(newData.tasks.map((task: Task) => simpleDeepClone(task))); // Typed task
  currentProjectStatus.value = newData.status;

  // Update pristine state to reflect the new incoming data.
  pristineProjectData = simpleDeepClone(getCurrentProjectData());
  checkForChanges();
}, { deep: true });

// Watch for locale prop changes
watch(() => props.locale, (newLocale) => {
  if (newLocale) {
    i18nLocale.value = newLocale;
  }
});

// Watch for translations prop changes
watch(() => props.translations, (newTranslations) => {
  if (newTranslations) {
    if (props.locale) {
      const messagesForLocale = (newTranslations as any)[props.locale];
      if (messagesForLocale) {
        // Using setLocaleMessage will overwrite, mergeLocaleMessage will merge.
        // For dynamic updates, merging is often safer unless full replacement is intended.
        mergeLocaleMessage(props.locale, messagesForLocale);
      }
    } else {
      Object.keys(newTranslations).forEach(lang => {
        mergeLocaleMessage(lang, (newTranslations as any)[lang]);
      });
    }
  }
}, { deep: true });


// Watch for changes to tasks directly within the taskStore (e.g., due to user edits).
watch(() => taskStore.tasks, () => {
  checkForChanges();
}, { deep: true });

// Watch for changes to currentProjectStatus if it's modified directly (e.g., by UI).
watch(currentProjectStatus, () => {
  checkForChanges();
});


// --- Event Handlers ---
// Handles changes to the project status dropdown (PS-02).
function handleProjectStatusChange(newStatus: string) {
  if (currentProjectStatus.value !== newStatus) {
    currentProjectStatus.value = newStatus;
    // `checkForChanges` will be triggered by the watcher on `currentProjectStatus`.
    // No direct emit here; changes are emitted via Save.
  }
}

// --- Expand/Collapse All (CT-05) ---
function expandAllTasks() {
  // Create a batch of updates
  const updatesToApply: { taskId: string, changes: Partial<Task> }[] = [];
  taskStore.tasks.forEach(task => {
    if (task.isCollapsed !== false) {
      updatesToApply.push({ taskId: task.id, changes: { isCollapsed: false } });
    }
  });

  if (updatesToApply.length > 0) {
    // Consider adding a batch update action to taskStore if performance becomes an issue
    // For now, individual updates are fine and will be captured by history.
    updatesToApply.forEach(update => taskStore.updateTask(update.taskId, update.changes));
    // console.log("Krama: All tasks expanded.");
    // checkForChanges(); // Will be triggered by watcher on taskStore.tasks
  }
}

function collapseAllTasks() {
  const updatesToApply: { taskId: string, changes: Partial<Task> }[] = [];
  taskStore.tasks.forEach(task => {
    if (task.isCollapsed !== true) {
      updatesToApply.push({ taskId: task.id, changes: { isCollapsed: true } });
    }
  });

  if (updatesToApply.length > 0) {
    updatesToApply.forEach(update => taskStore.updateTask(update.taskId, update.changes));
    // console.log("Krama: All tasks collapsed.");
  }
}

// Handles the "Save" button click (CT-02).
function handleSave() {
  if (hasChanges.value) {
    const dataToSave = getCurrentProjectData();
    emit('project-updated', simpleDeepClone(dataToSave)); // Emit a clone of the data.

    // After successfully emitting (and theoretically saved by host), update pristine state.
    pristineProjectData = simpleDeepClone(dataToSave);
    checkForChanges(); // Should reset `hasChanges` to false.
    // console.log("Krama: Project data emitted via @project-updated.");
  } else {
    // console.log("Krama: No changes to save.");
  }
}

// TODO: Add Undo/Redo button handlers that call taskStore.undo() and taskStore.redo()

// --- Zoom Control (CT-04) ---
type ZoomLevel = 'Day' | 'Week' | 'Month';
const zoomLevels: ZoomLevel[] = ['Day', 'Week', 'Month'];
const currentZoomLevel = ref<ZoomLevel>('Week'); // Default zoom level

const canZoomIn = computed(() => {
  const currentIndex = zoomLevels.indexOf(currentZoomLevel.value);
  return currentIndex > 0;
});

const canZoomOut = computed(() => {
  const currentIndex = zoomLevels.indexOf(currentZoomLevel.value);
  return currentIndex < zoomLevels.length - 1;
});

function zoomIn() {
  if (canZoomIn.value) {
    const currentIndex = zoomLevels.indexOf(currentZoomLevel.value);
    currentZoomLevel.value = zoomLevels[currentIndex - 1];
    // console.log("Zoomed In to:", currentZoomLevel.value);
  }
}

function zoomOut() {
  if (canZoomOut.value) {
    const currentIndex = zoomLevels.indexOf(currentZoomLevel.value);
    currentZoomLevel.value = zoomLevels[currentIndex + 1];
    // console.log("Zoomed Out to:", currentZoomLevel.value);
  }
}

// TODO: Integrate FrappeProjectPlanner and GanttChart components.

</script>

<template>
  <div class="krama-gantt-component">
    <!-- Toolbar Placeholder -->
    <div class="krama-toolbar">
      <p>{{ t('krama.toolbar.project') }}: {{ props.projectData.name }} (ID: {{ props.projectData.id }})</p>
      <!-- PS-02: Status Control -->
      <label for="projectStatus">{{ t('krama.toolbar.statusLabel') }}</label>
      <select id="projectStatus" :value="currentProjectStatus" @change="handleProjectStatusChange(($event.target as HTMLSelectElement).value)">
        <option value="Draft">{{ t('krama.projectStatus.Draft') }}</option>
        <option value="In Progress">{{ t('krama.projectStatus.InProgress') }}</option>
        <option value="Completed">{{ t('krama.projectStatus.Completed') }}</option>
        <option value="On Hold">{{ t('krama.projectStatus.OnHold') }}</option>
        <option value="Cancelled">{{ t('krama.projectStatus.Cancelled') }}</option>
      </select>
      <button @click="handleSave" :disabled="!hasChanges" class="krama-save-button">
        {{ t('krama.toolbar.saveChanges') }}
      </button>
      <span v-if="!hasChanges" class="no-changes-text">{{ t('krama.toolbar.noChanges') }}</span>

      <!-- CT-04: Zoom Controls -->
      <div class="krama-toolbar-group">
        <button @click="zoomIn" :disabled="!canZoomIn" class="krama-toolbar-button" :title="t('krama.toolbar.zoomIn')">{{ t('krama.toolbar.zoomIn') }}</button>
        <span class="krama-zoom-level-text">{{ t('krama.toolbar.zoomView') }} {{ currentZoomLevel }}</span>
        <button @click="zoomOut" :disabled="!canZoomOut" class="krama-toolbar-button" :title="t('krama.toolbar.zoomOut')">{{ t('krama.toolbar.zoomOut') }}</button>
      </div>

      <!-- CT-05: Expand/Collapse All -->
      <div class="krama-toolbar-group">
        <button @click="expandAllTasks" class="krama-toolbar-button" :title="t('krama.toolbar.expandAll')">{{ t('krama.toolbar.expandAll') }}</button>
        <button @click="collapseAllTasks" class="krama-toolbar-button" :title="t('krama.toolbar.collapseAll')">{{ t('krama.toolbar.collapseAll') }}</button>
      </div>
    </div>

    <!-- Grid Area Placeholder -->
    <div class="krama-grid-area">
      <h4>{{ t('krama.grid.tasksTitle') }}</h4>
      <div class="task-list-container">
        <div class="task-item task-header">
          <span>{{ t('krama.grid.headers.id') }}</span>
          <span>{{ t('krama.grid.headers.title') }}</span>
          <span>{{ t('krama.grid.headers.typeArea') }}</span>
          <span>{{ t('krama.grid.headers.startDate') }}</span>
          <span>{{ t('krama.grid.headers.endDate') }}</span>
          <span>{{ t('krama.grid.headers.duration') }}</span>
          <span>{{ t('krama.grid.headers.progress') }}</span>
          <span>{{ t('krama.grid.headers.dependencies') }}</span>
        </div>
        <ul v-if="displayedTasks.length" class="task-list">
          <li v-for="task in displayedTasks" :key="task.id" class="task-item">
            <span>{{ task.id }}</span>
            <span>{{ task.name }}</span>
            <span>{{ task.taskType }}</span>
            <span>{{ task.startDate }}</span>
            <span>{{ task.endDate }}</span>
            <span>{{ task.duration !== undefined ? task.duration : 'N/A' }}</span>
            <span>{{ task.progress }}</span>
            <span>{{ task.dependencies && task.dependencies.length ? task.dependencies.join(', ') : t('krama.grid.headers.none') }}</span>
          </li>
        </ul>
        <p v-else>{{ t('krama.grid.noTasksLoaded') }}</p>
      </div>
      <!-- <FrappeProjectPlanner /> -->
    </div>

    <!-- Gantt Chart Area Placeholder -->
    <div class="krama-gantt-area">
      <GanttChart :zoom-level="currentZoomLevel" />
    </div>
  </div>
</template>

<style scoped>
.krama-gantt-component {
  display: flex;
  flex-direction: column;
  height: 100%;
  border: 1px solid #ccc;
  padding: 10px;
  font-family: sans-serif;
}

.krama-toolbar {
  padding: 10px;
  border-bottom: 1px solid #eee;
  margin-bottom: 10px;
  background-color: #f5f5f5;
}
.krama-toolbar label {
  margin-right: 5px;
}
.krama-toolbar select {
  padding: 5px;
  border-radius: 4px;
  margin-right: 10px;
}

.krama-toolbar-group {
  display: inline-flex;
  align-items: center;
  margin-left: 15px;
  padding-left: 15px;
  border-left: 1px solid #ddd;
}

.krama-toolbar-button {
  padding: 5px 10px;
  border-radius: 4px;
  border: 1px solid #ccc;
  background-color: #e7e7e7;
  color: #333;
  cursor: pointer;
  margin: 0 5px;
}

.krama-toolbar-button:disabled {
  background-color: #f5f5f5;
  color: #aaa;
  cursor: not-allowed;
}

.krama-zoom-level-text {
  margin: 0 5px;
  font-size: 0.9em;
  color: #555;
}

.krama-save-button {
  padding: 5px 10px;
  border-radius: 4px;
  border: 1px solid #ccc;
  background-color: #4CAF50; /* Green */
  color: white;
  cursor: pointer;
  margin-left: 10px;
}

.krama-save-button:disabled {
  background-color: #ccc;
  color: #666;
  cursor: not-allowed;
}

.no-changes-text {
  margin-left: 5px;
  font-size: 0.9em;
  color: #777;
}

.krama-grid-area {
  flex-grow: 1;
  background-color: #f0f0f0;
  padding: 10px;
  margin-bottom: 10px;
  overflow-y: auto;
}

.krama-grid-area h4 {
  margin-top: 0;
  margin-bottom: 8px;
}

.task-list-container {
  display: flex;
  flex-direction: column;
  border: 1px solid #ddd;
  border-radius: 4px;
  overflow-x: auto; /* For smaller screens if content overflows */
}

.task-item {
  display: grid;
  grid-template-columns: minmax(50px, 1fr) minmax(150px, 3fr) minmax(100px, 2fr) minmax(100px, 2fr) minmax(100px, 2fr) minmax(80px, 1fr) minmax(80px, 1fr) minmax(120px, 2fr);
  gap: 8px;
  padding: 8px;
  border-bottom: 1px solid #eee;
  align-items: center;
}

.task-item:last-child {
  border-bottom: none;
}

.task-header {
  font-weight: bold;
  background-color: #f9f9f9;
}

.task-item span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.task-list {
  list-style-type: none;
  padding-left: 0;
  margin: 0;
}

.krama-gantt-area {
  flex-grow: 1;
  background-color: #e0e0e0;
  padding: 10px;
}
</style>
