// Cleaned and deduplicated paper list from professor

export const professorPaperList = [
  // LLMs and Human Simulation
  {
    identifier: "Using Large Language Models to Simulate Multiple Humans and Replicate Human Subject Studies",
    category: "LLM Human Simulation",
    identifierType: "title" as const
  },
  {
    identifier: "Towards Evaluating AI Systems for Moral Status Using Self-Reports",
    category: "AI Moral Status",
    identifierType: "title" as const
  },
  {
    identifier: "Language Models are Bounded Pragmatic Speakers: Understanding RLHF from a Bayesian Cognitive Modeling Perspective",
    category: "LLM Pragmatics",
    identifierType: "title" as const
  },
  {
    identifier: "From Word Models to World Models: Translating from Natural Language to the Probabilistic Language of Thought",
    category: "LLM World Models",
    identifierType: "title" as const
  },

  // Theory of Mind Papers
  {
    identifier: "2302.02083",
    category: "LLM Theory of Mind",
    identifierType: "paperId" as const
  },
  {
    identifier: "2302.08399",
    category: "LLM Theory of Mind",
    identifierType: "paperId" as const
  },
  {
    identifier: "2305.14763",
    category: "LLM Theory of Mind",
    identifierType: "paperId" as const
  },
  {
    identifier: "2306.00924",
    category: "LLM Theory of Mind",
    identifierType: "paperId" as const
  },
  {
    identifier: "2306.15448",
    category: "LLM Theory of Mind",
    identifierType: "paperId" as const
  },
  {
    identifier: "2309.01660",
    category: "LLM Theory of Mind",
    identifierType: "paperId" as const
  },
  {
    identifier: "2310.03051",
    category: "LLM Theory of Mind",
    identifierType: "paperId" as const
  },
  {
    identifier: "Hypothetical Minds: Scaffolding Theory of Mind for Multi-Agent Tasks with Large Language Models",
    category: "LLM Theory of Mind",
    identifierType: "title" as const
  },

  // LLMs in Cognitive Psychology
  {
    identifier: "Emergent analogical reasoning in large language models",
    category: "LLM Cognitive Psychology",
    identifierType: "title" as const
  },
  {
    identifier: "Human-like systematic generalization through a meta-learning neural network",
    category: "LLM Cognitive Psychology",
    identifierType: "title" as const
  },
  {
    identifier: "Do LLMs Exhibit Human-like Response Biases? A Case Study in Survey Design",
    category: "LLM Cognitive Psychology",
    identifierType: "title" as const
  },
  {
    identifier: "Using cognitive psychology to understand GPT-3",
    category: "LLM Cognitive Psychology",
    identifierType: "title" as const
  },
  {
    identifier: "Language models show human-like content effects on reasoning tasks",
    category: "LLM Cognitive Psychology",
    identifierType: "title" as const
  },
  {
    identifier: "Relational reasoning and generalization using non-symbolic neural networks",
    category: "LLM Cognitive Psychology",
    identifierType: "title" as const
  },
  {
    identifier: "Instructed to Bias: Instruction-Tuned Language Models Exhibit Emergent Cognitive Bias",
    category: "LLM Cognitive Biases",
    identifierType: "title" as const
  },
  {
    identifier: "Human-like intuitive behavior and reasoning biases emerged in large language models but disappeared in ChatGPT",
    category: "LLM Cognitive Biases",
    identifierType: "title" as const
  },

  // LLM Scaling and Capabilities
  {
    identifier: "Inverse Scaling: When Bigger Isn't Better",
    category: "LLM Scaling",
    identifierType: "title" as const
  },
  {
    identifier: "Language models as agent models",
    category: "LLM Agent Models",
    identifierType: "title" as const
  },
  {
    identifier: "Embers of Autoregression: Understanding Large Language Models Through the Problem They are Trained to Solve",
    category: "LLM Understanding",
    identifierType: "title" as const
  },

  // Semantic Processing and Language Understanding
  {
    identifier: "From words to meaning: A semantic illusion",
    category: "Semantic Processing",
    identifierType: "title" as const
  },
  {
    identifier: "Rational integration of noisy evidence and prior semantic expectations in sentence interpretation",
    category: "Semantic Processing",
    identifierType: "title" as const
  },
  {
    identifier: "A noisy-channel approach to depth-charge illusions",
    category: "Semantic Processing",
    identifierType: "title" as const
  },
  {
    identifier: "Bridging the data gap between children and large language models",
    category: "LLM Language Processing",
    identifierType: "title" as const
  },
  {
    identifier: "A Language Model with Limited Memory Capacity Captures Interference in Human Sentence Processing",
    category: "LLM Language Processing",
    identifierType: "title" as const
  },
  {
    identifier: "Artificial neural network language models align neurally and behaviorally with humans even after a developmentally realistic amount of training",
    category: "LLM Language Processing",
    identifierType: "title" as const
  },
  {
    identifier: "Mission: Impossible Language Models",
    category: "LLM Language Processing",
    identifierType: "title" as const
  },

  // Cognitive Evaluation of LLMs
  {
    identifier: "Baby steps in evaluating the capacities of large language models",
    category: "LLM Cognitive Evaluation",
    identifierType: "title" as const
  },
  {
    identifier: "Evaluating Cognitive Maps in Large Language Models with CogEval: No Emergent Planning",
    category: "LLM Cognitive Evaluation",
    identifierType: "title" as const
  },
  {
    identifier: "Running cognitive evaluations on large language models: The do's and the don'ts",
    category: "LLM Cognitive Evaluation",
    identifierType: "title" as const
  },

  // LLM Mechanisms and Learning
  {
    identifier: "Consciousness in Artificial Intelligence: Insights from the Science of Consciousness",
    category: "AI Consciousness",
    identifierType: "title" as const
  },
  {
    identifier: "A Theory of Emergent In-Context Learning as Implicit Structure Induction",
    category: "LLM Learning Mechanisms",
    identifierType: "title" as const
  },
  {
    identifier: "Why think step by step? Reasoning emerges from the locality of experience",
    category: "LLM Learning Mechanisms",
    identifierType: "title" as const
  },
  {
    identifier: "Pretraining task diversity and the emergence of non-Bayesian in-context learning for regression",
    category: "LLM Learning Mechanisms",
    identifierType: "title" as const
  },

  // AI and Democratic Processes
  {
    identifier: "AI can help humans find common ground in democratic deliberation",
    category: "AI Democracy",
    identifierType: "title" as const
  },
  {
    identifier: "How will advanced AI systems impact democracy?",
    category: "AI Democracy",
    identifierType: "title" as const
  },

  // AI-Mediated Communication
  {
    identifier: "From Text to Self: Users' Perception of AIMC Tools on Interpersonal Communication and Self",
    category: "AI-Mediated Communication",
    identifierType: "title" as const
  },
  {
    identifier: "How human–AI feedback loops alter human perceptual, emotional and social judgements",
    category: "AI-Mediated Communication",
    identifierType: "title" as const
  },
  {
    identifier: "Co-Writing with Opinionated Language Models Affects Users' Views",
    category: "AI-Mediated Communication",
    identifierType: "title" as const
  },
  {
    identifier: "Improving Interpersonal Communication by Simulating Audiences with Language Models",
    category: "AI-Mediated Communication",
    identifierType: "title" as const
  },

  // AI Empathy and Social Perception
  {
    identifier: "The Social Sense: Susceptibility to Others' Beliefs in Human Infants and Adult",
    category: "Social Perception",
    identifierType: "title" as const
  },
  {
    identifier: "Large Language Models Produce Responses Perceived to be Empathic",
    category: "AI Empathy",
    identifierType: "title" as const
  },
  {
    identifier: "Large language models know how the personality of public figures is perceived by the general public",
    category: "AI Social Perception",
    identifierType: "title" as const
  },
  {
    identifier: "Large language models and humans converge in judging public figures' personalities",
    category: "AI Social Perception",
    identifierType: "title" as const
  },
  {
    identifier: "Generative language models exhibit social identity biases",
    category: "AI Social Biases",
    identifierType: "title" as const
  },

  // AI Applications in Research
  {
    identifier: "Best Practices for Text Annotation with Large Language Models",
    category: "AI Research Methods",
    identifierType: "title" as const
  },
  {
    identifier: "Using large language models in psychology",
    category: "AI Research Methods",
    identifierType: "title" as const
  },

  // AI in Strategic and Game Contexts
  {
    identifier: "Human-level play in the game of Diplomacy by combining language models with strategic reasoning",
    category: "AI Strategic Reasoning",
    identifierType: "title" as const
  },
  {
    identifier: "Playing repeated games with Large Language Models",
    category: "AI Strategic Reasoning",
    identifierType: "title" as const
  },

  // AI Mathematical and Reasoning Limitations
  {
    identifier: "GSM-Symbolic: Understanding the Limitations of Mathematical Reasoning in Large Language Models",
    category: "AI Reasoning Limitations",
    identifierType: "title" as const
  },

  // AI Honesty and Deception
  {
    identifier: "How do Large Language Models Navigate Conflicts between Honesty and Helpfulness?",
    category: "AI Honesty and Deception",
    identifierType: "title" as const
  },
  {
    identifier: "Detection avoidance techniques for large language models",
    category: "AI Honesty and Deception",
    identifierType: "title" as const
  },
  {
    identifier: "Linguistic markers of inherently false AI communication and intentionally false human communication: Evidence from hotel reviews",
    category: "AI Honesty and Deception",
    identifierType: "title" as const
  },
  {
    identifier: "Honesty Is the Best Policy: Defining and Mitigating AI Deception",
    category: "AI Honesty and Deception",
    identifierType: "title" as const
  },
  {
    identifier: "AI Deception: A Survey of Examples, Risks, and Potential Solutions",
    category: "AI Honesty and Deception",
    identifierType: "title" as const
  },

  // AI Anthropomorphism and Persuasion
  {
    identifier: "The benefits and dangers of anthropomorphic conversational agents",
    category: "AI Anthropomorphism",
    identifierType: "title" as const
  },
  {
    identifier: "On the conversational persuasiveness of GPT-4",
    category: "AI Persuasion",
    identifierType: "title" as const
  },

  // Information Security and Vulnerabilities
  {
    identifier: "Quantifying the vulnerabilities of online public square",
    category: "Information Security",
    identifierType: "title" as const
  },

  // Missing papers added via script
  {
    identifier: "Micro-narratives: A Scalable Method for Eliciting Stories of People's Lived Experience",
    category: "Narrative Methods",
    identifierType: "title" as const
  },
  {
    identifier: "Executive Function: A Contrastive Value Policy for Resampling and Relabeling Perceptions via Hindsight Summarization",
    category: "Executive Function",
    identifierType: "title" as const
  },
  {
    identifier: "2302.02083",
    category: "LLM Theory of Mind",
    identifierType: "paperId" as const
  },
  {
    identifier: "2302.08399",
    category: "LLM Theory of Mind",
    identifierType: "paperId" as const
  },
  {
    identifier: "2305.14763",
    category: "LLM Theory of Mind",
    identifierType: "paperId" as const
  },
  {
    identifier: "2306.00924",
    category: "LLM Theory of Mind",
    identifierType: "paperId" as const
  },
  {
    identifier: "2306.15448",
    category: "LLM Theory of Mind",
    identifierType: "paperId" as const
  },
  {
    identifier: "2309.01660",
    category: "LLM Theory of Mind",
    identifierType: "paperId" as const
  },
  {
    identifier: "2310.03051",
    category: "LLM Theory of Mind",
    identifierType: "paperId" as const
  },
  {
    identifier: "FANToM: A Benchmark for Stress-testing Machine Theory of Mind in Interactions",
    category: "LLM Theory of Mind",
    identifierType: "title" as const
  },
  {
    identifier: "2312.01276",
    category: "LLM Cognitive Evaluation",
    identifierType: "paperId" as const
  },

  // arXiv papers fetched from API
  {
    identifier: "Evaluating Large Language Models in Theory of Mind Tasks",
    category: "LLM Theory of Mind",
    identifierType: "title" as const
  },
  {
    identifier: "Large Language Models Fail on Trivial Alterations to Theory-of-Mind Tasks",
    category: "LLM Theory of Mind",
    identifierType: "title" as const
  },
  {
    identifier: "Clever Hans or Neural Theory of Mind? Stress Testing Social Reasoning in Large Language Models",
    category: "LLM Theory of Mind",
    identifierType: "title" as const
  },
  {
    identifier: "Minding Language Models' (Lack of) Theory of Mind: A Plug-and-Play Multi-Character Belief Tracker",
    category: "LLM Theory of Mind",
    identifierType: "title" as const
  },
  {
    identifier: "Understanding Social Reasoning in Language Models with Language Models",
    category: "LLM Theory of Mind",
    identifierType: "title" as const
  },
  {
    identifier: "Unveiling Theory of Mind in Large Language Models: A Parallel to Single Neurons in the Human Brain",
    category: "LLM Theory of Mind",
    identifierType: "title" as const
  },
  {
    identifier: "How FaR Are Large Language Models From Agents with Theory-of-Mind?",
    category: "LLM Theory of Mind",
    identifierType: "title" as const
  },
  {
    identifier: "Toward best research practices in AI Psychology",
    category: "LLM Cognitive Evaluation",
    identifierType: "title" as const
  },
];

// Export count for verification
export const paperCount = professorPaperList.length;
console.log(`Total papers in professor's list: ${paperCount}`);

// Category breakdown
export const categoryBreakdown = professorPaperList.reduce((acc, paper) => {
  acc[paper.category] = (acc[paper.category] || 0) + 1;
  return acc;
}, {} as Record<string, number>);
