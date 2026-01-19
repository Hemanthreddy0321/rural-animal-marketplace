import { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import toast from "react-hot-toast";

export default function Profile() {
  const [userData, setUserData] = useState(null);
  const [edit, setEdit] = useState(false);
  const [loading, setLoading] = useState(false);

  const uid = auth.currentUser?.uid;

  useEffect(() => {
    if (!uid) return;

    const loadProfile = async () => {
      const refUser = doc(db, "users", uid);
      const snap = await getDoc(refUser);

      if (snap.exists()) {
        setUserData(snap.data());
      }
    };

    loadProfile();
  }, [uid]);

  const handleSave = async () => {
    try {
      setLoading(true);

      await updateDoc(doc(db, "users", uid), {
        name: userData.name,
        address: userData.address,
        district: userData.district,
      });

      toast.success("Profile updated successfully");
      setEdit(false);
    } catch (err) {
      toast.error("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  if (!userData) return <p className="p-6">Loading...</p>;

  return (
    <div className="p-6 max-w-lg mx-auto mt-20">
      <div className="bg-white shadow-xl rounded-2xl p-6">

        {/* HEADER */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-appDark">
              Profile
          </h1>

          {!edit && (
            <button
              onClick={() => setEdit(true)}
              className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg"
              title="Edit profile"
            >
              ✏️
            </button>
          )}
        </div>

        {/* NAME */}
        <label className="font-semibold text-gray-700">Name</label>
        <input
          disabled={!edit}
          value={userData.name}
          onChange={(e) =>
            setUserData({ ...userData, name: e.target.value })
          }
          className={`border p-3 w-full rounded-lg mb-4 ${
            !edit ? "bg-gray-100" : ""
          }`}
        />

        {/* PHONE */}
        <label className="font-semibold text-gray-700">
          Phone (not editable)
        </label>
        <input
          disabled
          value={userData.phone}
          className="border p-3 w-full rounded-lg mb-4 bg-gray-100"
        />

        {/* ADDRESS */}
        <label className="font-semibold text-gray-700">Address</label>
        <input
          disabled={!edit}
          value={userData.address}
          onChange={(e) =>
            setUserData({ ...userData, address: e.target.value })
          }
          className={`border p-3 w-full rounded-lg mb-4 ${
            !edit ? "bg-gray-100" : ""
          }`}
        />

        {/* DISTRICT */}
        <label className="font-semibold text-gray-700">District</label>
        <input
          disabled={!edit}
          value={userData.district}
          onChange={(e) =>
            setUserData({ ...userData, district: e.target.value })
          }
          className={`border p-3 w-full rounded-lg mb-6 ${
            !edit ? "bg-gray-100" : ""
          }`}
        />

        {/* ACTION BUTTONS */}
        {edit && (
          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={loading}
              className="bg-green-600 text-white w-full py-3 rounded-lg font-semibold"
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>

            <button
              onClick={() => setEdit(false)}
              disabled={loading}
              className="bg-gray-200 w-full py-3 rounded-lg font-semibold"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
