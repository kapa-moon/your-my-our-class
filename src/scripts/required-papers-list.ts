// Required weekly readings from professor

export const requiredPapersList = [
  // Week 2: Oct 2 - AI-Mediated Communication
  {
    title: "AI-Mediated Communication: Definition, Research Agenda, and Ethical Considerations",
    url: "https://academic.oup.com/jcmc/article/25/1/89/5714020",
    weekNumber: "2",
    weekTopic: "AI-Mediated Communication",
    category: "AI-Mediated Communication",
    identifierType: "title" as const
  },
  {
    title: "Human heuristics for AI-generated language are flawed",
    url: "https://www.pnas.org/doi/full/10.1073/pnas.2208839120",
    weekNumber: "2",
    weekTopic: "AI-Mediated Communication",
    category: "AI-Mediated Communication",
    identifierType: "title" as const
  },

  // Week 3: Oct 9 - LLMs and role play
  {
    title: "Role play with large language models",
    url: "https://www.nature.com/articles/s41586-023-06647-8",
    weekNumber: "3",
    weekTopic: "LLMs and role play",
    category: "LLM Role Play",
    identifierType: "title" as const
  },
  {
    title: "Evaluating large language models in theory of mind tasks",
    url: "https://www.pnas.org/doi/10.1073/pnas.2405460121",
    weekNumber: "3",
    weekTopic: "LLMs and role play",
    category: "LLM Theory of Mind",
    identifierType: "title" as const
  },

  // Week 4: Oct 16 - Social Bots
  {
    title: "Exposure to social bots amplifies perceptual biases and regulation propensity",
    url: "https://scholar.google.com/citations?view_op=view_citation&hl=en&user=tBCQR_8AAAAJ&sortby=pubdate&citation_for_view=tBCQR_8AAAAJ:MXK_kJrjxJIC",
    weekNumber: "4",
    weekTopic: "Social Bots",
    category: "Social Bots",
    identifierType: "title" as const
  },
  {
    title: "The landscape of social bot research: a critical appraisal",
    url: "https://scholar.google.com/citations?view_op=view_citation&hl=en&user=tBCQR_8AAAAJ&sortby=pubdate&citation_for_view=tBCQR_8AAAAJ:5nxA0vEk-isC",
    weekNumber: "4",
    weekTopic: "Social Bots",
    category: "Social Bots",
    identifierType: "title" as const
  },

  // Week 5: Oct 23 - Models interacting with each other
  {
    title: "Could a Large Language Model Be Conscious?",
    url: "https://www.bostonreview.net/articles/could-a-large-language-model-be-conscious/",
    weekNumber: "5",
    weekTopic: "Models interacting with each other",
    category: "LLM Consciousness",
    identifierType: "title" as const
  },
  {
    title: "Generative Agents: Interactive Simulacra of Human Behavior",
    url: "https://arxiv.org/abs/2304.03442",
    weekNumber: "5",
    weekTopic: "Models interacting with each other",
    category: "Generative Agents",
    identifierType: "title" as const
  },
  {
    title: "Large language models show human-like content biases in transmission chain experiments",
    url: "https://www.pnas.org/doi/abs/10.1073/pnas.2313790120",
    weekNumber: "5",
    weekTopic: "Models interacting with each other",
    category: "LLM Human-like Behavior",
    identifierType: "title" as const
  },

  // Week 6: Oct 30 - Deception and Truth
  {
    title: "Generative AI are more truth-biased than humans: A replication and extension of core truth-default theory principles",
    url: "https://journals.sagepub.com/doi/abs/10.1177/0261927X231220404",
    weekNumber: "6",
    weekTopic: "Deception and Truth",
    category: "AI Truth and Deception",
    identifierType: "title" as const
  },
  {
    title: "Durably reducing conspiracy beliefs through dialogues with AI",
    url: "https://www.science.org/doi/pdf/10.1126/science.adq1814",
    weekNumber: "6",
    weekTopic: "Deception and Truth",
    category: "AI Truth and Deception",
    identifierType: "title" as const
  },

  // Week 7: Nov 6 - LLMs reflecting human diversity of thought and opinion
  {
    title: "Can generative AI improve social science",
    url: "https://www.pnas.org/doi/epub/10.1073/pnas.2314021121",
    weekNumber: "7",
    weekTopic: "LLMs reflecting human diversity of thought and opinion",
    category: "AI for Social Science",
    identifierType: "title" as const
  },
  {
    title: "Can LLMs predict results of social science experiments?",
    url: "https://docsend.com/view/ity6yf2dansesucf",
    weekNumber: "7",
    weekTopic: "LLMs reflecting human diversity of thought and opinion",
    category: "AI for Social Science",
    identifierType: "title" as const
  },

  // Week 8: Nov 13 - LLMs as content analysts
  {
    title: "Embedding democratic values into social media AIs via societal objective functions",
    url: "https://dl.acm.org/doi/abs/10.1145/3641002",
    weekNumber: "8",
    weekTopic: "LLMs as content analysts",
    category: "AI Content Analysis",
    identifierType: "title" as const
  },
  {
    title: "Social Media Algorithms Can Shape Affective Polarization via Exposure to Antidemocratic Attitudes and Partisan Animosity",
    url: "https://www.semanticscholar.org/paper/Social-Media-Algorithms-Can-Shape-Affective-via-to-Piccardi-Saveski/590fbfbaec1c52eb1c064f23ce1406aa76dce793",
    weekNumber: "8",
    weekTopic: "LLMs as content analysts",
    category: "Social Media Analysis",
    identifierType: "title" as const
  },

  // Week 9: Nov 20 - Reflections on human cognition
  {
    title: "Openly accessible LLMs can help us to understand human cognition",
    url: "https://doi.org/10.1038/s41562-023-01732-4",
    weekNumber: "9",
    weekTopic: "Reflections on human cognition",
    category: "LLM Human Cognition",
    identifierType: "title" as const
  }
];

export const requiredPapersCount = requiredPapersList.length;
console.log(`Total required papers: ${requiredPapersCount}`);
