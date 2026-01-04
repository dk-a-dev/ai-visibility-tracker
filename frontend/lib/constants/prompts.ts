export const PROMPT_STRATEGIES = {
  balanced: {
    name: "Balanced",
    icon: "⚖️",
    description: "Works well for most brands",
    distribution: {
      informational: 0.35,
      comparison: 0.30,
      problem_solving: 0.20,
      feature: 0.15,
    },
  },
  startup: {
    name: "Startup",
    icon: "🚀",
    description: "Building brand awareness",
    distribution: {
      informational: 0.50,
      comparison: 0.20,
      problem_solving: 0.20,
      feature: 0.10,
    },
  },
  competitive: {
    name: "Competitive",
    icon: "⚔️",
    description: "Win head-to-head comparisons",
    distribution: {
      informational: 0.25,
      comparison: 0.45,
      problem_solving: 0.20,
      feature: 0.10,
    },
  },
  featureRich: {
    name: "Feature-Rich",
    icon: "🎯",
    description: "Showcase unique capabilities",
    distribution: {
      informational: 0.30,
      comparison: 0.25,
      problem_solving: 0.15,
      feature: 0.30,
    },
  },
  solutionFocused: {
    name: "Solution-Focused",
    icon: "🔧",
    description: "Be the answer to problems",
    distribution: {
      informational: 0.25,
      comparison: 0.25,
      problem_solving: 0.40,
      feature: 0.10,
    },
  },
};

export const PROMPT_CATEGORIES = {
  informational: {
    name: "Informational",
    color: "bg-blue-500",
    description: "Discovery phase questions",
  },
  comparison: {
    name: "Comparison",
    color: "bg-purple-500",
    description: "Competitive evaluation",
  },
  problem_solving: {
    name: "Problem Solving",
    color: "bg-green-500",
    description: "Solution-seeking queries",
  },
  feature: {
    name: "Feature",
    color: "bg-orange-500",
    description: "Feature-specific questions",
  },
};
