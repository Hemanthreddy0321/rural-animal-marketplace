import { useEffect, useRef, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import {
  collection,
  addDoc,
  serverTimestamp,
  orderBy,
  onSnapshot,
  doc,
  setDoc,
  updateDoc,
  getDoc,
  query,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export default function Chat() {
  const [params] = useSearchParams();
  const animalId = params.get("animalId");
  const sellerId = params.get("sellerId");

  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [userReady, setUserReady] = useState(false);
  const [chatReady, setChatReady] = useState(false);

  const buyerId = user?.uid;

  // ✅ FIXED chatId (NO SORT)
  const chatId =
    animalId && buyerId && sellerId
      ? `${animalId}_${buyerId}_${sellerId}`
      : null;

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  const bottomRef = useRef(null);

  /* 🔒 AUTH */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) navigate("/auth/phone");
      else {
        setUser(u);
        setUserReady(true);
      }
    });
    return () => unsub();
  }, [navigate]);

  /* 🔹 CREATE CHAT */
  useEffect(() => {
    if (!userReady || !chatId || !buyerId || !sellerId) return;

    const initChat = async () => {
      const chatRef = doc(db, "chats", chatId);
      const snap = await getDoc(chatRef);

      if (!snap.exists()) {
        await setDoc(chatRef, {
          animalId,
          buyerId,
          sellerId,
          participants: [buyerId, sellerId],
          lastMessage: "",
          lastUpdated: serverTimestamp(),
          seenBy: {
            [buyerId]: true,
            [sellerId]: false,
          },
          createdAt: serverTimestamp(),
        });
      }

      setChatReady(true);
    };

    initChat();
  }, [userReady, chatId, animalId, buyerId, sellerId]);

  /* 🔹 REAL-TIME MESSAGES */
  useEffect(() => {
    if (!chatReady || !chatId) return;

    const q = query(
      collection(db, "chats", chatId, "messages"),
      orderBy("createdAt", "asc")
    );

    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    return () => unsub();
  }, [chatReady, chatId]);

  /* 🔹 AUTO SCROLL */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* 👁️ MARK SEEN (SAFE) */
  useEffect(() => {
    if (!chatReady || !chatId || !user) return;

    const markSeen = async () => {
      try {
        await updateDoc(doc(db, "chats", chatId), {
          [`seenBy.${user.uid}`]: true,
        });
      } catch {}
    };

    markSeen();
  }, [chatReady, chatId, user]);

  /* 📤 SEND MESSAGE */
  const sendMessage = async () => {
    if (!text.trim() || !chatReady || !chatId || !user) return;

    const receiverId =
      user.uid === buyerId ? sellerId : buyerId;

    await addDoc(collection(db, "chats", chatId, "messages"), {
      senderId: user.uid,
      text: text.trim(),
      createdAt: serverTimestamp(),
    });

    await updateDoc(doc(db, "chats", chatId), {
      lastMessage: text.trim(),
      lastUpdated: serverTimestamp(),
      [`seenBy.${user.uid}`]: true,
      [`seenBy.${receiverId}`]: false,
    });

    setText("");
  };

  return (
    <div className="p-6 mt-20 max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Chat</h2>

      <div className="bg-white rounded-xl shadow p-4 h-[65vh] flex flex-col">
        <div className="flex-1 overflow-y-auto space-y-2">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`max-w-[75%] px-3 py-2 rounded-lg ${
                m.senderId === user.uid
                  ? "ml-auto bg-green-600 text-white"
                  : "bg-gray-200"
              }`}
            >
              {m.text}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        <div className="flex gap-2 mt-3">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="border p-3 rounded flex-1"
            placeholder="Type a message..."
          />
          <button
            onClick={sendMessage}
            className="bg-green-600 text-white px-6 rounded"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
