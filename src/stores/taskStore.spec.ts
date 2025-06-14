// src/stores/taskStore.spec.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useTaskStore } from './taskStore';
import type { Task } from '../types'; // Assuming Task type is needed for test data

// Helper function to create a fresh task for tests if needed, or use initial state
const getInitialTasks = (): Task[] => {
  // Return a deep copy of the initial state if you want to reset it,
  // or a specific set of tasks for testing.
  // For now, let's use a minimal set or rely on the store's default initial state.
  // This is important if tests modify the state.
  // A simple example:
  return [
    { id: '1', name: 'Task 1', startDate: '2024-01-01', endDate: '2024-01-05', progress: 0, dependencies: [], indent: 0, duration: 5, parentId: null, taskType: 'TypeA', assignee: '' },
    { id: '2', name: 'Task 2', startDate: '2024-01-06', endDate: '2024-01-10', progress: 0, dependencies: ['1'], indent: 0, duration: 5, parentId: null, taskType: 'TypeB', assignee: '' },
    { id: '3', name: 'Task 3', startDate: '2024-01-11', endDate: '2024-01-15', progress: 0, dependencies: ['2'], indent: 0, duration: 5, parentId: null, taskType: 'TypeC', assignee: '' },
    { id: '4', name: 'Task 4', startDate: '2024-01-16', endDate: '2024-01-20', progress: 0, dependencies: [], indent: 0, duration: 5, parentId: null, taskType: 'TypeD', assignee: '' },
    { id: '5', name: 'Task 5', startDate: '2024-01-21', endDate: '2024-01-25', progress: 0, dependencies: ['4'], indent: 0, duration: 5, parentId: null, taskType: 'TypeE', assignee: '' },
  ];
};

