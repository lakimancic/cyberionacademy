import { useEffect, useRef, useState } from "react";
import { TbMessages } from "react-icons/tb";
import { FiSend } from "react-icons/fi";
import catIcons from "@/utils/categories";
import api from "@/lib/api";
import { format } from "date-fns";
import { Link, useParams } from "react-router-dom";
import AutoGrowTextarea from "@/components/AutoGrowTextarea/AutoGrowTextarea";
import { IoSend } from "react-icons/io5";
import * as signalR from "@microsoft/signalr";
import { Avatar } from "@mui/material";
import AuthImage from "@/components/AuthImage/AuthImage";
import "./Support.css";
import { useAuth } from "@/contexts/AuthProvider";
import { getInfoFromToken } from "@/lib/jwt";

type ConversationData = {
  id: number;
  title: string;
  type: string;
  objId: number;
  category: {
    id: number;
    name: string;
    shortForm: string;
  };
  lastMessage: string;
  lastSender: string;
};

type ConvRequest = {
  message: string;
  challengeId?: number;
  lessonId?: number;
};

type MessageData = {
  senderUsername: string;
  senderId: number;
  senderRole: string;
  content: string;
  sentAt: string;
};

type Props = {
  isNew: boolean;
  isSupport: boolean;
};

function Support({ isNew, isSupport }: Props) {
  const [convPage, setConvPage] = useState(1);
  const [msgPage, setMsgPage] = useState(1);
  const [currentConv, setCurrentConv] = useState<ConversationData | null>(null);
  const [conversations, setConversations] = useState<ConversationData[]>([]);
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [totalConvPages, setTotalConvPages] = useState(1);
  const [totalMsgPages, setTotalMsgPages] = useState(1);
  const [msgInput, setMsgInput] = useState("");
  const [tab, setTab] = useState(0);
  const [newConv, setNewConv] = useState<number | null>(null);
  const [disabled, setDisabled] = useState(false);
  const connectionRef = useRef<signalR.HubConnection | null>(null);
  const auth = useAuth();
  const params = useParams();

  const tokenData = getInfoFromToken(auth?.token ?? null);

  const fetchConversations = async (closed: boolean, page: number) => {
    await api
      .get("/Support/Conversations", {
        params: { page: page, closed: closed, forUser: !isSupport },
      })
      .then((resp) => {
        setTotalConvPages(resp.data.totalPages);
        setConversations([
          ...(page > 1 ? conversations : []),
          ...resp.data.conversations,
        ]);
      })
      .catch(() => {});
  };

  const fetchMessages = async (convId: number, page: number) => {
    await api
      .get("/Support/Messages", {
        params: { page: page, conversationId: convId },
      })
      .then((resp) => {
        setTotalMsgPages(resp.data.totalPages);
        setMessages([...(page > 1 ? messages : []), ...resp.data.messages]);
      });
  };

  const loadMoreMessages = () => {
    if (!currentConv) return;

    fetchMessages(currentConv.id, msgPage + 1);
    setMsgPage(msgPage + 1);
  };

  const loadMoreConversations = () => {
    fetchConversations(tab === 1, convPage + 1);
    setConvPage(convPage + 1);
  };

  const changeTab = (newTab: number) => {
    setTab(newTab);
    fetchConversations(newTab === 1, 1);
    setConvPage(1);
  };

  const endConversation = async () => {
    if (!currentConv || disabled) return;

    await api
      .put("/Support/CloseConversation", { conversationId: currentConv.id })
      .then(() => {})
      .catch(() => {});
    setCurrentConv(null);
    await fetchConversations(tab === 1, 1);
    setConvPage(1);
  };

  const handleConvClick = async (conv: ConversationData) => {
    if (currentConv && conv.id === currentConv.id) return;

    setMsgPage(1);
    if (currentConv && connectionRef.current) {
      await connectionRef.current.send("LeaveConversation", currentConv.id);
    }
    await fetchMessages(conv.id, 1);
    if (connectionRef.current && tab === 0) {
      await connectionRef.current.send("JoinConversation", conv.id);
    }
    setCurrentConv(conv);
    setDisabled(tab === 1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const sendMessage = async () => {
    if (msgInput.trim().length == 0 || disabled) return;
    setMsgInput("");

    if (!currentConv) {
      if (!isNew || !params.type || !params.id) return;

      const intId = parseInt(params.id);
      const data: ConvRequest = { message: msgInput.trim() };

      if (params.type === "challenge") data.challengeId = intId;
      else data.lessonId = intId;

      await api
        .post("/Support/CreateConversation", data)
        .then((resp) => {
          setNewConv(resp.data.conversationId);
        })
        .catch(() => {});

      setConversations([]);
      setTab(0);
      fetchConversations(false, 1);
      setConvPage(1);

      return;
    }

    if (connectionRef.current)
      await connectionRef.current.send(
        "SendMessage",
        currentConv.id,
        msgInput.trim()
      );
  };

  useEffect(() => {
    fetchConversations(false, 1);
    setConvPage(1);

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${import.meta.env.VITE_BACKEND_URL}/chathub`, {
        accessTokenFactory: () => auth?.token || "",
      })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Information)
      .build();

    connection.on("ReceiveMessage", (message: MessageData) => {
      setMessages((prev) => [message, ...prev]);
    });

    connection
      .start()
      .then(() => {
        connectionRef.current = connection;
      })
      .catch((err) => console.error(err));

    return () => {
      connection.stop();
    };
  }, [params.id]);

  useEffect(() => {
    if (!currentConv && newConv) {
      const ind = conversations.findIndex((conv) => conv.id === newConv);

      if (ind !== -1) handleConvClick(conversations[ind]);
    }
  }, [conversations]);

  return (
    <div className="support">
      <div className="support-left">
        <div className="support-tabs">
          <div className="support-tab" onClick={() => changeTab(0)}>
            Active
          </div>
          <div className="support-tab" onClick={() => changeTab(1)}>
            Closed
          </div>
          <div
            className="support-tab-active"
            style={{ left: `${tab * 50}%` }}
          ></div>
        </div>
        <div className="support-list">
          {conversations.map((conv, ind) => (
            <div
              key={`conv-${ind}`}
              className={`support-item ${
                conv.id === currentConv?.id ? "support-active-item" : ""
              }`}
              onClick={() => handleConvClick(conv)}
            >
              <img src={(catIcons as any)[conv.category.shortForm] ?? ""} />
              <div className="support-subitem">
                <h2>
                  {conv.type}: <strong>{conv.title}</strong> <i>#{conv.id}</i>
                </h2>
                <p>
                  {conv.lastSender}: {conv.lastMessage.substring(0, 30)}
                  {conv.lastMessage.length > 30 ? "..." : ""}
                </p>
              </div>
            </div>
          ))}
          {totalConvPages > convPage && (
            <div className="support-load-more" onClick={loadMoreConversations}>
              LOAD MORE
            </div>
          )}
        </div>
      </div>
      <div className="support-right">
        {!currentConv && (
          <div className="support-info">
            {isNew ? <FiSend /> : <TbMessages />}
            <h2>
              {isNew
                ? "Send message to start conversation"
                : "Choose conversation from left menu"}
            </h2>
          </div>
        )}
        {currentConv && (
          <div className="support-header">
            <img
              src={(catIcons as any)[currentConv.category.shortForm] ?? ""}
            />
            <div className="support-subheader">
              <Link
                to={`/${currentConv.type.toLowerCase()}s/${currentConv.objId}`}
              >
                <h2>
                  {currentConv.type.at(0)?.toUpperCase() +
                    currentConv.type.slice(1)}
                  :<strong> {currentConv.title}</strong>{" "}
                  <i>#{currentConv.id}</i>
                </h2>
              </Link>
              <p>{currentConv.category.name}</p>
            </div>
            {!disabled && (
              <div className="support-end" onClick={() => endConversation()}>
                END
              </div>
            )}
          </div>
        )}
        <div className="support-content">
          {(currentConv || isNew) && (
            <div
              className={`support-input-con ${
                disabled ? "support-disabled" : ""
              }`}
            >
              <AutoGrowTextarea
                value={msgInput}
                onChange={(e) => setMsgInput(e.target.value)}
                className="support-input"
                placeholder="Write a message..."
                onKeyDown={handleKeyDown}
                disabled={disabled}
              />
              <IoSend onClick={() => sendMessage()} />
            </div>
          )}
          {currentConv && (
            <div className="support-messages">
              {messages.map((msg, ind) => (
                <div
                  key={`msg-${ind}`}
                  className={`support-message ${
                    tokenData?.userId === msg.senderId
                      ? "support-message-right"
                      : ""
                  }`}
                >
                  <Link to={`/user/${msg.senderId}`}>
                    <AuthImage
                      src={`/user/${msg.senderId}/ProfilePicture`}
                      element={Avatar}
                    />
                  </Link>
                  <div className="support-message-data">
                    <div className="support-message-sender">
                      <Link to={`/user/${msg.senderId}`}>
                        <div className="support-name">
                          <span
                            className={`role-${msg.senderRole.toLocaleLowerCase()}`}
                          >
                            {msg.senderRole !== "User" ? msg.senderRole : ""}
                          </span>
                          {msg.senderUsername}
                        </div>
                      </Link>
                      <div className="support-date">
                        {format(new Date(msg.sentAt), "dd/MM/yyyy HH:mm:ss")}
                      </div>
                    </div>
                    <div className="support-message-content">{msg.content}</div>
                  </div>
                </div>
              ))}
              {totalMsgPages > msgPage && (
                <div className="support-load-more" onClick={loadMoreMessages}>
                  LOAD MORE
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Support;
