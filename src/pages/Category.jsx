import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";

export default function Category() {
  const { type } = useParams(); // cow, goat, etc.
  const [animals, setAnimals] = useState([]);
  const [filtered, setFiltered] = useState([]);

  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  // Load all animals
  useEffect(() => {
    async function fetchAnimals() {
      const data = await getDocs(collection(db, "animals"));
      const list = data.docs.map((d) => ({ id: d.id, ...d.data() }));

      // Only selected category
      const filteredList =
        type === "others"
          ? list.filter(
              (a) =>
                a.type !== "cow" &&
                a.type !== "goat" &&
                a.type !== "sheep" &&
                a.type !== "bull"
            )
          : list.filter((a) => a.type === type);

      setAnimals(filteredList);
      setFiltered(filteredList);
    }

    fetchAnimals();
  }, [type]);


  // Apply Search Filter
  useEffect(() => {
    let list = animals;

    if (search.trim() !== "") {
      list = list.filter((a) =>
        (a.title || "").toLowerCase().includes(search.toLowerCase())
      );
    }

    if (location.trim() !== "") {
      list = list.filter((a) =>
        a.location.toLowerCase().includes(location.toLowerCase())
      );
    }

    if (maxPrice !== "") {
      list = list.filter((a) => Number(a.price) <= Number(maxPrice));
    }

    setFiltered(list);
  }, [search, location, maxPrice, animals]);


  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-3 capitalize">
        {type === "others" ? "Other Animals" : `${type} Listings`}
      </h1>

      {/* SEARCH FILTER BOX */}
      <div className="bg-white p-4 rounded-xl shadow-md grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">

        <input
          type="text"
          placeholder="Search by name..."
          className="border p-3 rounded-lg"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <input
          type="text"
          placeholder="Search by location..."
          className="border p-3 rounded-lg"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />

        <input
          type="number"
          placeholder="Max Price (₹)"
          className="border p-3 rounded-lg"
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
        />
      </div>

      {/* LISTINGS */}
      {filtered.length === 0 ? (
        <p className="text-gray-500 text-lg">No animals found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {filtered.map((animal) => (
            <div
              key={animal.id}
              className="bg-white rounded-2xl p-4 shadow hover:shadow-lg"
            >
              <img
                src={animal.image}
                alt=""
                className="w-full h-44 object-cover rounded-xl"
              />

              <h2 className="text-xl font-bold mt-3">{animal.title}</h2>
              <p className="text-gray-600">Location: {animal.location}</p>

              <p className="text-xl font-bold text-green-700 mt-2">
                ₹ {animal.price}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
