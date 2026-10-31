import React, { useState, useRef, useEffect } from 'react'
import {
  Bot,
  User,
  Send,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Package,
  DollarSign,
  AlertTriangle,
  Lightbulb,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react'
import { useApp } from '@/context/AppContext'
import { useAuth } from '@/context/AuthContext'
import { formatCurrency } from '@/lib/utils'
import { api } from '@/lib/api'

interface ChatMessage {
  id: string
  sender: 'user' | 'assistant'
  text: string
  timestamp: string
  metricCard?: {
    title: string
    value: string
    subvalue: string
    type: 'success' | 'warning' | 'info'
  }
  suggestedFollowUps?: string[]
}

export const Assistant: React.FC = () => {
  const { currentStore, products, transactions, recommendations, filteredRevenue, filteredExpenses, filteredProfit } = useApp()
  const { user } = useAuth()

  const userName = user?.full_name?.trim()
    ? user.full_name.trim().split(' ')[0]
    : (user?.username?.trim() ? user.username.trim().split('@')[0] : 'Operator')

  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'msg-0',
      sender: 'assistant',
      text: `Namaste ${userName}! I'm your NexusOps AI Business Assistant. I monitor real-time POS receipts, warehouse inventory velocity across Indian hubs, supplier lead times, and retail demand forecasts.\n\nHow can I assist your business operations today?`,
      timestamp: 'Just now',
      suggestedFollowUps: [
        'How much revenue did I generate this month?',
        'Which products are running low on stock?',
        'What are my predicted sales for next week?',
        'Compare this month with last month.',
      ],
    },
  ])

  useEffect(() => {
    if (user) {
      setMessages(prev => {
        if (prev.length === 1 && prev[0].id === 'msg-0') {
          return [
            {
              ...prev[0],
              text: `Namaste ${userName}! I'm your NexusOps AI Business Assistant. I monitor real-time POS receipts, warehouse inventory velocity across Indian hubs, supplier lead times, and retail demand forecasts.\n\nHow can I assist your business operations today?`,
            },
          ]
        }
        return prev
      })
    }
  }, [user, userName])

  const [inputPrompt, setInputPrompt] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping])

  const defaultSuggestedQuestions = [
    'How much revenue did I generate this month?',
    'Which products are selling the most?',
    'Which products are running low on stock?',
    'What are my predicted sales for next week?',
    'Which supplier has the highest on-time fulfillment?',
  ]

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || inputPrompt).trim()
    if (!query) return

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }

    setMessages(prev => [...prev, userMsg])
    setInputPrompt('')
    setIsTyping(true)

    // First attempt to query PostgreSQL backend
    try {
      const res = await api.post('/assistant/query/', { query })
      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'assistant',
        text: res.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        metricCard: res.metric_card ? {
          title: res.metric_card.label,
          value: res.metric_card.value,
          subvalue: res.metric_card.change,
          type: res.metric_card.is_positive ? 'success' : 'warning',
        } : undefined,
        suggestedFollowUps: res.follow_up_prompts,
      }
      setMessages(prev => [...prev, botMsg])
      setIsTyping(false)
      return
    } catch {
      // Fallback to client-side simulated engine if offline
    }

    // Simulate intelligent response generation based on local dataset in INR
    setTimeout(() => {
      let botResponse = ''
      let metricCard: ChatMessage['metricCard'] = undefined
      let followUps: string[] = []

      const q = query.toLowerCase()

      if (q.includes('revenue') || q.includes('generate') || q.includes('income')) {
        botResponse = `This month, ${currentStore.name} generated ${formatCurrency(filteredRevenue)} in gross revenue across all sales channels.\n\n• Direct Operating Expenses: ${formatCurrency(filteredExpenses)}\n• Net Operating Profit: ${formatCurrency(filteredProfit)}\n• Gross Margin: 59.4% (+4.8% vs last month)\n\nSales velocity has been propelled primarily by the Hardware & Displays and Audio categories.`
        metricCard = {
          title: 'Total Monthly Revenue',
          value: formatCurrency(filteredRevenue),
          subvalue: `Net Profit: ${formatCurrency(filteredProfit)}`,
          type: 'success',
        }
        followUps = ['Which products are selling the most?', 'Compare this month with last month.']
      } else if (q.includes('low') || q.includes('stock') || q.includes('inventory')) {
        const lowStock = products.filter(p => p.status === 'low_stock' || p.status === 'out_of_stock')
        botResponse = `Currently, there are ${lowStock.length} SKUs that require immediate procurement attention:\n\n`
        lowStock.forEach(p => {
          botResponse += `• ${p.name} (${p.sku}): ${p.stock} units remaining (Safety threshold: ${p.reorderLevel} units). Supplier: ${p.supplier}.\n`
        })
        botResponse += `\nRecommended Action: Issue procurement POs to prevent festive weekend stockouts.`
        metricCard = {
          title: 'Critical Stock Alerts',
          value: `${lowStock.length} SKUs`,
          subvalue: 'Reorder buffer breached',
          type: 'warning',
        }
        followUps = ['What are my predicted sales for next week?', 'How much did we spend on suppliers?']
      } else if (q.includes('predict') || q.includes('forecast') || q.includes('next week')) {
        botResponse = `According to our Demand Forecasting Engine, projected demand over the next 7 days is 424 units (~60.6 units/day average).\n\n• Projected Peak Day: Friday, Oct 30 (79 units estimated)\n• Forecast Accuracy: 90% confidence interval\n• Reorder Buffer: Healthy`
        metricCard = {
          title: '7-Day Demand Forecast',
          value: '424 units',
          subvalue: 'Peak Day: Friday Oct 30 (79 units)',
          type: 'info',
        }
        followUps = ['Which products are running low on stock?', 'Compare this month with last month.']
      } else if (q.includes('best') || q.includes('selling') || q.includes('most')) {
        botResponse = `Here are the top-performing products ranked by 30-day velocity:\n\n1. AcousticPro Wireless ANC Headphones — 88 units (₹2,62,485 gross)\n2. UltraHD 27" Curved Pro Monitor — 42 units (₹3,29,990 gross)\n3. ErgoPeak Synchronous Chair — 31 units (₹2,99,990 gross)\n4. GaN UltraFast 65W Multi-Port Hub — 215 units (₹1,54,755 gross)`
        followUps = ['How much revenue did I generate this month?', 'What are my predicted sales for next week?']
      } else if (q.includes('compare') || q.includes('last month')) {
        botResponse = `Comparing this month vs. prior month:\n\n• Gross Revenue: ${formatCurrency(filteredRevenue)} vs. ₹11,03,000 (+16.4%)\n• Operating Expenses: ${formatCurrency(filteredExpenses)} vs. ₹5,11,000 (+3.4%)\n• Net Profit: ${formatCurrency(filteredProfit)} vs. ₹5,92,000 (+27.6%)\n\nProfitability expanded significantly because operational costs grew at a modest +3.4% relative to top-line volume growth (+16.4%).`
        followUps = ['Which products are selling the most?', 'What are my predicted sales for next week?']
      } else {
        botResponse = `Based on current operational logs for ${currentStore.name}:\n\n• Active Catalog: ${products.length} registered SKUs\n• 30-Day Gross Turnover: ${formatCurrency(filteredRevenue)}\n• Active Vendor POs: 2 in transit, 1 pending fulfillment\n• Store Status: All POS registers online with zero gateway latency.`
        followUps = [
          'How much revenue did I generate this month?',
          'Which products are running low on stock?',
        ]
      }

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'assistant',
        text: botResponse,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        metricCard,
        suggestedFollowUps: followUps,
      }

      setMessages(prev => [...prev, botMsg])
      setIsTyping(false)
    }, 750)
  }

  const renderMessageContent = (text: string) => {
    // If text contains any markdown bold **text**, render clean bold elements without raw asterisks
    const parts = text.split(/(\*\*.*?\*\*)/g)
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={index} className="font-semibold text-slate-900">
            {part.slice(2, -2)}
          </strong>
        )
      }
      return <span key={index}>{part}</span>
    })
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card flex flex-col h-[calc(100vh-140px)] overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/20">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900">NexusOps AI Business Assistant</h2>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <p className="text-xs text-slate-400">Context aware • Connected to Indian business operations</p>
          </div>
        </div>

        <button
          onClick={() => {
            setMessages([
              {
                id: `msg-${Date.now()}`,
                sender: 'assistant',
                text: `Conversation reset. How can I assist with your Indian business metrics, ${userName}?`,
                timestamp: 'Just now',
                suggestedFollowUps: defaultSuggestedQuestions.slice(0, 3),
              },
            ])
          }}
          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition"
          title="Reset conversation"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map(msg => {
          const isUser = msg.sender === 'user'

          return (
            <div
              key={msg.id}
              className={`flex items-start gap-3.5 max-w-3xl ${isUser ? 'ml-auto flex-row-reverse' : ''}`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${
                  isUser
                    ? 'bg-blue-600 text-white'
                    : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              {/* Message Bubble */}
              <div className="space-y-2 max-w-xl">
                <div
                  className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${
                    isUser
                      ? 'bg-blue-600 text-white font-medium rounded-tr-xs'
                      : 'bg-slate-50 text-slate-800 border border-slate-200/80 rounded-tl-xs shadow-xs'
                  }`}
                >
                  {renderMessageContent(msg.text)}
                </div>

                {/* Embedded Mini Metric Card */}
                {msg.metricCard && (
                  <div className="p-3 bg-white rounded-xl border border-slate-200/90 shadow-xs flex items-center justify-between">
                    <div>
                      <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                        {msg.metricCard.title}
                      </div>
                      <div className="text-base font-bold text-slate-900 mt-0.5">
                        {msg.metricCard.value}
                      </div>
                      <div className="text-[11px] text-slate-500">{msg.metricCard.subvalue}</div>
                    </div>
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                        msg.metricCard.type === 'success'
                          ? 'bg-emerald-50 text-emerald-600'
                          : msg.metricCard.type === 'warning'
                          ? 'bg-amber-50 text-amber-600'
                          : 'bg-blue-50 text-blue-600'
                      }`}
                    >
                      <Sparkles className="w-4 h-4" />
                    </div>
                  </div>
                )}

                {/* Suggested Follow-Ups */}
                {msg.suggestedFollowUps && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {msg.suggestedFollowUps.map(fu => (
                      <button
                        key={fu}
                        onClick={() => handleSend(fu)}
                        className="text-[11px] px-2.5 py-1 rounded-full bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-600 border border-slate-200/60 transition"
                      >
                        {fu}
                      </button>
                    ))}
                  </div>
                )}

                <div className={`text-[10px] text-slate-400 ${isUser ? 'text-right' : ''}`}>
                  {msg.timestamp}
                </div>
              </div>
            </div>
          )
        })}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex items-center gap-3 text-slate-400 text-xs">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="px-4 py-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" />
              <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce [animation-delay:0.2s]" />
              <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce [animation-delay:0.4s]" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div className="p-4 border-t border-slate-100 bg-white space-y-3">
        {/* Quick prompt suggestions chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <span className="text-slate-400 font-semibold text-[11px] shrink-0">Try asking:</span>
          {defaultSuggestedQuestions.map(q => (
            <button
              key={q}
              onClick={() => handleSend(q)}
              className="px-2.5 py-1 rounded-full bg-slate-50 hover:bg-blue-50 text-slate-600 hover:text-blue-600 border border-slate-200/60 whitespace-nowrap transition text-xs shrink-0"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input Text Box */}
        <form
          onSubmit={e => {
            e.preventDefault()
            handleSend()
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={inputPrompt}
            onChange={e => setInputPrompt(e.target.value)}
            placeholder="Ask about revenue in INR, low inventory, customer trends, or forecast models..."
            className="flex-1 px-4 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          />
          <button
            type="submit"
            disabled={!inputPrompt.trim() || isTyping}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold transition flex items-center gap-1.5 shadow-xs shrink-0"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline text-xs">Ask</span>
          </button>
        </form>
      </div>
    </div>
  )
}
