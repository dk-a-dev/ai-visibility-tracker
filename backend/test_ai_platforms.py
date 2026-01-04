#!/usr/bin/env python3
"""Test all AI platforms individually"""
import asyncio
import sys
sys.path.insert(0, '/app')

from app.services.ai_service import ai_service

async def test_all_platforms():
    """Test each AI platform"""
    prompt = "What is artificial intelligence?"
    
    print("🧪 Testing AI Platforms\n")
    print("=" * 50)
    
    # Test ChatGPT
    print("\n1️⃣ Testing ChatGPT (OpenAI)...")
    if ai_service.openai_client:
        try:
            result = await ai_service.query_chatgpt(prompt)
            if result['status'] == 'success':
                print(f"✅ SUCCESS - Model: {result['model']}")
                print(f"   Response: {result['response_text'][:100]}...")
                print(f"   Tokens: {result['tokens_used']}, Time: {result['response_time_ms']}ms")
            else:
                print(f"❌ FAILED - {result.get('error_message', 'Unknown error')}")
        except Exception as e:
            print(f"❌ ERROR - {str(e)}")
    else:
        print("⚠️  SKIPPED - No API key configured")
    
    # Test Claude
    print("\n2️⃣ Testing Claude (Anthropic)...")
    if ai_service.anthropic_client:
        try:
            result = await ai_service.query_claude(prompt)
            if result['status'] == 'success':
                print(f"✅ SUCCESS - Model: {result['model']}")
                print(f"   Response: {result['response_text'][:100]}...")
                print(f"   Tokens: {result['tokens_used']}, Time: {result['response_time_ms']}ms")
            else:
                print(f"❌ FAILED - {result.get('error_message', 'Unknown error')}")
        except Exception as e:
            print(f"❌ ERROR - {str(e)}")
    else:
        print("⚠️  SKIPPED - No API key configured")
    
    # Test Gemini
    print("\n3️⃣ Testing Gemini (Google)...")
    if ai_service.gemini_client:
        try:
            result = await ai_service.query_gemini(prompt)
            if result['status'] == 'success':
                print(f"✅ SUCCESS - Model: {result['model']}")
                print(f"   Response: {result['response_text'][:100]}...")
                print(f"   Tokens: {result['tokens_used']}, Time: {result['response_time_ms']}ms")
                print(f"   Citations: {len(result.get('citations', []))} found")
            else:
                print(f"❌ FAILED - {result.get('error_message', 'Unknown error')}")
        except Exception as e:
            print(f"❌ ERROR - {str(e)}")
    else:
        print("⚠️  SKIPPED - No API key configured")
    
    # Test Perplexity
    print("\n4️⃣ Testing Perplexity (Sonar)...")
    if ai_service.perplexity_client:
        try:
            result = await ai_service.query_perplexity(prompt)
            if result['status'] == 'success':
                print(f"✅ SUCCESS - Model: {result['model']}")
                print(f"   Response: {result['response_text'][:100]}...")
                print(f"   Tokens: {result['tokens_used']}, Time: {result['response_time_ms']}ms")
                print(f"   Citations: {len(result.get('citations', []))} found")
            else:
                print(f"❌ FAILED - {result.get('error_message', 'Unknown error')}")
        except Exception as e:
            print(f"❌ ERROR - {str(e)}")
    else:
        print("⚠️  SKIPPED - No API key configured")
    
    print("\n" + "=" * 50)
    print("✅ Test complete!\n")

if __name__ == "__main__":
    asyncio.run(test_all_platforms())
