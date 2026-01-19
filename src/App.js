import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Sell from "./pages/Sell";
import Profile from "./pages/Profile";
import Requests from "./pages/Requests";
import Category from "./pages/Category";
import AnimalDetail from "./pages/AnimalDetail";
import Chat from "./pages/Chat";
import ChatInbox from "./pages/ChatInbox"; // ✅ ADD THIS

// Auth pages
import PhoneLogin from "./pages/auth/PhoneLogin";
import OtpVerify from "./pages/auth/OtpVerify";

import ProtectedRoute from "./components/ProtectedRoute";
import Navbar from "./components/Navbar";

// ✅ Professional notifications
import { Toaster } from "react-hot-toast";

function App() {
  return (
    <BrowserRouter>
      {/* ✅ Global Toast Notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            fontSize: "14px",
          },
        }}
      />

      <Navbar />

      {/* ✅ Fix for fixed navbar overlap */}
      <div className="pt-20">
        <Routes>
          {/* 🔓 AUTH ROUTES */}
          <Route path="/auth/phone" element={<PhoneLogin />} />
          <Route path="/auth/verify" element={<OtpVerify />} />

          {/* 🌍 PUBLIC ROUTES */}
          <Route path="/" element={<Home />} />
          <Route path="/category/:type" element={<Category />} />
          <Route path="/animal/:id" element={<AnimalDetail />} />

          {/* 🔐 PROTECTED ROUTES */}
          <Route
            path="/sell"
            element={
              <ProtectedRoute>
                <Sell />
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />

          <Route
            path="/requests"
            element={
              <ProtectedRoute>
                <Requests />
              </ProtectedRoute>
            }
          />

          {/* ✅ CHAT INBOX (IMPORTANT) */}
          <Route
            path="/chats"
            element={
              <ProtectedRoute>
                <ChatInbox />
              </ProtectedRoute>
            }
          />

          {/* ✅ SINGLE CHAT */}
          <Route
            path="/chat"
            element={
              <ProtectedRoute>
                <Chat />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
