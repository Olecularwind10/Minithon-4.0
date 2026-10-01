import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { ArrowLeft, CheckCheck, MessageCircle, Send, Wifi, WifiOff } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { io, type Socket } from 'socket.io-client'
import {
  fetchConversation,
  fetchConversations,
  markConversationRead,
  sendConversationMessage,
  type ChatMessage,
  type Conversation,
} from '../lib/api'
import type { AuthSession } from '../lib/api'

function formatChatTime(value?: string | null) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}

function socketOrigin() {
  if (typeof window === 'undefined') return undefined
  return window.location.origin
}

export default function ChatPage({ session }: { session: AuthSession }) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [draft, setDraft] = useState('')
  const [loading, setLoading] = useState(true)
  const [threadLoading, setThreadLoading] = useState(false)
  const [error, setError] = useState('')
  const [connectionState, setConnectionState] = useState<'connecting' | 'live' | 'offline'>('connecting')
  const [searchParams] = useSearchParams()
  const socketRef = useRef<Socket | null>(null)
  const messageEndRef = useRef<HTMLDivElement | null>(null)

  const selectedConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === selectedId) ?? null,
    [conversations, selectedId],
  )

  useEffect(() => {
    let active = true
    fetchConversations()
      .then(({ conversations: loaded }) => {
        if (!active) return
        setConversations(loaded)
        setSelectedId((current) => current ?? searchParams.get('conversation') ?? loaded[0]?.id ?? null)
      })
      .catch((loadError) => { if (active) setError(loadError instanceof Error ? loadError.message : 'Could not load chats.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (!selectedId) {
      setMessages([])
      return
    }
    let active = true
    setThreadLoading(true)
    fetchConversation(selectedId)
      .then(({ messages: loaded }) => { if (active) setMessages(loaded) })
      .then(() => markConversationRead(selectedId).catch(() => undefined))
      .then(() => {
        if (active) setConversations((current) => current.map((item) => item.id === selectedId ? { ...item, unreadCount: 0 } : item))
      })
      .catch((loadError) => { if (active) setError(loadError instanceof Error ? loadError.message : 'Could not load this chat.') })
      .finally(() => { if (active) setThreadLoading(false) })
    return () => { active = false }
  }, [selectedId])

  useEffect(() => {
    const socket = io(socketOrigin(), { auth: { token: session.token }, autoConnect: true })
    socketRef.current = socket
    socket.on('connect', () => setConnectionState('live'))
    socket.on('connect_error', () => setConnectionState('offline'))
    socket.on('disconnect', () => setConnectionState('offline'))
    socket.on('new_message', (message: ChatMessage) => {
      if (message.conversation_id !== selectedId) {
        setConversations((current) => current.map((item) => item.id === message.conversation_id
          ? { ...item, unreadCount: item.unreadCount + 1, lastMessage: { content: message.content, createdAt: message.createdAt } }
          : item))
        return
      }
      setMessages((current) => current.some((item) => item.id === message.id) ? current : [...current, message])
      void markConversationRead(message.conversation_id)
    })
    return () => { socket.disconnect(); socketRef.current = null }
  }, [session.token, selectedId])

  useEffect(() => {
    const socket = socketRef.current
    if (!socket || !selectedId) return
    socket.emit('join_conversation', selectedId)
    return () => { socket.emit('leave_conversation', selectedId) }
  }, [selectedId, connectionState])

  useEffect(() => { messageEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  async function submitMessage(event: FormEvent) {
    event.preventDefault()
    const content = draft.trim()
    if (!content || !selectedId) return
    setDraft('')
    setError('')
    const socket = socketRef.current
    if (socket?.connected) {
      socket.emit('send_message', { conversationId: selectedId, content }, (result: { ok: boolean; error?: string; message?: ChatMessage }) => {
        if (!result.ok) setError(result.error || 'Could not send message.')
      })
      return
    }
    try {
      const { message } = await sendConversationMessage(selectedId, content)
      setMessages((current) => current.some((item) => item.id === message.id) ? current : [...current, message])
    } catch (sendError) {
      setDraft(content)
      setError(sendError instanceof Error ? sendError.message : 'Could not send message.')
    }
  }

  return (
    <div className={`chat-page ${selectedConversation ? 'has-selection' : ''}`}>
      <header className="chat-page-header">
        <div>
          <p className="text-sm font-semibold text-accent">Stay connected</p>
          <h1 className="mt-1 text-[30px] font-bold leading-tight text-ink">Chats</h1>
        </div>
        <span className={`chat-connection ${connectionState === 'live' ? 'is-online' : ''}`}><span /> {connectionState === 'live' ? 'Live' : connectionState === 'connecting' ? 'Connecting…' : 'Reconnecting…'}</span>
      </header>
      <div className="chat-layout">
        <aside className="conversation-list" aria-label="Your conversations">
          <div className="conversation-list-heading"><strong>Messages</strong><span>{conversations.length}</span></div>
          {loading && <p className="chat-empty">Loading chats…</p>}
          {!loading && conversations.length === 0 && <div className="chat-empty-state"><MessageCircle size={23} /><strong>No chats yet</strong><p>When you connect with a neighbor, your conversation will appear here.</p></div>}
          {conversations.map((conversation) => (
            <button key={conversation.id} type="button" className={`conversation-item ${conversation.id === selectedId ? 'is-selected' : ''}`} onClick={() => setSelectedId(conversation.id)}>
              <span className="conversation-avatar">{conversation.other_user_name?.slice(0, 1).toUpperCase() || '?'}</span>
              <span className="conversation-copy"><strong>{conversation.other_user_name || 'Neighbor'}</strong><span>{conversation.lastMessage?.content || 'Start a conversation'}</span></span>
              <span className="conversation-meta"><time>{formatChatTime(conversation.lastMessage?.createdAt)}</time>{conversation.unreadCount > 0 && <b>{conversation.unreadCount}</b>}</span>
            </button>
          ))}
        </aside>
        <section className="chat-thread" aria-label={selectedConversation ? `Chat with ${selectedConversation.other_user_name}` : 'Chat thread'}>
          {selectedConversation ? (
            <>
              <header className="chat-thread-header">
                <button type="button" className="chat-back-button" onClick={() => setSelectedId(null)} aria-label="Back to conversations"><ArrowLeft size={18} /></button>
                <span className="conversation-avatar">{selectedConversation.other_user_name?.slice(0, 1).toUpperCase() || '?'}</span>
                <div><strong>{selectedConversation.other_user_name || 'Neighbor'}</strong><span>Neighborly connection</span></div>
              </header>
              <div className="chat-messages">
                {threadLoading && <p className="chat-empty">Loading messages…</p>}
                {!threadLoading && messages.length === 0 && <p className="chat-empty">Say hello and coordinate the details here.</p>}
                {messages.map((message) => {
                  const mine = message.sender_id === session.user.id
                  return <div key={message.id} className={`chat-bubble-row ${mine ? 'is-mine' : ''}`}><div className="chat-bubble"><p>{message.content}</p><span>{formatChatTime(message.createdAt)} {mine && <CheckCheck size={13} />}</span></div></div>
                })}
                <div ref={messageEndRef} />
              </div>
              <form className="chat-composer" onSubmit={submitMessage}><input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Write a message…" aria-label="Message" /><button type="submit" disabled={!draft.trim()} aria-label="Send message"><Send size={18} /></button></form>
            </>
          ) : <div className="chat-empty-state chat-thread-empty"><MessageCircle size={30} /><strong>Select a conversation</strong><p>Choose a neighbor from the list to continue your chat.</p>{connectionState === 'offline' && <span><WifiOff size={14} /> Realtime will reconnect automatically</span>}</div>}
        </section>
      </div>
      {error && <p className="chat-error" role="alert">{error}</p>}
      {connectionState === 'offline' && selectedConversation && <p className="chat-offline-note"><Wifi size={14} /> Reconnecting. You can still send; delivery will retry through the server.</p>}
    </div>
  )
}