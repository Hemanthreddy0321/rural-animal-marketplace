// src/pages/auth/OtpVerify.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../firebase";
import toast from "react-hot-toast";

export default function OtpVerify() {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  /* =========================
     VERIFY OTP
  ========================== */
  const handleVerify = async (e) => {
    e.preventDefault();

    if (!/^\d{6}$/.test(otp)) {
      toast.error("Enter a valid 6-digit OTP");
      return;
    }

    if (!window.confirmationResult) {
      toast.error("Session expired. Please login again.");
      nav("/auth/phone");
      return;
    }

    setLoading(true);

    try {
      const result = await window.confirmationResult.confirm(otp);
      const user = result.user;

      // 🔹 Check Firestore user
      const userRef = doc(db, "users", user.uid);
      const snap = await getDoc(userRef);

      // 🔹 Create profile on first login
      if (!snap.exists()) {
        await setDoc(userRef, {
          phone: user.phoneNumber,
          name: "",
          address: "",
          district: "",
          createdAt: serverTimestamp(),
        });
      }

      toast.success("Login successful");
      nav("/");
    } catch (err) {
      console.error(err);
      toast.error("Invalid OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     UI
  ========================== */
  return (
    <div className="p-6">
      <form
        onSubmit={handleVerify}
        className="bg-white shadow-xl p-8 rounded-2xl max-w-md mx-auto mt-12"
      >
        <h1 className="text-3xl font-bold mb-5 text-center">
          Enter OTP
        </h1>

        <input
          type="text"
          inputMode="numeric"
          placeholder="6-digit OTP"
          className="border p-3 w-full rounded-lg mb-4 text-center tracking-widest text-lg"
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
          maxLength={6}
        />

        <button
          type="submit"
          disabled={loading}
          className="bg-appGreen text-appDark w-full py-3 rounded-lg font-bold disabled:opacity-50"
        >
          {loading ? "Verifying..." : "Verify OTP"}
        </button>
      </form>
    </div>
  );
}
