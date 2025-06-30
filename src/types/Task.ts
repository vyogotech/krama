// src/types/Task.ts

export interface Task {
  id: string;
  name: string;
  startDate: string; // YYYY-MM-DD format
  endDate: string;   // YYYY-MM-DD format
  progress: number;  // Percentage
  assignee?: string; // Optional: As per taskStore initial data, some might not have it
  duration?: number; // Task duration in days - Can be calculated or explicit
  dependencies?: string[]; // Array of task IDs
  indent: number;
  parentId?: string | null;
  taskType: string;
  isCollapsed?: boolean; // For CT-05 Expand/Collapse
  sequence?: number; // From src/types.ts Task definition
  // Optional: Fields from taskStore's sample data not in original JSDoc
  // but good to have consistency.
  // If 'duration' is always calculated, it can be removed from explicit definition
  // but store actions suggest it can be set.
}

/**
 * Example task object:
 *
 * const exampleTask: Task = {
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
 *   duration: 15 // Example: if duration is explicit
 * };
 */