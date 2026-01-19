// src/components/Navbar.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { auth } from "../firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";

export default function Navbar() {
  const [user, setUser] = useState(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsub();
  }, []);

  return (
    <nav className="fixed top-0 left-0 w-full bg-appGreen shadow-md z-50">
      
      {/* TOP BAR */}
      <div className="flex justify-between items-center px-4 py-3">

        {/* LOGO */}
        <Link to="/" className="text-appDark">
          <h1 className="text-lg font-bold">🌾 Rural Marketplace</h1>
          <p className="text-xs text-green-900 hidden sm:block">
            Connecting Farmers & Buyers
          </p>
        </Link>

        {/* DESKTOP MENU */}
        {user && (
          <div className="hidden md:flex items-center gap-6 text-appDark font-medium">
            <Link to="/sell">🐄 Sell Animal</Link>
            <Link to="/requests">📩 My Requests</Link>
            <Link to="/profile">👤 Profile</Link>
            <button
              onClick={() => signOut(auth)}
              className="bg-red-600 text-white px-4 py-1 rounded-lg"
            >
              Logout
            </button>
          </div>
        )}

        {/* MOBILE MENU BUTTON */}
        {user && (
          <button
            className="md:hidden text-2xl"
            onClick={() => setOpen(!open)}
          >
            ☰
          </button>
        )}

        {!user && (
          <Link
            to="/auth/phone"
            className="bg-appDark text-white px-4 py-2 rounded-lg"
          >
            Login
          </Link>
        )}
      </div>

      {/* MOBILE DROPDOWN */}
      {open && user && (
        <div className="md:hidden bg-white shadow-md px-4 py-3 space-y-3">
          <Link
            to="/sell"
            onClick={() => setOpen(false)}
            className="block"
          >
            🐄 Sell Animal
          </Link>

          <Link
            to="/requests"
            onClick={() => setOpen(false)}
            className="block"
          >
            📩 My Requests
          </Link>

          <Link
            to="/profile"
            onClick={() => setOpen(false)}
            className="block"
          >
            👤 Profile
          </Link>

          <button
            onClick={() => signOut(auth)}
            className="w-full bg-red-600 text-white py-2 rounded-lg"
          >
            Logout
          </button>
        </div>
      )}
    </nav>
  );
}