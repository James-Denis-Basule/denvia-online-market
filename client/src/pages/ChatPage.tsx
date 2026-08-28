import ChatWidget from '../components/ChatWidget';
import Container from '../components/layout/Container';
import Card from '../components/ui/Card';

function ChatPage() {
  return (
    <main className="py-12">
      <Container>
        <div className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">Analytics chat</p>
          <h1 className="text-3xl font-bold text-gray-900">Ask the platform</h1>
        </div>

        <Card>
          <ChatWidget />
        </Card>
      </Container>
    </main>
  );
}

export default ChatPage;
