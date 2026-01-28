import Parser from 'rss-parser';
import { Groq } from 'groq-sdk';

const SOURCES = [
  { url: 'https://finshots.in/archive/rss/', type: 'Finance' },
  { url: 'https://hnrss.org/best', type: 'Tech' },
  { url: 'https://collabfund.com/blog/feed.xml', type: 'Strategy' },
  { url: 'https://fs.blog/feed/', type: 'Mental Models' }
];

async function getData() {
  const apiKey = process.env.GROQ_API_KEY;
  const parser = new Parser();
  
  const promises = SOURCES.map(async (s) => {
    try {
      const feed = await parser.parseURL(s.url);
      return feed.items.slice(0, 3).map(i => `[${s.type}] ${i.title}: ${i.contentSnippet?.substring(0, 400)}`).join("\n");
    } catch (e) { return ""; }
  });
  
  const results = await Promise.all(promises);
  const allText = results.join("\n");

  const groq = new Groq({ apiKey: apiKey });
  
  const prompt = `
    ROLE: Executive Editor of a premium financial journal.
    AUDIENCE: A highly ambitious 19-year-old student (South Indian, CA Intermediate candidate, marathon runner).
    TONE: Articulate, authoritative, and analytical. Avoid clichés.
    
    INSTRUCTIONS:
    1. TECH/STRATEGY: Select 3 items. Write 80-120 words per item. Focus on second-order implications (e.g., How does this impact the unit economics of the sector?).
    2. FINANCE/ECONOMY: Select 3 items. Connect these to Indian regulatory frameworks (RBI/SEBI) or CA principles (Audit/Law/Tax) where possible. 
    3. THE DEEP CASE STUDY: A 500-word sophisticated essay. Theme: Either a legendary capital allocation masterclass, a startup's structural failure, or a Hindu philosophical study on 'Tapas' (disciplined heat) applied to modern ambition.
    4. QUOTE: A sharp, disciplined maxim.

    JSON FORMAT ONLY:
    {
      "tech": [{"h": "headline", "i": "analysis"}],
      "finance": [{"h": "headline", "i": "analysis"}],
      "case_study": {"title": "title", "text": "content_essay"},
      "quote": "text"
    }
    
    DATA:
    ${allText}
  `;

  const completion = await groq.chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    model: 'llama-3.3-70b-versatile',
    temperature: 0.4, 
    response_format: { type: 'json_object' }
  });

  return JSON.parse(completion.choices[0].message.content);
}

export default async function Page() {
  try {
    const data = await getData();
    const date = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    return (
      <div style={{ fontFamily: '"Times New Roman", Times, serif', padding: '25px', maxWidth: '600px', margin: '0 auto', background: '#fffcf5', color: '#1a1a1a', lineHeight: '1.7' }}>
        
        {/* Header Section */}
        <header style={{ borderBottom: '2px solid #1a1a1a', marginBottom: '30px', textAlign: 'center' }}>
          <h1 style={{ fontSize: '36px', fontWeight: '800', margin: '0 0 5px 0', letterSpacing: '-1px' }}>INTELLIGENCE</h1>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', textTransform: 'uppercase', fontWeight: 'bold', paddingBottom: '5px' }}>
            <span>VOL. I • NO. {new Date().getDate()}</span>
            <span>{date}</span>
          </div>
        </header>

        {/* The Maxim */}
        <blockquote style={{ margin: '0 0 40px 0', padding: '20px', borderTop: '1px solid #eee', borderBottom: '1px solid #eee', textAlign: 'center' }}>
          <p style={{ fontSize: '20px', fontStyle: 'italic', margin: 0 }}>"{data.quote}"</p>
        </blockquote>

        {/* Content Body */}
        <main>
          <section style={{ marginBottom: '45px' }}>
            <h2 style={{ fontSize: '14px', textTransform: 'uppercase', borderBottom: '2px solid #1a1a1a', display: 'inline-block', marginBottom: '20px', letterSpacing: '1px' }}>Technological Shifts</h2>
            {data.tech.map((item, i) => (
              <article key={i} style={{ marginBottom: '30px' }}>
                <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '10px', lineHeight: '1.2' }}>{item.h}</h3>
                <p style={{ fontSize: '16px', color: '#333' }}>{item.i}</p>
              </article>
            ))}
          </section>

          <section style={{ marginBottom: '45px' }}>
            <h2 style={{ fontSize: '14px', textTransform: 'uppercase', borderBottom: '2px solid #1a1a1a', display: 'inline-block', marginBottom: '20px', letterSpacing: '1px' }}>Financial Architecture</h2>
            {data.finance.map((item, i) => (
              <article key={i} style={{ marginBottom: '30px' }}>
                <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '10px', lineHeight: '1.2' }}>{item.h}</h3>
                <p style={{ fontSize: '16px', color: '#333' }}>{item.i}</p>
              </article>
            ))}
          </section>

          {/* Featured Case Study */}
          <section style={{ background: '#1a1a1a', color: '#fffcf5', padding: '30px', marginTop: '50px' }}>
            <span style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', color: '#d4af37' }}>The Deep Analysis</span>
            <h2 style={{ fontSize: '28px', fontWeight: 'bold', margin: '10px 0 20px 0', lineHeight: '1.1' }}>{data.case_study.title}</h2>
            <div style={{ fontSize: '16px', lineHeight: '1.8', opacity: '0.95', whiteSpace: 'pre-wrap' }}>
              {data.case_study.text}
            </div>
          </section>
        </main>

        <footer style={{ marginTop: '60px', textAlign: 'center', fontSize: '12px', color: '#777', borderTop: '1px solid #ddd', paddingTop: '20px' }}>
          RESTRICTED CIRCULATION • OPTIMIZED FOR CA INTER PREPARATION
        </footer>
      </div>
    );
  } catch (e) {
    return (
      <div style={{ padding: '50px', textAlign: 'center', fontFamily: 'serif' }}>
        <h2>Refining the Morning Brief...</h2>
        <p>The editor is finalizing today's insights. Please refresh in 60 seconds.</p>
      </div>
    );
  }
}
