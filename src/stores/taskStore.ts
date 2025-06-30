// src/stores/taskStore.ts
import { defineStore } from 'pinia'; // Removed storeToRefs
import { ref as vueRef } from 'vue'; // Use vueRef, removed computed
import { format } from 'date-fns';
import type { Task } from '../types'; // This should now point to the corrected Task type
import { useRefHistory } from '@vueuse/core';

// Initial Data (moved outside for clarity, can be part of state function too)
const initialTasks: Task[] = [
  {
    id: '1',
    name: 'Site Preparation',
    startDate: '2024-01-01',
    endDate: '2024-01-10',
    progress: 0,
    assignee: 'John Doe',
    dependencies: [],
    indent: 0,
    duration: 10,
    parentId: null,
    taskType: 'Preparation',
  },
  {
    id: '2',
    name: 'Foundation Work',
    startDate: '2024-01-11',
    endDate: '2024-01-20',
    progress: 0,
    assignee: 'Jane Smith',
    dependencies: ['1'],
    indent: 1,
    duration: 10,
    parentId: null,
    taskType: 'Construction',
  },
  // ... (other initial tasks can be kept or removed for brevity in this example)
  {
    id: '20',
    name: 'Project Completion',
    startDate: '2024-07-01',
    endDate: '2024-07-01',
    progress: 0,
    assignee: 'Jane Smith',
    dependencies: ['19'], // Assuming task 19 exists or this is illustrative
    indent: 0,
    duration: 1,
    parentId: null,
    taskType: 'Completion',
  },
];


