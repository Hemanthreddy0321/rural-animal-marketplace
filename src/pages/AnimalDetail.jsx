import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db, auth } from "../firebase";
import {
  doc,
  getDoc,
  addDoc,
  collection,
  serverTimestamp,
  query,
  where,
  getDocs,
  updateDoc,
} from "firebase/firestore";

export default function AnimalDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [animal, setAnimal] = useState(null);
  const [seller, setSeller] = useState(null);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);

  const [requestStatus, setRequestStatus] = useState(null);
  const [requestId, setRequestId] = useState(null);

  // 🖼️ GALLERY
  const [activeIndex, setActiveIndex] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);

  const user = auth.currentUser;

  /* ================= LOAD ANIMAL ================= */
  useEffect(() => {
    const loadAnimal = async () => {
      const snap = await getDoc(doc(db, "animals", id));
      if (snap.exists()) {
        const data = { id: snap.id, ...snap.data() };
        setAnimal(data);

        // 🔹 LOAD SELLER INFO
        if (data.sellerId) {
          const sellerSnap = await getDoc(
            doc(db, "users", data.sellerId)
          );
          if (sellerSnap.exists()) {
            setSeller(sellerSnap.data());
          }
        }
      }
      setLoading(false);
    };
    loadAnimal();
  }, [id]);

  /* ================= CHECK REQUEST ================= */
  useEffect(() => {
    if (!user) {
      setRequestStatus(null);
      setRequestId(null);
      return;
    }

    const checkRequest = async () => {
      const q = query(
        collection(db, "requests"),
        where("animalId", "==", id),
        where("buyerId", "==", user.uid)
      );

      const snap = await getDocs(q);

      if (snap.empty) {
        setRequestStatus(null);
        setRequestId(null);
      } else {
        setRequestStatus(snap.docs[0].data().status);
        setRequestId(snap.docs[0].id);
      }
    };

    checkRequest();
  }, [user, id]);

  /* ================= SEND REQUEST ================= */
  const sendRequest = async () => {
    if (!user) return navigate("/auth/phone");

    try {
      setRequesting(true);
      const ref = await addDoc(collection(db, "requests"), {
        animalId: id,
        sellerId: animal.sellerId,
        buyerId: user.uid,
        status: "pending",
        createdAt: serverTimestamp(),
      });

      setRequestStatus("pending");
      setRequestId(ref.id);
    } catch {
      alert("Failed to send request");
    } finally {
      setRequesting(false);
    }
  };

  /* ================= CANCEL REQUEST ================= */
  const cancelRequest = async () => {
    if (!requestId) return;
    await updateDoc(doc(db, "requests", requestId), {
      status: "cancelled",
    });
    setRequestStatus(null);
    setRequestId(null);
  };

  /* ================= CHAT ================= */
  const openChat = () => {
    navigate(`/chat?animalId=${id}&sellerId=${animal.sellerId}`);
  };

  if (loading) return <p className="p-6">Loading...</p>;
  if (!animal) return <p className="p-6">Animal not found</p>;

  // 🔹 COMBINE IMAGES + VIDEO
  const media = [
    ...(animal.images || []),
    ...(animal.videoUrl ? [animal.videoUrl] : []),
  ];

  const isVideo = animal.videoUrl && activeIndex === media.length - 1;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="bg-white shadow rounded-xl overflow-hidden">

        {/* 🔍 FULLSCREEN ZOOM */}
        {zoomOpen && !isVideo && (
          <div
            className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50"
            onClick={() => setZoomOpen(false)}
          >
            <img
              src={media[activeIndex]}
              className="max-h-[90vh] max-w-[90vw] rounded"
              alt="zoom"
            />
          </div>
        )}

        {/* 🖼️ MAIN VIEW */}
        <div
          className="bg-gray-100 flex items-center justify-center cursor-pointer"
          onClick={() => !isVideo && setZoomOpen(true)}
        >
          {!isVideo ? (
            <img
              src={media[activeIndex]}
              className="h-96 object-contain"
              alt="animal"
            />
          ) : (
            <video
              src={media[activeIndex]}
              controls
              className="h-96"
            />
          )}
        </div>

        {/* 🖼️ THUMBNAILS */}
        {media.length > 1 && (
          <div className="flex gap-2 p-3 overflow-x-auto">
            {media.map((m, i) => (
              <div
                key={i}
                onClick={() => setActiveIndex(i)}
                className={`border-2 rounded cursor-pointer ${
                  i === activeIndex
                    ? "border-green-600"
                    : "border-transparent"
                }`}
              >
                {m.includes("video") ? (
                  <div className="w-20 h-20 bg-black flex items-center justify-center text-white">
                    ▶
                  </div>
                ) : (
                  <img
                    src={m}
                    className="w-20 h-20 object-cover"
                    alt="thumb"
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {/* 📄 DETAILS */}
        <div className="p-4">
          <h1 className="text-2xl font-bold capitalize">
            {animal.animalName}
          </h1>

          {/* ✅ SELLER NAME */}
          {seller && (
            <p className="text-sm text-gray-600 mt-1">
              Seller: <b>{seller.name || "Seller"}</b>
            </p>
          )}

          {/* ✅ BREED + AGE */}
          <p className="text-gray-600 mt-1">
            {animal.subType || "Breed not specified"}
            {" • "}
            Age: {animal.age ?? "Not specified"} years
          </p>

          {/* ✅ DESCRIPTION */}
          {animal.description && (
            <p className="text-gray-700 mt-3 leading-relaxed">
              {animal.description}
            </p>
          )}

          {/* 🔒 PRICE */}
          {requestStatus === "accepted" ? (
            <p className="text-green-700 font-semibold mt-4 text-xl">
              ₹ {animal.price}
            </p>
          ) : (
            <p className="text-gray-500 mt-4 italic">
              Price visible after request is accepted
            </p>
          )}

          {/* 🔘 ACTIONS */}
          <div className="flex gap-3 mt-6 flex-wrap">
            {requestStatus === null && (
              <button
                onClick={sendRequest}
                disabled={requesting}
                className="bg-green-600 text-white px-4 py-2 rounded"
              >
                {requesting ? "Sending..." : "Request Contact"}
              </button>
            )}

            {requestStatus === "pending" && (
              <>
                <button
                  disabled
                  className="bg-gray-400 text-white px-4 py-2 rounded"
                >
                  Request Pending
                </button>
                <button
                  onClick={cancelRequest}
                  className="bg-red-500 text-white px-4 py-2 rounded"
                >
                  Cancel Request
                </button>
              </>
            )}

            {requestStatus === "accepted" && (
              <>
                <button
                  disabled
                  className="bg-green-100 text-green-800 px-4 py-2 rounded border border-green-600"
                >
                  Accepted
                </button>
                <button
                  onClick={openChat}
                  className="bg-blue-600 text-white px-4 py-2 rounded"
                >
                  💬 Chat with Seller
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
