import Parser from 'rss-parser';
import { Groq } from 'groq-sdk';

const SOURCES = [
  { url: 'https://finshots.in/archive/rss/', type: 'Finance' },
  { url: 'https://hnrss.org/best', type: 'Tech' },
  { url: 'https://collabfund.com/blog/feed.xml', type: 'Deep' },
  { url: 'https://fs.blog/feed/', type: 'Mental Models' }
];

async function getData() {
  const apiKey = process.env.GROQ_API_KEY;
  const parser = new Parser();
  
  const promises = SOURCES.map(async (s) => {
    try {
      const feed = await parser.parseURL(s.url);
      return feed.items.slice(0, 3).map(i => `[${s.type}] ${i.title}: ${i.contentSnippet?.substring(0, 100)}`).join("\n");
    } catch (e) { return ""; }
  });
  
  const results = await Promise.all(promises);
  const allText = results.join("\n");

  const groq = new Groq({ apiKey: apiKey });
  const prompt = `ACT AS: Chief of Staff for a 19yo CA student. DATA: ${allText}. TASK: Summarize into JSON. FORMAT: {"tech": [{"h":"headline","i":"insight"}], "finance": [{"h":"headline","i":"insight"}], "quote": "discipline quote", "case_study": {"title":"title","text":"content"}}`;

  const completion = await groq.chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    model: 'llama-3.3-70b-versatile', // This is the updated, powerful model
    response_format: { type: 'json_object' }
  });

  return JSON.parse(completion.choices[0].message.content);
}

export default async function Page() {
  try {
    const data = await getData();
    const date = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' });

    return (
      <div style={{ fontFamily: 'sans-serif', padding: '20px', maxWidth: '500px', margin: '0 auto', background: '#f5f5f4', minHeight: '100vh', color: '#1c1917' }}>
        <div style={{ borderBottom: '2px solid #000', paddingBottom: '10px', marginBottom: '20px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: '900', textTransform: 'uppercase', margin: 0 }}>The Daily Brief</h1>
          <p style={{ fontSize: '12px', color: '#57534e', margin: '5px 0 0 0' }}>{date} • CA INTER SPECIAL</p>
        </div>

        <div style={{ background: '#fff', padding: '15px', borderLeft: '4px solid #b91c1c', marginBottom: '25px' }}>
          <p style={{ fontStyle: 'italic', fontSize: '16px', margin: 0 }}>"{data.quote}"</p>
        </div>

        <h2 style={{ fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', borderBottom: '1px solid #d6d3d1', paddingBottom: '5px', marginBottom: '15px' }}>Tech & Strategy</h2>
        {data.tech.map((item, i) => (
          <div key={i} style={{ marginBottom: '15px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '700', margin: '0 0 4px 0' }}>{item.h}</h3>
            <p style={{ fontSize: '13px', color: '#44403c', margin: 0 }}>{item.i}</p>
          </div>
        ))}

        <h2 style={{ fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', borderBottom: '1px solid #d6d3d1', paddingBottom: '5px', marginBottom: '15px', marginTop: '25px' }}>Finance & Macro</h2>
        {data.finance.map((item, i) => (
          <div key={i} style={{ marginBottom: '15px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '700', margin: '0 0 4px 0' }}>{item.h}</h3>
            <p style={{ fontSize: '13px', color: '#44403c', margin: 0 }}>{item.i}</p>
          </div>
        ))}

        <div style={{ background: '#1c1917', color: '#f5f5f4', padding: '20px', borderRadius: '8px', marginTop: '30px' }}>
          <p style={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', color: '#facc15', margin: '0 0 10px 0' }}>Deep Case Study</p>
          <h2 style={{ fontSize: '17px', fontWeight: 'bold', margin: '0 0 10px 0' }}>{data.case_study.title}</h2>
          <p style={{ fontSize: '13px', lineHeight: '1.5', opacity: '0.9', margin: 0 }}>{data.case_study.text}</p>
        </div>
      </div>
    );
  } catch (e) {
    return <div style={{ padding: '20px' }}>Finalizing system... please refresh in 30 seconds. (Error: {e.message})</div>;
  }
}
