"""Prompt generation service with templates"""
from typing import List
import random


# Template categories
INFORMATIONAL_TEMPLATES = [
    "What are the best {category} for {persona}?",
    "Top {category} in 2026",
    "Which {category} should I choose?",
    "Best {category} for {use_case}",
    "Leading {category} platforms",
    "{category} - complete guide",
    "Most popular {category} tools",
    "Recommended {category} for {company_size}",
]

COMPARISON_TEMPLATES = [
    "Compare {category} - which is best?",
    "{brand1} vs {brand2} for {use_case}",
    "Free vs paid {category} comparison",
    "{category} pricing comparison",
    "Which {category} has better {feature}?",
    "{brand1} or {brand2} - which to choose?",
    "Best {category} alternatives",
    "{category} features comparison",
]

PROBLEM_SOLVING_TEMPLATES = [
    "How to solve {problem} with {category}?",
    "What {category} helps with {pain_point}?",
    "Looking for {category} that can {capability}",
    "Need {category} for {specific_need}",
    "Which {category} handles {challenge} best?",
    "How to improve {metric} using {category}?",
    "{category} for solving {business_problem}",
]

FEATURE_SPECIFIC_TEMPLATES = [
    "Which {category} has {feature}?",
    "{category} with {integration} integration",
    "Best {category} for {platform} users",
    "{category} that supports {capability}",
    "Looking for {category} with {requirement}",
    "{category} that integrates with {tool}",
    "Which {category} offers {specific_feature}?",
]

USE_CASE_TEMPLATES = [
    "{category} for {industry} companies",
    "Best {category} for {team_size} teams",
    "{category} for remote {workflow}",
    "Which {category} works best for {scenario}?",
    "{category} recommendations for {business_type}",
]


# Personas
PERSONAS = [
    "small businesses",
    "startups",
    "enterprises",
    "freelancers",
    "agencies",
    "remote teams",
    "growing companies",
    "beginners",
]

# Company sizes
COMPANY_SIZES = [
    "small teams",
    "10-person teams",
    "50+ employees",
    "large organizations",
    "solo entrepreneurs",
    "mid-size companies",
]

# Common use cases
USE_CASES = [
    "team collaboration",
    "project management",
    "sales tracking",
    "customer support",
    "marketing campaigns",
    "data analysis",
    "workflow automation",
    "reporting",
]

# Common features
FEATURES = [
    "automation",
    "analytics",
    "mobile app",
    "API access",
    "custom fields",
    "integrations",
    "reporting dashboards",
    "collaboration tools",
]

# Common problems/pain points
PAIN_POINTS = [
    "slow onboarding",
    "data silos",
    "manual processes",
    "lack of visibility",
    "team communication issues",
    "inefficient workflows",
    "scattered information",
]


def generate_prompts(
    category: str, 
    brands: List[str], 
    count: int = 40,
    distribution: dict = None
) -> List[dict]:
    """
    Generate prompts for a category using templates
    
    Args:
        category: The product category (e.g., "CRM software")
        brands: List of brand names to include in comparisons
        count: Number of prompts to generate
        distribution: Optional custom distribution (e.g., {"informational": 0.40, "comparison": 0.35, ...})
                     Useful for brands with specific strategies:
                     - Startups: More informational (discovery)
                     - Competitive brands: More comparison
                     - Feature-rich products: More feature-specific
        
    Returns:
        List of prompt dicts with text, category, and intent_type
    """
    prompts = []
    
    # Default distribution (can be customized per brand strategy)
    if distribution is None:
        distribution = {
            "informational": 0.35,  # Discovery phase
            "comparison": 0.30,      # Competitive evaluation
            "problem_solving": 0.20, # Solution-seeking
            "feature": 0.15          # Feature exploration
        }
    
    # Calculate distribution
    informational_count = int(count * distribution.get("informational", 0.35))
    comparison_count = int(count * distribution.get("comparison", 0.30))
    problem_solving_count = int(count * distribution.get("problem_solving", 0.20))
    feature_count = int(count * distribution.get("feature", 0.15))
    
    # Generate informational prompts
    for _ in range(informational_count):
        template = random.choice(INFORMATIONAL_TEMPLATES)
        prompt_text = template.format(
            category=category,
            persona=random.choice(PERSONAS),
            use_case=random.choice(USE_CASES),
            company_size=random.choice(COMPANY_SIZES)
        )
        prompts.append({
            "text": prompt_text,
            "category": "informational",
            "intent_type": "discovery"
        })
    
    # Generate comparison prompts
    for _ in range(comparison_count):
        template = random.choice(COMPARISON_TEMPLATES)
        
        # Pick two random brands for comparison
        if len(brands) >= 2:
            brand1, brand2 = random.sample(brands, 2)
        else:
            brand1 = brands[0] if brands else "tool"
            brand2 = "alternative"
        
        prompt_text = template.format(
            category=category,
            brand1=brand1,
            brand2=brand2,
            use_case=random.choice(USE_CASES),
            feature=random.choice(FEATURES)
        )
        prompts.append({
            "text": prompt_text,
            "category": "comparison",
            "intent_type": "evaluation"
        })
    
    # Generate problem-solving prompts
    for _ in range(problem_solving_count):
        template = random.choice(PROBLEM_SOLVING_TEMPLATES)
        prompt_text = template.format(
            category=category,
            problem=random.choice(PAIN_POINTS),
            pain_point=random.choice(PAIN_POINTS),
            capability=random.choice(USE_CASES),
            specific_need=random.choice(USE_CASES),
            challenge=random.choice(PAIN_POINTS),
            metric="productivity",
            business_problem=random.choice(PAIN_POINTS)
        )
        prompts.append({
            "text": prompt_text,
            "category": "problem_solving",
            "intent_type": "decision"
        })
    
    # Generate feature-specific prompts
    for _ in range(feature_count):
        template = random.choice(FEATURE_SPECIFIC_TEMPLATES)
        prompt_text = template.format(
            category=category,
            feature=random.choice(FEATURES),
            integration=random.choice(["Slack", "Salesforce", "Google Workspace", "Microsoft Teams"]),
            platform=random.choice(["Mac", "Windows", "mobile", "web"]),
            capability=random.choice(FEATURES),
            requirement=random.choice(FEATURES),
            tool=random.choice(["Slack", "Trello", "Jira", "Asana"]),
            specific_feature=random.choice(FEATURES)
        )
        prompts.append({
            "text": prompt_text,
            "category": "feature",
            "intent_type": "evaluation"
        })
    
    return prompts
