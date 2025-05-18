import { useState, useRef, useEffect } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import porscheHeader from './assets/porsche-header.png'
import './App.css'
import ReactMarkdown from 'react-markdown'
import { jsPDF } from 'jspdf'

const porscheRed = '#b80000';
const accentColor = '#6c757d'; // soft gray accent
const chatBg = '#f4f4f4'; // immersive solid background
const pageBg = '#f4f4f4'; // solid background for immersive look
const retroFont = 'Inter, Montserrat, Arial, sans-serif';

const porscheQuotes = [
  {
    text: '“I couldn\'t find the sports car of my dreams, so I built it myself.”',
    author: 'Dr. Ferdinand Porsche'
  },
  {
    text: '“Change is easy. Improvement is far more difficult.”',
    author: 'Dr. Ferdinand Porsche'
  },
  {
    text: '“If one does not fail at times, then one has not challenged himself.”',
    author: 'Dr. Ferdinand Porsche'
  },
  {
    text: '“In the beginning, I looked around and could not find quite the car I dreamed of, so I decided to build it myself.”',
    author: 'Dr. Ferdinand Porsche'
  }
];

// Pick a random quote on first render
function getRandomQuoteMsg() {
  const q = porscheQuotes[Math.floor(Math.random() * porscheQuotes.length)];
  return { sender: 'quote', text: `${q.text}\n— ${q.author}` };
}

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState([]); // [{id, title, messages}]
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeHistoryId, setActiveHistoryId] = useState(null);
  const [showSummary, setShowSummary] = useState(false);
  const [summaryText, setSummaryText] = useState('');
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [summaryError, setSummaryError] = useState('');

  const messagesEndRef = useRef(null);
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Load a chat from history
  const loadHistory = (id) => {
    const item = history.find(h => h.id === id);
    if (item) {
      setMessages(item.messages);
      setActiveHistoryId(id);
    }
  };

  // Toggle sidebar
  const toggleSidebar = () => setSidebarOpen(v => !v);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMessage = { sender: 'user', text: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');

    const res = await fetch('http://localhost:3001/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: newMessages }),
    });
    const data = await res.json();
    setMessages((msgs) => [...msgs, { sender: 'bot', text: data.reply }]);
  };

  const handleSummarize = async () => {
    setLoadingSummary(true);
    setSummaryError('');
    setShowSummary(true);
    try {
      const res = await fetch('http://localhost:3001/api/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages }),
      });
      const data = await res.json();
      setSummaryText(data.summary);
    } catch (err) {
      setSummaryError('Failed to generate summary. Please try again.');
      setSummaryText('');
    } finally {
      setLoadingSummary(false);
    }
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    const lines = doc.splitTextToSize(summaryText, 180);
    doc.text(lines, 10, 10);
    doc.save('porsche_chat_summary.pdf');
  };

  const [quoteMsg] = useState(getRandomQuoteMsg);

  return (
    <div style={{
      minHeight: '100vh',
      height: '100vh',
      width: '100vw',
      background: pageBg,
      fontFamily: retroFont,
      padding: 0,
      margin: 0,
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'stretch',
      justifyContent: 'center',
      overflow: 'hidden',
    }}>
      {/* Sidebar */}
      <div style={{
        width: sidebarOpen ? 260 : 0,
        background: '#fff',
        borderRight: sidebarOpen ? `2px solid ${porscheRed}` : 'none',
        transition: 'width 0.3s',
        overflow: 'hidden',
        boxShadow: sidebarOpen ? '2px 0 12px #b8000022' : 'none',
        zIndex: 2,
        position: 'relative',
        minHeight: '100vh',
        height: '100vh',
        margin: 0,
        padding: 0,
      }}>
        <div style={{ padding: sidebarOpen ? 16 : 0, display: sidebarOpen ? 'block' : 'none' }}>
          <div style={{ fontWeight: 700, color: porscheRed, marginBottom: 12, fontSize: 18 }}>History</div>
          {history.length === 0 && <div style={{ color: '#888', fontSize: 14 }}>No saved chats yet.</div>}
          {history.map(h => (
            <div
              key={h.id}
              onClick={() => loadHistory(h.id)}
              style={{
                padding: '8px 6px',
                marginBottom: 6,
                borderRadius: 6,
                background: h.id === activeHistoryId ? porscheRed : '#f7f7f9',
                color: h.id === activeHistoryId ? '#fff' : '#222',
                cursor: 'pointer',
                fontWeight: h.id === activeHistoryId ? 700 : 500,
                border: h.id === activeHistoryId ? `1.5px solid ${porscheRed}` : '1.5px solid #eee',
                transition: 'all 0.2s',
                fontSize: 15,
              }}
            >
              {h.title}
            </div>
          ))}
        </div>
        {/* Sidebar toggle button */}
        <button
          onClick={toggleSidebar}
          style={{
            position: 'absolute',
            top: 20,
            right: -18,
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: porscheRed,
            color: '#fff',
            border: 'none',
            fontWeight: 900,
            fontSize: 20,
            cursor: 'pointer',
            boxShadow: '0 2px 8px #b8000033',
            zIndex: 3,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'right 0.3s',
          }}
        >
          {sidebarOpen ? '<' : '>'}
        </button>
      </div>
      {/* Main chat area */}
      <div style={{
        flex: 1,
        width: 0,
        height: '100vh',
        display: 'flex',
        alignItems: 'stretch',
        justifyContent: 'center',
        background: chatBg,
        overflow: 'hidden',
        margin: 0,
        padding: 0,
      }}>
        <div style={{
          width: '75%',
          height: '100%',
          maxWidth: '100vw',
          maxHeight: '100vh',
          margin: '0 auto',
          background: chatBg,
          borderRadius: 0,
          boxShadow: 'none',
          backdropFilter: 'none',
          border: 'none',
          padding: 0,
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          gap: 0,
          paddingBottom: 28,
        }}>
          <div style={{ textAlign: 'center', margin: 0, padding: 0, lineHeight: 1 }}>
            <img
              src={porscheHeader}
              alt="Classic Porsche header"
              style={{
                maxWidth: '120px',
                width: '100%',
                height: 'auto',
                display: 'block',
                margin: '0 auto',
                background: '#f4f4f4',
                objectFit: 'contain',
                padding: 0,
                marginTop: 0,
                marginBottom: 0,
                lineHeight: 1,
              }}
            />
          </div>
          <h1 style={{
            color: '#222',
            fontFamily: retroFont,
            fontWeight: 900,
            letterSpacing: 1,
            textAlign: 'center',
            marginBottom: 1,
            marginTop: '-32px',
            textShadow: '0 1px 4px #fff8',
            fontSize: 32,
            position: 'relative',
            zIndex: 2,
          }}>
            <span style={{ color: porscheRed }}>AI</span>r-Cooled Answers
          </h1>
          <div
            style={{
              fontStyle: 'italic',
              color: '#b80000',
              textAlign: 'center',
              margin: '0 0 18px 0',
              fontSize: 16,
              fontWeight: 500,
            }}
          >
            {quoteMsg.text}
          </div>
          <div style={{
            width: '100%',
            height: 4,
            background: `linear-gradient(90deg, ${porscheRed} 0%, #fff 100%)`,
            borderRadius: 2,
            margin: '0 auto 18px auto',
          }} />
          <div style={{
            border: 'none',
            background: '#fff',
            borderRadius: 0,
            flex: 1,
            padding: 0,
            margin: 0,
            overflowY: 'auto',
            boxShadow: 'none',
            transition: 'box-shadow 0.2s',
            paddingBottom: 28,
          }}>
            {messages.map((msg, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  flexDirection: msg.sender === 'user' ? 'row-reverse' : 'row',
                  alignItems: 'flex-start',
                  margin: '12px 0',
                }}
              >
                <div
                  style={{
                    background: msg.sender === 'user' ? '#d1e7dd' : '#f8f9fa',
                    color: '#222',
                    borderRadius: 12,
                    padding: '12px 16px',
                    maxWidth: '70%',
                    minWidth: 80,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                    position: 'relative',
                    marginLeft: msg.sender === 'user' ? 0 : 12,
                    marginRight: msg.sender === 'user' ? 12 : 0,
                  }}
                >
                  {msg.sender === 'bot' && (
                    <div style={{
                      fontWeight: 'bold',
                      fontSize: 13,
                      color: '#0d6efd',
                      marginBottom: 4,
                      position: 'absolute',
                      top: 8,
                      left: 16,
                    }}>
                      Dr P
                    </div>
                  )}
                  {msg.sender === 'user' && (
                    <div style={{
                      fontWeight: 'bold',
                      fontSize: 13,
                      color: '#198754',
                      marginBottom: 4,
                      position: 'absolute',
                      top: 8,
                      right: 16,
                    }}>
                      You
                    </div>
                  )}
                  <div style={{ marginTop: 20 }}>
                    {msg.sender === 'bot' ? (
                      <ReactMarkdown
                        components={{
                          a: ({node, ...props}) => (
                          <a {...props} target="_blank" rel="noopener noreferrer" />
                        )
                        }}
                      >
                        {msg.text}
                      </ReactMarkdown>
                    ) : (
                      msg.text
                    )}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          <div style={{
            width: '100%',
            padding: '1.5rem 2rem',
            background: 'rgba(255,255,255,0.95)',
            borderBottomLeftRadius: 0,
            borderBottomRightRadius: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            boxShadow: 'none',
            boxSizing: 'border-box',
          }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              style={{
                flex: 1,
                minWidth: 0,
                maxWidth: '100%',
                padding: '12px 12px',
                borderRadius: 8,
                border: `2px solid ${porscheRed}`,
                fontSize: 16,
                fontFamily: retroFont,
                background: '#fff',
                color: '#222',
                outline: 'none',
                boxShadow: '0 1px 6px #b8000011',
                transition: 'border 0.2s',
                margin: 0,
              }}
              placeholder="Talk to the Dr..."
            />
            <button
              onClick={sendMessage}
              style={{
                flexShrink: 0,
                width: 80,
                padding: '12px 0',
                margin: 0,
                borderRadius: 8,
                border: 'none',
                background: porscheRed,
                color: '#fff',
                fontWeight: 800,
                fontSize: 15,
                fontFamily: retroFont,
                cursor: 'pointer',
                boxShadow: '0 2px 8px #b8000033',
                transition: 'background 0.2s',
              }}
            >
              Send
            </button>
            <button
              onClick={handleSummarize}
              style={{
                flexShrink: 0,
                width: 120,
                padding: '12px 0',
                margin: 0,
                borderRadius: 8,
                border: 'none',
                background: accentColor,
                color: '#fff',
                fontWeight: 700,
                fontSize: 13,
                fontFamily: retroFont,
                cursor: 'pointer',
                boxShadow: '0 2px 8px #bbb3',
                transition: 'background 0.2s',
              }}
            >
              Export
            </button>
          </div>
          <div style={{
            width: '100%',
            textAlign: 'center',
            fontSize: 12,
            color: '#888',
            margin: '10px auto 8px auto',
            background: 'rgba(244,244,244,0.95)',
            padding: '6px 0 0 0',
            letterSpacing: 0.1,
          }}>
            Disclaimer: This tool is for informational purposes only. Always confirm advice and procedures with certified Porsche resources. The creators are not responsible for any actions taken based on information provided here. This site is not affiliated with, endorsed by, or associated with Dr. Ing. h.c. F. Porsche AG, Porsche AG, Porsche Cars North America (PCNA), or any other Porsche entity worldwide.
          </div>
        </div>
      </div>
      {/* Summary Modal */}
      {showSummary && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0,0,0,0.45)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{
            background: '#fff',
            borderRadius: 12,
            padding: 32,
            maxWidth: 600,
            width: '90vw',
            boxShadow: '0 4px 32px #0003',
            fontFamily: retroFont,
            color: '#222',
            position: 'relative',
          }}>
            <h2 style={{marginTop:0, color: porscheRed}}>Conversation Summary</h2>
            {loadingSummary ? (
              <div style={{color: accentColor, fontSize: 17, textAlign: 'center', padding: 24}}>Generating summary...</div>
            ) : summaryError ? (
              <div style={{color: porscheRed, fontSize: 16, textAlign: 'center', padding: 24}}>{summaryError}</div>
            ) : (
              <pre style={{
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                background: '#f7f7f9',
                padding: 16,
                borderRadius: 8,
                fontSize: 15,
                maxHeight: 350,
                overflowY: 'auto',
              }}>{summaryText}</pre>
            )}
            <div style={{display:'flex', justifyContent:'flex-end', gap:12, marginTop:18}}>
              <button
                onClick={handleExportPDF}
                disabled={loadingSummary || !!summaryError}
                style={{
                  padding: '10px 18px',
                  borderRadius: 8,
                  border: 'none',
                  background: loadingSummary || summaryError ? '#ccc' : porscheRed,
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: 15,
                  fontFamily: retroFont,
                  cursor: loadingSummary || summaryError ? 'not-allowed' : 'pointer',
                  boxShadow: '0 2px 8px #b8000033',
                  transition: 'background 0.2s',
                }}
              >
                Export to PDF
              </button>
              <button
                onClick={()=>setShowSummary(false)}
                style={{
                  padding: '10px 18px',
                  borderRadius: 8,
                  border: 'none',
                  background: accentColor,
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: 15,
                  fontFamily: retroFont,
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px #bbb3',
                  transition: 'background 0.2s',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
