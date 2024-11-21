'use client'

import { useEffect, useState, useRef } from "react"
import { supabase } from "@/lib/supabase"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { FileText, MessageSquare, Send, Loader2, Plus, Search, Trash2, MoreVertical, FolderOpen, User, Bot } from 'lucide-react'
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { motion, AnimatePresence } from "framer-motion"
import { format } from 'date-fns'
import { Input } from "@/components/ui/input"
import ReactMarkdown from 'react-markdown'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface FileItem {
  id: string
  name: string
  created_at: string
  fileUrl: string
}

interface Message {
  role: "user" | "assistant"
  content: string
}

interface ChatSession {
  id: string
  title: string
  created_at: string
  file_id: string
}

export default function Dashboard() {
  const [files, setFiles] = useState<FileItem[]>([])
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([])
  const [selectedChat, setSelectedChat] = useState<ChatSession | null>(null)
  const [loadingChats, setLoadingChats] = useState(true)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchFiles()
    fetchChatSessions()
  }, [])

  async function fetchFiles() {
    try {
      const { data: files, error } = await supabase.storage.from("documents").list()
      if (error) throw error
      const filesWithUrls = await Promise.all(
        files.map(async (file) => {
          const { data: { publicUrl } } = supabase.storage.from("documents").getPublicUrl(file.name)
          return {
            id: file.id,
            name: file.name,
            created_at: file.created_at,
            fileUrl: publicUrl,
          }
        })
      )
      setFiles(filesWithUrls)
    } catch (error) {
      console.error("Error fetching files:", error)
      toast({
        title: "Error",
        description: "Failed to fetch files. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  async function fetchChatSessions() {
    try {
      const { data: chats, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      console.log('Fetched chats:', chats)
      setChatSessions(chats || [])
    } catch (error) {
      console.error("Error fetching chats:", error)
      toast({
        title: "Error",
        description: "Failed to fetch chat history.",
        variant: "destructive",
      })
    } finally {
      setLoadingChats(false)
    }
  }

  async function createNewChat(fileId: string) {
    try {
      const selectedFileName = files.find(f => f.name === selectedFile?.name)?.name || 'file'
      console.log('Creating new chat for file:', selectedFileName)
      
      const { data: chat, error } = await supabase
        .from('chat_sessions')
        .insert([
          { 
            title: `Chat with ${selectedFileName}`,
            file_id: selectedFile?.name // Use file name as ID since that's what we have
          }
        ])
        .select()
        .single()
      
      if (error) {
        console.error('Error creating chat:', error)
        throw error
      }
      
      console.log('Created new chat:', chat)
      setChatSessions(prev => [chat, ...prev])
      setSelectedChat(chat)
      setMessages([])
      
      toast({
        title: "Success",
        description: "New chat created successfully.",
      })
    } catch (error) {
      console.error("Error creating chat:", error)
      toast({
        title: "Error",
        description: "Failed to create new chat.",
        variant: "destructive",
      })
    }
  }

  async function deleteChat(chatId: string) {
    try {
      const { error } = await supabase
        .from('chat_sessions')
        .delete()
        .eq('id', chatId)
      
      if (error) throw error
      
      setChatSessions(prev => prev.filter(chat => chat.id !== chatId))
      if (selectedChat?.id === chatId) {
        setSelectedChat(null)
        setMessages([])
      }
      
      toast({
        title: "Success",
        description: "Chat deleted successfully.",
      })
    } catch (error) {
      console.error("Error deleting chat:", error)
      toast({
        title: "Error",
        description: "Failed to delete chat.",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    if (selectedChat) {
      // Load messages for the selected chat
      const loadChatMessages = async () => {
        try {
          const { data: messages, error } = await supabase
            .from('chat_messages')
            .select('*')
            .eq('chat_id', selectedChat.id)
            .order('created_at', { ascending: true })
          
          if (error) throw error
          
          if (messages) {
            setMessages(messages.map(msg => ({
              role: msg.role as "user" | "assistant",
              content: msg.content
            })))
          }
        } catch (error) {
          console.error("Error loading chat messages:", error)
          toast({
            title: "Error",
            description: "Failed to load chat messages.",
            variant: "destructive",
          })
        }
      }

      loadChatMessages()
    }
  }, [selectedChat])

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedFile || !inputMessage.trim() || isSending || !selectedChat) return
    setIsSending(true)
    const newMessage: Message = { role: "user", content: inputMessage }
    setMessages((prev) => [...prev, newMessage])
    setInputMessage("")

    try {
      // Save the message to the database
      const { error: messageError } = await supabase
        .from('chat_messages')
        .insert([{
          chat_id: selectedChat.id,
          role: 'user',
          content: inputMessage
        }])

      if (messageError) throw messageError

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileId: selectedFile.name,
          message: inputMessage,
        }),
      })

      if (!response.ok) throw new Error("Failed to send message")
      if (!response.body) throw new Error("No response body")

      const assistantMessage: Message = { role: "assistant", content: "" }
      setMessages((prev) => [...prev, assistantMessage])

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let assistantResponse = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const text = decoder.decode(value)
        assistantResponse += text
        setMessages((prev) => {
          const newMessages = [...prev]
          const lastMessage = newMessages[newMessages.length - 1]
          if (lastMessage.role === "assistant") {
            lastMessage.content = assistantResponse
          }
          return newMessages
        })
      }

      // Save the assistant's response to the database
      const { error: assistantError } = await supabase
        .from('chat_messages')
        .insert([{
          chat_id: selectedChat.id,
          role: 'assistant',
          content: assistantResponse
        }])

      if (assistantError) throw assistantError

    } catch (error) {
      console.error("Error in chat:", error)
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSending(false)
    }
  }

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [messages])

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
      {/* Left Sidebar - Chat History */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col shadow-lg">
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Chat History</h2>
          <Button 
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-md hover:shadow-lg transition-all duration-200"
            onClick={() => selectedFile && createNewChat(selectedFile.id)}
            disabled={!selectedFile}
          >
            <Plus className="w-4 h-4 mr-2" />
            New Chat
          </Button>
          <div className="mt-4 relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <Input 
              placeholder="Search chats..." 
              className="pl-10 bg-gray-50 border-gray-200 focus:ring-blue-500"
            />
          </div>
        </div>
        <ScrollArea className="flex-1">
          <motion.div 
            className="p-4 space-y-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {loadingChats ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              </div>
            ) : chatSessions.length === 0 ? (
              <div className="text-center p-8">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600 font-medium">No chat history yet</p>
                <p className="text-sm text-gray-500 mt-1">Select a file and start a new chat</p>
              </div>
            ) : (
              <div className="space-y-3">
                {chatSessions.map((chat) => (
                  <motion.div
                    key={chat.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className={`group rounded-xl p-4 cursor-pointer transition-all duration-200 hover:shadow-md ${
                      selectedChat?.id === chat.id 
                        ? "bg-blue-50 border-blue-200 shadow-sm" 
                        : "hover:bg-gray-50 border border-transparent hover:border-gray-200"
                    }`}
                    onClick={() => setSelectedChat(chat)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${
                          selectedChat?.id === chat.id 
                            ? "bg-blue-100" 
                            : "bg-gray-100"
                        }`}>
                          <MessageSquare className={`h-5 w-5 ${
                            selectedChat?.id === chat.id 
                              ? "text-blue-600" 
                              : "text-gray-600"
                          }`} />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 line-clamp-1">{chat.title}</p>
                          <p className="text-sm text-gray-500">
                            {format(new Date(chat.created_at), 'MMM d, yyyy')}
                          </p>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            className="text-red-600"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteChat(chat.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Chat
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </ScrollArea>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white">
        {/* Chat Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
          <div className="flex items-center space-x-4">
            <div className="p-2 bg-blue-50 rounded-lg">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-800">
                {selectedFile ? selectedFile.name : "Select a file to start chatting"}
              </h1>
              {selectedFile && (
                <p className="text-sm text-gray-500 mt-1">
                  {format(new Date(selectedFile.created_at), 'MMMM d, yyyy')}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Chat Messages */}
        <ScrollArea className="flex-1 p-6" ref={chatContainerRef}>
          <motion.div 
            className="space-y-6 max-w-4xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {messages.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <MessageSquare className="h-10 w-10 text-blue-500" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Start a Conversation</h3>
                <p className="text-gray-500 max-w-sm mx-auto">
                  Ask questions about your document and get detailed responses
                </p>
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                {messages.map((message, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="flex items-start space-x-3"
                  >
                    {/* User/Assistant Icon */}
                    <div className="flex-shrink-0 mt-1">
                      {message.role === "user" ? (
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <User className="w-5 h-5 text-blue-600" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                          <Bot className="w-5 h-5 text-purple-600" />
                        </div>
                      )}
                    </div>

                    {/* Message Content */}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium text-sm text-gray-700">
                          {message.role === "user" ? "You" : "Assistant"}
                        </span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-400">
                          {format(new Date(), 'h:mm a')}
                        </span>
                      </div>
                      <div
                        className={`rounded-xl px-4 py-3 shadow-sm ${
                          message.role === "user"
                            ? "bg-blue-50 text-gray-800"
                            : "bg-white border border-gray-100"
                        }`}
                      >
                        <div className="prose prose-sm max-w-none">
                          <ReactMarkdown>
                            {message.content}
                          </ReactMarkdown>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </motion.div>
        </ScrollArea>

        {/* Chat Input */}
        <div className="p-6 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-white">
          <div className="max-w-4xl mx-auto">
            <form onSubmit={handleSendMessage} className="flex gap-4">
              <Textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 min-h-[60px] max-h-[200px] resize-none rounded-xl border-gray-200 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                disabled={!selectedFile || isSending}
              />
              <Button 
                type="submit" 
                disabled={!selectedFile || !inputMessage.trim() || isSending}
                className="h-[60px] px-6 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-md hover:shadow-lg transition-all duration-200 rounded-xl"
              >
                {isSending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* Right Sidebar - File Explorer */}
      <div className="w-80 bg-white border-l border-gray-200 flex flex-col shadow-lg">
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-white to-gray-50">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Files</h2>
            <Button variant="outline" size="icon" className="rounded-lg">
              <FolderOpen className="h-5 w-5 text-gray-600" />
            </Button>
          </div>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <Input 
              placeholder="Search files..." 
              className="pl-10 bg-gray-50 border-gray-200 focus:ring-blue-500"
            />
          </div>
        </div>
        <ScrollArea className="flex-1">
          <motion.div 
            className="p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              </div>
            ) : (
              <div className="space-y-3">
                {files.map((file) => (
                  <motion.button
                    key={file.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => setSelectedFile(file)}
                    className={`w-full p-4 rounded-xl flex items-center space-x-3 transition-all duration-200 hover:shadow-md ${
                      selectedFile?.id === file.id
                        ? "bg-blue-50 border-blue-200 shadow-sm"
                        : "hover:bg-gray-50 border border-transparent hover:border-gray-200"
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${
                      selectedFile?.id === file.id 
                        ? "bg-blue-100" 
                        : "bg-gray-100"
                    }`}>
                      <FileText className={`h-5 w-5 ${
                        selectedFile?.id === file.id 
                          ? "text-blue-600" 
                          : "text-gray-600"
                      }`} />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-medium text-gray-900 line-clamp-1">{file.name}</p>
                      <p className="text-sm text-gray-500">
                        {format(new Date(file.created_at), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </motion.button>
                ))}
              </div>
            )}
          </motion.div>
        </ScrollArea>
      </div>
    </div>
  )
}