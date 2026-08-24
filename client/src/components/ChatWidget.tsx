import { useEffect, useState } from 'react';
import { getMessages, postMessage, type Message } from '../services/chatService';

function ChatWidget() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);

  const load = async () => {
    const msgs = await getMessages(50);
    setMessages(msgs);
  };

  useEffect(() => {
    void load();
    const id = setInterval(() => void load(), 5000);
    return () => clearInterval(id);
  }, []);

  const handleSend = async () => {
    if (!input.trim()) return;
    setSending(true);
    try {
      const result = await postMessage(input.trim());
      if (result) {
        // result contains userMessage and assistantMessage
        setMessages((prev) => [...prev, result.userMessage, result.assistantMessage]);
      }
      setInput('');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-xl rounded-lg border border-gray-200 bg-white p-3">
      <div className="h-64 overflow-auto space-y-2 p-2">
        {messages.length === 0 ? <p className="text-sm text-gray-500">No messages yet — ask for analytics like "Top sellers" or "Revenue 30d".</p> : null}
        {messages.map((m) => (
          <div key={m._id} className={`rounded-md p-2 ${m.role === 'assistant' ? 'bg-gray-50' : 'bg-blue-50'}`}>
            <div className="text-sm text-gray-800 whitespace-pre-wrap">{m.content}</div>
            <div className="text-xs text-gray-400 mt-1">{new Date(m.createdAt ?? Date.now()).toLocaleString()}</div>
          </div>
        ))}
      </div>

      <div className="mt-3 flex gap-2">
        <input value={input} onChange={(e) => setInput(e.target.value)} className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="Ask a question (e.g. Top sellers)" />
        <button onClick={handleSend} disabled={sending || input.trim() === ''} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
          Send
        </button>
      </div>
    </div>
  );
}

export default ChatWidget;