describe('useTaskStore', () => {
  beforeEach(() => {
    // Create a new Pinia instance and make it active for each test
    setActivePinia(createPinia());
    // Optional: Reset the store's state if your tests modify it directly
    // and you don't want side effects between tests.
    // const taskStore = useTaskStore();
    // taskStore.$reset(); // Pinia's built-in $reset method if you've defined a state factory
    // Or manually reset state:
    // taskStore.tasks = getInitialTasks(); // Or your store's default initial tasks
    // Given that the store has a substantial default initial state,
    // for tests that modify state, it's often better to reset to that default.
    // However, Pinia's `createPinia()` for each test effectively isolates stores.
    // If the store's *definition* itself has side effects or shared module-level state (it shouldn't),
    // then more care is needed. For typical Pinia stores, this is fine.
  });

  it('should initialize with default tasks from the store definition', () => {
    const taskStore = useTaskStore();
    // This test relies on the actual default state defined in taskStore.ts
    // The default state in taskStore.ts has 20 tasks.
    expect(taskStore.tasks.length).toBe(20);
    // Example check on one of the default tasks
    expect(taskStore.tasks[0].name).toBe('Site Preparation');
  });

  // Placeholder for future tests
  describe('Circular Dependency Detection (_hasCircularDependency)', () => {
    it('should return false when a task has no dependencies', () => {
      const taskStore = useTaskStore();
      taskStore.tasks = [
        { id: '1', name: 'Task 1', dependencies: [], startDate: '2024-01-01', endDate: '2024-01-05', progress: 0, indent: 0, duration: 5, parentId: null, taskType: '', assignee: '' },
      ];
      // Directly test _hasCircularDependency. Note: _hasCircularDependency is not exposed if not returned from setup().
      // So, we test it via updateTaskValue's return for 'dependencies' field.
      const success = taskStore.updateTaskValue(0, 'dependencies', ''); // No dependencies
      expect(success).toBe(true);
      expect(taskStore.tasks[0].dependencies).toEqual([]);
    });

    it('should return false for valid, non-circular dependencies', () => {
      const taskStore = useTaskStore();
      taskStore.tasks = [
        { id: '1', name: 'Task 1', dependencies: [], startDate: '2024-01-01', endDate: '2024-01-05', progress: 0, indent: 0, duration: 5, parentId: null, taskType: '', assignee: '' },
        { id: '2', name: 'Task 2', dependencies: [], startDate: '2024-01-06', endDate: '2024-01-10', progress: 0, indent: 0, duration: 5, parentId: null, taskType: '', assignee: '' },
      ];
      // Task 2 depends on Task 1
      const success = taskStore.updateTaskValue(1, 'dependencies', '1');
      expect(success).toBe(true);
      expect(taskStore.tasks[1].dependencies).toEqual(['1']);
    });

    it('should detect and prevent a direct circular dependency (A -> B, B -> A)', () => {
      const taskStore = useTaskStore();
      taskStore.tasks = [
        { id: '1', name: 'Task 1', dependencies: ['2'], startDate: '2024-01-01', endDate: '2024-01-05', progress: 0, indent: 0, duration: 5, parentId: null, taskType: '', assignee: '' },
        { id: '2', name: 'Task 2', dependencies: [], startDate: '2024-01-06', endDate: '2024-01-10', progress: 0, indent: 0, duration: 5, parentId: null, taskType: '', assignee: '' },
      ];
      // Attempt to make Task 2 depend on Task 1 (Task 1 already depends on Task 2)
      // This setup is slightly off, as taskStore.tasks[0] (Task 1) already depends on '2'.
      // The check happens when we try to modify Task 2.
      // Let's re-evaluate the setup or the action being tested.
      // If T1 -> T2 is already set, trying to set T2 -> T1 should be caught.
      // The _hasCircularDependency is called for task being modified (task at index 1, i.e. Task 2)
      // and its new dependencies ('1'). It will trace '1' -> '2' (original task), thus a circle.
      const success = taskStore.updateTaskValue(1, 'dependencies', '1');
      expect(success).toBe(false);
      // Ensure dependencies of Task 2 were not updated
      expect(taskStore.tasks[1].dependencies).toEqual([]);
    });

    it('should allow setting initial dependency before the other task has its circular dependency set', () => {
      const taskStore = useTaskStore();
      taskStore.tasks = [
        { id: '1', name: 'Task 1', dependencies: [], startDate: '2024-01-01', endDate: '2024-01-05', progress: 0, indent: 0, duration: 5, parentId: null, taskType: '', assignee: '' },
        { id: '2', name: 'Task 2', dependencies: [], startDate: '2024-01-06', endDate: '2024-01-10', progress: 0, indent: 0, duration: 5, parentId: null, taskType: '', assignee: '' },
      ];
      // Make Task 1 depend on Task 2 (This is valid)
      let success = taskStore.updateTaskValue(0, 'dependencies', '2');
      expect(success).toBe(true);
      expect(taskStore.tasks[0].dependencies).toEqual(['2']);

      // Now, attempt to make Task 2 depend on Task 1 (This should fail, creating a circle T2->T1->T2)
      success = taskStore.updateTaskValue(1, 'dependencies', '1');
      expect(success).toBe(false);
      expect(taskStore.tasks[1].dependencies).toEqual([]); // Dependencies of Task 2 should not change
    });

    it('should detect and prevent an indirect circular dependency (A -> B, B -> C, C -> A)', () => {
      const taskStore = useTaskStore();
      taskStore.tasks = [
        { id: '1', name: 'Task 1', dependencies: [], startDate: '2024-01-01', endDate: '2024-01-05', progress: 0, indent: 0, duration: 5, parentId: null, taskType: '', assignee: '' }, // Will try to set T1 -> T3
        { id: '2', name: 'Task 2', dependencies: ['1'], startDate: '2024-01-06', endDate: '2024-01-10', progress: 0, indent: 0, duration: 5, parentId: null, taskType: '', assignee: '' }, // T2 -> T1
        { id: '3', name: 'Task 3', dependencies: ['2'], startDate: '2024-01-11', endDate: '2024-01-15', progress: 0, indent: 0, duration: 5, parentId: null, taskType: '', assignee: '' }, // T3 -> T2
      ];
      // Attempt to make Task 1 depend on Task 3 (creating T1->T3->T2->T1)
      const success = taskStore.updateTaskValue(0, 'dependencies', '3');
      expect(success).toBe(false);
      expect(taskStore.tasks[0].dependencies).toEqual([]); // Dependencies of Task 1 should not change
    });

    it('should detect and prevent a self-dependency (A -> A)', () => {
      const taskStore = useTaskStore();
      taskStore.tasks = [
        { id: '1', name: 'Task 1', dependencies: [], startDate: '2024-01-01', endDate: '2024-01-05', progress: 0, indent: 0, duration: 5, parentId: null, taskType: '', assignee: '' },
      ];
      // Attempt to make Task 1 depend on itself
      const success = taskStore.updateTaskValue(0, 'dependencies', '1');
      expect(success).toBe(false);
      expect(taskStore.tasks[0].dependencies).toEqual([]);
    });

    it('should allow multiple valid dependencies', () => {
      const taskStore = useTaskStore();
      taskStore.tasks = [
        { id: '1', name: 'Task 1', dependencies: [], startDate: '2024-01-01', endDate: '2024-01-05', progress: 0, indent: 0, duration: 5, parentId: null, taskType: '', assignee: '' },
        { id: '2', name: 'Task 2', dependencies: [], startDate: '2024-01-01', endDate: '2024-01-05', progress: 0, indent: 0, duration: 5, parentId: null, taskType: '', assignee: '' },
        { id: '3', name: 'Task 3', dependencies: [], startDate: '2024-01-06', endDate: '2024-01-10', progress: 0, indent: 0, duration: 5, parentId: null, taskType: '', assignee: '' },
      ];
      // Task 3 depends on Task 1 and Task 2
      const success = taskStore.updateTaskValue(2, 'dependencies', '1,2');
      expect(success).toBe(true);
      expect(taskStore.tasks[2].dependencies).toEqual(['1', '2']);
    });

    it('should prevent adding a valid dependency if another new one creates a circle', () => {
      const taskStore = useTaskStore();
      taskStore.tasks = [
        { id: '1', name: 'Task 1', dependencies: ['3'], startDate: '2024-01-01', endDate: '2024-01-05', progress: 0, indent: 0, duration: 5, parentId: null, taskType: '', assignee: '' }, // T1 -> T3
        { id: '2', name: 'Task 2', dependencies: [], startDate: '2024-01-01', endDate: '2024-01-05', progress: 0, indent: 0, duration: 5, parentId: null, taskType: '', assignee: '' },
        { id: '3', name: 'Task 3', dependencies: [], startDate: '2024-01-06', endDate: '2024-01-10', progress: 0, indent: 0, duration: 5, parentId: null, taskType: '', assignee: '' },
      ];
      // Attempt to make Task 3 depend on Task 1 (T3 -> T1) and Task 2 (T3 -> T2).
      // T3 -> T1 would create T1 -> T3 -> T1 circle.
      const success = taskStore.updateTaskValue(2, 'dependencies', '1,2');
      expect(success).toBe(false);
      expect(taskStore.tasks[2].dependencies).toEqual([]); // Dependencies of Task 3 should not change
    });
  });

  describe('Date Calculation and Cascading Logic', () => {
    it('should update endDate when startDate is changed (duration preserved)', () => {
      const taskStore = useTaskStore();
      taskStore.tasks = [
        // Duration 4 days means it spans 4 days. If it starts Jan 1, it ends Jan 5.
        // startDate: Jan 1. addDays(Jan 1, 4) = Jan 5.
        { id: '1', name: 'Task 1', startDate: '2024-01-01', endDate: '2024-01-05', duration: 4, progress: 0, dependencies: [], indent: 0, parentId: null, taskType: '', assignee: '' },
      ];
      const success = taskStore.updateTaskValue(0, 'startDate', '2024-01-03');
      expect(success).toBe(true);
      expect(taskStore.tasks[0].startDate).toBe('2024-01-03');
      expect(taskStore.tasks[0].duration).toBe(4); // Duration preserved
      expect(taskStore.tasks[0].endDate).toBe('2024-01-07'); // Jan 03 + 4 days = Jan 07
    });

    it('should update duration when endDate is changed (startDate preserved)', () => {
      const taskStore = useTaskStore();
      taskStore.tasks = [
        { id: '1', name: 'Task 1', startDate: '2024-01-01', endDate: '2024-01-05', duration: 4, progress: 0, dependencies: [], indent: 0, parentId: null, taskType: '', assignee: '' },
      ];
      const success = taskStore.updateTaskValue(0, 'endDate', '2024-01-10');
      expect(success).toBe(true);
      expect(taskStore.tasks[0].startDate).toBe('2024-01-01');
      expect(taskStore.tasks[0].endDate).toBe('2024-01-10');
      expect(taskStore.tasks[0].duration).toBe(9); // Jan 1 to Jan 10 is 9 days duration (10 - 1)
    });

    it('should update endDate when duration is changed (startDate preserved)', () => {
      const taskStore = useTaskStore();
      taskStore.tasks = [
        { id: '1', name: 'Task 1', startDate: '2024-01-01', endDate: '2024-01-05', duration: 4, progress: 0, dependencies: [], indent: 0, parentId: null, taskType: '', assignee: '' },
      ];
      const success = taskStore.updateTaskValue(0, 'duration', 6); // New duration 6 days
      expect(success).toBe(true);
      expect(taskStore.tasks[0].startDate).toBe('2024-01-01');
      expect(taskStore.tasks[0].duration).toBe(6);
      expect(taskStore.tasks[0].endDate).toBe('2024-01-07'); // Jan 01 + 6 days = Jan 07
    });

    it('should cascade date changes to a single dependent task', () => {
      const taskStore = useTaskStore();
      taskStore.tasks = [
        { id: 'T1', name: 'Task 1', startDate: '2024-03-01', endDate: '2024-03-05', duration: 4, dependencies: [], indent: 0, progress: 0, parentId: null, taskType: '', assignee: '' },
        { id: 'T2', name: 'Task 2', startDate: '2024-03-06', endDate: '2024-03-10', duration: 4, dependencies: ['T1'], indent: 0, progress: 0, parentId: null, taskType: '', assignee: '' },
      ];
      // Change endDate of T1
      const success = taskStore.updateTaskValue(0, 'endDate', '2024-03-08'); // T1 now ends on March 8th. Original start 2024-03-01. New Duration = 7
      expect(success).toBe(true);
      expect(taskStore.tasks[0].endDate).toBe('2024-03-08');
      expect(taskStore.tasks[0].duration).toBe(7);


      // Check T2 (dependent)
      expect(taskStore.tasks[1].startDate).toBe('2024-03-09'); // Should start day after T1's new end date (08 -> 09)
      expect(taskStore.tasks[1].duration).toBe(4); // Duration preserved
      expect(taskStore.tasks[1].endDate).toBe('2024-03-13'); // 09 + 4 days = 13
    });

    it('should cascade date changes through a chain of dependent tasks (A -> B -> C)', () => {
      const taskStore = useTaskStore();
      taskStore.tasks = [ // Durations are 2 days each (end date is start + 2)
        { id: 'A', name: 'Task A', startDate: '2024-04-01', endDate: '2024-04-03', duration: 2, dependencies: [], indent: 0, progress: 0, parentId: null, taskType: '', assignee: '' },
        { id: 'B', name: 'Task B', startDate: '2024-04-04', endDate: '2024-04-06', duration: 2, dependencies: ['A'], indent: 0, progress: 0, parentId: null, taskType: '', assignee: '' },
        { id: 'C', name: 'Task C', startDate: '2024-04-07', endDate: '2024-04-09', duration: 2, dependencies: ['B'], indent: 0, progress: 0, parentId: null, taskType: '', assignee: '' },
      ];
      // Change duration of Task A, pushing its end date
      const success = taskStore.updateTaskValue(0, 'duration', 4); // A's new duration: 4 days. New endDate: 2024-04-01 + 4 = 2024-04-05
      expect(success).toBe(true);
      expect(taskStore.tasks[0].endDate).toBe('2024-04-05');

      // Check Task B: new start 2024-04-06
      expect(taskStore.tasks[1].startDate).toBe('2024-04-06');
      expect(taskStore.tasks[1].duration).toBe(2); // duration preserved
      expect(taskStore.tasks[1].endDate).toBe('2024-04-08'); // 06 + 2 days = 08

      // Check Task C: new start 2024-04-09
      expect(taskStore.tasks[2].startDate).toBe('2024-04-09');
      expect(taskStore.tasks[2].duration).toBe(2); // duration preserved
      expect(taskStore.tasks[2].endDate).toBe('2024-04-11'); // 09 + 2 days = 11
    });

    it('should update all direct dependents when a task date changes', () => {
      const taskStore = useTaskStore();
      taskStore.tasks = [ // P: dur 4. D1: dur 2. D2: dur 4
        { id: 'P', name: 'Predecessor', startDate: '2024-05-01', endDate: '2024-05-05', duration: 4, dependencies: [], indent: 0, progress: 0, parentId: null, taskType: '', assignee: '' },
        { id: 'D1', name: 'Dependent 1', startDate: '2024-05-06', endDate: '2024-05-08', duration: 2, dependencies: ['P'], indent: 0, progress: 0, parentId: null, taskType: '', assignee: '' },
        { id: 'D2', name: 'Dependent 2', startDate: '2024-05-06', endDate: '2024-05-10', duration: 4, dependencies: ['P'], indent: 0, progress: 0, parentId: null, taskType: '', assignee: '' },
      ];
      // Change P's end date by increasing duration
      const success = taskStore.updateTaskValue(0, 'duration', 6); // P's new duration: 6 days. New endDate: 2024-05-01 + 6 = 2024-05-07
      expect(success).toBe(true);
      expect(taskStore.tasks[0].endDate).toBe('2024-05-07');

      // Check Dependent 1: new start 2024-05-08
      expect(taskStore.tasks[1].startDate).toBe('2024-05-08');
      expect(taskStore.tasks[1].duration).toBe(2); // duration preserved
      expect(taskStore.tasks[1].endDate).toBe('2024-05-10'); // 08 + 2 = 10

      // Check Dependent 2: new start 2024-05-08
      expect(taskStore.tasks[2].startDate).toBe('2024-05-08');
      expect(taskStore.tasks[2].duration).toBe(4); // duration preserved
      expect(taskStore.tasks[2].endDate).toBe('2024-05-12'); // 08 + 4 = 12
    });

    it('should move a dependent task if its start date is before predecessor new end date + 1 day (current behavior)', () => {
      const taskStore = useTaskStore();
      taskStore.tasks = [ // P1: dur 4. D1: dur 2
        { id: 'P1', name: 'Predecessor 1', startDate: '2024-06-01', endDate: '2024-06-05', duration: 4, dependencies: [], indent: 0, progress: 0, parentId: null, taskType: '', assignee: '' },
        { id: 'D1', name: 'Dependent 1', startDate: '2024-06-10', endDate: '2024-06-12', duration: 2, dependencies: ['P1'], indent: 0, progress: 0, parentId: null, taskType: '', assignee: '' }, // D1 starts much later
      ];
      // Change P1's end date, but still before D1's original start
      const success = taskStore.updateTaskValue(0, 'endDate', '2024-06-08'); // P1 new endDate: 2024-06-08. Duration becomes 7.
      expect(success).toBe(true);
      expect(taskStore.tasks[0].endDate).toBe('2024-06-08');
      expect(taskStore.tasks[0].duration).toBe(7);

      // Check D1 - current logic moves it to start on 2024-06-09
      expect(taskStore.tasks[1].startDate).toBe('2024-06-09');
      expect(taskStore.tasks[1].duration).toBe(2); // duration preserved
      expect(taskStore.tasks[1].endDate).toBe('2024-06-11'); // 09 + 2 = 11
    });

    it('should correctly calculate duration and end date for a 0-day duration task', () => {
      const taskStore = useTaskStore();
      taskStore.tasks = [
        { id: '1', name: 'Task 1', startDate: '2024-01-01', endDate: '2024-01-01', duration: 0, progress: 0, dependencies: [], indent: 0, parentId: null, taskType: '', assignee: '' },
      ];
      // 1. Test changing endDate when duration is 0
      let success = taskStore.updateTaskValue(0, 'endDate', '2024-01-01');
      expect(success).toBe(true);
      expect(taskStore.tasks[0].duration).toBe(0);
      expect(taskStore.tasks[0].startDate).toBe('2024-01-01');
      expect(taskStore.tasks[0].endDate).toBe('2024-01-01');

      // 2. Test changing duration to 0
      taskStore.tasks[0].startDate = '2024-01-05';
      taskStore.tasks[0].endDate = '2024-01-10'; // Arbitrary different end date
      taskStore.tasks[0].duration = 5; // Arbitrary different duration
      success = taskStore.updateTaskValue(0, 'duration', 0);
      expect(success).toBe(true);
      expect(taskStore.tasks[0].startDate).toBe('2024-01-05');
      expect(taskStore.tasks[0].endDate).toBe('2024-01-05'); // Start + 0 days
      expect(taskStore.tasks[0].duration).toBe(0);

      // 3. Test changing startDate when duration is 0
      taskStore.tasks[0].duration = 0; // Ensure duration is 0
      taskStore.tasks[0].endDate = '2024-01-05'; // To see if it changes
      success = taskStore.updateTaskValue(0, 'startDate', '2024-02-10');
      expect(success).toBe(true);
      expect(taskStore.tasks[0].startDate).toBe('2024-02-10');
      expect(taskStore.tasks[0].endDate).toBe('2024-02-10'); // Should follow start date with 0 duration
      expect(taskStore.tasks[0].duration).toBe(0);
    });
  });

  describe('Input Validation in updateTaskValue', () => {
    let taskStore: ReturnType<typeof useTaskStore>; // Add type for taskStore

    beforeEach(() => {
      // setActivePinia(createPinia()); // This is in global beforeEach
      taskStore = useTaskStore();
      // Initial state for each test in this describe block
      taskStore.tasks = [
        { id: '1', name: 'Test Task', startDate: '2024-01-01', endDate: '2024-01-05', duration: 4, progress: 50, dependencies: [], indent: 0, parentId: null, taskType: '', assignee: '' },
      // Note: duration 4 for Jan 1 to Jan 5 (Jan 1 + 4 days = Jan 5)
      ];
    });

    // Duration Validation
    it('should reject negative duration and return false', () => {
      const success = taskStore.updateTaskValue(0, 'duration', -5);
      expect(success).toBe(false);
      expect(taskStore.tasks[0].duration).toBe(4); // Original value unchanged
    });

    it('should reject NaN duration and return false', () => {
      const success = taskStore.updateTaskValue(0, 'duration', NaN as any); // Cast for test
      expect(success).toBe(false);
      expect(taskStore.tasks[0].duration).toBe(4);
    });

    it('should accept valid duration and return true', () => {
      const success = taskStore.updateTaskValue(0, 'duration', 10);
      expect(success).toBe(true);
      expect(taskStore.tasks[0].duration).toBe(10);
      expect(taskStore.tasks[0].endDate).toBe('2024-01-11'); // 2024-01-01 + 10 days
    });

    // StartDate Validation
    it('should reject invalid startDate string and return false', () => {
      const success = taskStore.updateTaskValue(0, 'startDate', 'invalid-date-string');
      expect(success).toBe(false);
      expect(taskStore.tasks[0].startDate).toBe('2024-01-01');
    });

    it('should accept valid startDate string and update endDate, returning true', () => {
      const success = taskStore.updateTaskValue(0, 'startDate', '2024-01-03');
      expect(success).toBe(true);
      expect(taskStore.tasks[0].startDate).toBe('2024-01-03');
      expect(taskStore.tasks[0].duration).toBe(4); // Duration preserved
      expect(taskStore.tasks[0].endDate).toBe('2024-01-07'); // Jan 03 + 4 days
    });

    it('should handle startDate update when it crosses original endDate (endDate adjusts)', () => {
      // Original: start: 2024-01-01, end: 2024-01-05, duration: 4
      // Set startDate to 2024-01-06
      const success = taskStore.updateTaskValue(0, 'startDate', '2024-01-06');
      expect(success).toBe(true);
      expect(taskStore.tasks[0].startDate).toBe('2024-01-06');
      // The logic for startDate change:
      // 1. task.startDate = '2024-01-06'
      // 2. currentDuration is 4.
      // 3. newEndDate = addDays('2024-01-06', 4) = '2024-01-10'
      expect(taskStore.tasks[0].duration).toBe(4);
      expect(taskStore.tasks[0].endDate).toBe('2024-01-10');
    });


    // EndDate Validation
    it('should reject invalid endDate string and return false', () => {
      const success = taskStore.updateTaskValue(0, 'endDate', 'invalid-date-string');
      expect(success).toBe(false);
      expect(taskStore.tasks[0].endDate).toBe('2024-01-05');
    });

    it('should accept valid endDate string and update duration, returning true', () => {
      const success = taskStore.updateTaskValue(0, 'endDate', '2024-01-08');
      expect(success).toBe(true);
      expect(taskStore.tasks[0].endDate).toBe('2024-01-08');
      expect(taskStore.tasks[0].duration).toBe(7); // Jan 01 to Jan 08 => duration 7
    });

    it('should handle endDate update when it is before startDate (duration becomes 0)', () => {
      // Original: start: 2024-01-01, end: 2024-01-05, duration: 4
      // Set endDate to 2023-12-31
      const success = taskStore.updateTaskValue(0, 'endDate', '2023-12-31');
      expect(success).toBe(true);
      expect(taskStore.tasks[0].endDate).toBe('2023-12-31');
      // Current logic: if newEndDate < startDate, duration becomes 0.
      expect(taskStore.tasks[0].duration).toBe(0);
    });

    // Progress Validation (these seem correct based on current store logic)
    it('should reject negative progress and return false', () => {
      const success = taskStore.updateTaskValue(0, 'progress', -10);
      expect(success).toBe(false);
      expect(taskStore.tasks[0].progress).toBe(50);
    });

    it('should reject progress greater than 100 and return false', () => {
      const success = taskStore.updateTaskValue(0, 'progress', 101);
      expect(success).toBe(false);
      expect(taskStore.tasks[0].progress).toBe(50);
    });

    it('should reject NaN progress and return false', () => {
      const success = taskStore.updateTaskValue(0, 'progress', NaN as any); // Cast for test
      expect(success).toBe(false);
      expect(taskStore.tasks[0].progress).toBe(50);
    });

    it('should accept valid progress (0-100) and return true', () => {
      let success = taskStore.updateTaskValue(0, 'progress', 0);
      expect(success).toBe(true);
      expect(taskStore.tasks[0].progress).toBe(0);

      success = taskStore.updateTaskValue(0, 'progress', 100);
      expect(success).toBe(true);
      expect(taskStore.tasks[0].progress).toBe(100);

      success = taskStore.updateTaskValue(0, 'progress', 75);
      expect(success).toBe(true);
      expect(taskStore.tasks[0].progress).toBe(75);
    });

    it('should return false if taskIndex is out of bounds', () => {
      const success = taskStore.updateTaskValue(5, 'name', 'New Name'); // Assuming only 1 task at index 0
      expect(success).toBe(false);
    });
  });

  describe('Other Actions (addTask, deleteTask, etc.)', () => {
    // Tests for addTask, deleteTask, etc.
    it('should add a new task', () => {
      const taskStore = useTaskStore();
      const initialTaskCount = taskStore.tasks.length;
      taskStore.addTask(0); // Add at the beginning
      expect(taskStore.tasks.length).toBe(initialTaskCount + 1);
      expect(taskStore.tasks[0].name).toBe(''); // Default name for new tasks
      expect(taskStore.tasks[0].id).toBeDefined();
    });

    it('should delete a task', () => {
      const taskStore = useTaskStore();
      // Pre-populate with known state for this test or use default if suitable
      taskStore.tasks = getInitialTasks(); // Use a smaller, controlled set for this test
      const initialTaskCount = taskStore.tasks.length; // Should be 5
      const taskToDelete = taskStore.tasks[1]; // Task '2'

      // Select the task to be deleted (deleteTask uses selectedRow)
      taskStore.selectedRow = 1;

      taskStore.deleteTask(taskToDelete.id); // taskId param is currently unused by the action

      expect(taskStore.tasks.length).toBe(initialTaskCount - 1);
      expect(taskStore.tasks.find(t => t.id === taskToDelete.id)).toBeUndefined();
      expect(taskStore.selectedRow).toBeNull();
    });

    it.todo('should indent a task');
    it.todo('should unindent a task');
    it.todo('should select a task');
  });
});
