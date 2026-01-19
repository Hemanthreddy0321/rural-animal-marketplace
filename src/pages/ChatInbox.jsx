import { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  getDoc,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";

export default function ChatInbox() {
  const [chats, setChats] = useState([]);
  const [uid, setUid] = useState(null);
  const navigate = useNavigate();

  /* =========================
     WAIT FOR AUTH
  ========================== */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) {
        setChats([]);
        setUid(null);
        return;
      }
      setUid(user.uid);
    });

    return () => unsub();
  }, []);

  /* =========================
     REAL-TIME CHAT LISTENER
  ========================== */
  useEffect(() => {
    if (!uid) return;

    const q = query(
      collection(db, "chats"),
      where("participants", "array-contains", uid)
    );

    const unsub = onSnapshot(q, async (snap) => {
      const list = await Promise.all(
        snap.docs.map(async (d) => {
          const data = d.data();

          let animal = null;
          if (data.animalId) {
            const animalSnap = await getDoc(
              doc(db, "animals", data.animalId)
            );
            if (animalSnap.exists()) {
              animal = animalSnap.data();
            }
          }

          return {
            id: d.id,
            ...data,
            animal,
          };
        })
      );

      // SAFE SORT
      list.sort(
        (a, b) =>
          (b.lastUpdated?.toMillis?.() || 0) -
          (a.lastUpdated?.toMillis?.() || 0)
      );

      setChats(list);
    });

    return () => unsub();
  }, [uid]);

  return (
    <div className="p-6 mt-20 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Chats</h1>

      {chats.length === 0 && (
        <p className="text-gray-500">No chats yet</p>
      )}

      {chats.map((chat) => {
        const unread =
          chat.seenBy && chat.seenBy[uid] === false;

        return (
          <div
            key={chat.id}
            onClick={() =>
              navigate(
                `/chat?animalId=${chat.animalId}&sellerId=${chat.sellerId}`
              )
            }
            className="flex items-center gap-4 p-4 bg-white rounded-xl shadow mb-4 cursor-pointer hover:bg-gray-50"
          >
            {/* IMAGE (FIXED) */}
            <img
              src={
                chat.animal?.images?.[0] ||
                "/no-image.png"
              }
              alt="animal"
              className="w-16 h-16 object-cover rounded-lg"
            />

            {/* TEXT */}
            <div className="flex-1">
              <h2 className="font-bold capitalize">
                {chat.animal?.animalName || "Animal"}
              </h2>

              <p className="text-gray-600 truncate">
                {chat.lastMessage || "Start chatting"}
              </p>
            </div>

            {/* UNREAD DOT */}
            {unread && (
              <span className="w-3 h-3 bg-red-600 rounded-full"></span>
            )}
          </div>
        );
      })}
    </div>
  );
}
