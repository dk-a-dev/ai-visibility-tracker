"""Analysis service for extracting mentions and sentiment"""
import re
from typing import List, Dict, Optional, Tuple
from urllib.parse import urlparse


# Sentiment keywords
POSITIVE_KEYWORDS = [
    "best", "excellent", "great", "top", "leading", "recommended", "outstanding",
    "superior", "powerful", "efficient", "easy", "intuitive", "robust", "reliable",
    "popular", "trusted", "preferred", "favorite", "ideal", "perfect", "comprehensive"
]

NEGATIVE_KEYWORDS = [
    "limited", "expensive", "complex", "difficult", "lacking", "poor", "weak",
    "complicated", "confusing", "outdated", "slow", "unreliable", "buggy",
    "problematic", "disappointing", "inadequate", "insufficient", "restrictive"
]


class AnalysisService:
    """Service for analyzing AI responses"""
    
    def extract_brand_mentions(
        self, 
        response_text: str, 
        brands: List[Dict]
    ) -> List[Dict]:
        """
        Extract brand mentions from response text
        
        Args:
            response_text: The AI response text
            brands: List of brand dicts with 'id', 'name', 'website'
            
        Returns:
            List of mention dicts with brand_id, position, context, sentiment
        """
        mentions = []
        response_lower = response_text.lower()
        
        for brand in brands:
            brand_name = brand['name']
            brand_name_lower = brand_name.lower()
            
            # Find all occurrences
            pattern = r'\b' + re.escape(brand_name_lower) + r'\b'
            matches = list(re.finditer(pattern, response_lower))
            
            if matches:
                # Take the first occurrence for position
                first_match = matches[0]
                position = self._calculate_position(response_text, first_match.start())
                
                # Extract context (100 chars before and after)
                start = max(0, first_match.start() - 100)
                end = min(len(response_text), first_match.end() + 100)
                context = response_text[start:end].strip()
                
                # Analyze sentiment
                sentiment, sentiment_score = self._analyze_sentiment(context)
                
                # Check if recommended
                is_recommended = self._is_recommended(context, brand_name)
                
                mentions.append({
                    'brand_id': brand['id'],
                    'position': position,
                    'context': context,
                    'sentiment': sentiment,
                    'sentiment_score': sentiment_score,
                    'is_recommended': is_recommended
                })
        
        return mentions
    
    def _calculate_position(self, text: str, char_position: int) -> int:
        """
        Calculate mention position (1st, 2nd, 3rd) based on approximate thirds
        
        Args:
            text: Full text
            char_position: Character position of mention
            
        Returns:
            Position (1, 2, or 3)
        """
        text_length = len(text)
        relative_position = char_position / text_length
        
        if relative_position < 0.33:
            return 1
        elif relative_position < 0.66:
            return 2
        else:
            return 3
    
    def _analyze_sentiment(self, context: str) -> Tuple[str, float]:
        """
        Analyze sentiment of context around brand mention
        
        Args:
            context: Text context around mention
            
        Returns:
            Tuple of (sentiment_label, sentiment_score)
            sentiment_label: 'positive', 'neutral', 'negative'
            sentiment_score: -1.0 to 1.0
        """
        context_lower = context.lower()
        
        # Count positive and negative keywords
        positive_count = sum(1 for word in POSITIVE_KEYWORDS if word in context_lower)
        negative_count = sum(1 for word in NEGATIVE_KEYWORDS if word in context_lower)
        
        # Calculate score
        total = positive_count + negative_count
        if total == 0:
            return "neutral", 0.0
        
        score = (positive_count - negative_count) / total
        
        # Determine label
        if score > 0.2:
            label = "positive"
        elif score < -0.2:
            label = "negative"
        else:
            label = "neutral"
        
        return label, round(score, 2)
    
    def _is_recommended(self, context: str, brand_name: str) -> bool:
        """Check if brand is explicitly recommended"""
        context_lower = context.lower()
        brand_lower = brand_name.lower()
        
        recommendation_patterns = [
            f"recommend {brand_lower}",
            f"{brand_lower} is recommended",
            f"suggest {brand_lower}",
            f"{brand_lower} is the best",
            f"go with {brand_lower}",
            f"{brand_lower} is ideal",
            f"choose {brand_lower}",
        ]
        
        return any(pattern in context_lower for pattern in recommendation_patterns)
    
    def extract_citations(self, response_text: str, brands: List[Dict]) -> List[Dict]:
        """
        Extract URLs/citations from response text
        
        Args:
            response_text: The AI response text
            brands: List of brand dicts with 'id', 'name', 'website'
            
        Returns:
            List of citation dicts with url, domain, position, is_brand_owned, brand_id
        """
        citations = []
        
        # Find URLs in text
        url_pattern = r'https?://[^\s<>"{}|\\^`\[\]]+'
        urls = re.findall(url_pattern, response_text)
        
        for i, url in enumerate(urls, start=1):
            # Parse URL
            parsed = urlparse(url)
            domain = parsed.netloc
            
            # Check if brand-owned
            is_brand_owned = False
            brand_id = None
            
            for brand in brands:
                if brand.get('website'):
                    brand_domain = urlparse(brand['website']).netloc
                    if domain == brand_domain or domain.endswith('.' + brand_domain):
                        is_brand_owned = True
                        brand_id = brand['id']
                        break
            
            citations.append({
                'url': url,
                'domain': domain,
                'position': i,
                'is_brand_owned': is_brand_owned,
                'brand_id': brand_id
            })
        
        return citations
    
    def calculate_metrics(
        self,
        mentions: List[Dict],
        total_responses: int
    ) -> Dict:
        """
        Calculate visibility metrics for a brand
        
        Args:
            mentions: List of mention records
            total_responses: Total number of responses analyzed
            
        Returns:
            Dict with calculated metrics
        """
        if total_responses == 0:
            return {
                'visibility_score': 0,
                'answers_mentioned': 0,
                'total_answers': 0,
                'avg_position': None,
                'sentiment_score': None,
                'first_position_count': 0,
                'second_position_count': 0,
                'third_position_count': 0
            }
        
        answers_mentioned = len(mentions)
        visibility_score = (answers_mentioned / total_responses) * 100
        
        # Position breakdown
        positions = [m['position'] for m in mentions if m.get('position')]
        first_count = sum(1 for p in positions if p == 1)
        second_count = sum(1 for p in positions if p == 2)
        third_count = sum(1 for p in positions if p == 3)
        avg_position = sum(positions) / len(positions) if positions else None
        
        # Sentiment
        sentiments = [m['sentiment'] for m in mentions if m.get('sentiment')]
        positive_count = sum(1 for s in sentiments if s == 'positive')
        sentiment_score = (positive_count / len(sentiments) * 100) if sentiments else None
        
        return {
            'visibility_score': round(visibility_score, 2),
            'answers_mentioned': answers_mentioned,
            'total_answers': total_responses,
            'avg_position': round(avg_position, 2) if avg_position else None,
            'sentiment_score': round(sentiment_score, 2) if sentiment_score else None,
            'first_position_count': first_count,
            'second_position_count': second_count,
            'third_position_count': third_count
        }


# Singleton instance
analysis_service = AnalysisService()
