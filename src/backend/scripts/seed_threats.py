
import asyncio
import os
import sys
import re

# Add project root to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.db.session import AsyncSessionLocal
from app.models.threat_case import ThreatCase
from sqlalchemy import select

SAMPLE_FILE_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../tests/threatcase-sample.md'))

def parse_threat_cases(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    cases = []
    # Split by "### ▶️사례"
    sections = re.split(r'### ▶️사례\d+:\s*', content)[1:]
    
    for section in sections:
        lines = section.strip().split('\n')
        title = lines[0].strip('**').strip()
        
        source = ""
        summary = ""
        
        # Simple parsing logic
        is_summary = False
        summary_lines = []
        
        for line in lines[1:]:
            line = line.strip()
            if line.startswith('- 출처'):
                continue
            if line.startswith('- http') or line.startswith('http'):
                 # Extract URL roughly
                 match = re.search(r'(https?://[^\s\)]+)', line)
                 if match:
                     source = match.group(1)
            elif line.startswith('- 내용 요약'):
                is_summary = True
            elif is_summary:
                if line:
                    summary_lines.append(line)
        
        summary = "\n".join(summary_lines)
        
        cases.append({
            "title": title,
            "source": source,
            "content": summary
        })
    
    return cases

async def seed_data():
    if not os.path.exists(SAMPLE_FILE_PATH):
        print(f"File not found: {SAMPLE_FILE_PATH}")
        return

    cases = parse_threat_cases(SAMPLE_FILE_PATH)
    print(f"Found {len(cases)} cases.")

    async with AsyncSessionLocal() as session:
        for case in cases:
            # Check if exists (by source url or similar content)
            # For simplicity, just add if not exactly same source or title
            result = await session.execute(
                select(ThreatCase).where(ThreatCase.source_url == case['source'])
            )
            existing = result.scalars().first()
            
            if not existing:
                new_case = ThreatCase(
                    source_url=case['source'],
                    raw_text=f"제목: {case['title']}\n\n내용:\n{case['content']}",
                    analysis_json="{}" # Empty JSON for now
                )
                session.add(new_case)
                print(f"Added: {case['title']}")
            else:
                print(f"Skipped (exists): {case['title']}")
        
        await session.commit()

if __name__ == "__main__":
    asyncio.run(seed_data())
