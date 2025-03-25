// src/types/Task.js

/**
 * @typedef {Object} Task
 * @property {string} id - The unique identifier for the task.
 * @property {string} name - The name of the task.
 * @property {string} startDate - The start date of the task in YYYY-MM-DD format.
 * @property {string} endDate - The end date of the task in YYYY-MM-DD format.
 * @property {number} progress - The progress of the task as a percentage.
 * @property {string} assignee - The name of the person assigned to the task.
 * @property {number} duration - Task duration in days.
 * @property {string[]} dependencies - An array of task IDs that this task depends on.
 * @property {number} indent - The indentation level of the task.
 * @property {string|null} parentId - The ID of the parent task, or null if there is no parent.
 * @property {string} taskType - The type of the task.
 */

/**
 * Example task object:
 * 
 * const exampleTask = {
 *   id: '1',
 *   name: 'Project Planning',
 *   startDate: '2024-03-01',
 *   endDate: '2024-03-15',
 *   progress: 0,
 *   assignee: 'John Doe',
 *   dependencies: [],
 *   indent: 0,
 *   parentId: null,
 *   taskType: 'Planning',
 * };
 */