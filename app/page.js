import Parser from 'rss-parser';
import { Groq } from 'groq-sdk';

const SOURCES = [
  { url: 'https://finshots.in/archive/rss/', type: 'Finance' },
  { url: 'https://hnrss.org/best', type: 'Tech' },
  { url: 'https://collabfund.com/blog/feed.xml', type: 'Strategy' },
  { url: 'https://pulse.zerodha.com/feed.php', type: 'Markets' }
];

async function getData() {
  const apiKey = process.env.GROQ_API_KEY;
  const parser = new Parser();
  
  const promises = SOURCES.map(async (s) => {
    try {
      const feed = await parser.parseURL(s.url);
      // We take more data now to feed the deeper analysis
      return feed.items.slice(0, 4).map(i => `[${s.type}] ${i.title}: ${i.contentSnippet?.substring(0, 800)}`).join("\n");
    } catch (e) { return ""; }
  });
  
  const results = await Promise.all(promises);
  const allText = results.join("\n");

  const groq = new Groq({ apiKey: apiKey });
  
  const prompt = `
    ROLE: Senior Managing Partner at a global consulting firm (McKinsey/Bain).
    AUDIENCE: A 19-year-old CA Inter student with elite ambitions, a marathoner's discipline, and a deep interest in Indian capital markets.
    TONE: Sophisticated, ruthless in logic, articulate, and academic yet practical.
    
    TASK:
    1. TECH/STRATEGY (3 items): Provide 200 words each. Analyze the 'Unit Economics' and 'Competitive Moat'. 
    2. FINANCE/MACRO (3 items): Provide 200 words each. Explicitly link to CA Inter topics (Company Law, Audit Standards, or Income Tax Act).
    3. THE MASTERCLASS CASE STUDY (1000+ words): A definitive essay. 
       - Structure: (I) The Strategic Impasse, (II) Financial Dissection, (III) The Consulting Pivot, (IV) The Endurance Mindset (linked to Tapas/Dharma).
       - Content: Provide "insider" level viewpoints on capital allocation and structural risk.
    4. THE MAXIM: A cold-blooded insight on discipline.

    FORMAT: Return STRICT JSON. Ensure the "case_study.text" is exceptionally long and detailed.
  `;

  const completion = await groq.chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    model: 'llama-3.3-70b-versatile',
    temperature: 0.45, // Balanced for precision and narrative flow
    max_tokens: 6000, 
    response_format: { type: 'json_object' }
  });

  return JSON.parse(completion.choices[0].message.content);
}

export default async function Page() {
  try {
    const data = await getData();
    const date = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

    return (
      <div style={{ fontFamily: 'charter, Georgia, serif', padding: '40px 24px', maxWidth: '700px', margin: '0 auto', background: '#fff', color: '#111', lineHeight: '1.8' }}>
        
        <header style={{ borderBottom: '3px solid #000', marginBottom: '50px', paddingBottom: '10px' }}>
          <div style={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '3px', marginBottom: '10px', color: '#666' }}>Intelligence Briefing</div>
          <h1 style={{ fontSize: '48px', fontWeight: '900', margin: '0', letterSpacing: '-2px', lineHeight: '0.9' }}>The 10:45 Edition</h1>
          <div style={{
