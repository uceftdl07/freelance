"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  HiMagnifyingGlass,
  HiPaperAirplane,
  HiChatBubbleLeftRight,
  HiExclamationTriangle,
} from "react-icons/hi2";
import { apiRequest } from "../../lib/api";

interface ConvSummary {
  id: string;
  partnerId: string;
  partnerName: string;
  partnerAvatar: string | null;
  partnerSubtitle: string | null;
  lastMessage: string | null;
  lastMessageAt: string;
  unreadCount: number;
}

interface Msg {
  id: string;
  content: string;
  createdAt: string;
  read: boolean;
  isFromMe: boolean;
}

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

function formatTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  }
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return "Hier";
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

function ConvSkeleton() {
  return (
    <div className="px-4 py-3.5 border-b border-gray-50 animate-pulse">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0" />
        <div className="flex-1 space-y-2 pt-1">
          <div className="h-3 bg-gray-200 rounded w-3/4" />
          <div className="h-2.5 bg-gray-200 rounded w-1/2" />
        </div>
      </div>
    </div>
  );
}

export default function MessagerieView({ role }: { role: "candidat" | "recruteur" }) {
  const [convs, setConvs] = useState<ConvSummary[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [search, setSearch] = useState("");
  const [newMsg, setNewMsg] = useState("");
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const activeConv = convs.find((c) => c.id === activeId) ?? null;

  const fetchConvs = useCallback(async () => {
    try {
      const res = await apiRequest<ConvSummary[]>("/messaging/conversations");
      if (res.success && res.data) {
        setConvs(res.data);
        setActiveId((prev) => {
          if (prev) return prev;
          return res.data && res.data.length > 0 ? res.data[0].id : null;
        });
      }
    } catch {
      // silently keep current state
    } finally {
      setLoadingConvs(false);
    }
  }, []);

  const fetchMessages = useCallback(async (convId: string) => {
    try {
      setLoadingMsgs(true);
      const res = await apiRequest<Msg[]>(`/messaging/conversations/${convId}/messages`);
      if (res.success && res.data) {
        setMessages(res.data);
      }
    } catch {
      // silently keep current state
    } finally {
      setLoadingMsgs(false);
    }
  }, []);

  useEffect(() => {
    fetchConvs();
    const t = setInterval(fetchConvs, 10000);
    return () => clearInterval(t);
  }, [fetchConvs]);

  useEffect(() => {
    if (!activeId) return;
    fetchMessages(activeId);
    const t = setInterval(() => fetchMessages(activeId), 10000);
    return () => clearInterval(t);
  }, [activeId, fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMsg(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 120) + "px";
    }
  };

  const sendMessage = async () => {
    if (!newMsg.trim() || !activeId || sending) return;
    const content = newMsg.trim();
    setNewMsg("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    const optimistic: Msg = {
      id: `opt-${Date.now()}`,
      content,
      createdAt: new Date().toISOString(),
      read: false,
      isFromMe: true,
    };
    setMessages((prev) => [...prev, optimistic]);

    setSending(true);
    try {
      await apiRequest(`/messaging/conversations/${activeId}/messages`, {
        method: "POST",
        body: JSON.stringify({ content }),
      });
      fetchMessages(activeId);
      fetchConvs();
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      setError("Erreur lors de l'envoi du message.");
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const filtered = convs.filter((c) =>
    c.partnerName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex h-[calc(100vh-8rem)] bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

      {/* LEFT: Inbox */}
      <div className="w-[30%] min-w-[280px] border-r border-gray-100 flex flex-col">
        <div
          className="p-4 border-b border-gray-100 space-y-3 flex-shrink-0"
          style={{ background: "#0a1628" }}
        >
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <HiChatBubbleLeftRight className="w-5 h-5" style={{ color: "#00b8d9" }} />
            Messagerie
          </h2>
          <div className="relative">
            <HiMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-white/10 border border-white/20 text-white placeholder-gray-400 rounded-lg outline-none focus:ring-2 focus:ring-[#00b8d9]/40 focus:border-[#00b8d9] transition-all"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loadingConvs ? (
            <>
              {[...Array(4)].map((_, i) => (
                <ConvSkeleton key={i} />
              ))}
            </>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">
              {convs.length === 0
                ? "Aucune conversation pour l'instant."
                : "Aucun résultat."}
            </div>
          ) : (
            filtered.map((conv) => {
              const isActive = conv.id === activeId;
              const ini = initials(conv.partnerName);
              return (
                <button
                  key={conv.id}
                  onClick={() => setActiveId(conv.id)}
                  className={`w-full flex items-start gap-3 px-4 py-3.5 text-left transition-colors border-b border-gray-50 cursor-pointer ${
                    isActive
                      ? "bg-[#00b8d9]/5 border-l-2 border-l-[#00b8d9]"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <div className="relative flex-shrink-0">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white"
                      style={{ backgroundColor: isActive ? "#00b8d9" : "#94a3b8" }}
                    >
                      {ini}
                    </div>
                    {conv.unreadCount > 0 && (
                      <span
                        className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-white text-[9px] font-bold flex items-center justify-center"
                        style={{ backgroundColor: "#00b8d9" }}
                      >
                        {conv.unreadCount > 9 ? "9+" : conv.unreadCount}
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`text-sm truncate ${
                          conv.unreadCount > 0
                            ? "font-bold text-gray-900"
                            : "font-medium text-gray-700"
                        }`}
                      >
                        {conv.partnerName}
                      </span>
                      <span className="text-[11px] text-gray-400 flex-shrink-0">
                        {formatTime(conv.lastMessageAt)}
                      </span>
                    </div>
                    {conv.partnerSubtitle && (
                      <p className="text-[11px] text-gray-400 truncate mt-0.5">
                        {conv.partnerSubtitle}
                      </p>
                    )}
                    {conv.lastMessage && (
                      <p
                        className={`text-xs truncate mt-0.5 ${
                          conv.unreadCount > 0
                            ? "text-gray-800 font-semibold"
                            : "text-gray-500"
                        }`}
                      >
                        {conv.lastMessage}
                      </p>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* RIGHT: Chat */}
      <div className="flex-1 flex flex-col min-w-0">
        {!activeConv ? (
          <div className="flex-1 flex items-center justify-center flex-col gap-3 text-gray-400">
            <HiChatBubbleLeftRight className="w-12 h-12 opacity-30" />
            <p className="text-sm">Sélectionnez une conversation</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div
              className="flex items-center gap-3 px-6 py-3.5 border-b border-gray-100 flex-shrink-0"
              style={{ background: "#0a1628" }}
            >
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                style={{ backgroundColor: "#00b8d9" }}
              >
                {initials(activeConv.partnerName)}
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">
                  {activeConv.partnerName}
                </h3>
                {activeConv.partnerSubtitle && (
                  <p className="text-xs text-gray-400">{activeConv.partnerSubtitle}</p>
                )}
              </div>
            </div>

            {/* Messages */}
            <div
              className="flex-1 overflow-y-auto px-6 py-4 space-y-3"
              style={{ backgroundColor: "#f8fafc" }}
            >
              {loadingMsgs && messages.length === 0 ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className={`flex ${i % 2 === 0 ? "justify-start" : "justify-end"} animate-pulse`}
                    >
                      <div
                        className={`h-10 rounded-2xl bg-gray-200 ${i % 2 === 0 ? "w-2/5" : "w-1/3"}`}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.isFromMe ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                        msg.isFromMe
                          ? "text-white rounded-br-md"
                          : "bg-white border border-gray-100 text-gray-800 rounded-bl-md shadow-sm"
                      }`}
                      style={msg.isFromMe ? { backgroundColor: "#0a1628" } : undefined}
                    >
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                      <div className="flex items-center justify-end gap-1 mt-1">
                        <span className="text-[10px] text-gray-400">
                          {new Date(msg.createdAt).toLocaleTimeString("fr-FR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        {msg.isFromMe && (
                          <span
                            className="text-[10px]"
                            style={{ color: msg.read ? "#00b8d9" : "#9ca3af" }}
                          >
                            {msg.read ? "✓✓" : "✓"}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Error toast */}
            {error && (
              <div className="mx-4 mb-2 px-3 py-2 rounded-lg bg-red-50 text-red-600 text-xs border border-red-100 flex items-center gap-2">
                <HiExclamationTriangle className="w-4 h-4 flex-shrink-0" />
                {error}
                <button
                  onClick={() => setError(null)}
                  className="ml-auto font-bold hover:text-red-800"
                >
                  ×
                </button>
              </div>
            )}

            {/* Input */}
            <div className="border-t border-gray-100 px-4 py-3 flex-shrink-0 bg-white">
              <div className="flex items-end gap-2">
                <textarea
                  ref={textareaRef}
                  value={newMsg}
                  onChange={handleTextareaChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Écrivez votre message… (Entrée pour envoyer)"
                  rows={1}
                  className="flex-1 px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#00b8d9]/40 focus:border-[#00b8d9] transition-all resize-none leading-relaxed"
                  style={{ maxHeight: "120px" }}
                />
                <button
                  onClick={sendMessage}
                  disabled={sending || !newMsg.trim()}
                  className="p-2.5 rounded-xl text-white transition-all hover:-translate-y-0.5 flex-shrink-0 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: "#00b8d9" }}
                  title="Envoyer"
                >
                  <HiPaperAirplane className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
