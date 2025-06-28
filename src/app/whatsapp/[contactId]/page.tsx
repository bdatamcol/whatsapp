import ChatView from "../../components/whatsapp/ChatView";

export default async function Page({ params }: { params: Promise<{ contactId: string }> }) {
    const { contactId } = await params;
    return <ChatView contactId={contactId} />;
}