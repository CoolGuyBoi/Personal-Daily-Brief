import Parser from 'rss-parser';
import { Groq } from 'groq-sdk';

const SOURCES = [
  { url: 'https://finshots.in/archive/rss/', type: 'Finance' },
  { url: 'https://hnrss.org/best', type: 'Tech' }
];

async function getData() {
  const apiKey = process.env.GROQ_API_KEY;
  
  if (!apiKey) {
    throw new Error("MISSING_API_KEY: Go to Vercel Settings > Environment Variables and add GROQ_API_KEY.");
  }

  const parser = new Parser();
  let allText = "";

  try {
    const promises = SOURCES.map(async (s) => {
      const feed = await parser.parseURL(s.url);
      return feed.items.slice(0, 2).map(i => i.title).join(". ");
    });
    const results = await Promise.all(promises);
    allText = results.join(" ");
  } catch (e) {
    throw new Error("RSS_FETCH_FAILED: One of the news sites is blocking the request.");
  }

  const groq = new Groq({ apiKey: apiKey });
  
  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: `Summarize this into a 1-sentence quote about discipline: ${allText}. Return JSON: {"quote": "..."}` }],
      model: 'llama3-8b-8192', // Using the smaller model for faster testing
      response_format: { type: 'json_object' }
    });
    return JSON.parse(completion.choices[0].message.content);
  } catch (e) {
    throw new Error(`GROQ_API_ERROR: ${e.message}`);
  }
}

export default async function Page() {
  try {
    const data = await getData();
    return (
      <div style={{ padding: '40px', fontFamily: 'sans-serif', textAlign: 'center' }}>
        <h1 style={{ fontSize: '20px' }}>✅ System Online</h1>
        <p style={{ fontStyle: 'italic', marginTop: '20px' }}>"{data.quote}"</p>
        <p style={{ fontSize: '12px', color: '#888', marginTop: '40px' }}>If you see this, your API and Code are working. We can now add the full layout back.</p>
      </div>
    );
  } catch (e) {
    return (
      <div style={{ padding: '40px', fontFamily: 'sans-serif', border: '2px solid red', margin: '20px' }}>
        <h1 style={{ color: 'red' }}>❌ Diagnostic Report</h1>
        <p><strong>Error Type:</strong> {e.message}</p>
        <hr />
        <p style={{ fontSize: '14px' }}>1. Go to Vercel Dashboard.</p>
        <p style={{ fontSize: '14px' }}>2. Click <strong>Settings</strong> top menu.</p>
        <p style={{ fontSize: '14px' }}>3. Click <strong>Environment Variables</strong> left menu.</p>
        <p style={{ fontSize: '14px' }}>4. Ensure <strong>GROQ_API_KEY</strong> is exactly named like that and the value starts with <code>gsk_</code></p>
      </div>
    );
  }
}
