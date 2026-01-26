import feedparser
from typing import List, Dict, Any
from bs4 import BeautifulSoup

def clean_html(html_content: str) -> str:
    soup = BeautifulSoup(html_content, "html.parser")
    return soup.get_text(separator=' ', strip=True)

def fetch_security_news(feed_urls: List[str]) -> List[Dict[str, Any]]:
    articles = []
    
    for url in feed_urls:
        try:
            print(f"Fetching RSS feed: {url}")
            feed = feedparser.parse(url)
            
            for entry in feed.entries:
                # Basic fields
                title = entry.get('title', 'No Title')
                link = entry.get('link', '')
                
                # Try to get content or summary
                content_raw = ''
                if 'content' in entry:
                    content_raw = entry.content[0].value
                elif 'summary' in entry:
                    content_raw = entry.summary
                else:
                    content_raw = entry.get('description', '')
                
                clean_text = clean_html(content_raw)
                
                articles.append({
                    "source_url": link,
                    "title": title,
                    "raw_text": f"{title}\n\n{clean_text}",
                    "published_at": entry.get('published', '')
                })
                
        except Exception as e:
            print(f"Error fetching {url}: {e}")
            
    return articles
