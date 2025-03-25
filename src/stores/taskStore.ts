// src/stores/taskStore.ts
import { defineStore } from 'pinia';
import { format } from 'date-fns';
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
    
    updateTaskValue(rowindex: number, field: keyof Task, value: any) {
      const task = this.tasks[rowindex];
      if (!task) return;
      switch (field) {
        case 'name':
        case 'taskType':
        case 'assignee':
          task[field] = value;
          break;
        case 'duration':
          if (value < 0) return;
          task.duration = value;
          if (task.startDate) {
            const start_date = new Date(task.startDate);
            if (!isNaN(start_date.getTime())) {
              const end_date = new Date(start_date);
              end_date.setDate(start_date.getDate() + parseInt(value));
              task.endDate = end_date.toISOString().split('T')[0];
            }
          }
          break;
          
        case 'startDate':
          task.startDate = value;
          if (task.endDate) {
            const start_date = new Date(value);
            const end_date = new Date(task.endDate);
            if (!isNaN(start_date.getTime()) && !isNaN(end_date.getTime())) {
              const diffTime = end_date.getTime() - start_date.getTime();
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              task.duration = diffDays;
            }
          }
          break;
            
        case 'endDate':
          task.endDate = value;
          if (task.startDate) {
            const start_date = new Date(task.startDate);
            const end_date = new Date(value);
            if (!isNaN(start_date.getTime()) && !isNaN(end_date.getTime())) {
              const diffTime = end_date.getTime() - start_date.getTime();
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              task.duration = diffDays;
            }
          }
          break;

        case 'progress':
          task.progress = parseFloat(value);
          break;
        case 'dependencies':
          task.dependencies = value.split(',').map((d: string) => d.trim()).filter((d: string) => d);
          break;
      }
    }
  }
});
