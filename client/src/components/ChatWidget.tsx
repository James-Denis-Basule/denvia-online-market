import { useEffect, useRef, useState } from 'react';
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
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);

  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const previousMessageCountRef = useRef(0);

  const load = async () => {
    try {
      const msgs = await getMessages(50);
      setMessages(msgs);
    } catch (error) {
      console.error('Failed to load analytics messages:', error);
    }
  };

  useEffect(() => {
    const initialLoad = window.setTimeout(() => {
      void load();
    }, 0);

    const id = window.setInterval(() => {
      void load();
    }, 5000);

    return () => {
      window.clearTimeout(initialLoad);
      window.clearInterval(id);
    };
  }, []);

  const scrollToBottom = () => {
    const container = messagesContainerRef.current;

    if (!container) {
      return;
    }

    container.scrollTo({
      top: container.scrollHeight,
      behavior: 'smooth',
    });

    setShowScrollToBottom(false);
  };

  useEffect(() => {
    const container = messagesContainerRef.current;

    if (!container) {
      return;
    }

    const handleScroll = () => {
      const distanceFromBottom =
        container.scrollHeight -
        container.scrollTop -
        container.clientHeight;

      setShowScrollToBottom(distanceFromBottom > 80);
    };

    container.addEventListener('scroll', handleScroll);

    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, []);

  useEffect(() => {
    if (messages.length > previousMessageCountRef.current) {
      const container = messagesContainerRef.current;

      if (container) {
        container.scrollTo({
          top: container.scrollHeight,
          behavior: 'smooth',
        });
      }
    }

    previousMessageCountRef.current = messages.length;
  }, [messages.length]);

  const handleSend = async (question?: string) => {
    const message = (question ?? input).trim();

    if (!message || sending) {
      return;
    }

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

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      void handleSend();
    }
  };

  return (
    <section className="w-full rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <h2 className="mb-5 text-xl font-bold text-slate-800">
        Ask analytics <span className="text-slate-500">(Gemini)</span>
      </h2>

      <div className="grid h-[440px] min-h-0 gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="min-h-0 overflow-y-auto rounded-xl border border-slate-200 bg-white p-5">
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

        <div className="relative flex min-h-0 min-w-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-slate-50/40">
          <div
            ref={messagesContainerRef}
            className="min-h-0 flex-1 space-y-4 overflow-x-hidden overflow-y-auto p-4"
          >
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
                    <span className="font-medium">“Top sellers”</span> or{' '}
                    <span className="font-medium">“Revenue 30d”</span>.
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
                  className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-6 ${
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
                <span>Gemini is analyzing your business data...</span>
              </div>
            )}
          </div>

          {showScrollToBottom && (
            <button
              type="button"
              onClick={scrollToBottom}
              aria-label="Scroll to bottom"
              className="absolute bottom-20 right-4 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-lg font-bold text-slate-600 shadow-md transition hover:bg-slate-50"
            >
              ↓
            </button>
          )}

          <div className="shrink-0 border-t border-slate-200 bg-white p-3">
            <div className="flex gap-3">
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={handleKeyDown}
                disabled={sending}
                placeholder="Ask Gemini..."
                className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />

              <button
                type="button"
                onClick={() => void handleSend()}
                disabled={sending || !input.trim()}
                className="shrink-0 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {sending ? 'Sending...' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ChatWidget;
