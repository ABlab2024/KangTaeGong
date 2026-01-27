import os
import asyncio
import time
from typing import List, Dict, Any
from dotenv import load_dotenv
from supabase import create_client, Client
from datetime import datetime, UTC

# Import modules
from rss_fetcher import fetch_security_news
from ai_analyzer import analyze_threat, get_embedding

# Load environment variables
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

# Default RSS Feeds (can be moved to env or DB)
DEFAULT_FEEDS = [
    "https://feeds.feedburner.com/TheHackersNews",
    "https://www.kisa.or.kr/rss/kr/201.xml", # KISA Security Notice
    "https://googleprojectzero.blogspot.com/feeds/posts/default?alt=rss",
    "http://www.boannews.com/media/news_rss.xml?mkind=1",
    "http://www.boannews.com/media/news_rss.xml?mkind=2",
    "http://www.boannews.com/media/news_rss.xml?mkind=4",
    "http://www.boannews.com/media/news_rss.xml?mkind=5",
    "http://www.boannews.com/media/news_rss.xml?kind=1"
]

def get_supabase_client() -> Client:
    if not SUPABASE_URL or not SUPABASE_KEY:
        raise ValueError("Supabase credentials missing.")
    return create_client(SUPABASE_URL, SUPABASE_KEY)

async def process_feeds(client: Client):
    print("Starting Threat Collection...")
    
    # 1. Fetch Articles
    feeds = os.getenv("RSS_FEED_URLS", "").split(",")
    feeds = [f.strip() for f in feeds if f.strip()] or DEFAULT_FEEDS
    
    articles = fetch_security_news(feeds)
    print(f"Fetched {len(articles)} articles.")
    
    for article in articles:
        # TODO: Check if article.source_url already exists to avoid duplicates
        # For simple MVP, we rely on duplicate checks or just proceed.
        # Ideally: response = client.table("threat_cases").select("id").eq("source_url", article["source_url"]).execute()
        
        print(f"Analyzing: {article['title']}...")
        
        # 2. AI Analysis (with rate limiting)
        analysis = analyze_threat(article["raw_text"])
        time.sleep(15)  # Rate limiting: 8 seconds between API calls
        
        if not analysis.get("is_threat", True): # Default to True if key missing, but here logical default is False if returned explicitly
             print(f"Skipping (Not a threat): {article['title']}")
             continue
             
        if analysis.get("is_threat") is False:
             print(f"Skipping (Not a threat): {article['title']}")
             continue

        # 3. Embedding
        embedding_text = analysis.get("embedding_text", article["title"])
        embedding_vector = get_embedding(embedding_text)
        
        # 4. Insert into DB
        try:
            data = {
                "source_url": article["source_url"],
                "raw_text": article["raw_text"],
                "analysis_json": analysis,
                "embedding": embedding_vector,
                "collected_at": datetime.now(UTC).isoformat()
            }
            
            # Using upsert based on source_url if we had a unique constraint, but we don't on schema v1.
            # We'll just insert.
            client.table("threat_cases").insert(data).execute()
            print(f"Saved Threat: {article['title']}")
            
        except Exception as e:
            print(f"DB Insert Error: {e}")

async def main():
    try:
        client = get_supabase_client()
        await process_feeds(client)
        print("Collection Complete.")
    except Exception as e:
        print(f"Fatal Error: {e}")

if __name__ == "__main__":
    asyncio.run(main())
