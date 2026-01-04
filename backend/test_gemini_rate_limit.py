"""Test Gemini API rate limiting"""
import asyncio
import time
from app.services.ai_service import ai_service


async def test_gemini_single():
    """Test a single Gemini API call"""
    print("\n🧪 Testing single Gemini API call...")
    prompt = "What is the best AI chatbot?"
    
    try:
        start = time.time()
        result = await ai_service.query_gemini(prompt)
        elapsed = time.time() - start
        
        print(f"✅ Success in {elapsed:.2f}s")
        print(f"   Model: {result['model']}")
        print(f"   Status: {result['status']}")
        print(f"   Response length: {len(result['response_text'])} chars")
        print(f"   Tokens: {result['tokens_used']}")
        print(f"   Citations: {len(result.get('citations', []))}")
        
        if result.get('citations'):
            print("\n   📄 Citations:")
            for i, cite in enumerate(result['citations'][:3], 1):
                print(f"      {i}. {cite.get('url', 'N/A')}")
                if cite.get('title'):
                    print(f"         {cite['title']}")
        
        return result
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return None


async def test_gemini_rate_limiting():
    """Test rate limiting with multiple rapid calls"""
    print("\n🧪 Testing Gemini rate limiting (3 rapid calls)...")
    prompts = [
        "What is artificial intelligence?",
        "Who makes the best smartphones?",
        "What are the top programming languages?"
    ]
    
    start_time = time.time()
    for i, prompt in enumerate(prompts, 1):
        call_start = time.time()
        try:
            result = await ai_service.query_gemini(prompt)
            call_end = time.time()
            
            print(f"   Call {i}: {result['status']} in {call_end - call_start:.2f}s")
        except Exception as e:
            print(f"   Call {i}: ERROR - {str(e)}")
    
    total_time = time.time() - start_time
    print(f"\n   Total time: {total_time:.2f}s")
    print(f"   Expected minimum (60 RPM): {(3-1) * (60/60):.2f}s")


async def test_error_handling():
    """Test error handling"""
    print("\n🧪 Testing error handling...")
    
    # Save original key
    from app.core.config import settings
    original_key = settings.GEMINI_API_KEY
    
    # Test with invalid key
    settings.GEMINI_API_KEY = "invalid_key_test"
    
    # Reinitialize service
    from app.services import ai_service as service_module
    from google import genai
    service_module.ai_service.gemini_client = genai.Client(api_key="invalid_key_test")
    
    try:
        result = await ai_service.query_gemini("Test prompt")
        print(f"   Status: {result['status']}")
        if result['status'] == 'failed':
            print(f"   ✅ Error handled correctly: {result.get('error_message', 'N/A')[:100]}")
    except Exception as e:
        print(f"   ✅ Exception caught: {str(e)[:100]}")
    finally:
        # Restore original key
        settings.GEMINI_API_KEY = original_key
        service_module.ai_service.gemini_client = genai.Client(api_key=original_key)


async def main():
    print("=" * 60)
    print("🔍 Gemini API Rate Limiting Test")
    print("=" * 60)
    
    # Test 1: Single call
    await test_gemini_single()
    
    # Test 2: Rate limiting
    await test_gemini_rate_limiting()
    
    # Test 3: Error handling
    await test_error_handling()
    
    print("\n" + "=" * 60)
    print("✨ Tests complete!")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(main())
