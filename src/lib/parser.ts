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
  let effortEstimate = '2-3 hours';
  let difficultyEstimate = 'Medium';
  if (wordCount > 300) { effortEstimate = '4-6 hours'; difficultyEstimate = 'Medium-High'; }
  if (wordCount > 500) { effortEstimate = '6-10 hours'; difficultyEstimate = 'High'; }

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
      { title: 'Read and analyze the prompt', description: 'Carefully read through the assignment prompt. Highlight key requirements and note any questions.', estimatedMinutes: 20, order: 0 },
      { title: 'Research and gather sources', description: 'Find relevant sources, take notes, and identify key arguments or evidence.', estimatedMinutes: 60, order: 1 },
      { title: 'Create an outline', description: 'Organize your main points into a logical structure with intro, body, and conclusion.', estimatedMinutes: 30, order: 2 },
      { title: 'Write the first draft', description: 'Write the full essay following your outline. Don\'t worry about perfection yet.', estimatedMinutes: 90, order: 3 },
      { title: 'Revise and edit', description: 'Review for clarity, argument strength, grammar, and formatting requirements.', estimatedMinutes: 45, order: 4 },
      { title: 'Final review and submit', description: 'Do a final read-through, check formatting, and submit before the deadline.', estimatedMinutes: 20, order: 5 },
    ],
    lab_report: [
      { title: 'Review lab procedures', description: 'Go through the lab manual and understand each step of the experiment.', estimatedMinutes: 20, order: 0 },
      { title: 'Organize raw data', description: 'Compile and organize all data collected during the lab session.', estimatedMinutes: 30, order: 1 },
      { title: 'Create tables and figures', description: 'Build data tables, graphs, and charts to visualize your results.', estimatedMinutes: 45, order: 2 },
      { title: 'Write methods and results', description: 'Describe the experimental procedure and present your findings.', estimatedMinutes: 40, order: 3 },
      { title: 'Write introduction and discussion', description: 'Provide context and interpret your results in the discussion section.', estimatedMinutes: 50, order: 4 },
      { title: 'Write abstract and conclusion', description: 'Summarize the entire report and state your conclusions.', estimatedMinutes: 25, order: 5 },
      { title: 'Review and format', description: 'Check formatting, citations, and proofread the entire report.', estimatedMinutes: 20, order: 6 },
    ],
    programming: [
      { title: 'Understand the requirements', description: 'Read through the assignment and identify inputs, outputs, and constraints.', estimatedMinutes: 20, order: 0 },
      { title: 'Plan the solution', description: 'Sketch out your approach, data structures, and algorithms before coding.', estimatedMinutes: 30, order: 1 },
      { title: 'Set up the project', description: 'Create the project structure, files, and any boilerplate code.', estimatedMinutes: 15, order: 2 },
      { title: 'Implement core logic', description: 'Write the main functionality step by step, testing as you go.', estimatedMinutes: 90, order: 3 },
      { title: 'Handle edge cases', description: 'Test with edge cases and add error handling where needed.', estimatedMinutes: 30, order: 4 },
      { title: 'Write tests and documentation', description: 'Add comments, write tests, and document your code.', estimatedMinutes: 30, order: 5 },
      { title: 'Final testing and submission', description: 'Run all tests, clean up code, and prepare for submission.', estimatedMinutes: 20, order: 6 },
    ],
    reading_response: [
      { title: 'Read the assigned text', description: 'Read carefully, highlighting key passages and noting your reactions.', estimatedMinutes: 45, order: 0 },
      { title: 'Identify main themes', description: 'Note the core arguments, themes, or ideas presented in the text.', estimatedMinutes: 15, order: 1 },
      { title: 'Draft your response', description: 'Write your analysis, connecting the text to course themes and your own perspective.', estimatedMinutes: 40, order: 2 },
      { title: 'Revise and submit', description: 'Edit for clarity, check word count requirements, and submit.', estimatedMinutes: 15, order: 3 },
    ],
    presentation: [
      { title: 'Define the presentation scope', description: 'Clarify the topic, audience, time limit, and key messages.', estimatedMinutes: 15, order: 0 },
      { title: 'Research content', description: 'Gather information, data, and examples to support your presentation.', estimatedMinutes: 45, order: 1 },
      { title: 'Create slide outline', description: 'Plan the flow: intro, main points, examples, conclusion.', estimatedMinutes: 20, order: 2 },
      { title: 'Design slides', description: 'Create clean, visual slides with minimal text and strong visuals.', estimatedMinutes: 60, order: 3 },
      { title: 'Prepare speaking notes', description: 'Write key talking points for each slide.', estimatedMinutes: 20, order: 4 },
      { title: 'Practice and rehearse', description: 'Run through the presentation at least twice, timing yourself.', estimatedMinutes: 30, order: 5 },
    ],
    project: [
      { title: 'Define project scope', description: 'Clarify deliverables, constraints, and success criteria.', estimatedMinutes: 20, order: 0 },
      { title: 'Create a project plan', description: 'Break the project into phases with milestones and deadlines.', estimatedMinutes: 30, order: 1 },
      { title: 'Research and gather resources', description: 'Collect all materials, tools, and information needed.', estimatedMinutes: 45, order: 2 },
      { title: 'Execute phase 1', description: 'Complete the first major section or deliverable of the project.', estimatedMinutes: 90, order: 3 },
      { title: 'Execute phase 2', description: 'Complete the second major section, building on phase 1.', estimatedMinutes: 90, order: 4 },
      { title: 'Review and polish', description: 'Quality check all deliverables and make final improvements.', estimatedMinutes: 40, order: 5 },
      { title: 'Final submission', description: 'Compile everything and submit according to instructions.', estimatedMinutes: 20, order: 6 },
    ],
    other: [
      { title: 'Read and understand requirements', description: 'Carefully review all assignment instructions and note key requirements.', estimatedMinutes: 20, order: 0 },
      { title: 'Plan your approach', description: 'Decide how to tackle the assignment and break it into steps.', estimatedMinutes: 15, order: 1 },
      { title: 'Work on main content', description: 'Complete the core work of the assignment.', estimatedMinutes: 60, order: 2 },
      { title: 'Review and refine', description: 'Check your work against the requirements and make improvements.', estimatedMinutes: 30, order: 3 },
      { title: 'Finalize and submit', description: 'Do a final check and submit your work.', estimatedMinutes: 15, order: 4 },
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
