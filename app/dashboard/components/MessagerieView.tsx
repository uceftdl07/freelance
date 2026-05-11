"use client";

import { useState, useRef, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  HiMagnifyingGlass,
  HiPaperAirplane,
  HiPaperClip,
  HiArrowTopRightOnSquare,
} from "react-icons/hi2";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
interface Message {
  id: string;
  text: string;
  time: string;
  fromMe: boolean;
}

interface Conversation {
  id: string;
  name: string;
  avatar: string;
  badge: string;
  badgeColor: string;
  lastMessage: string;
  time: string;
  unread: boolean;
  link: string;
  linkLabel: string;
  messages: Message[];
}

/* ------------------------------------------------------------------ */
/*  Mock data factory                                                  */
/* ------------------------------------------------------------------ */
function buildMockData(role: "candidat" | "recruteur"): Conversation[] {
  if (role === "candidat") {
    return [
      {
        id: "1",
        name: "Sophie Martin — Capgemini",
        avatar: "SM",
        badge: "Candidature en cours",
        badgeColor: "#00b8d9",
        lastMessage: "Bonjour, votre profil nous intéresse beaucoup !",
        time: "10:42",
        unread: true,
        link: "/dashboard/candidat/offres",
        linkLabel: "Voir l'offre associée",
        messages: [
          { id: "m1", text: "Bonjour ! Nous avons bien reçu votre candidature pour le poste de Développeur React Senior.", time: "09:15", fromMe: false },
          { id: "m2", text: "Merci beaucoup ! Je suis très motivé par cette opportunité.", time: "09:22", fromMe: true },
          { id: "m3", text: "Parfait. Seriez-vous disponible pour un entretien technique cette semaine ?", time: "09:30", fromMe: false },
          { id: "m4", text: "Oui, je suis disponible jeudi après-midi ou vendredi matin.", time: "09:45", fromMe: true },
          { id: "m5", text: "Bonjour, votre profil nous intéresse beaucoup !", time: "10:42", fromMe: false },
        ],
      },
      {
        id: "2",
        name: "Thomas Durand — Qonto",
        avatar: "TD",
        badge: "Prise de contact",
        badgeColor: "#8b5cf6",
        lastMessage: "Merci pour votre retour rapide.",
        time: "Hier",
        unread: false,
        link: "/dashboard/candidat/offres",
        linkLabel: "Voir l'offre associée",
        messages: [
          { id: "m1", text: "Bonjour, j'ai vu votre profil sur FreelanceIT et je souhaitais prendre contact.", time: "14:00", fromMe: false },
          { id: "m2", text: "Bonjour Thomas ! Avec plaisir, quel est le contexte de la mission ?", time: "14:15", fromMe: true },
          { id: "m3", text: "Nous cherchons un dev fullstack pour renforcer notre équipe paiement.", time: "14:20", fromMe: false },
          { id: "m4", text: "Merci pour votre retour rapide.", time: "14:30", fromMe: false },
        ],
      },
      {
        id: "3",
        name: "Julie Leroy — Doctolib",
        avatar: "JL",
        badge: "Entretien planifié",
        badgeColor: "#10b981",
        lastMessage: "RDV confirmé pour mardi à 14h.",
        time: "Lun",
        unread: true,
        link: "/dashboard/candidat/candidatures",
        linkLabel: "Voir ma candidature",
        messages: [
          { id: "m1", text: "Bonjour ! Suite à notre échange, je vous propose un créneau mardi 14h.", time: "10:00", fromMe: false },
          { id: "m2", text: "C'est parfait pour moi, merci !", time: "10:05", fromMe: true },
          { id: "m3", text: "RDV confirmé pour mardi à 14h.", time: "10:06", fromMe: false },
        ],
      },
      {
        id: "4",
        name: "Marc Petit — BNP Paribas",
        avatar: "MP",
        badge: "Mission terminée",
        badgeColor: "#6b7280",
        lastMessage: "Merci pour cette belle collaboration !",
        time: "12 Avr",
        unread: false,
        link: "/dashboard/candidat/offres",
        linkLabel: "Voir l'offre associée",
        messages: [
          { id: "m1", text: "La mission est officiellement terminée. Merci pour votre excellent travail !", time: "16:00", fromMe: false },
          { id: "m2", text: "Merci pour cette belle collaboration !", time: "16:10", fromMe: true },
        ],
      },
    ];
  }

  // Recruteur mock data
  return [
    {
      id: "1",
      name: "Yassine El Amrani",
      avatar: "YA",
      badge: "Candidature reçue",
      badgeColor: "#00b8d9",
      lastMessage: "Oui, je suis disponible dès la semaine prochaine.",
      time: "11:05",
      unread: true,
      link: "/dashboard/recruteur/recherche-talents",
      linkLabel: "Voir le profil",
      messages: [
        { id: "m1", text: "Bonjour Yassine, votre profil correspond parfaitement à notre besoin.", time: "10:00", fromMe: true },
        { id: "m2", text: "Merci ! De quoi s'agit-il exactement ?", time: "10:15", fromMe: false },
        { id: "m3", text: "Une mission React/Node.js de 6 mois pour notre client dans la fintech.", time: "10:20", fromMe: true },
        { id: "m4", text: "Oui, je suis disponible dès la semaine prochaine.", time: "11:05", fromMe: false },
      ],
    },
    {
      id: "2",
      name: "Camille Bernard",
      avatar: "CB",
      badge: "Entretien planifié",
      badgeColor: "#10b981",
      lastMessage: "Je vous envoie mon portfolio ce soir.",
      time: "09:30",
      unread: true,
      link: "/dashboard/recruteur/recherche-talents",
      linkLabel: "Voir le profil",
      messages: [
        { id: "m1", text: "Bonjour Camille, seriez-vous intéressée par une mission UX/UI ?", time: "Hier 15:00", fromMe: true },
        { id: "m2", text: "Absolument ! Pouvez-vous m'en dire plus sur le projet ?", time: "Hier 15:30", fromMe: false },
        { id: "m3", text: "Il s'agit de la refonte complète de l'app mobile d'un grand groupe retail.", time: "Hier 16:00", fromMe: true },
        { id: "m4", text: "Je vous envoie mon portfolio ce soir.", time: "09:30", fromMe: false },
      ],
    },
    {
      id: "3",
      name: "Alexandre Morel",
      avatar: "AM",
      badge: "Prise de contact",
      badgeColor: "#8b5cf6",
      lastMessage: "D'accord, je regarde et je reviens vers vous.",
      time: "Hier",
      unread: false,
      link: "/dashboard/recruteur/recherche-talents",
      linkLabel: "Voir le profil",
      messages: [
        { id: "m1", text: "Bonjour Alexandre, j'ai une opportunité qui pourrait vous intéresser en DevOps.", time: "11:00", fromMe: true },
        { id: "m2", text: "D'accord, je regarde et je reviens vers vous.", time: "11:30", fromMe: false },
      ],
    },
    {
      id: "4",
      name: "Fatima Zahra Benali",
      avatar: "FZ",
      badge: "Mission en cours",
      badgeColor: "#f59e0b",
      lastMessage: "Le sprint 3 est terminé, voici le rapport.",
      time: "Mar",
      unread: false,
      link: "/dashboard/recruteur/recherche-talents",
      linkLabel: "Voir le profil",
      messages: [
        { id: "m1", text: "Bonjour Fatima, comment avance le sprint 3 ?", time: "09:00", fromMe: true },
        { id: "m2", text: "Le sprint 3 est terminé, voici le rapport.", time: "17:00", fromMe: false },
      ],
    },
  ];
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
export default function MessagerieView({ role }: { role: "candidat" | "recruteur" }) {
  const searchParams = useSearchParams();
  const initialConversationId = searchParams?.get("conversationId");
  
  const [conversations, setConversations] = useState<Conversation[]>(buildMockData(role));
  const [activeId, setActiveId] = useState(initialConversationId || conversations[0].id);
  const [search, setSearch] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [localMessages, setLocalMessages] = useState<Record<string, Message[]>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const active = conversations.find((c) => c.id === activeId) || conversations[0];
  
  // Si la conversation est "réelle" (UUID), on utilise uniquement les messages fetchés
  const isRealConversation = activeId.length > 10;
  const fetchedMessages = localMessages[activeId] || [];
  const allMessages = isRealConversation ? fetchedMessages : [...active.messages, ...fetchedMessages];

  const filtered = conversations.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  // 1. Load User
  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) setCurrentUser(JSON.parse(stored));
  }, []);

  // 2. Fetch & Poll Conversations
  useEffect(() => {
    if (!currentUser) return;
    const fetchConvs = async () => {
      try {
        const res = await fetch(`/api/conversations?userId=${currentUser.id}&role=${currentUser.role}`);
        const data = await res.json();
        if (data.success && data.data.length > 0) {
          setConversations(data.data);
          if (!activeId || !data.data.find((c: any) => c.id === activeId)) {
            setActiveId(initialConversationId || data.data[0].id);
          }
        }
      } catch (e) {
        // Silently fallback to mock data
      }
    };
    fetchConvs();
    const interval = setInterval(fetchConvs, 5000);
    return () => clearInterval(interval);
  }, [currentUser, activeId, initialConversationId]);

  // 3. Fetch & Poll Messages for active chat
  useEffect(() => {
    if (!isRealConversation || !currentUser) return;
    
    const fetchMsgs = async () => {
      try {
        const res = await fetch(`/api/messages?conversationId=${activeId}`);
        const data = await res.json();
        if (data.success) {
          const formatted = data.data.map((m: any) => ({ ...m, fromMe: m.senderId === currentUser.id }));
          setLocalMessages((prev) => ({ ...prev, [activeId]: formatted }));
        }
      } catch (e) {}
    };
    fetchMsgs();
    const interval = setInterval(fetchMsgs, 2000); // Polling rapide
    return () => clearInterval(interval);
  }, [activeId, isRealConversation, currentUser]);

  // Auto-scroll to bottom when conversation changes or new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeId, localMessages]);

  // Auto-resize textarea
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + "px";
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    const msg: Message = {
      id: Date.now().toString(),
      text: newMessage.trim(),
      time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
      fromMe: true,
    };
    setLocalMessages((prev) => ({
      ...prev,
      [activeId]: [...(prev[activeId] || []), msg],
    }));
    setNewMessage("");
    
    // Si c'est une vraie conversation, on l'envoie en BDD
    if (isRealConversation && currentUser) {
      try {
        await fetch("/api/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ conversationId: activeId, senderId: currentUser.id, content: msg.text }),
        });
      } catch (e) {
        console.error("Erreur d'envoi", e);
      }
    }

    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

      {/* ============ LEFT: Inbox ============ */}
      <div className="w-[30%] min-w-[280px] border-r border-gray-100 flex flex-col">

        {/* Header */}
        <div className="p-4 border-b border-gray-100 space-y-3 flex-shrink-0">
          <h2 className="text-lg font-bold text-gray-900">Messagerie</h2>
          <div className="relative">
            <HiMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher une conversation..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-[#00b8d9]/40 focus:border-[#00b8d9] transition-all"
            />
          </div>
        </div>

        {/* Conversations list */}
        <div className="flex-1 overflow-y-auto">
          {filtered.map((conv) => {
            const isActive = conv.id === activeId;
            return (
              <button
                key={conv.id}
                onClick={() => setActiveId(conv.id)}
                className={`w-full flex items-start gap-3 px-4 py-3.5 text-left transition-colors border-b border-gray-50 cursor-pointer ${
                  isActive ? "bg-[#00b8d9]/5" : "hover:bg-gray-50"
                }`}
              >
                {/* Avatar */}
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                  style={{ backgroundColor: isActive ? "#00b8d9" : "#94a3b8" }}
                >
                  {conv.avatar}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-sm truncate ${conv.unread ? "font-bold text-gray-900" : "font-medium text-gray-700"}`}>
                      {conv.name}
                    </span>
                    <span className="text-[11px] text-gray-400 flex-shrink-0">{conv.time}</span>
                  </div>

                  {/* Badge */}
                  <span
                    className="inline-block mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold"
                    style={{ backgroundColor: conv.badgeColor + "18", color: conv.badgeColor }}
                  >
                    {conv.badge}
                  </span>

                  {/* Last message */}
                  <div className="flex items-center gap-1.5 mt-1">
                    {conv.unread && (
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: "#00b8d9" }} />
                    )}
                    <p className={`text-xs truncate ${conv.unread ? "text-gray-800 font-semibold" : "text-gray-500"}`}>
                      {conv.lastMessage}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}

          {filtered.length === 0 && (
            <div className="p-6 text-center text-sm text-gray-400">Aucune conversation trouvée.</div>
          )}
        </div>
      </div>

      {/* ============ RIGHT: Active Chat ============ */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Chat header */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white"
              style={{ backgroundColor: "#00b8d9" }}
            >
              {active.avatar}
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">{active.name}</h3>
              <span
                className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold"
                style={{ backgroundColor: active.badgeColor + "18", color: active.badgeColor }}
              >
                {active.badge}
              </span>
            </div>
          </div>
          <a
            href={active.link}
            className="flex items-center gap-1.5 text-xs font-semibold text-[#00b8d9] hover:underline"
          >
            {active.linkLabel}
            <HiArrowTopRightOnSquare className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4" style={{ backgroundColor: "#f8fafc" }}>
          {allMessages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.fromMe ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  msg.fromMe
                    ? "text-white rounded-br-md"
                    : "bg-white border border-gray-100 text-gray-800 rounded-bl-md shadow-sm"
                }`}
                style={msg.fromMe ? { backgroundColor: "#0a1628" } : undefined}
              >
                <p>{msg.text}</p>
                <p className={`text-[10px] mt-1.5 ${msg.fromMe ? "text-gray-400" : "text-gray-400"}`}>
                  {msg.time}
                </p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="border-t border-gray-100 px-4 py-3 flex-shrink-0" style={{ backgroundColor: "#ffffff" }}>
          <div className="flex items-end gap-2">
            {/* Attach */}
            <button
              className="p-2.5 rounded-xl text-gray-400 hover:text-[#00b8d9] hover:bg-[#00b8d9]/10 transition-colors flex-shrink-0"
              title="Joindre un fichier"
            >
              <HiPaperClip className="w-5 h-5" />
            </button>

            {/* Textarea */}
            <textarea
              ref={textareaRef}
              value={newMessage}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              placeholder="Écrivez votre message..."
              rows={1}
              className="flex-1 px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#00b8d9]/40 focus:border-[#00b8d9] transition-all resize-none leading-relaxed"
              style={{ maxHeight: "120px" }}
            />

            {/* Send */}
            <button
              onClick={sendMessage}
              className="p-2.5 rounded-xl text-white transition-all hover:-translate-y-0.5 flex-shrink-0 shadow-md"
              style={{ backgroundColor: "#00b8d9" }}
              title="Envoyer"
            >
              <HiPaperAirplane className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
