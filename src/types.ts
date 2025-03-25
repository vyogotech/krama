export interface Task {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  progress: number;
  assignee: string;
  dependencies: string[];
  level: number;
  parentId: string | null;
  sequence?: number;
  taskType: string;
}

export interface Column {
  key: keyof Task;
  label: string;
  width: string;
  editable?: boolean;
  type?: 'text' | 'date' | 'number' | 'select';
  options?: string[];
}

export interface GanttBar {
  task: Task;
  left: number;
  width: number;
}

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