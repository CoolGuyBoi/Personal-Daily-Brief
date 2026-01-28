import Parser from 'rss-parser';
import { Groq } from 'groq-sdk';

// 1. CONFIGURATION
const GROQ_API_KEY = process.env.GROQ_API_KEY; // Managed by Vercel
const SOURCES = [
  { url: 'https://finshots.in/archive/rss/', type: 'Finance' },
  { url: 'https://hnrss.org/best', type: 'Tech' },
  { url: 'https://collabfund.com/blog/feed.xml', type: 'Deep' },
  { url: 'https://fs.blog/feed/', type: 'Mental Models' }
];

// 2. DATA FETCHING (Runs on Server)
async function getData() {
  const parser = new Parser();
  let allText = "";

  // Fetch feeds
  const promises = SOURCES.map(async (s) => {
    try {
      const feed = await parser.parseURL(s.url);
      return feed.items.slice(0, 2).map(i => `[${s.type}] ${i.title}: ${i.contentSnippet?.substring(0, 150)}`).join("\n");
    } catch (e) { return ""; }
  });
  
  const results = await Promise.all(promises);
  allText = results.join("\n");

  // AI Processing
  const groq = new Groq({ apiKey: GROQ_API_KEY });
  const prompt = `
    ACT AS: Chief of Staff for a CA student. 
    INPUT: ${allText}
    TASK: Summarize into strict JSON.
    FORMAT: { "tech": [{"h":"headline","i":"insight"}], "finance": [{"h":"headline","i":"insight"}], "quote": "quote string", "case_study": {"title":"t","text":"content"} }
  `;

  const completion = await groq.chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    model: 'llama3-70b-8192',
    response_format: { type: 'json_object' }
  });

  return JSON.parse(completion.choices[0].message.content);
}

// 3. THE PAGE (What you see)
export const revalidate = 21600; // Update every 6 hours

export default async function Page() {
  let data;
  try {
    data = await getData();
 } catch (e) {
    console.error(e); 
    return (
      <div style={{ padding: '20px', fontFamily: 'sans-serif', background: '#fff' }}>
        <h1 style={{ color: '#b91c1c', fontSize: '20px' }}>System Diagnosis</h1>
        <div style={{ background: '#fee2e2', padding: '15px', borderRadius: '5px', marginTop: '10px' }}>
          <p style={{ fontWeight: 'bold', margin: '0 0 5px 0' }}>Error Message:</p>
          <code style={{ fontSize: '13px', color: '#7f1d1d' }}>{e.message}</code>
        </div>
        <p style={{ fontSize: '14px', marginTop: '15px', color: '#444' }}>
          <strong>Next Step:</strong> Refresh the page. If the error says "401", your Groq API key is wrong. If it says "fetch failed", one of the news websites is down.
        </p>
      </div>
    );
  }
} // This last curly bracket must remain!

  const date = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' });

  return (
    <div style={{ fontFamily: 'sans-serif', padding: '20px', maxWidth: '600px', margin: '0 auto', background: '#f5f5f4', minHeight: '100vh', color: '#1c1917' }}>
      
      {/* Header */}
      <div style={{ borderBottom: '2px solid #000', paddingBottom: '10px', marginBottom: '20px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '900', textTransform: 'uppercase', margin: 0 }}>The Daily Brief</h1>
        <p style={{ fontSize: '14px', color: '#57534e', margin: '5px 0 0 0' }}>{date} • Bengaluru</p>
      </div>

      {/* Quote */}
      <div style={{ background: '#fff', padding: '15px', borderLeft: '4px solid #b91c1c', marginBottom: '25px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
        <p style={{ fontStyle: 'italic', fontSize: '16px', lineHeight: '1.5', margin: 0 }}>"{data.quote}"</p>
      </div>

      {/* Tech Section */}
      <section style={{ marginBottom: '30px' }}>
        <h2 style={{ fontSize: '14px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: '1px solid #d6d3d1', paddingBottom: '5px', marginBottom: '15px' }}>Tech & Signals</h2>
        {data.tech.map((item, i) => (
          <div key={i} style={{ marginBottom: '15px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 4px 0' }}>{item.h}</h3>
            <p style={{ fontSize: '14px', color: '#44403c', margin: 0, lineHeight: '1.4' }}>{item.i}</p>
          </div>
        ))}
      </section>

      {/* Finance Section */}
      <section style={{ marginBottom: '30px' }}>
        <h2 style={{ fontSize: '14px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: '1px solid #d6d3d1', paddingBottom: '5px', marginBottom: '15px' }}>Finance & Macro</h2>
        {data.finance.map((item, i) => (
          <div key={i} style={{ marginBottom: '15px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 4px 0' }}>{item.h}</h3>
            <p style={{ fontSize: '14px', color: '#44403c', margin: 0, lineHeight: '1.4' }}>{item.i}</p>
          </div>
        ))}
      </section>

      {/* Deep Case Study */}
      <div style={{ background: '#1c1917', color: '#f5f5f4', padding: '20px', borderRadius: '8px' }}>
        <p style={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', color: '#facc15', margin: '0 0 10px 0' }}>Deep Case Study</p>
        <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 10px 0' }}>{data.case_study.title}</h2>
        <p style={{ fontSize: '14px', lineHeight: '1.6', opacity: '0.9', margin: 0 }}>{data.case_study.text}</p>
      </div>

    </div>
  );
}
