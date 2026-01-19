import { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  getDoc,
  deleteDoc,
  onSnapshot,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

export default function Requests() {
  const [sentRequests, setSentRequests] = useState([]);
  const [receivedRequests, setReceivedRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chats, setChats] = useState([]);

  /* ================= AUTH ================= */
  useEffect(() => {
    let unsubChats;

    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        window.location.href = "/auth/phone";
        return;
      }
      loadRequests(user.uid);
      unsubChats = listenChats(user.uid);
    });

    return () => {
      unsubAuth();
      if (unsubChats) unsubChats();
    };
  }, []);

  /* ================= LOAD REQUESTS ================= */
  const loadRequests = async (uid) => {
    setLoading(true);

    const buyerQ = query(
      collection(db, "requests"),
      where("buyerId", "==", uid)
    );

    const sellerQ = query(
      collection(db, "requests"),
      where("sellerId", "==", uid)
    );

    const [buyerSnap, sellerSnap] = await Promise.all([
      getDocs(buyerQ),
      getDocs(sellerQ),
    ]);

    const enrich = async (snap) =>
      Promise.all(
        snap.docs.map(async (r) => {
          const data = r.data();

          const animalSnap = await getDoc(
            doc(db, "animals", data.animalId)
          );

          const buyerSnap = await getDoc(
            doc(db, "users", data.buyerId)
          );

          const sellerSnap = await getDoc(
            doc(db, "users", data.sellerId)
          );

          return {
            id: r.id,
            ...data,
            animal: animalSnap.exists()
              ? { id: animalSnap.id, ...animalSnap.data() }
              : null,

            buyerName: buyerSnap.exists()
              ? buyerSnap.data().name
              : "Buyer",
            buyerPhone: buyerSnap.exists()
              ? buyerSnap.data().phone
              : null,

            sellerName: sellerSnap.exists()
              ? sellerSnap.data().name
              : "Seller",
            sellerPhone: sellerSnap.exists()
              ? sellerSnap.data().phone
              : null,
          };
        })
      );

    setSentRequests(await enrich(buyerSnap));
    setReceivedRequests(await enrich(sellerSnap));
    setLoading(false);
  };

  /* ================= CHAT LISTENER ================= */
  const listenChats = (uid) => {
    const q = query(
      collection(db, "chats"),
      where("participants", "array-contains", uid)
    );

    return onSnapshot(q, (snap) => {
      setChats(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  };

  /* ================= ACTIONS ================= */
  const acceptRequest = async (id) => {
    await updateDoc(doc(db, "requests", id), { status: "accepted" });
    toast.success("Request accepted");
    loadRequests(auth.currentUser.uid);
  };

  const rejectRequest = async (id) => {
    await updateDoc(doc(db, "requests", id), { status: "rejected" });
    toast.error("Request rejected");
    loadRequests(auth.currentUser.uid);
  };

  const cancelRequest = async (id) => {
    await updateDoc(doc(db, "requests", id), { status: "cancelled" });
    toast.success("Request cancelled");
    loadRequests(auth.currentUser.uid);
  };

  const deleteRequest = async (id) => {
    await deleteDoc(doc(db, "requests", id));
    toast.success("Deleted from history");
    loadRequests(auth.currentUser.uid);
  };

  if (loading) return <p className="p-6">Loading...</p>;

  /* ================= CARD ================= */
  const RequestCard = ({ req, type }) => {
    const uid = auth.currentUser.uid;

    const chat = chats.find(
      (c) =>
        c.animalId === req.animalId &&
        c.participants?.includes(uid)
    );

    const hasUnread = chat && chat.seenBy?.[uid] === false;

    return (
      <div className="bg-white shadow rounded-xl p-4 mb-4 flex gap-4">
        <img
          src={req.animal?.images?.[0]}
          onClick={() =>
            (window.location.href = `/animal/${req.animal.id}`)
          }
          className="w-28 h-28 object-contain bg-gray-100 rounded cursor-pointer"
          alt="animal"
        />

        <div className="flex-1">
          <h2 className="text-lg font-bold">
            {req.animal?.animalName} ({req.animal?.subType})
          </h2>

          {/* 👤 NAMES ALWAYS VISIBLE */}
          <p className="text-sm text-gray-700">
            {type === "received" ? (
              <>Buyer: <b>{req.buyerName}</b></>
            ) : (
              <>Seller: <b>{req.sellerName}</b></>
            )}
          </p>

          <p className="text-gray-600">
            Age: {req.animal?.age} years
          </p>

          {/* 🔒 PRICE */}
          {req.status === "accepted" ? (
            <p className="text-green-700 font-semibold">
              ₹ {req.animal?.price}
            </p>
          ) : (
            <p className="text-gray-500 italic">
              Price visible after acceptance
            </p>
          )}

          <p className="mt-1 font-semibold">
            Status: {req.status}
          </p>

          {/* SELLER ACTIONS */}
          {type === "received" && req.status === "pending" && (
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => acceptRequest(req.id)}
                className="bg-green-600 text-white px-4 py-1 rounded"
              >
                Accept
              </button>
              <button
                onClick={() => rejectRequest(req.id)}
                className="bg-red-600 text-white px-4 py-1 rounded"
              >
                Reject
              </button>
            </div>
          )}

          {/* BUYER ACTION */}
          {type === "sent" && req.status === "pending" && (
            <button
              onClick={() => cancelRequest(req.id)}
              className="mt-2 bg-gray-200 px-3 py-1 rounded"
            >
              ❌ Cancel Request
            </button>
          )}

          {/* 📞 + 💬 AFTER ACCEPT */}
          {req.status === "accepted" && (
            <div className="flex gap-4 mt-3 items-center">
              <a
                href={`tel:${
                  type === "received"
                    ? req.buyerPhone
                    : req.sellerPhone
                }`}
                className="text-green-700 font-semibold flex items-center gap-1"
              >
                📞{" "}
                {type === "received"
                  ? req.buyerPhone
                  : req.sellerPhone}
              </a>

              <Link
                to={`/chat?animalId=${req.animalId}&sellerId=${req.sellerId}`}
                className="relative text-blue-600 font-semibold flex items-center gap-1"
              >
                💬 Chat
                {hasUnread && (
                  <span className="absolute -top-1 -right-2 w-2 h-2 bg-red-600 rounded-full" />
                )}
              </Link>
            </div>
          )}

          {req.status !== "pending" && (
            <button
              onClick={() => deleteRequest(req.id)}
              className="mt-2 text-red-600"
            >
              🗑️
            </button>
          )}
        </div>
      </div>
    );
  };

  /* ================= UI ================= */
  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">
        My Requests
      </h1>

      <h2 className="text-xl font-bold mb-3">
        Requests You Sent
      </h2>
      {sentRequests.map((r) => (
        <RequestCard key={r.id} req={r} type="sent" />
      ))}

      <h2 className="text-xl font-bold mt-8 mb-3">
        Requests You Received
      </h2>
      {receivedRequests.map((r) => (
        <RequestCard key={r.id} req={r} type="received" />
      ))}
    </div>
  );
}
