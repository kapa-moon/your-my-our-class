// Course information for AI paper matching system

export const COURSE_INFO = {
  title: "COMM 324: Language and Technology",
  
  courseOverview: `
In this course, we integrate models of language use from psychology and communication with emerging technologies, with this year having a focus on generative AI, in particular Large Language Models (LLMs). We will read and discuss a selection of recent papers at the intersection of communication and computer science.

We will aim to understand:
- How will AI systems influence human communication?
- How human-like in behavior are current AI systems?
- Where can AI be better informed by (recent) advances in cognitive and communication sciences?
- Which ideas from modern AI inspire new approaches to human intelligence and communication?
- What principles of intelligence and communication emerge from comparing humans to modern AI?
`,

  courseGoals: `
The overall goal for the course is to introduce students to thinking about how new language analysis tools like large language models can be examined to understand human language and social dynamics, but also how they can be used to advance social science research, and to develop a research project for the student.

Multiple objectives intended for a wide variety of student backgrounds and goals including:
- Systematically examining the literature on large language models.
- Evaluating these models, with an emphasis on how examining these models can inform our understanding of human behavior and language and how they can be used to analyze psychological and social dynamics.
- Applying concepts from class and large language models to conduct a project.
`,

  weeklyTopics: {
    "1": { topic: "Intro", description: "Course introduction and overview" },
    "2": { topic: "AI-Mediated Communication", description: "How AI systems mediate human communication" },
    "3": { topic: "LLMs and role play", description: "Large language models in role-playing scenarios and theory of mind" },
    "4": { topic: "Social Bots", description: "Social bots and their impact on perception and regulation" },
    "5": { topic: "Models interacting with each other", description: "AI consciousness, generative agents, and model-to-model interactions" },
    "6": { topic: "Deception and Truth", description: "Truth bias in AI, conspiracy beliefs, and deception detection" },
    "7": { topic: "LLMs reflecting human diversity of thought and opinion", description: "AI's ability to understand and replicate human diversity in thinking" },
    "8": { topic: "LLMs as content analysts", description: "Using LLMs for content analysis and democratic value embedding" },
    "9": { topic: "Reflections on human cognition", description: "How LLMs help us understand human cognitive processes" },
    "10": { topic: "Final project presentations", description: "Student presentations of final projects" }
  },

  courseEssence: `
This course sits at the intersection of communication science, psychology, and artificial intelligence. 
It focuses on understanding how Large Language Models work as communication tools and psychological research instruments.
The emphasis is on bidirectional learning: using psychology and communication science to understand AI, 
and using AI to advance our understanding of human communication and cognition.
Key themes include human-AI interaction, computational approaches to psychology, 
and the social implications of AI communication technologies.
`
};

// Helper function to get relevant course context for a specific week
export function getCourseContextForWeek(weekNumber: string): string {
  const weekInfo = COURSE_INFO.weeklyTopics[weekNumber as keyof typeof COURSE_INFO.weeklyTopics];
  
  return `
Course: ${COURSE_INFO.title}

Course Overview: ${COURSE_INFO.courseOverview}

Course Goals: ${COURSE_INFO.courseGoals}

Course Essence: ${COURSE_INFO.courseEssence}

Week ${weekNumber} Focus:
Topic: ${weekInfo?.topic || 'Unknown'}
Description: ${weekInfo?.description || 'No description available'}
`;
}

// Helper function to extract relevant student interests (filtering out distracting information)
export function extractRelevantStudentInterests(personaData: any, surveyData: any): string {
  const relevant = {
    researchInterests: personaData?.researchInterest || surveyData?.researchInterests || '',
    academicBackground: personaData?.academicBackground || surveyData?.academicBackground || '',
    learningGoals: personaData?.learningGoal || surveyData?.classGoals || '',
    recentReadings: personaData?.recentReading || surveyData?.recentReadings || '',
  };

  // Filter out potentially distracting information (personal details, preferences not related to research)
  const cleanText = (text: string) => {
    if (!text) return '';
    // Remove overly personal details, focus on academic/research content
    return text
      .replace(/\b(I like|I enjoy|I prefer|personally|my favorite)\b/gi, '')
      .replace(/\b(fun|exciting|interesting)\b/gi, '')
      .trim();
  };

  return `
Research Interests: ${cleanText(relevant.researchInterests)}
Academic Background: ${cleanText(relevant.academicBackground)}
Learning Goals for This Class: ${cleanText(relevant.learningGoals)}
Recent Academic Readings/Thoughts: ${cleanText(relevant.recentReadings)}
`.trim();
}
