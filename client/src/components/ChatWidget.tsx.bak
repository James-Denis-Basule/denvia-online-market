import { useEffect, useState } from 'react';
import {
  BarChart3,
  Bot,
  ShoppingBag,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react';

import {
  getMessages,
  postMessage,
  type Message,
} from '../services/chatService';

const suggestions = [
  {
    title: 'Top sellers',
    description: 'See your best selling products',
    query: 'Top sellers',
    icon: BarChart3,
    iconClass: 'bg-green-50 text-green-600',
  },
  {
    title: 'Revenue 30d',
    description: 'Total revenue in the last 30 days',
    query: 'Revenue 30d',
    icon: Wallet,
    iconClass: 'bg-purple-50 text-purple-600',
  },
  {
    title: 'Orders today',
    description: 'Number of orders today',
    query: 'Orders today',
    icon: ShoppingBag,
    iconClass: 'bg-orange-50 text-orange-600',
  },
  {
    title: 'Customers',
    description: 'New vs returning customers',
    query: 'Customers',
    icon: Users,
    iconClass: 'bg-blue-50 text-blue-600',
  },
  {
    title: 'Conversion rate',
    description: 'Your store conversion rate',
    query: 'Conversion rate',
    icon: TrendingUp,
    iconClass: 'bg-red-50 text-red-500',
  },
];

function ChatWidget() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);

  const load = async () => {
    try {
      const msgs = await getMessages(50);
      setMessages(msgs);
    } catch (error) {
      console.error('Failed to load analytics messages:', error);
    }
  };

  useEffect(() => {
    void load();

    const id = setInterval(() => {
      void load();
    }, 5000);

    return () => clearInterval(id);
  }, []);

  const handleSend = async (question?: string) => {
    const message = (question ?? input).trim();

    if (!message || sending) return;

    setSending(true);

    try {
      const result = await postMessage(message);

      if (result) {
        setMessages((prev) => [
          ...prev,
          result.userMessage,
          result.assistantMessage,
        ]);
      }

      setInput('');
    } catch (error) {
      console.error('Failed to send analytics question:', error);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      void handleSend();
    }
  };

  return (
    <section className="w-full rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <h2 className="mb-5 text-xl font-bold text-slate-800">
        Ask analytics <span className="text-slate-500">(beta)</span>
      </h2>

      <div className="grid min-h-[440px] gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
        {/* Suggestions */}
        <aside className="rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="mb-5 font-semibold text-slate-700">
            Try asking about
          </h3>

          <div className="space-y-4">
            {suggestions.map((suggestion) => {
              const Icon = suggestion.icon;

              return (
                <button
                  key={suggestion.title}
                  type="button"
                  onClick={() => void handleSend(suggestion.query)}
                  disabled={sending}
                  className="flex w-full items-center gap-3 text-left transition hover:opacity-80 disabled:opacity-50"
                >
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${suggestion.iconClass}`}
                  >
                    <Icon size={20} strokeWidth={2} />
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-slate-700">
                      {suggestion.title}
                    </p>

                    <p className="mt-0.5 text-xs leading-5 text-slate-500">
                      {suggestion.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Chat Area */}
        <div className="flex min-w-0 flex-col rounded-xl border border-slate-200 bg-slate-50/40 p-4">
          <div className="flex-1 space-y-4 overflow-y-auto pr-1">
            {messages.length === 0 && (
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                  <Bot size={21} />
                </div>

                <div className="max-w-xl rounded-2xl rounded-tl-sm bg-blue-50 px-4 py-3 text-sm leading-6 text-slate-700">
                  <p>
                    Hi! I can help you with analytics about your business.
                  </p>

                  <p className="mt-1">
                    Try asking something like{' '}
                    <span className="font-medium">
                      “Top sellers”
                    </span>{' '}
                    or{' '}
                    <span className="font-medium">
                      “Revenue 30d”
                    </span>.
                  </p>
                </div>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message._id}
                className={`flex ${
                  message.role === 'assistant'
                    ? 'justify-start'
                    : 'justify-end'
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 whitespace-pre-wrap ${
                    message.role === 'assistant'
                      ? 'rounded-tl-sm bg-blue-50 text-slate-700'
                      : 'rounded-tr-sm bg-blue-600 text-white'
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}

            {sending && (
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Bot size={18} className="text-blue-600" />
                <span>Analyzing your business data...</span>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="mt-4 flex gap-3 border-t border-slate-200 pt-4">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={sending}
              placeholder="Ask a question (e.g. Top sellers, Revenue 30d, Orders today)"
              className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />

            <button
              type="button"
              onClick={() => void handleSend()}
              disabled={sending || !input.trim()}
              className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {sending ? 'Sending...' : 'Send'}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ChatWidget;