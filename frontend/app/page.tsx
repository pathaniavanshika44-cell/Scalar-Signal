"use client";

import {
  FormEvent,
  useEffect,
  useRef,
  useState,
} from "react";

import ContactsModal from "./components/ContactsModal";
import GroupMembersModal from "./components/GroupMembersModal";
import SettingsModal from "./components/SettingsModal";

const API_URL = "http://localhost:8000";
const WS_URL = "ws://localhost:8000";

type User = {
  id: number;
  username: string;
  display_name: string;
  phone: string | null;
  avatar_url: string | null;
};

type Conversation = {
  id: number;
  type: "DIRECT" | "GROUP";
  name: string;
  avatar_url: string | null;
  last_message: string | null;
  updated_at: string;
  unread_count: number;
};

type Message = {
  id: number;
  content: string;
  time: string;
  sender_id: number;
  status: string;
  optimistic?: boolean;
};

type ConnectionStatus =
  | "connected"
  | "reconnecting"
  | "offline";

function MenuIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path
        d="M4 6h16M4 12h16M4 18h16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path
        d="M20 11.5a7.5 7.5 0 0 1-8 7.45 8.3 8.3 0 0 1-3.5-.78L4 20l1.35-3.85A7.3 7.3 0 0 1 4.5 11.5 7.5 7.5 0 1 1 20 11.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none">
      <path
        d="M6.5 4.5 9 4l2 4-1.8 1.8a14 14 0 0 0 5 5L16 13l4 2-.5 2.5c-.25 1.2-1.3 2-2.5-2.5C10.37 19.5 4.5 19.5 4.5 7c0-1.2.8-2.25 2-2.5Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function StoriesIcon() {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none">
      <rect
        x="5"
        y="5"
        width="14"
        height="14"
        rx="4"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <circle
        cx="12"
        cy="12"
        r="3"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <circle cx="16.5" cy="7.5" r="1" fill="currentColor" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none">
      <circle
        cx="12"
        cy="12"
        r="3.5"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M19.4 15 21 16l-1.5 2.6-1.7-.7a7.5 7.5 0 0 1-2.2 1.3l-.3 1.8h-3l-.3-1.8a7.5 7.5 0 0 1-2.2-1.3l-1.7.7L6.6 16l1.5-2.6 1.7.7A7.5 7.5 0 0 1 12 8.8l.3-1.8h3l.3 1.8a7.5 7.5 0 0 1 2.2 1.3l1.7-.7L21 12l-1.6 1a7.5 7.5 0 0 1 0 2Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <circle
        cx="11"
        cy="11"
        r="6.5"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="m16 16 4 4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ComposeIcon() {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none">
      <path
        d="M13.5 5.5H6.8A2.3 2.3 0 0 0 4.5 7.8v9.4a2.3 2.3 0 0 0 2.3 2.3h9.4a2.3 2.3 0 0 0 2.3-2.3v-6.7"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="m14 10 5.8-5.8a1.4 1.4 0 0 1 2 2L16 12l-3 1 1-3Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
      <path
        d="M5 7h14M8 12h8M10.5 17h3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function VerifiedIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" fill="#3A76F0" />
      <path
        d="m8 12.2 2.5 2.5L16.5 9"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CheckDoubleIcon() {
  return (
    <svg width="17" height="14" viewBox="0 0 24 20" fill="none">
      <path
        d="m1.5 10 5 5L15 6.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="m8 10 5 5 8.5-8.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SignalLogo() {
  return (
    <svg width="74" height="74" viewBox="0 0 100 100" fill="none">
      <path
        d="M28 31.5h44c6.9 0 12.5 5.6 12.5 12.5v17c0 6.9-5.6 12.5-12.5 12.5H51l-14 10v-10h-9c-6.9 0-12.5-5.6-12.5-12.5V44C15.5 37.1 21.1 31.5 28 31.5Z"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path
        d="M31 48h38M31 57h25"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function Home() {
  const [showPromo, setShowPromo] = useState(true);
  const [showContacts, setShowContacts] = useState(false);
  const [showIconRail, setShowIconRail] = useState(true);
  const [showGroupMembers, setShowGroupMembers] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const [selectedChat, setSelectedChat] = useState<string | null>(
    null
  );

  const [messageText, setMessageText] = useState("");

  const [messages, setMessages] = useState<Message[]>([]);
  const [messageLoading, setMessageLoading] = useState(false);

  const [user, setUser] = useState<User | null>(null);

  const [conversations, setConversations] = useState<Conversation[]>(
    []
  );

  const [authLoading, setAuthLoading] = useState(true);

  const [conversationLoading, setConversationLoading] =
    useState(true);

  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>("offline");

  const [typingUser, setTypingUser] = useState(false);

  const socketRef = useRef<WebSocket | null>(null);

  const reconnectTimeoutRef = useRef<ReturnType<
    typeof setTimeout
  > | null>(null);

  const reconnectAttemptRef = useRef(0);

  async function loadConversations() {
    const token = localStorage.getItem("access_token");

    if (!token) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/conversations`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to load conversations");
      }

      const data = await response.json();

      setConversations(data);

      if (data.length > 0 && selectedChat === null) {
        setSelectedChat(String(data[0].id));
        loadMessages(data[0].id);
      }
    } catch (error) {
      console.error(
        "Failed to load conversations:",
        error
      );
    } finally {
      setConversationLoading(false);
    }
  }

  async function loadMessages(conversationId: number) {
    const token = localStorage.getItem("access_token");

    if (!token) {
      return;
    }

    setMessageLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/conversations/${conversationId}/messages`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to load messages");
      }

      const data = await response.json();

      console.log("MESSAGES FROM BACKEND:", data);

      const formattedMessages: Message[] = data.map(
        (message: {
          id: number;
          content: string;
          sender_id: number;
          status: string;
          created_at: string;
        }) => ({
          id: message.id,
          content: message.content,
          sender_id: message.sender_id,
          status: message.status,
          time: new Date(
            message.created_at
          ).toLocaleTimeString([], {
            hour: "numeric",
            minute: "2-digit",
          }),
        })
      );

      setMessages(formattedMessages);
    } catch (error) {
      console.error(
        "Failed to load messages:",
        error
      );

      setMessages([]);
    } finally {
      setMessageLoading(false);
    }
  }

  async function markConversationAsRead(conversationId: number) {
    const token = localStorage.getItem("access_token");

    if (!token) {
      return;
    }

    try {
      await fetch(
        `${API_URL}/conversations/${conversationId}/messages/read`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      await loadConversations();
    } catch (error) {
      console.error(
        "Failed to mark messages as read:",
        error
      );
    }
  }

  async function markMessageAsDelivered(
    conversationId: number,
    messageId: number
  ) {
    const token = localStorage.getItem("access_token");

    if (!token) {
      return;
    }

    try {
      await fetch(
        `${API_URL}/conversations/${conversationId}/messages/${messageId}/delivered`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
    } catch (error) {
      console.error(
        "Failed to mark message as delivered:",
        error
      );
    }
  }

  useEffect(() => {
    async function loadCurrentUser() {
      const token = localStorage.getItem("access_token");

      if (!token) {
        window.location.href = "/auth";
        return;
      }

      try {
        const response = await fetch(`${API_URL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          localStorage.removeItem("access_token");
          localStorage.removeItem("user");

          window.location.href = "/auth";

          return;
        }

        const data = await response.json();

        setUser(data);

        await loadConversations();
      } catch {
        setUser(null);
        setConversationLoading(false);
      } finally {
        setAuthLoading(false);
      }
    }

    loadCurrentUser();
  }, []);

  useEffect(() => {
    if (!selectedChat || !user) {
      setConnectionStatus("offline");
      return;
    }

    const token = localStorage.getItem("access_token");

    if (!token) {
      setConnectionStatus("offline");
      return;
    }

    const conversationId = Number(selectedChat);

    let shouldReconnect = true;

    function connectWebSocket() {
      if (!shouldReconnect) {
        return;
      }

      setConnectionStatus("reconnecting");

      const websocket = new WebSocket(
        `${WS_URL}/ws/${conversationId}?token=${encodeURIComponent(
          token
        )}`
      );

      socketRef.current = websocket;

      websocket.onopen = () => {
        if (!shouldReconnect) {
          websocket.close();
          return;
        }

        reconnectAttemptRef.current = 0;

        setConnectionStatus("connected");
      };

      websocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === "typing") {
            if (data.user_id !== user?.id) {
              setTypingUser(data.is_typing);
            }

            return;
          }

          if (data.type === "message_read") {
            setMessages((previousMessages) =>
              previousMessages.map((message) =>
                message.id === data.message_id
                  ? { ...message, status: "READ" }
                  : message
              )
            );

            return;
          }

          if (!data.id) {
            return;
          }

          const incomingMessage: Message = {
            id: data.id,
            content: data.content,
            sender_id: data.sender_id,
            status: data.status,
            time: new Date(
              data.created_at
            ).toLocaleTimeString([], {
              hour: "numeric",
              minute: "2-digit",
            }),
          };

          setMessages((previousMessages) => {
            const optimisticIndex =
              previousMessages.findIndex(
                (message) =>
                  message.optimistic &&
                  message.sender_id ===
                    incomingMessage.sender_id &&
                  message.content ===
                    incomingMessage.content
              );

            if (optimisticIndex !== -1) {
              const updatedMessages = [
                ...previousMessages,
              ];

              updatedMessages[optimisticIndex] =
                incomingMessage;

              return updatedMessages;
            }

            const alreadyExists =
              previousMessages.some(
                (message) =>
                  message.id === incomingMessage.id
              );

            if (alreadyExists) {
              return previousMessages;
            }

            return [
              ...previousMessages,
              incomingMessage,
            ];
          });

          if (user && data.sender_id !== user.id) {
            markMessageAsDelivered(
              conversationId,
              data.id
            );

            markConversationAsRead(
              conversationId
            );

            if (
              socketRef.current?.readyState ===
              WebSocket.OPEN
            ) {
              socketRef.current.send(
                JSON.stringify({
                  type: "message_read",
                  message_id: data.id,
                })
              );
            }
          }

          loadConversations();
        } catch (error) {
          console.error(
            "Failed to process WebSocket message:",
            error
          );
        }
      };

      websocket.onclose = () => {
        if (!shouldReconnect) {
          return;
        }

        socketRef.current = null;

        setConnectionStatus("reconnecting");

        const delays = [
          1000,
          2000,
          4000,
          8000,
          15000,
        ];

        const attempt = Math.min(
          reconnectAttemptRef.current,
          delays.length - 1
        );

        const delay = delays[attempt];

        reconnectAttemptRef.current += 1;

        reconnectTimeoutRef.current = setTimeout(
          connectWebSocket,
          delay
        );
      };

      websocket.onerror = () => {
        setConnectionStatus("reconnecting");
      };
    }

    reconnectAttemptRef.current = 0;

    connectWebSocket();

    return () => {
      shouldReconnect = false;

      if (reconnectTimeoutRef.current) {
        clearTimeout(
          reconnectTimeoutRef.current
        );

        reconnectTimeoutRef.current = null;
      }

      reconnectAttemptRef.current = 0;

      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }

      setConnectionStatus("offline");
    };
  }, [selectedChat, user]);

  function sendMessage(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const content = messageText.trim();

    if (!content || !selectedChat) {
      return;
    }

    const websocket = socketRef.current;

    if (
      !websocket ||
      websocket.readyState !== WebSocket.OPEN
    ) {
      console.error(
        "WebSocket is not connected"
      );

      return;
    }

    const optimisticMessage: Message = {
      id: -Date.now(),
      content,
      sender_id: user?.id ?? 0,
      status: "SENDING",
      optimistic: true,
      time: new Date().toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
      }),
    };

    setMessages((previousMessages) => [
      ...previousMessages,
      optimisticMessage,
    ]);

    websocket.send(
      JSON.stringify({
        content,
      })
    );

    setMessageText("");
  }

  function getConnectionStatusText() {
    if (typingUser) {
      return "typing...";
    }

    if (connectionStatus === "connected") {
      return "Connected";
    }

    if (connectionStatus === "reconnecting") {
      return "Reconnecting...";
    }

    return "Offline";
  }

  function getConnectionStatusColor() {
    if (connectionStatus === "connected") {
      return "bg-[#34c759]";
    }

    if (connectionStatus === "reconnecting") {
      return "bg-[#ffcc00]";
    }

    return "bg-[#ff3b30]";
  }

  if (authLoading) {
    return (
      <main className="flex h-screen items-center justify-center bg-[#0f0f0f] text-[#8e8e93]">
        Loading...
      </main>
    );
  }

  const activeConversation = conversations.find(
    (conversation) =>
      String(conversation.id) === selectedChat
  );

  return (
    <main className="relative flex h-screen min-h-[600px] overflow-hidden bg-[#0f0f0f] font-sans text-white">

  {/* HAMBURGER BUTTON */}
  {/* HAMBURGER */}
<button
  onClick={() => setShowIconRail(!showIconRail)}
  className="absolute left-3 top-5 z-50 flex h-10 w-10 items-center justify-center rounded-xl text-[#b8b8bd] transition hover:bg-[#2b2b2e] hover:text-white"
  aria-label="Toggle sidebar"
>
  <MenuIcon />
</button>

{/* ICON RAIL */}
{showIconRail && (
  <aside className="flex w-[65px] shrink-0 flex-col items-center border-r border-[#29292b] bg-[#1c1c1e]">

    {/* Space for hamburger */}
    <div className="h-20 shrink-0" />

    <nav className="flex flex-col items-center gap-5">

      {/* CHATS */}
      <button
        className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#eeeeee] text-[#1c1c1e]"
        aria-label="Chats"
      >
        <ChatIcon />
      </button>

      {/* CALLS */}
      <button
        className="flex h-11 w-11 items-center justify-center rounded-xl text-[#b8b8bd] transition hover:bg-[#2b2b2e] hover:text-white"
        aria-label="Calls"
      >
        <PhoneIcon />
      </button>

      {/* STORIES */}
      <button
        className="relative flex h-11 w-11 items-center justify-center rounded-xl text-[#b8b8bd] transition hover:bg-[#2b2b2e] hover:text-white"
        aria-label="Stories"
      >
        <StoriesIcon />

        <span className="absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
          1
        </span>
      </button>

    </nav>

    {/* SETTINGS */}
    <button
      onClick={() => setShowSettings(true)}
      className="mt-auto mb-5 flex h-11 w-11 items-center justify-center rounded-xl text-[#b8b8bd] transition hover:bg-[#2b2b2e] hover:text-white"
      aria-label="Settings"
    >
      <SettingsIcon />
    </button>

  </aside>
)}


      {/* CHAT BUTTON WHEN ICON RAIL IS HIDDEN */}
      {!showIconRail && (
        <button
          onClick={() => setShowIconRail(true)}
          className="absolute left-3 top-5 z-30 flex h-10 w-10 items-center justify-center rounded-xl bg-[#1c1c1e] text-[#b8b8bd] transition hover:bg-[#2b2b2e] hover:text-white"
          aria-label="Chats"
        >
          <ChatIcon />
        </button>
      )}

      {/* CHAT LIST */}
      <section className="flex w-[500px] shrink-0 flex-col border-r border-[#29292b] bg-[#0f0f0f]">

        <header className="flex h-[76px] shrink-0 items-center justify-between px-6">
          <div>
            <h1 className="text-[28px] font-bold tracking-[-0.5px]">
              Chats
            </h1>

            {user && (
              <p className="mt-0.5 text-[11px] text-[#66666b]">
                Signed in as {user.display_name}
              </p>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowContacts(true)}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-[#a0a0a5] transition hover:bg-[#1c1c1e] hover:text-white"
              aria-label="New chat"
            >
              <ComposeIcon />
            </button>

            <button
              className="flex h-10 w-10 items-center justify-center rounded-xl text-[#a0a0a5] transition hover:bg-[#1c1c1e] hover:text-white"
              aria-label="More options"
            >
              <span className="mb-2 text-[24px] leading-none">
                ⋯
              </span>
            </button>
          </div>
        </header>

        <div className="flex items-center gap-3 px-5 pb-4">
          <div className="flex h-11 flex-1 items-center gap-3 rounded-xl bg-[#1c1c1e] px-4 text-[#8e8e93]">
            <SearchIcon />

            <span className="text-[15px]">
              Search
            </span>
          </div>

          <button
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[#8e8e93] transition hover:bg-[#1c1c1e] hover:text-white"
            aria-label="Filter chats"
          >
            <FilterIcon />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2">
          {conversationLoading ? (
            <div className="px-4 py-6 text-center text-sm text-[#66666b]">
              Loading conversations...
            </div>
          ) : conversations.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-[#66666b]">
              No conversations yet
            </div>
          ) : (
            conversations.map((conversation) => (
              <button
                key={conversation.id}
                onClick={() => {
                  setSelectedChat(
                    String(conversation.id)
                  );

                  loadMessages(conversation.id);

                  markConversationAsRead(
                    conversation.id
                  );
                }}
                className={`mx-1 flex w-[calc(100%-8px)] items-center gap-4 rounded-xl px-3 py-4 text-left transition ${
                  selectedChat ===
                  String(conversation.id)
                    ? "bg-[#1c1c1e]"
                    : "hover:bg-[#1c1c1e]"
                }`}
              >
                <div className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full bg-[#6c5dd3] text-lg font-bold">
                  {conversation.name
                    .charAt(0)
                    .toUpperCase()}
                </div>

                <div className="min-w-0 flex-1 self-stretch">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-1.5">
                      <p className="truncate text-[16px] font-bold text-white">
                        {conversation.name}
                      </p>

                      {conversation.type ===
                        "DIRECT" && (
                        <VerifiedIcon />
                      )}
                    </div>

                    <span className="shrink-0 text-[12px] text-[#8e8e93]">
                      {new Date(
                        conversation.updated_at
                      ).toLocaleTimeString([], {
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  <div className="mt-1 flex items-center justify-between gap-3">
                    <p className="truncate text-[14px] text-[#8e8e93]">
                      {conversation.last_message ??
                        "No messages yet"}
                    </p>

                    {conversation.unread_count >
                    0 ? (
                      <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#6c5dd3] px-1.5 text-[10px] font-bold text-white">
                        {conversation.unread_count}
                      </span>
                    ) : (
                      <span className="shrink-0 text-[#8e8e93]">
                        <CheckDoubleIcon />
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        {showPromo && (
          <div className="mx-5 mb-5 rounded-2xl border border-[#303034] bg-[#1c1c1e] p-4">
            <div className="flex gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#6c5dd3] text-[18px] font-medium text-white">
                @
              </div>

              <div className="min-w-0">
                <h2 className="text-[14px] font-bold text-white">
                  New ways to connect
                </h2>

                <p className="mt-1 text-[12px] leading-5 text-[#8e8e93]">
                  Discover new ways to stay connected
                  with the people and conversations that
                  matter to you.
                </p>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-5">
              <button
                onClick={() => setShowPromo(false)}
                className="text-[13px] font-medium text-[#a0a0a5] hover:text-white"
              >
                Dismiss
              </button>

              <button className="text-[13px] font-bold text-[#7b68ee] hover:text-[#9b8cff]">
                Learn more
              </button>
            </div>
          </div>
        )}

      </section>

      {/* MAIN PANEL */}
      <section className="relative flex min-w-0 flex-1 flex-col bg-[#121212]">

        {selectedChat === null ? (
          <div className="flex flex-1 flex-col items-center justify-center">

            <div className="flex h-[155px] w-[155px] items-center justify-center rounded-full border-[2px] border-dashed border-[#555559] text-[#eeeeee]">
              <SignalLogo />
            </div>

            <h2 className="mt-8 text-[28px] font-bold tracking-[-0.4px] text-white">
              Welcome to Signal
            </h2>

            <p className="mt-3 text-[14px] text-[#8e8e93]">
              See{" "}
              <button className="font-medium text-[#7b68ee] hover:underline">
                what&apos;s new
              </button>{" "}
              in this update
            </p>

          </div>
        ) : (
          <div className="flex flex-1 flex-col">

            <header
              onClick={() => {
                if (
                  activeConversation?.type ===
                  "GROUP"
                ) {
                  setShowGroupMembers(true);
                }
              }}
              className={`flex h-[76px] items-center border-b border-[#29292b] bg-[#0f0f0f] px-6 ${
                activeConversation?.type ===
                "GROUP"
                  ? "cursor-pointer hover:bg-[#151515]"
                  : ""
              }`}
            >

              <div className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-[#6c5dd3] text-lg font-bold">
                {activeConversation?.name
                  .charAt(0)
                  .toUpperCase()}
              </div>

              <div className="ml-3">
                <p className="text-[16px] font-bold text-white">
                  {activeConversation?.name}
                </p>

                <div className="mt-1 flex items-center gap-1.5">
                  <span
                    className={`h-2 w-2 rounded-full ${getConnectionStatusColor()}`}
                  />

                  <p className="text-[12px] text-[#8e8e93]">
                    {getConnectionStatusText()}
                  </p>
                </div>
              </div>

            </header>

            <div className="flex flex-1 flex-col justify-end gap-2 overflow-y-auto p-6">

              {messageLoading ? (
                <div className="flex flex-1 items-center justify-center text-sm text-[#66666b]">
                  Loading messages...
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-1 items-center justify-center text-sm text-[#66666b]">
                  No messages yet
                </div>
              ) : (
                messages.map((message) => {
                  const isOwnMessage =
                    message.sender_id ===
                    user?.id;

                  return (
                    <div
                      key={message.id}
                      className={`flex ${
                        isOwnMessage
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >

                      <div
                        className={`max-w-[65%] rounded-[18px] px-4 py-3 ${
                          isOwnMessage
                            ? "bg-[#6c5dd3] text-white"
                            : "bg-[#2b2b2e] text-white"
                        }`}
                      >

                        <p className="text-[14px]">
                          {message.content}
                        </p>

                        <div className="mt-1 flex items-center justify-end gap-1 text-[11px] text-white/70">

                          <span>
                            {message.time}
                          </span>

                          {isOwnMessage && (
                            <span
                              className={
                                message.status ===
                                "READ"
                                  ? "text-blue-500"
                                  : "text-white/70"
                              }
                            >
                              <CheckDoubleIcon />
                            </span>
                          )}

                        </div>

                      </div>

                    </div>
                  );
                })
              )}

            </div>

            <form
              onSubmit={sendMessage}
              className="border-t border-[#29292b] bg-[#0f0f0f] p-4"
            >

              <div className="flex items-center gap-3">

                <input
                  type="text"
                  value={messageText}
                  onChange={(event) => {
                    const value =
                      event.target.value;

                    setMessageText(value);

                    if (
                      socketRef.current
                        ?.readyState ===
                      WebSocket.OPEN
                    ) {
                      socketRef.current.send(
                        JSON.stringify({
                          type: "typing",
                          is_typing:
                            value.length > 0,
                        })
                      );
                    }
                  }}
                  placeholder="Write a message..."
                  className="flex-1 rounded-full bg-[#1c1c1e] px-5 py-3 text-sm text-white outline-none placeholder:text-[#77777d]"
                />

                <button
                  type="submit"
                  disabled={
                    !messageText.trim() ||
                    connectionStatus !==
                      "connected"
                  }
                  className={`flex h-11 w-11 items-center justify-center rounded-full text-white transition ${
                    messageText.trim() &&
                    connectionStatus ===
                      "connected"
                      ? "bg-[#6c5dd3] hover:bg-[#7b68ee]"
                      : "bg-[#303034] text-[#66666b]"
                  }`}
                  aria-label="Send message"
                >
                  ➤
                </button>

              </div>

            </form>

          </div>
        )}

        <div className="absolute bottom-5 right-6 text-[11px] text-[#66666b]">
          Signal is a 501c3 nonprofit
        </div>

        {showContacts && (
          <ContactsModal
            onClose={() => setShowContacts(false)}
            onConversationCreated={async (
              conversationId
            ) => {
              setShowContacts(false);

              await loadConversations();

              setSelectedChat(
                String(conversationId)
              );

              await loadMessages(
                conversationId
              );
            }}
          />
        )}

        {showGroupMembers &&
          activeConversation && (
            <GroupMembersModal
              conversationId={
                activeConversation.id
              }
              onClose={() =>
                setShowGroupMembers(false)
              }
            />
          )}

        {showSettings && (
          <SettingsModal
            onClose={() =>
              setShowSettings(false)
            }
          />
        )}

      </section>
    </main>
  );
}