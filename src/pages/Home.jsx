// src/pages/Home.jsx
import { useEffect, useState } from "react";
import { db, auth } from "../firebase";
import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const [animals, setAnimals] = useState([]);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  // CATEGORY LIST
  const categories = [
    { name: "cow", icon: "🐄" },
    { name: "goat", icon: "🐐" },
    { name: "sheep", icon: "🐑" },
    { name: "bull", icon: "🐂" },
    { name: "others", icon: "🐾" },
  ];

  /* ================= AUTH ================= */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      loadAnimals(u?.uid);
    });
    return () => unsub();
  }, []);

  /* ================= LOAD ANIMALS ================= */
  const loadAnimals = async (uid) => {
    const q = query(
      collection(db, "animals"),
      where("isActive", "==", true)
    );

    const data = await getDocs(q);

    let list = data.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Remove seller’s own animals
    if (uid) {
      list = list.filter((item) => item.sellerId !== uid);
    }

    setAnimals(list);
  };

  return (
    <div className="px-4 max-w-7xl mx-auto">

      {/* 🔥 CATEGORY SECTION */}
      <h2 className="text-2xl font-bold text-appDark mb-4">
        Categories
      </h2>

      <div className="grid grid-cols-3 sm:grid-cols-5 gap-4 mb-10">
        {categories.map((cat) => (
          <div
            key={cat.name}
            onClick={() => navigate(`/category/${cat.name}`)}
            className="flex flex-col items-center justify-center
              bg-white shadow-md rounded-xl p-4
              hover:scale-105 hover:shadow-xl transition cursor-pointer"
          >
            <div className="text-4xl">{cat.icon}</div>
            <p className="mt-2 font-semibold capitalize">
              {cat.name}
            </p>
          </div>
        ))}
      </div>

      {/* 🔥 LISTINGS */}
      <h2 className="text-2xl font-bold text-appDark mb-5">
        Animals for Sale
      </h2>

      {animals.length === 0 && (
        <p className="text-gray-500 text-center">
          No animals available right now.
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-10">
        {animals.map((animal) => (
          <div
            key={animal.id}
            onClick={() => {
              if (!user) {
                navigate("/auth/phone");
              } else {
                navigate(`/animal/${animal.id}`);
              }
            }}
            className="bg-white shadow-lg rounded-2xl overflow-hidden
              hover:shadow-2xl hover:-translate-y-1 transition
              cursor-pointer"
          >
            {/* IMAGE */}
            <img
              src={
                animal.images?.[0] ||
                "https://via.placeholder.com/400x300?text=No+Image"
              }
              className="w-full h-48 object-contain bg-gray-100"
              alt={animal.animalName}
            />

            {/* CONTENT */}
            <div className="p-4">
              <h3 className="text-lg font-bold capitalize">
                {animal.animalName}
              </h3>

              <p className="text-sm text-gray-600">
                {animal.subType} • Age: {animal.age}
              </p>

              {/* 🔒 PRICE HIDDEN */}
              <p className="text-sm text-gray-500 mt-2 italic">
                Price visible after seller approval
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
