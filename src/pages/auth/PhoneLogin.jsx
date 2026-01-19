import { useEffect, useRef, useState } from "react";
import { auth, phoneLogin } from "../../firebase";
import { RecaptchaVerifier } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

export default function PhoneLogin() {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  const recaptchaRef = useRef(null);

  /* =========================
     INIT RECAPTCHA (ONCE)
  ========================== */
  useEffect(() => {
    if (!recaptchaRef.current) {
      recaptchaRef.current = new RecaptchaVerifier(
        auth,
        "recaptcha-container",
        {
          size: "invisible",
        }
      );
    }
  }, []);

  /* =========================
     SEND OTP
  ========================== */
  const handleSendOTP = async (e) => {
    e.preventDefault();

    if (!/^[6-9]\d{9}$/.test(phone)) {
      toast.error("Enter a valid 10-digit Indian phone number");
      return;
    }

    setLoading(true);

    try {
      const result = await phoneLogin(
        auth,
        "+91" + phone,
        recaptchaRef.current
      );

      window.confirmationResult = result;
      toast.success("OTP sent successfully");
      nav("/auth/verify");
    } catch (err) {
      console.error(err);
      toast.error("Failed to send OTP. Try again later.");

      // 🔄 Reset reCAPTCHA on failure
      recaptchaRef.current.clear();
      recaptchaRef.current.render();
    }

    setLoading(false);
  };

  /* =========================
     UI
  ========================== */
  return (
    <div className="p-6 max-w-lg mx-auto">
      {/* Required for Firebase */}
      <div id="recaptcha-container"></div>

      <form
        onSubmit={handleSendOTP}
        className="bg-white shadow-xl p-8 rounded-2xl mt-12"
      >
        <h1 className="text-3xl font-bold mb-5 text-center">
          Phone Login
        </h1>

        <input
          type="tel"
          placeholder="Enter 10-digit phone number"
          className="border p-3 w-full rounded mb-4"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />

        <button
          type="submit"
          disabled={loading}
          className="bg-green-600 text-white w-full py-3 rounded-lg text-lg disabled:opacity-50"
        >
          {loading ? "Sending OTP…" : "Send OTP"}
        </button>
      </form>
    </div>
  );
}
