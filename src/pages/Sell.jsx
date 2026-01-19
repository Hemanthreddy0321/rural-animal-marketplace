import { useState, useEffect, useCallback } from "react";
import { db, storage, auth } from "../firebase";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  getDoc,
  query,
  where,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import toast from "react-hot-toast";

export default function Sell() {
  const uid = auth.currentUser?.uid;

  const [showModal, setShowModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  // PREVIEW MODAL
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewSlides, setPreviewSlides] = useState([]);
  const [previewIndex, setPreviewIndex] = useState(0);

  // FORM
  const [animalName, setAnimalName] = useState("");
  const [animalSubType, setAnimalSubType] = useState("");
  const [price, setPrice] = useState("");
  const [age, setAge] = useState("");
  const [description, setDescription] = useState("");

  const [images, setImages] = useState([]);
  const [video, setVideo] = useState(null);

  const [uploading, setUploading] = useState(false);
  const [contact, setContact] = useState("");
  const [listings, setListings] = useState([]);

  const [slideIndex, setSlideIndex] = useState({});

  /* ================= LOAD PHONE ================= */
  useEffect(() => {
    if (!uid) return;
    getDoc(doc(db, "users", uid)).then((snap) => {
      if (snap.exists()) setContact(snap.data().phone);
    });
  }, [uid]);

  /* ================= LOAD LISTINGS ================= */
  const loadListings = useCallback(async () => {
    if (!uid) return;
    const q = query(collection(db, "animals"), where("sellerId", "==", uid));
    const snap = await getDocs(q);
    setListings(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  }, [uid]);

  useEffect(() => {
    loadListings();
  }, [loadListings]);

  /* ================= IMAGE COMPRESSION ================= */
  const compressImage = (file) =>
    new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target.result;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX = 800;
          let { width, height } = img;
          if (width > MAX) {
            height = (MAX / width) * height;
            width = MAX;
          }
          canvas.width = width;
          canvas.height = height;
          canvas.getContext("2d").drawImage(img, 0, 0, width, height);
          canvas.toBlob((b) => resolve(b), "image/jpeg", 0.7);
        };
      };
      reader.readAsDataURL(file);
    });

  /* ================= RESET FORM ================= */
  const resetForm = () => {
    setShowModal(false);
    setAnimalName("");
    setAnimalSubType("");
    setPrice("");
    setAge("");
    setDescription("");
    setImages([]);
    setVideo(null);
  };

  /* ================= SUBMIT ================= */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (images.length < 4 || images.length > 6) {
      toast.error("Add 4 to 6 images");
      return;
    }

    if (video && video.size > 30 * 1024 * 1024) {
      toast.error("Video must be under 30MB");
      return;
    }

    setUploading(true);

    try {
      const imageUrls = [];
      for (const file of images) {
        const compressed = await compressImage(file);
        const imgRef = ref(
          storage,
          `animals/${uid}/images/${Date.now()}-${file.name}`
        );
        await uploadBytes(imgRef, compressed);
        imageUrls.push(await getDownloadURL(imgRef));
      }

      let videoUrl = null;
      if (video) {
        const videoRef = ref(
          storage,
          `animals/${uid}/videos/${Date.now()}-${video.name}`
        );
        await uploadBytes(videoRef, video);
        videoUrl = await getDownloadURL(videoRef);
      }

      await addDoc(collection(db, "animals"), {
        sellerId: uid,
        animalName,
        subType: animalSubType,
        price: Number(price),
        age,
        description,
        contactNumber: contact,
        images: imageUrls,
        videoUrl,
        isActive: true,
        createdAt: serverTimestamp(),
      });

      toast.success("Animal added");
      resetForm();
      loadListings();
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  /* ================= DELETE ================= */
  const confirmDelete = async () => {
    await deleteDoc(doc(db, "animals", deleteId));
    toast.success("Deleted");
    setDeleteId(null);
    loadListings();
  };

  /* ================= UI ================= */
  return (
    <div className="p-6">
      <button
        onClick={() => setShowModal(true)}
        className="bg-green-600 text-white px-6 py-3 rounded mb-6"
      >
        + Add Animal
      </button>

      <h2 className="text-xl font-bold mb-3">Your Listings</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 mb-10">
        {listings.map((item) => {
          const slides = [
            ...(item.images || []),
            ...(item.videoUrl ? [item.videoUrl] : []),
          ];
          const current = slideIndex[item.id] || 0;
          const isVideo =
            item.videoUrl && current === slides.length - 1;

          return (
            <div key={item.id} className="bg-white shadow rounded-xl p-3">
              {/* SLIDER */}
              <div
                className="relative cursor-pointer"
                onClick={() => {
                  setPreviewSlides(slides);
                  setPreviewIndex(current);
                  setPreviewOpen(true);
                }}
              >
                {!isVideo ? (
                  <img
                    src={slides[current]}
                    className="h-44 w-full object-contain bg-gray-100 rounded"
                    alt=""
                  />
                ) : (
                  <video
                    src={slides[current]}
                    className="h-44 w-full bg-black rounded"
                  />
                )}

                {slides.length > 1 && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSlideIndex((p) => ({
                          ...p,
                          [item.id]:
                            current === 0
                              ? slides.length - 1
                              : current - 1,
                        }));
                      }}
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/60 text-white px-2 rounded"
                    >
                      ◀
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSlideIndex((p) => ({
                          ...p,
                          [item.id]:
                            current === slides.length - 1
                              ? 0
                              : current + 1,
                        }));
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/60 text-white px-2 rounded"
                    >
                      ▶
                    </button>
                  </>
                )}
              </div>

              <h3 className="font-bold mt-2">{item.animalName}</h3>
              <p className="text-sm text-gray-600">
                {item.subType} • Age: {item.age}
              </p>
              <p className="text-green-700 font-semibold">₹ {item.price}</p>

              <button
                onClick={async () => {
                  await updateDoc(doc(db, "animals", item.id), {
                    isActive: !item.isActive,
                  });
                  toast.success(
                    item.isActive ? "Hidden from buyers" : "Visible to buyers"
                  );
                  loadListings();
                }}
                className={`mt-2 w-full py-1 rounded text-white ${
                  item.isActive ? "bg-yellow-500" : "bg-green-600"
                }`}
              >
                {item.isActive ? "Mark as Sold / Hide" : "Make Active"}
              </button>

              <button
                onClick={() => setDeleteId(item.id)}
                className="mt-2 w-full bg-red-600 text-white py-1 rounded"
              >
                Delete
              </button>
            </div>
          );
        })}
      </div>

      {/* FULLSCREEN PREVIEW */}
      {previewOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
          <button
            onClick={() => setPreviewOpen(false)}
            className="absolute top-4 right-4 text-white text-3xl"
          >
            ✕
          </button>

          <button
            onClick={() =>
              setPreviewIndex(
                previewIndex === 0
                  ? previewSlides.length - 1
                  : previewIndex - 1
              )
            }
            className="absolute left-4 text-white text-4xl"
          >
            ‹
          </button>

          <div className="max-w-[90vw] max-h-[90vh]">
            {previewSlides[previewIndex]?.includes("video") ? (
              <video
                src={previewSlides[previewIndex]}
                controls
                autoPlay
                className="max-h-[85vh] rounded"
              />
            ) : (
              <img
                src={previewSlides[previewIndex]}
                className="max-h-[85vh] rounded"
                alt=""
              />
            )}
          </div>

          <button
            onClick={() =>
              setPreviewIndex(
                previewIndex === previewSlides.length - 1
                  ? 0
                  : previewIndex + 1
              )
            }
            className="absolute right-4 text-white text-4xl"
          >
            ›
          </button>
        </div>
      )}

      {/* DELETE CONFIRM */}
      {deleteId && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center">
          <div className="bg-white p-6 rounded-xl w-80 text-center">
            <p className="mb-4 font-semibold">Delete this animal?</p>
            <div className="flex gap-4">
              <button
                onClick={() => setDeleteId(null)}
                className="w-1/2 bg-gray-300 py-2 rounded"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="w-1/2 bg-red-600 text-white py-2 rounded"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD MODAL (UNCHANGED) */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center pt-16">
          <div className="bg-white p-6 rounded-xl w-96 max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSubmit}>
              <input
                placeholder="Animal Name"
                className="border p-2 w-full mb-2"
                value={animalName}
                onChange={(e) => setAnimalName(e.target.value)}
              />

              <input
                placeholder="Type / Breed"
                className="border p-2 w-full mb-2"
                value={animalSubType}
                onChange={(e) => setAnimalSubType(e.target.value)}
              />

              <input
                placeholder="Price"
                type="number"
                className="border p-2 w-full mb-2"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />

              <input
                placeholder="Age"
                className="border p-2 w-full mb-2"
                value={age}
                onChange={(e) => setAge(e.target.value)}
              />

              <textarea
                placeholder="About animal"
                className="border p-2 w-full mb-2"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />

              {/* IMAGES */}
              <label className="font-semibold">Images (4–6)</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (!file || images.length >= 6) return;
                  setImages((p) => [...p, file]);
                }}
              />

              <p className="text-sm mb-2">
                Selected: {images.length} / 6
              </p>

              <div className="grid grid-cols-3 gap-2 mb-3">
                {images.map((img, i) => (
                  <div key={i} className="relative">
                    <img
                      src={URL.createObjectURL(img)}
                      className="h-20 w-full object-cover rounded"
                      alt=""
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setImages(images.filter((_, idx) => idx !== i))
                      }
                      className="absolute top-1 right-1 bg-red-600 text-white text-xs px-1 rounded"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              {/* VIDEO */}
              <label className="font-semibold">Video (optional)</label>
              <input
                type="file"
                accept="video/*"
                onChange={(e) => setVideo(e.target.files[0])}
              />

              {video && (
                <div className="relative mt-2">
                  <video
                    src={URL.createObjectURL(video)}
                    controls
                    className="w-full rounded"
                  />
                  <button
                    type="button"
                    onClick={() => setVideo(null)}
                    className="absolute top-1 right-1 bg-red-600 text-white px-2 rounded"
                  >
                    ✕
                  </button>
                </div>
              )}

              <div className="flex gap-2 mt-4">
                <button
                  disabled={uploading}
                  className="bg-green-600 text-white w-full py-2 rounded"
                >
                  {uploading ? "Uploading..." : "Submit"}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="bg-gray-300 w-full py-2 rounded"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
