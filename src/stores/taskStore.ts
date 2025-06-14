// src/stores/taskStore.ts
import { defineStore } from 'pinia';
import { format, parseISO, addDays } from 'date-fns';
import type { Task } from '../types';

export const useTaskStore = defineStore('tasks', {
  state: () => ({
    tasks: [
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
      {
        id: '3',
        name: 'Framing',
        startDate: '2024-01-21',
        endDate: '2024-02-05',
        progress: 0,
        assignee: 'John Doe',
        dependencies: ['2'],
        indent: 1,
        duration: 15,
        parentId: null,
        taskType: 'Construction',
      },
      {
        id: '4',
        name: 'Roofing',
        startDate: '2024-02-06',
        endDate: '2024-02-15',
        progress: 0,
        assignee: 'Jane Smith',
        dependencies: ['3'],
        indent: 2,
        duration: 10,
        parentId: null,
        taskType: 'Construction',
      },
      {
        id: '5',
        name: 'Electrical Rough-In',
        startDate: '2024-02-16',
        endDate: '2024-02-25',
        progress: 0,
        assignee: 'John Doe',
        dependencies: ['4'],
        indent: 3,
        duration: 10,
        parentId: null,
        taskType: 'Electrical',
      },
      {
        id: '6',
        name: 'Plumbing Rough-In',
        startDate: '2024-02-26',
        endDate: '2024-03-07',
        progress: 0,
        assignee: 'Jane Smith',
        dependencies: ['5'],
        indent: 0,
        duration: 10,
        parentId: null,
        taskType: 'Plumbing',
      },
      {
        id: '7',
        name: 'HVAC Rough-In',
        startDate: '2024-03-08',
        endDate: '2024-03-17',
        progress: 0,
        assignee: 'John Doe',
        dependencies: ['6'],
        indent: 0,
        duration: 10,
        parentId: null,
        taskType: 'HVAC',
      },
      {
        id: '8',
        name: 'Insulation',
        startDate: '2024-03-18',
        endDate: '2024-03-27',
        progress: 0,
        assignee: 'Jane Smith',
        dependencies: ['7'],
        indent: 0,
        duration: 10,
        parentId: null,
        taskType: 'Insulation',
      },
      {
        id: '9',
        name: 'Drywall Installation',
        startDate: '2024-03-28',
        endDate: '2024-04-06',
        progress: 0,
        assignee: 'John Doe',
        dependencies: ['8'],
        indent: 0,
        duration: 10,
        parentId: null,
        taskType: 'Drywall',
      },
      {
        id: '10',
        name: 'Painting',
        startDate: '2024-04-07',
        endDate: '2024-04-16',
        progress: 0,
        assignee: 'Jane Smith',
        dependencies: ['9'],
        indent: 0,
        duration: 10,
        parentId: null,
        taskType: 'Painting',
      },
      {
        id: '11',
        name: 'Flooring Installation',
        startDate: '2024-04-17',
        endDate: '2024-04-26',
        progress: 0,
        assignee: 'John Doe',
        dependencies: ['10'],
        indent: 0,
        duration: 10,
        parentId: null,
        taskType: 'Flooring',
      },
      {
        id: '12',
        name: 'Cabinet Installation',
        startDate: '2024-04-27',
        endDate: '2024-05-06',
        progress: 0,
        assignee: 'Jane Smith',
        dependencies: ['11'],
        indent: 0,
        duration: 10,
        parentId: null,
        taskType: 'Cabinetry',
      },
      {
        id: '13',
        name: 'Trim Work',
        startDate: '2024-05-07',
        endDate: '2024-05-16',
        progress: 0,
        assignee: 'John Doe',
        dependencies: ['12'],
        indent: 0,
        duration: 10,
        parentId: null,
        taskType: 'Trim',
      },
      {
        id: '14',
        name: 'Final Electrical',
        startDate: '2024-05-17',
        endDate: '2024-05-26',
        progress: 0,
        assignee: 'Jane Smith',
        dependencies: ['13'],
        indent: 0,
        duration: 10,
        parentId: null,
        taskType: 'Electrical',
      },
      {
        id: '15',
        name: 'Final Plumbing',
        startDate: '2024-05-27',
        endDate: '2024-06-05',
        progress: 0,
        assignee: 'John Doe',
        dependencies: ['14'],
        indent: 0,
        duration: 10,
        parentId: null,
        taskType: 'Plumbing',
      },
      {
        id: '16',
        name: 'Final HVAC',
        startDate: '2024-06-06',
        endDate: '2024-06-15',
        progress: 0,
        assignee: 'Jane Smith',
        dependencies: ['15'],
        indent: 0,
        duration: 10,
        parentId: null,
        taskType: 'HVAC',
      },
      {
        id: '17',
        name: 'Final Inspection',
        startDate: '2024-06-16',
        endDate: '2024-06-20',
        progress: 0,
        assignee: 'John Doe',
        dependencies: ['16'],
        indent: 0,
        duration: 5,
        parentId: null,
        taskType: 'Inspection',
      },
      {
        id: '18',
        name: 'Punch List',
        startDate: '2024-06-21',
        endDate: '2024-06-25',
        progress: 0,
        assignee: 'Jane Smith',
        dependencies: ['17'],
        indent: 0,
        duration: 5,
        parentId: null,
        taskType: 'Finalization',
      },
      {
        id: '19',
        name: 'Final Walkthrough',
        startDate: '2024-06-26',
        endDate: '2024-06-30',
        progress: 0,
        assignee: 'John Doe',
        dependencies: ['18'],
        indent: 0,
        duration: 5,
        parentId: null,
        taskType: 'Finalization',
      },
      {
        id: '20',
        name: 'Project Completion',
        startDate: '2024-07-01',
        endDate: '2024-07-01',
        progress: 0,
        assignee: 'Jane Smith',
        dependencies: ['19'],
        indent: 0,
        duration: 1,
        parentId: null,
        taskType: 'Completion',
      },
    ] as Task[],
    selectedRow: null as number | null,
  }),
  
  actions: {
    addTask(position: number) {
      const newId = Date.now().toString();
      const newTask: Task = {
        id: newId,
        name: '',
        startDate: format(new Date(), 'yyyy-MM-dd'),
        endDate: format(new Date(), 'yyyy-MM-dd'),
        progress: 0,
        assignee: '',
        dependencies: [],
        indent: 0,
        parentId: null,
        taskType: '',
      };
      if (position > 0) {
        newTask.indent = this.tasks[position - 1].indent;
        if (newTask.indent > 0) {
          for (let i = position - 1; i >= 0; i--) {
            if (this.tasks[i].indent === newTask.indent - 1) {
              newTask.parentId = this.tasks[i].id;
              break;
            }
          }
        }
      }
      this.tasks.splice(position, 0, newTask);
      this.selectedRow = position;
      return newId;
    },
    
    deleteTask(taskId: string) {
      if (this.selectedRow !== null) {
        this.tasks.splice(this.selectedRow, 1);
        this.selectedRow = null;
      }
    },
    
    updateTask(taskId: string, updates: Partial<Task>) {
      const task = this.tasks.find(t => t.id === taskId);
      if (!task) return;
      Object.assign(task, updates);
    },
    
    selectTask(taskId: string | null) {
      this.selectedRow = taskId ? this.tasks.findIndex(t => t.id === taskId) : null;
    },
    
    indentTask(taskId: string) {
      if (this.selectedRow === null) return;
      const task = this.tasks[this.selectedRow];
      const previousTask = this.tasks[this.selectedRow - 1];
      if (task.indent >= 5) return;
      task.indent++;
      for (let i = this.selectedRow + 1; i < this.tasks.length; i++) {
        if (this.tasks[i].indent == task.indent) {
          this.tasks[i].indent = task.indent + 1;
        }
      }
    },
    
    unindentTask(taskId: string) {
      if (this.selectedRow === null) return;
      const task = this.tasks[this.selectedRow];
      if (task.indent === 0) return;
      task.indent--;
      if (task.indent === 0) {
        task.parentId = null;
      } else {
        for (let i = this.selectedRow + 1; i < this.tasks.length; i++) {
          if (this.tasks[i].indent == task.indent) {
            this.tasks[i].indent = task.indent - 1;
          }
        }
      }
    },
    
    updateTaskRecord(rowindex: number, colIndex: number, value: any) {
      const task = this.tasks[rowindex];
      if (!task) return;
      task[colIndex] = value;
    },
    
    updateTaskValue(rowindex: number, field: keyof Task, value: any): boolean {
      const task = this.tasks[rowindex];
      if (!task) return false;

      let successfullyUpdated = true; // Assume success initially

      switch (field) {
        case 'name':
        case 'taskType':
        case 'assignee':
          task[field] = value;
          break;
        case 'duration': {
          const newDuration = parseInt(value);
          if (isNaN(newDuration) || newDuration < 0) {
            successfullyUpdated = false; // Invalid input
            break;
          }

          const oldEndDate = task.endDate;
          task.duration = newDuration;

          if (task.startDate) {
            const startDateObj = parseISO(task.startDate);
            if (!isNaN(startDateObj.getTime())) {
              const newEndDateObj = addDays(startDateObj, task.duration);
              task.endDate = format(newEndDateObj, 'yyyy-MM-dd');
            }
          }

          if (task.endDate !== oldEndDate) {
            this._updateDependentTasks(task.id, task.endDate);
          }
          break;
        }
          
        case 'startDate': {
          const newStartDateStr = value; // value is already 'yyyy-MM-dd' string
          const oldEndDate = task.endDate;

          const newStartDateObj = parseISO(newStartDateStr);
          if (isNaN(newStartDateObj.getTime())) {
            successfullyUpdated = false; // Invalid date string
            break;
          }

          task.startDate = newStartDateStr;

          let currentDuration = typeof task.duration === 'number' && !isNaN(task.duration) ? task.duration : 0;
          // If duration was 0/undefined, and we have an old end date, try to preserve it by calculating new duration
          if (currentDuration === 0 && oldEndDate && oldEndDate >= task.startDate) {
                const oldEndDateObj = parseISO(oldEndDate);
                if(!isNaN(oldEndDateObj.getTime())) {
                    let tempDuration = 0;
                    let tempDate = newStartDateObj;
                    while(format(tempDate, 'yyyy-MM-dd') < oldEndDate) {
                        tempDate = addDays(tempDate, 1);
                        tempDuration++;
                    }
                    currentDuration = tempDuration;
                    task.duration = currentDuration;
                }
          }

          const newEndDateObjBasedOnDuration = addDays(newStartDateObj, currentDuration);
          task.endDate = format(newEndDateObjBasedOnDuration, 'yyyy-MM-dd');

          if (task.endDate !== oldEndDate) {
            this._updateDependentTasks(task.id, task.endDate);
          }
          break;
        }
            
        case 'endDate': {
          const newEndDateStr = value; // value is 'yyyy-MM-dd'
          const oldEndDate = task.endDate;

          const newEndDateObj = parseISO(newEndDateStr);
          if (isNaN(newEndDateObj.getTime())) {
             successfullyUpdated = false;
             break;
          }

          task.endDate = newEndDateStr;

          if (task.startDate) {
            const currentStartDateObj = parseISO(task.startDate);
            if (!isNaN(currentStartDateObj.getTime()) && newEndDateObj >= currentStartDateObj) {
              let tempDuration = 0;
              let tempDate = currentStartDateObj;
              // Calculate duration by counting days
              while(format(tempDate, 'yyyy-MM-dd') < task.endDate) {
                  tempDate = addDays(tempDate, 1);
                  tempDuration++;
              }
              task.duration = tempDuration;
            } else if (!isNaN(currentStartDateObj.getTime()) && newEndDateObj < currentStartDateObj) {
              task.duration = 0;
            }
          }

          if (task.endDate !== oldEndDate) {
            this._updateDependentTasks(task.id, task.endDate);
          }
          break;
        }

        case 'progress':
          const newProgress = parseFloat(value);
          if (isNaN(newProgress) || newProgress < 0 || newProgress > 100) {
            successfullyUpdated = false;
            break;
          }
          task.progress = newProgress;
          break;
        case 'dependencies':
          const newPotentialDependencies = value.split(',').map((d: string) => d.trim()).filter((d: string) => d);
          if (this._hasCircularDependency(task.id, newPotentialDependencies, this.tasks)) {
            console.warn(`Circular dependency detected for task ${task.id}. Update rejected.`);
            successfullyUpdated = false; // Indicate failure
          } else {
            task.dependencies = newPotentialDependencies;
          }
          break;
        default:
          // Potentially handle unknown field if necessary, or just let it be a successful no-op
          break;
      }
      return successfullyUpdated;
    },

    _hasCircularDependency(taskId: string, newDependencies: string[], allTasks: Task[]): boolean {
      const tasksMap = new Map(allTasks.map(t => [t.id, t]));

      for (const depId of newDependencies) {
        // For each new dependency, perform a DFS to see if it can reach back to taskId
        const stack: Array<{ id: string, path: Set<string> }> = [{ id: depId, path: new Set() }];

        while (stack.length > 0) {
          const { id: currentId, path: currentPath } = stack.pop()!;

          if (currentId === taskId) {
            return true; // Cycle detected: a dependency path leads back to the original task
          }

          // If already visited in the current specific path, skip (this forms the cycle).
          // Note: This check is slightly different from a global visited set.
          // A task can be part of multiple non-cyclic paths.
          if (currentPath.has(currentId)) {
            // This condition implies that `currentId` is being revisited within the same traversal path from `depId`.
            // If `currentId` also happens to be `taskId`, the check `currentId === taskId` above would have caught it.
            // If it's another node being revisited in the same path, it's a cycle not necessarily involving `taskId` directly
            // but means this path is cyclic. The primary goal is to see if `taskId` is reachable.
            continue;
          }

          // Add current node to the path for this traversal
          const newPath = new Set(currentPath);
          newPath.add(currentId);

          const currentTask = tasksMap.get(currentId);
          if (currentTask && currentTask.dependencies) {
            for (const nextDepId of currentTask.dependencies) {
              // We only push to the stack if `nextDepId` is not already in `newPath`.
              // If `nextDepId` *is* in `newPath`, that means adding `nextDepId` would form a cycle.
              // If that `nextDepId` which forms a cycle is `taskId`, then we have our circular dependency.
              if (nextDepId === taskId) { // Check before pushing if the next step completes the cycle to taskId
                return true;
              }
              if (!newPath.has(nextDepId)) { // Push to stack only if not visited in current path
                stack.push({ id: nextDepId, path: newPath });
              }
            }
          }
        }
      }
      return false; // No circular dependencies found
    },

    _recalculateTaskDates(taskId: string, newStartDate: Date): boolean {
      const task = this.tasks.find(t => t.id === taskId);
      if (!task) return false;

      const formattedNewStartDate = format(newStartDate, 'yyyy-MM-dd');

      // Check if the start date is actually changing
      if (task.startDate === formattedNewStartDate) {
        return false;
      }

      task.startDate = formattedNewStartDate;
      // Ensure duration is a valid number before using it
      const duration = typeof task.duration === 'number' && !isNaN(task.duration) ? task.duration : 0;

      const newEndDate = addDays(newStartDate, duration);
      task.endDate = format(newEndDate, 'yyyy-MM-dd');

      // If duration was invalid and reset, ensure it's reflected
      if (duration === 0 && task.duration !== 0) {
          task.duration = 0;
      }

      return true;
    },

    _updateDependentTasks(updatedTaskId: string, updatedTaskEndDateStr: string) {
      if (!updatedTaskEndDateStr) return; // Should not happen if called correctly
      const updatedTaskEndDate = parseISO(updatedTaskEndDateStr);

      this.tasks.forEach(dependentTask => {
        if (dependentTask.dependencies && dependentTask.dependencies.includes(updatedTaskId)) {
          const newDependentStartDate = addDays(updatedTaskEndDate, 1);
          const oldDependentEndDate = dependentTask.endDate;

          if (this._recalculateTaskDates(dependentTask.id, newDependentStartDate)) {
            // If _recalculateTaskDates changed the dependent task's dates,
            // (which means its endDate might have changed),
            // then recursively call _updateDependentTasks for this dependent task.
             if (dependentTask.endDate !== oldDependentEndDate) { // Recurse only if end date changed
                this._updateDependentTasks(dependentTask.id, dependentTask.endDate);
             }
          }
        }
      });
    }
  }
});
