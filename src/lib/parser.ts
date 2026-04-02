import { Tables } from '@/integrations/supabase/types';

export type Assignment = Tables<'assignments'>;
export type AssignmentTask = Tables<'assignment_tasks'>;

export interface ParsedRequirements {
  deliverables: string[];
  constraints: string[];
  gradingCriteria: string[];
  unclearItems: string[];
}

export interface ParsedWarning {
  type: 'missing_due_date' | 'late_start' | 'high_workload' | 'ambiguous';
  message: string;
}

// Mock parser that simulates AI parsing
export function parseAssignmentText(rawText: string, title: string, courseName: string, dueDate: string | null) {
  const text = rawText.toLowerCase();

  // Detect assignment type
  let assignmentType: Assignment['assignment_type'] = 'other';
  if (text.includes('essay') || text.includes('paper') || text.includes('thesis') || text.includes('write')) assignmentType = 'essay';
  else if (text.includes('lab') || text.includes('experiment') || text.includes('hypothesis')) assignmentType = 'lab_report';
  else if (text.includes('code') || text.includes('program') || text.includes('function') || text.includes('implement')) assignmentType = 'programming';
  else if (text.includes('read') || text.includes('response') || text.includes('reflection')) assignmentType = 'reading_response';
  else if (text.includes('present') || text.includes('slides') || text.includes('group')) assignmentType = 'presentation';
  else if (text.includes('project') || text.includes('proposal')) assignmentType = 'project';

  // Estimate effort
  const wordCount = rawText.split(/\s+/).length;
  let effortEstimate = '1-2 hours';
  let difficultyEstimate = 'Medium';
  if (wordCount > 300) { effortEstimate = '2-3 hours'; difficultyEstimate = 'Medium-High'; }
  if (wordCount > 500) { effortEstimate = '3-5 hours'; difficultyEstimate = 'High'; }

  // Priority
  let priorityLevel: Assignment['priority_level'] = 'medium';
  if (dueDate) {
    const days = Math.ceil((new Date(dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (days <= 2) priorityLevel = 'urgent';
    else if (days <= 5) priorityLevel = 'high';
  }

  // Extract requirements
  const requirements: ParsedRequirements = {
    deliverables: extractBulletPoints(rawText, ['submit', 'turn in', 'deliver', 'include', 'write', 'create', 'complete']),
    constraints: extractBulletPoints(rawText, ['must', 'required', 'minimum', 'maximum', 'at least', 'no more than', 'format']),
    gradingCriteria: extractBulletPoints(rawText, ['grade', 'rubric', 'points', 'criteria', 'assessed', 'evaluated', 'worth']),
    unclearItems: [],
  };

  if (requirements.deliverables.length === 0) {
    requirements.deliverables = ['Review the full assignment prompt and identify main deliverable'];
  }
  if (requirements.constraints.length === 0) {
    requirements.unclearItems.push('No specific constraints mentioned — check with your instructor');
  }

  // Generate warnings
  const warnings: ParsedWarning[] = [];
  if (!dueDate) warnings.push({ type: 'missing_due_date', message: 'No due date provided. Add one to get timeline suggestions.' });
  if (dueDate) {
    const days = Math.ceil((new Date(dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (days <= 2) warnings.push({ type: 'late_start', message: `Only ${days} day${days === 1 ? '' : 's'} left. Start immediately.` });
    if (effortEstimate.includes('6') || effortEstimate.includes('10')) warnings.push({ type: 'high_workload', message: 'This looks like a substantial assignment. Plan multiple work sessions.' });
  }
  if (text.includes('unclear') || requirements.unclearItems.length > 0) {
    warnings.push({ type: 'ambiguous', message: 'Some parts of the instructions may be unclear. Consider asking your instructor for clarification.' });
  }

  // Generate tasks
  const tasks = generateTasks(assignmentType, title, dueDate);

  return {
    assignmentType,
    effortEstimate,
    difficultyEstimate,
    priorityLevel,
    requirements,
    warnings,
    tasks,
  };
}

function extractBulletPoints(text: string, keywords: string[]): string[] {
  const sentences = text.split(/[.!?\n]+/).map(s => s.trim()).filter(s => s.length > 10);
  const matches = sentences.filter(s => keywords.some(k => s.toLowerCase().includes(k)));
  return matches.slice(0, 5);
}

interface GeneratedTask {
  title: string;
  description: string;
  estimatedMinutes: number;
  order: number;
}

function generateTasks(type: Assignment['assignment_type'], title: string, dueDate: string | null): GeneratedTask[] {
  const baseTasks: Record<string, GeneratedTask[]> = {
    essay: [
      { title: 'Analyze prompt & rubric', description: 'Review the grading criteria, length requirements, and identify the core question to answer.', estimatedMinutes: 10, order: 0 },
      { title: 'Gather sources & evidence', description: 'Locate required citations, book quotes, or academic sources to support your arguments.', estimatedMinutes: 30, order: 1 },
      { title: 'Outline & thesis drafting', description: 'Formulate a strong thesis statement and plot out the core arguments for body paragraphs.', estimatedMinutes: 15, order: 2 },
      { title: 'Rough draft writing', description: 'Focus purely on getting ideas down without over-analyzing grammar and flow.', estimatedMinutes: 60, order: 3 },
      { title: 'Formatting & citations', description: 'Add proper APA/MLA formatting, bibliography, and align with margin/font rules.', estimatedMinutes: 15, order: 4 },
      { title: 'Final polish & proofread', description: 'Read aloud to catch unnatural phrasing and correct grammatical errors.', estimatedMinutes: 15, order: 5 },
    ],
    lab_report: [
      { title: 'Review experiment goals', description: 'Understand the underlying hypothesis and theoretical background of the lab.', estimatedMinutes: 10, order: 0 },
      { title: 'Format raw data', description: 'Clean up messy lab notes and identify the key metrics recorded.', estimatedMinutes: 15, order: 1 },
      { title: 'Create charts/tables', description: 'Generate data visualizations ensuring proper axis labels and units.', estimatedMinutes: 20, order: 2 },
      { title: 'Write Methods & Results', description: 'Document the exact procedure and present the factual outcomes neutrally.', estimatedMinutes: 25, order: 3 },
      { title: 'Draft Discussion section', description: 'Interpret the results, calculate error margins, and explain anomalies.', estimatedMinutes: 30, order: 4 },
      { title: 'Finalize Abstract & format', description: 'Write the brief summary last, and ensure scientific formatting is consistent.', estimatedMinutes: 15, order: 5 },
    ],
    programming: [
      { title: 'Parse constraints & I/O', description: 'Identify exact inputs, required outputs, and edge cases mentioned in the prompt.', estimatedMinutes: 15, order: 0 },
      { title: 'Architecture & pseudocode', description: 'Sketch out object structure, database schemas, or primary algorithms before typing.', estimatedMinutes: 20, order: 1 },
      { title: 'Environment setup', description: 'Initialize the project, install dependencies, and configure the boilerplate.', estimatedMinutes: 10, order: 2 },
      { title: 'Implement core features', description: 'Build the primary "happy path" functionality.', estimatedMinutes: 60, order: 3 },
      { title: 'Debugging & edge cases', description: 'Test against weird inputs and fix crashes or logical bugs.', estimatedMinutes: 30, order: 4 },
      { title: 'Documentation & cleanup', description: 'Add comments, format code, and write a README if required.', estimatedMinutes: 15, order: 5 },
    ],
    reading_response: [
      { title: 'Active reading', description: 'Skim first, then read deeply while highlighting key themes related to class.', estimatedMinutes: 30, order: 0 },
      { title: 'Theme identification', description: 'Pick 1-2 specific passages or arguments to focus your response on.', estimatedMinutes: 10, order: 1 },
      { title: 'Drafting response', description: 'Connect the text to broader course concepts and synthesize your opinion.', estimatedMinutes: 25, order: 2 },
      { title: 'Review & word-count check', description: 'Ensure you meet the minimum length and directly answer the prompt.', estimatedMinutes: 10, order: 3 },
    ],
    presentation: [
      { title: 'Scope & audience check', description: 'Identify the time limit constraints and what the audience needs to takeaway.', estimatedMinutes: 10, order: 0 },
      { title: 'Research & scripting', description: 'Gather the raw facts and map out the spoken narrative.', estimatedMinutes: 30, order: 1 },
      { title: 'Visual design & drafting', description: 'Build clean slides with minimal text and high-impact visuals.', estimatedMinutes: 40, order: 2 },
      { title: 'Add speaker notes', description: 'Transfer detailed points from the screen into your private speaker notes.', estimatedMinutes: 15, order: 3 },
      { title: 'Timed rehearsal', description: 'Run through verbally with a stopwatch to ensure you fit the window.', estimatedMinutes: 15, order: 4 },
    ],
    project: [
      { title: 'Requirements breakdown', description: 'Map out all mandatory deliverables and final turn-in formats.', estimatedMinutes: 15, order: 0 },
      { title: 'Milestone planning', description: 'Divide the large project into 2-3 manageable checkpoints.', estimatedMinutes: 15, order: 1 },
      { title: 'Resource gathering', description: 'Collect references, templates, or external tools required.', estimatedMinutes: 20, order: 2 },
      { title: 'Core execution phase', description: 'Heads-down work on the primary deliverable.', estimatedMinutes: 90, order: 3 },
      { title: 'Peer review / self-audit', description: 'Compare current progress against the original rubric.', estimatedMinutes: 20, order: 4 },
      { title: 'Final compilation', description: 'Assemble all parts, double check formatting, and package for submission.', estimatedMinutes: 15, order: 5 },
    ],
    other: [
      { title: 'Prompt deconstruction', description: 'Highlight verbs and mandatory constraints in the instructions.', estimatedMinutes: 10, order: 0 },
      { title: 'Initial drafting/execution', description: 'Complete the bulk of the required tasks without aiming for perfection.', estimatedMinutes: 45, order: 1 },
      { title: 'Constraint review', description: 'Compare your draft against the original rules to ensure compliance.', estimatedMinutes: 15, order: 2 },
      { title: 'Final polish & submission', description: 'Clean up styling, grammar, and turn in the assignment.', estimatedMinutes: 10, order: 3 },
    ],
  };

  return baseTasks[type || 'other'] || baseTasks.other;
}

export const sampleAssignments = [
  {
    title: 'Civil War Causes Essay',
    course: 'US History 101',
    text: `Write a 5-page analytical essay examining the primary causes of the American Civil War. Your essay must include at least 4 scholarly sources, properly cited in Chicago style. Address economic, political, and social factors that led to the conflict. Include a clear thesis statement in your introduction. The essay should demonstrate critical thinking and original analysis, not just a summary of events. Due date: April 15. Grading criteria: Thesis clarity (20%), Evidence quality (25%), Analysis depth (25%), Writing quality (15%), Citations (15%).`,
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  },
  {
    title: 'Cell Biology Lab Report',
    course: 'Biology 201',
    text: `Write a formal lab report for the osmosis experiment conducted in Lab 7. The report must follow standard scientific format: Title, Abstract, Introduction, Methods, Results, Discussion, Conclusion, and References. Include at least 2 data tables and 1 graph showing the relationship between solute concentration and cell mass change. Your discussion should explain whether your hypothesis was supported and identify potential sources of error. Minimum 3 peer-reviewed references required. Format: 12pt Times New Roman, double-spaced, APA format.`,
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  },
  {
    title: 'Sorting Algorithm Implementation',
    course: 'CS 210 - Data Structures',
    text: `Implement three sorting algorithms in Python: Merge Sort, Quick Sort, and Heap Sort. Each algorithm must be implemented as a separate function that accepts a list of integers and returns the sorted list. Write unit tests for each algorithm with at least 5 test cases including edge cases (empty list, single element, already sorted, reverse sorted, duplicates). Include a performance comparison that measures and plots the runtime of each algorithm on randomly generated lists of sizes 100, 1000, 10000, and 100000. Submit: source code files, test file, performance plot, and a brief README explaining your approach.`,
    dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  },
  {
    title: 'The Great Gatsby Response',
    course: 'English Literature',
    text: `Write a 2-3 page reading response to chapters 5-7 of The Great Gatsby. Focus on the theme of the American Dream and how Fitzgerald uses symbolism to critique it. Include at least 3 direct quotes from the text to support your analysis. Consider: What does Gatsby's green light represent? How does the Valley of Ashes function as a symbol? What is the significance of the eyes of Doctor T.J. Eckleburg? Your response should go beyond summary to offer original interpretation.`,
    dueDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  },
  {
    title: 'Marketing Strategy Presentation',
    course: 'Business 301',
    text: `Prepare a 15-minute group presentation on a marketing strategy for a real company of your choice. The presentation must include: market analysis, target audience identification, competitive analysis, proposed marketing channels, budget estimation, and expected outcomes. Create professional slides (maximum 20 slides). Each group member must present a section. Include a Q&A plan. Grading: Content quality (30%), Visual design (20%), Delivery (25%), Teamwork (15%), Q&A handling (10%).`,
    dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  },
];
