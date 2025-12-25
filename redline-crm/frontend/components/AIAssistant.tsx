import React, { useState, useRef, useEffect } from 'react';
import {
    Sparkles, Send, X, Maximize2, Minimize2, ChevronDown,
    Mic, BarChart2, Users, Phone, Calendar, Lightbulb
} from 'lucide-react';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

const quickActions = [
    { icon: BarChart2, label: "Today's calls", query: "How many calls today?" },
    { icon: Users, label: "Pending follow-ups", query: "Show pending follow-ups" },
    { icon: Phone, label: "Top customers", query: "Top 5 customers by calls" },
    { icon: Calendar, label: "Weekly stats", query: "What is this week's performance?" },
];

const AIAssistant: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            role: 'assistant',
            content: 'Hello! 👋 I am your AI Assistant. You can ask me anything like:\n\n• "How many calls today?"\n• "Which leads are pending?"\n• "What is John\'s phone number?"\n\nHow can I help you?',
            timestamp: new Date()
        }
    ]);
    const [isTyping, setIsTyping] = useState(false);
    const [conversationId, setConversationId] = useState<string | null>(null);
    const [insight, setInsight] = useState<string>("Loading personalized insights...");
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        const fetchInsight = async () => {
            try {
                const res = await fetch(`${API_URL}/ai/insight`);
                const data = await res.json();
                if ((data.success || data.status === 'success') && data.data.insight) {
                    setInsight(data.data.insight);
                }
            } catch (error) {
                console.error('Failed to fetch insight:', error);
                setInsight("Welcome back! How can I help you today?");
            }
        };
        fetchInsight();
    }, []);

    const handleSend = async (query?: string) => {
        const text = query || message;
        if (!text.trim()) return;

        // Add user message
        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: text,
            timestamp: new Date()
        };
        setMessages(prev => [...prev, userMessage]);
        setMessage('');
        setIsTyping(true);

        try {
            const payload: any = {
                message: text,
                context: "You are a helpful assistant for RedLine CRM user."
            };
            
            if (conversationId) {
                payload.conversationId = conversationId;
            }

            const res = await fetch(`${API_URL}/ai/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            const data = await res.json();
            console.log('AI API Response:', data); // Debug log

            if (data.success || data.status === 'success') {
                const aiResponse = data.data.response;
                setConversationId(data.data.conversation.id);

                const aiMessage: Message = {
                    id: Date.now().toString(),
                    role: 'assistant',
                    content: aiResponse,
                    timestamp: new Date()
                };
                setMessages(prev => [...prev, aiMessage]);
            } else {
                console.error('Backend returned error:', data);
                throw new Error(data.message || 'Failed to get response (No message in data)');
            }

        } catch (error) {
            console.error('AI Chat Error:', error);
            const errorMessage: Message = {
                id: Date.now().toString(),
                role: 'assistant',
                content: "⚠️ I'm having trouble connecting to the server. Please check your connection or try again later.",
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsTyping(false);
        }
    };

    // Floating Button (when closed)
    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="ai-fab group"
                title="AI Assistant"
            >
                <Sparkles className="w-6 h-6" />
            </button>
        );
    }

    // Chat Panel
    return (
        <div
            className={`fixed z-50 bg-white rounded-2xl shadow-2xl border border-neutral-200 flex flex-col overflow-hidden animate-slide-up ${isExpanded
                ? 'inset-6'
                : 'bottom-6 right-6 w-[420px] h-[600px]'
                }`}
            style={{ transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}
        >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-neutral-100 bg-gradient-to-r from-red-600 to-orange-500 text-white">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                        <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-bold">AI Assistant</h3>
                        <p className="text-xs text-white/80">Powered by Gemini</p>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                    >
                        {isExpanded ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                    </button>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-neutral-50">
                {messages.map(msg => (
                    <div
                        key={msg.id}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div
                            className={`max-w-[85%] p-4 rounded-2xl ${msg.role === 'user'
                                ? 'chat-bubble-user'
                                : 'chat-bubble-ai'
                                }`}
                        >
                            <p className="text-sm whitespace-pre-wrap leading-relaxed">
                                {msg.content.split('**').map((part, i) =>
                                    i % 2 === 1 ? <strong key={i}>{part}</strong> : part
                                )}
                            </p>
                            <p className={`text-xs mt-2 ${msg.role === 'user' ? 'text-white/60' : 'text-neutral-400'
                                }`}>
                                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                        </div>
                    </div>
                ))}

                {/* Typing Indicator */}
                {isTyping && (
                    <div className="flex justify-start">
                        <div className="chat-bubble-ai">
                            <div className="typing-indicator">
                                <span></span>
                                <span></span>
                                <span></span>
                            </div>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Quick Actions */}
            {messages.length <= 1 && (
                <div className="p-3 border-t border-neutral-100 bg-white">
                    <p className="text-xs font-medium text-neutral-500 mb-2 px-1">Quick Actions</p>
                    <div className="flex flex-wrap gap-2">
                        {quickActions.map(action => (
                            <button
                                key={action.label}
                                onClick={() => handleSend(action.query)}
                                className="action-chip"
                            >
                                <action.icon className="w-3.5 h-3.5" />
                                {action.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Input Area */}
            <div className="p-4 border-t border-neutral-100 bg-white">
                <div className="flex items-end gap-2">
                    <div className="flex-1 relative">
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSend();
                                }
                            }}
                            placeholder="Ask anything..."
                            rows={1}
                            className="w-full px-4 py-3 pr-12 bg-neutral-50 border border-neutral-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                        />
                        <button className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-neutral-400 hover:text-neutral-600 transition-colors">
                            <Mic className="w-5 h-5" />
                        </button>
                    </div>
                    <button
                        onClick={() => handleSend()}
                        disabled={!message.trim()}
                        className="p-3 bg-gradient-to-r from-red-600 to-orange-500 text-white rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-500/25"
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </div>

                {/* Proactive Insight */}
                <div className="mt-3 p-3 bg-amber-50 border border-amber-100 rounded-xl">
                    <div className="flex items-start gap-2">
                        <Lightbulb className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-amber-700">
                            <strong>Insight:</strong> {insight}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AIAssistant;
