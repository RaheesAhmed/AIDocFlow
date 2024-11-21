"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { FileText, MessageSquare } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface FileItem {
  id: string;
  name: string;
  created_at: string;
  fileUrl: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function Dashboard() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchFiles();
  }, []);

  async function fetchFiles() {
    try {
      const { data: files, error } = await supabase.storage
        .from("documents")
        .list();

      if (error) throw error;

      // Get public URLs for all files
      const filesWithUrls = await Promise.all(
        files.map(async (file) => {
          const {
            data: { publicUrl },
          } = supabase.storage.from("documents").getPublicUrl(file.name);

          return {
            id: file.id,
            name: file.name,
            created_at: file.created_at,
            fileUrl: publicUrl,
          };
        })
      );

      setFiles(filesWithUrls);
    } catch (error) {
      console.error("Error fetching files:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedFile || !inputMessage.trim() || isSending) return;

    setIsSending(true);
    const newMessage: Message = { role: "user", content: inputMessage };
    setMessages((prev) => [...prev, newMessage]);
    setInputMessage("");

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileId: selectedFile.name,
          message: inputMessage,
        }),
      });

      if (!response.ok) throw new Error("Failed to send message");
      if (!response.body) throw new Error("No response body");

      // Create a new message for the assistant's response
      const assistantMessage: Message = { role: "assistant", content: "" };
      setMessages((prev) => [...prev, assistantMessage]);

      // Read the stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value);

        // Update the last message (assistant's message) with the new content
        setMessages((prev) => {
          const newMessages = [...prev];
          const lastMessage = newMessages[newMessages.length - 1];
          if (lastMessage.role === "assistant") {
            lastMessage.content += text;
          }
          return newMessages;
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  }

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-64 border-r bg-gray-50">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Your Documents</h2>
        </div>
        <ScrollArea className="h-[calc(100vh-5rem)]">
          <div className="p-2">
            {loading ? (
              <div className="text-center p-4">Loading...</div>
            ) : files.length === 0 ? (
              <div className="text-center p-4 text-gray-500">
                No files uploaded yet
              </div>
            ) : (
              files.map((file) => (
                <Button
                  key={file.id}
                  variant={selectedFile?.id === file.id ? "secondary" : "ghost"}
                  className="w-full justify-start gap-2 mb-1"
                  onClick={() => setSelectedFile(file)}
                >
                  <FileText className="h-4 w-4" />
                  <span className="truncate">{file.name}</span>
                </Button>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {selectedFile ? (
          <div className="flex-1 p-6 flex flex-col">
            <div className="mb-6">
              <h1 className="text-2xl font-bold mb-2">{selectedFile.name}</h1>
              <p className="text-gray-500">
                Uploaded on{" "}
                {new Date(selectedFile.created_at).toLocaleDateString()}
              </p>
            </div>

            {/* Chat Interface */}
            <div className="flex-1 flex flex-col bg-gray-50 rounded-lg p-4">
              <div
                ref={chatContainerRef}
                className="flex-1 overflow-y-auto mb-4 space-y-4"
              >
                {messages.length === 0 ? (
                  <div className="text-center text-gray-500">
                    <MessageSquare className="h-12 w-12 mx-auto mb-2" />
                    <p>Ask questions about your document</p>
                  </div>
                ) : (
                  messages.map((msg, index) => (
                    <div
                      key={index}
                      className={`flex ${
                        msg.role === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          msg.role === "user"
                            ? "bg-blue-500 text-white"
                            : "bg-white border"
                        }`}
                      >
                        {msg.content}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={handleSendMessage} className="flex gap-2">
                <Textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Ask a question about your document..."
                  className="resize-none"
                  rows={1}
                  disabled={isSending}
                />
                <Button type="submit" disabled={isSending}>
                  {isSending ? "Sending..." : "Send"}
                </Button>
              </form>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <FileText className="h-12 w-12 mx-auto mb-2" />
              <p>Select a file to view details</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
