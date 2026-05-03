import { clipExamText } from "@/lib/groq";

export function topicExtractionPrompt(examText: string) {
  const text = clipExamText(examText);
  return `Extract all topics from the following exam questions.
Return JSON exactly in this shape:
{"topics":[{"name":"string","frequency":number}]}

Exam text:
${text}`;
}

export function classificationPrompt(examText: string) {
  const text = clipExamText(examText);
  return `Classify each question into:
MCQ, Theory, Numerical
Also assign difficulty: Easy/Medium/Hard

Return JSON only in this shape:
{"items":[{"excerpt":"string","type":"MCQ|Theory|Numerical","difficulty":"Easy|Medium|Hard"}]}

Use a short excerpt (max 200 chars) per question. If the document is one block, split into distinct questions.

Exam text:
${text}`;
}

export function importancePrompt(topicFrequencyTable: { name: string; frequency: number }[]) {
  const rows = JSON.stringify(topicFrequencyTable);
  return `Rank each topic by exam importance as High, Medium, or Low using frequency and typical exam weighting.
Return JSON only:
{"rankings":[{"name":"string","importance":"High|Medium|Low","rationale":"string"}]}

Topics with frequencies:
${rows}`;
}

export function syllabusCoveragePrompt(syllabusText: string, topicNames: string[]) {
  return `Compare this syllabus to the extracted exam topics. Return JSON only:
{"percentCovered":number,"coveredTopics":["string"],"gapTopics":["string"],"notes":"string"}

Syllabus:
${clipExamText(syllabusText, 8000)}

Exam topics:
${JSON.stringify(topicNames)}`;
}

export function studyPlanPrompt(highTopics: string[], days: number) {
  return `Generate a day-wise study plan based on:
- High priority topics: ${JSON.stringify(highTopics)}
- Number of days: ${days}

Return JSON only:
{"plan":[{"day":1,"topics":[],"revision":true}]}

Each day must list topic names from the high priority set (spread across days). Use revision: true on roughly every third day.`;
}

export function practiceQuestionsPrompt(topic: string) {
  return `Generate 3 exam-level questions for this topic.

Return JSON only:
{"questions":[{"prompt":"string","type":"MCQ|Theory|Numerical","difficulty":"Easy|Medium|Hard","answerOutline":"string"}]}

Topic: ${topic}`;
}
