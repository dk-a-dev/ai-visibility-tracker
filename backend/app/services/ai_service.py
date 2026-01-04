"""AI platform integration service"""
import asyncio
import time
import os
from typing import Dict, Optional
import openai
import anthropic
try:
    from google import genai
    from google.genai import types
except ImportError:
    genai = None
    types = None
try:
    from perplexity import Perplexity
except ImportError:
    Perplexity = None
from app.core.config import settings


class AIService:
    """Service for querying AI platforms"""
    
    def __init__(self):
        self.openai_client = None
        self.anthropic_client = None
        self.gemini_client = None
        self.perplexity_client = None
        
        if settings.OPENAI_API_KEY:
            self.openai_client = openai.AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        
        if settings.ANTHROPIC_API_KEY:
            self.anthropic_client = anthropic.AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
        
        if settings.GEMINI_API_KEY and genai:
            self.gemini_client = genai.Client(api_key=settings.GEMINI_API_KEY)
        
        if settings.PERPLEXITY_API_KEY and Perplexity:
            self.perplexity_client = Perplexity()
    
    async def query_chatgpt(self, prompt: str) -> Dict:
        """
        Query ChatGPT via OpenAI API
        
        Args:
            prompt: The prompt to send
            
        Returns:
            Dict with response_text, model, tokens_used, response_time_ms
        """
        if not self.openai_client:
            raise Exception("OpenAI API key not configured")
        
        start_time = time.time()
        
        try:
            response = await self.openai_client.chat.completions.create(
                model="gpt-4-turbo-preview",
                messages=[{
                    "role": "user",
                    "content": prompt
                }],
                temperature=0.7,
                max_tokens=1024
            )
            
            response_time = int((time.time() - start_time) * 1000)
            
            return {
                "platform": "chatgpt",
                "model": "gpt-4-turbo-preview",
                "response_text": response.choices[0].message.content,
                "tokens_used": response.usage.total_tokens,
                "response_time_ms": response_time,
                "status": "success"
            }
        
        except Exception as e:
            response_time = int((time.time() - start_time) * 1000)
            return {
                "platform": "chatgpt",
                "model": "gpt-4-turbo-preview",
                "response_text": "",
                "tokens_used": 0,
                "response_time_ms": response_time,
                "status": "failed",
                "error_message": str(e)
            }
    
    async def query_claude(self, prompt: str) -> Dict:
        """
        Query Claude via Anthropic API
        
        Args:
            prompt: The prompt to send
            
        Returns:
            Dict with response_text, model, tokens_used, response_time_ms
        """
        if not self.anthropic_client:
            raise Exception("Anthropic API key not configured")
        
        start_time = time.time()
        
        try:
            response = await self.anthropic_client.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=1024,
                messages=[{
                    "role": "user",
                    "content": prompt
                }]
            )
            
            response_time = int((time.time() - start_time) * 1000)
            
            return {
                "platform": "claude",
                "model": "claude-3-5-sonnet-20241022",
                "response_text": response.content[0].text,
                "tokens_used": response.usage.input_tokens + response.usage.output_tokens,
                "response_time_ms": response_time,
                "status": "success"
            }
        
        except Exception as e:
            response_time = int((time.time() - start_time) * 1000)
            return {
                "platform": "claude",
                "model": "claude-3-5-sonnet-20241022",
                "response_text": "",
                "tokens_used": 0,
                "response_time_ms": response_time,
                "status": "failed",
                "error_message": str(e)
            }
    
    async def query_gemini(self, prompt: str) -> Dict:
        """
        Query Gemini via Google Generative AI API with Google Search grounding
        
        Args:
            prompt: The prompt to send
            
        Returns:
            Dict with response_text, model, tokens_used, response_time_ms, citations
        """
        if not self.gemini_client:
            raise Exception("Gemini API key not configured")
        
        start_time = time.time()
        
        try:
            # Configure with Google Search grounding for better citations
            grounding_tool = types.Tool(google_search=types.GoogleSearch())
            config = types.GenerateContentConfig(tools=[grounding_tool])
            
            response = await asyncio.to_thread(
                self.gemini_client.models.generate_content,
                model=settings.GEMINI_MODEL,
                contents=prompt,
                config=config
            )
            
            response_time = int((time.time() - start_time) * 1000)
            
            # Extract token usage if available
            tokens_used = 0
            if hasattr(response, 'usage_metadata'):
                tokens_used = response.usage_metadata.total_token_count
            
            # Extract citations from grounding metadata
            citations = []
            try:
                if (hasattr(response, 'candidates') and 
                    len(response.candidates) > 0 and
                    hasattr(response.candidates[0], 'grounding_metadata')):
                    
                    grounding_metadata = response.candidates[0].grounding_metadata
                    
                    if hasattr(grounding_metadata, 'grounding_chunks'):
                        for chunk in grounding_metadata.grounding_chunks:
                            if hasattr(chunk, 'web') and hasattr(chunk.web, 'uri'):
                                citations.append({
                                    "url": chunk.web.uri,
                                    "title": getattr(chunk.web, 'title', None)
                                })
            except Exception as cite_error:
                print(f"⚠️  Failed to extract Gemini citations: {cite_error}")
            
            return {
                "platform": "gemini",
                "model": settings.GEMINI_MODEL,
                "response_text": response.text,
                "tokens_used": tokens_used,
                "response_time_ms": response_time,
                "status": "success",
                "citations": citations  # Include structured citations
            }
        
        except Exception as e:
            response_time = int((time.time() - start_time) * 1000)
            return {
                "platform": "gemini",
                "model": settings.GEMINI_MODEL,
                "response_text": "",
                "tokens_used": 0,
                "response_time_ms": response_time,
                "status": "failed",
                "error_message": str(e),
                "citations": []
            }
    
    async def query_perplexity(self, prompt: str) -> Dict:
        """
        Query Perplexity Sonar via Chat Completions API with web search
        
        Args:
            prompt: The prompt to send
            
        Returns:
            Dict with response_text, model, tokens_used, response_time_ms, citations
        """
        if not self.perplexity_client:
            raise Exception("Perplexity API key not configured")
        
        start_time = time.time()
        
        try:
            completion = await asyncio.to_thread(
                self.perplexity_client.chat.completions.create,
                messages=[{
                    "role": "user",
                    "content": prompt
                }],
                model=settings.PERPLEXITY_MODEL
            )
            
            response_time = int((time.time() - start_time) * 1000)
            
            # Extract token usage
            tokens_used = 0
            if hasattr(completion, 'usage'):
                tokens_used = completion.usage.total_tokens
            
            # Extract citations from response
            citations = []
            try:
                if hasattr(completion, 'citations'):
                    for url in completion.citations:
                        citations.append({"url": url, "title": None})
                
                # Also get detailed search results if available
                if hasattr(completion, 'search_results'):
                    citations = []  # Replace with detailed info
                    for result in completion.search_results:
                        citations.append({
                            "url": result.url,
                            "title": result.title if hasattr(result, 'title') else None,
                            "date": result.date if hasattr(result, 'date') else None
                        })
            except Exception as cite_error:
                print(f"⚠️  Failed to extract Perplexity citations: {cite_error}")
            
            return {
                "platform": "perplexity",
                "model": settings.PERPLEXITY_MODEL,
                "response_text": completion.choices[0].message.content,
                "tokens_used": tokens_used,
                "response_time_ms": response_time,
                "status": "success",
                "citations": citations
            }
        
        except Exception as e:
            response_time = int((time.time() - start_time) * 1000)
            return {
                "platform": "perplexity",
                "model": settings.PERPLEXITY_MODEL,
                "response_text": "",
                "tokens_used": 0,
                "response_time_ms": response_time,
                "status": "failed",
                "error_message": str(e),
                "citations": []
            }
    
    async def query_all_platforms(self, prompt: str) -> list[Dict]:
        """
        Query all available platforms in parallel
        
        Args:
            prompt: The prompt to send
            
        Returns:
            List of response dicts from all platforms
        """
        tasks = []
        
        if self.openai_client:
            tasks.append(self.query_chatgpt(prompt))
        
        if self.anthropic_client:
            tasks.append(self.query_claude(prompt))
        
        if self.gemini_client:
            tasks.append(self.query_gemini(prompt))
        
        if self.perplexity_client:
            tasks.append(self.query_perplexity(prompt))
        
        if not tasks:
            raise Exception("No AI platform API keys configured. Please set OPENAI_API_KEY, ANTHROPIC_API_KEY, GEMINI_API_KEY, or PERPLEXITY_API_KEY")
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Filter out exceptions and log them
        valid_results = []
        for result in results:
            if isinstance(result, dict):
                valid_results.append(result)
            elif isinstance(result, Exception):
                print(f"⚠️  Platform query failed: {result}")
        
        if not valid_results:
            raise Exception("All platform queries failed")
        
        return valid_results


# Singleton instance
ai_service = AIService()