export const useTaskStore = defineStore('tasks', () => {
  // State
  const tasks = vueRef<Task[]>([...initialTasks].map(task => ({...task}))); // Ensure it's a reactive ref and cloned
  const selectedRow = vueRef<number | null>(null);

  // Undo/Redo History for tasks
  // We need to use deep: true for arrays of objects.
  // clone: true is also important for useRefHistory when dealing with objects/arrays to ensure history snapshots are independent.
  const {
    history, // array of history snapshots
    undo: historyUndo,
    redo: historyRedo,
    canUndo,
    canRedo,
    pause, // function to pause history tracking
    resume, // function to resume history tracking
    clear, // function to clear history
  } = useRefHistory(tasks, {
    deep: true,
    clone: (val) => JSON.parse(JSON.stringify(val)), // Simple deep clone for snapshots
    capacity: 20, // Store up to 20 history states
  });

  // Actions
  // Helper to wrap mutations with history pause/resume if needed, or just ensure actions modify `tasks.value`
  const executeWithHistory = (action: () => void) => {
    // For complex multi-step actions, you might pause history, perform all steps, then resume.
    // For simple actions that directly mutate `tasks.value`, history should capture it.
    action();
  }

  const addTask = (position: number) => {
    executeWithHistory(() => {
      const newId = Date.now().toString();
      const newTask: Task = {
        id: newId,
        name: '',
        startDate: format(new Date(), 'yyyy-MM-dd'),
        endDate: format(new Date(), 'yyyy-MM-dd'),
        progress: 0,
        assignee: '', // Made optional in Task interface, ensure consistency
        dependencies: [],
        indent: 0,
        parentId: null,
        taskType: '',
        isCollapsed: false, // Default new tasks to expanded (CT-05)
        // duration might be calculated or set, ensure it's handled.
        // For now, let it be undefined or set a default if required by Task interface.
      };
      if (position > 0 && tasks.value[position - 1]) {
        newTask.indent = tasks.value[position - 1].indent;
        if (newTask.indent > 0) {
          for (let i = position - 1; i >= 0; i--) {
            if (tasks.value[i].indent === newTask.indent - 1) {
              newTask.parentId = tasks.value[i].id;
              break;
            }
          }
        }
      }
      tasks.value.splice(position, 0, newTask);
      selectedRow.value = position;
      // return newId; // Actions in setup stores don't typically return values like this unless for specific reasons
    });
  };

  const deleteTask = (taskId: string) => { // Changed to taskId for clarity, though original used selectedRow
    executeWithHistory(() => {
      const taskIndex = tasks.value.findIndex((t: Task) => t.id === taskId); // Typed t
      if (taskIndex !== -1) {
        tasks.value.splice(taskIndex, 1);
        if (selectedRow.value === taskIndex || (selectedRow.value !== null && selectedRow.value > taskIndex)) { // Added null check for selectedRow.value > taskIndex
          selectedRow.value = selectedRow.value > 0 ? selectedRow.value -1 : null; // Adjust selection
        }
         if (tasks.value.length === 0) {
            selectedRow.value = null;
        } else if (selectedRow.value !== null && selectedRow.value >= tasks.value.length) {
            selectedRow.value = tasks.value.length -1;
        }

      }
    });
  };

  const updateTask = (taskId: string, updates: Partial<Task>) => {
    executeWithHistory(() => {
      const task = tasks.value.find((t: Task) => t.id === taskId); // Typed t
      if (task) {
        Object.assign(task, updates);
      }
    });
  };

  const selectTask = (taskId: string | null) => { // Parameter is taskId, not index
    if (taskId === null) {
      selectedRow.value = null;
    } else {
      const taskIndex = tasks.value.findIndex((t: Task) => t.id === taskId); // Typed t
      selectedRow.value = taskIndex !== -1 ? taskIndex : null;
    }
  };

  const indentTask = (taskId: string) => {
    executeWithHistory(() => {
      const taskIndex = tasks.value.findIndex((t: Task) => t.id === taskId); // Typed t
      if (taskIndex === -1 || taskIndex === 0) return; // Cannot indent first task

      const task = tasks.value[taskIndex];
      const previousTask = tasks.value[taskIndex - 1];

      if (task.indent >= 5 || previousTask.indent < task.indent) return; // Max indent or can't indent under a child

      task.indent++;
      task.parentId = previousTask.id; // Set parentId
      // Children indentation logic might need adjustment if direct children follow.
      // The original logic for adjusting subsequent tasks might need review based on true parent/child relationships.
      // For now, keeping it simple: just indent the current task.
      // The original logic:
      // for (let i = taskIndex + 1; i < tasks.value.length; i++) {
      //   if (tasks.value[i].indent == task.indent) { // This condition seems problematic
      //     tasks.value[i].indent = task.indent + 1;
      //   }
      // }
    });
  };

  const unindentTask = (taskId: string) => {
    executeWithHistory(() => {
      const taskIndex = tasks.value.findIndex((t: Task) => t.id === taskId); // Typed t
      if (taskIndex === -1 || tasks.value[taskIndex].indent === 0) return;

      const task = tasks.value[taskIndex];
      // const oldIndent = task.indent; // Unused
      task.indent--;

      if (task.indent === 0) {
        task.parentId = null;
      } else {
        // Find new parent if still indented
        let newParentFound = false;
        for (let i = taskIndex - 1; i >= 0; i--) {
          if (tasks.value[i].indent === task.indent -1) {
            task.parentId = tasks.value[i].id;
            newParentFound = true;
            break;
          }
        }
        if (!newParentFound) task.parentId = null; // Should not happen if indent > 0
      }
      // Adjust formerly direct children if any. This part is complex.
      // The original logic:
      // for (let i = taskIndex + 1; i < tasks.value.length; i++) {
      //   if (tasks.value[i].indent == oldIndent) { // This condition seems problematic
      //     tasks.value[i].indent = oldIndent - 1;
      //   }
      // }
    });
  };

  const updateTaskValue = (rowIndex: number, field: keyof Task, value: any) => {
    // This action seems to be used by FrappeProjectPlanner which uses rowIndex.
    // It's better to operate by ID if possible, but let's adapt it for now.
    // Ensure history captures this.
    executeWithHistory(() => {
      const task = tasks.value[rowIndex];
      if (!task) return;

      let changed = false;
      const updates: Partial<Task> = {};

      switch (field) {
        case 'name':
        case 'taskType':
        case 'assignee':
          if (task[field] !== value) {
            updates[field] = value;
            changed = true;
          }
          break;
        case 'duration':
          const numValue = parseInt(value, 10);
          if (isNaN(numValue) || numValue < 0) return;
          if (task.duration !== numValue) {
            updates.duration = numValue;
            changed = true;
            if (task.startDate) {
              const startDate = new Date(task.startDate);
              if (!isNaN(startDate.getTime())) {
                const endDate = new Date(startDate);
                endDate.setDate(startDate.getDate() + numValue); // duration is in days
                updates.endDate = format(endDate, 'yyyy-MM-dd');
              }
            }
          }
          break;
        case 'startDate':
          if (task.startDate !== value) {
            updates.startDate = value;
            changed = true;
            if (task.endDate) { // Recalculate duration if endDate exists
              const startDate = new Date(value);
              const endDate = new Date(task.endDate);
              if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime()) && endDate >= startDate) {
                const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
                updates.duration = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) +1; // +1 for inclusive days
              } else {
                 updates.duration = 1; // Default or error case
              }
            } else if (task.duration !== undefined) { // Recalculate endDate if duration exists
                const startDate = new Date(value);
                if(!isNaN(startDate.getTime())) {
                    const endDate = new Date(startDate);
                    endDate.setDate(startDate.getDate() + (task.duration || 1) -1 ); // -1 because duration includes start day
                    updates.endDate = format(endDate, 'yyyy-MM-dd');
                }
            }
          }
          break;
        case 'endDate':
          if (task.endDate !== value) {
            updates.endDate = value;
            changed = true;
            if (task.startDate) { // Recalculate duration
              const startDate = new Date(task.startDate);
              const endDate = new Date(value);
              if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime()) && endDate >= startDate) {
                const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
                updates.duration = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 for inclusive days
              } else {
                  updates.duration = 1; // Default or error case
              }
            }
          }
          break;
        case 'progress':
          const progressValue = parseFloat(value);
           if (task.progress !== progressValue && !isNaN(progressValue)) {
            updates.progress = Math.max(0, Math.min(100, progressValue)); // Clamp between 0-100
            changed = true;
          }
          break;
        case 'dependencies':
          const newDependencies = Array.isArray(value) ? value : String(value).split(',').map(d => d.trim()).filter(d => d);
          if (JSON.stringify(task.dependencies) !== JSON.stringify(newDependencies)) {
            updates.dependencies = newDependencies;
            changed = true;
          }
          break;
        // indent, parentId are handled by indentTask/unindentTask
        // id should not be changed here
      }

      if (changed) {
        Object.assign(task, updates);
      }
    });
  };

  // New actions for undo/redo
  const undo = () => {
    if (canUndo.value) {
      historyUndo();
    }
  };

  const redo = () => {
    if (canRedo.value) {
      historyRedo();
    }
  };

  // Function to reset tasks, e.g., when loading new project data
  // This should also clear the history for the new project context.
  const setTasks = (newTasks: Task[]) => {
    pause(); // Pause history tracking during reset
    tasks.value = newTasks.map(task => ({ ...task }));
    clear(); // Clear history stack for the new set of tasks
    resume(); // Resume history tracking
    // Add one initial history entry for the new state, so future undos don't go to an empty state
    // This might be handled automatically by useRefHistory on next change, or commit explicitly if needed.
    // For now, let's assume subsequent changes will populate history.
  };


  // Expose state, getters (if any), and actions
  return {
    // State (exposed as refs for direct use, or use storeToRefs in components)
    tasks,
    selectedRow,

    // History related (already refs from useRefHistory)
    canUndo,
    canRedo,
    history, // Exposing history array itself for debugging or advanced features

    // Actions
    addTask,
    deleteTask,
    updateTask,
    updateTaskValue,
    selectTask,
    indentTask,
    unindentTask,
    undo,
    redo,
    setTasks, // New action to replace all tasks and reset history
  };
});
