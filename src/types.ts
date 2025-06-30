import type { Task } from './types/Task'; // Import for use within this file

// The local Task interface has been removed.

export interface Column {
  key: keyof Task; // Now refers to the imported Task interface
  label: string;
  width: string;
  editable?: boolean;
  type?: 'text' | 'date' | 'number' | 'select';
  options?: string[];
}

export interface GanttBar {
  task: Task; // Now refers to the imported Task interface
  left: number;
  width: number;
}

export type { Task }; // Re-export Task for other modules

export type TaskType = 
  | 'Foundation' 
  | 'Framing' 
  | 'Electrical' 
  | 'Plumbing' 
  | 'HVAC' 
  | 'Roofing' 
  | 'Drywall' 
  | 'Painting' 
  | 'Flooring' 
  | 'Landscaping' 
  | 'Inspection' 
  | 'Planning';

export const TASK_TYPES: TaskType[] = [
  'Planning',
  'Foundation',
  'Framing',
  'Electrical',
  'Plumbing',
  'HVAC',
  'Roofing',
  'Drywall',
  'Painting',
  'Flooring',
  'Landscaping',
  'Inspection'
];