import { useState, useEffect } from "react";
import { auth } from "./firebase";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import "./App.css";

function App() {
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [user, setUser] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [showRoleSelection, setShowRoleSelection] = useState(false);

  // Array of catchy quotes
  const quotes = [
    "Ditch WhatsApp chaos—sell and buy smarter with UniMart!",
    "Skip the store trips—find campus deals at UniMart!",
    "Stop wasting money on new—grab second-hand gems on UniMart!",
    "Say goodbye to old ways—UniMart is your campus marketplace!",
  ];

  // Rotate quotes every 5 seconds instead of 3
  useEffect(() => {
    const interval = setInterval(() => {
      setQuoteIndex((prevIndex) => (prevIndex + 1) % quotes.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        if (user.email.endsWith("@srmist.edu.in")) {
          setUser(user);
          setShowPopup(false);
          setShowRoleSelection(true);
        } else {
          auth.signOut();
          setUser(null);
          setShowPopup(true);
          setShowRoleSelection(false);
          setTimeout(() => setShowPopup(false), 5000); // Show popup for 5 seconds
        }
      } else {
        setUser(null);
        setShowRoleSelection(false);
      }
    });
    return unsubscribe;
  }, []);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed:", error.message);
    }
  };

  const handleRoleSelect = (selectedRole) => {
    // Here you can add navigation to different sections based on role
    console.log(`Selected role: ${selectedRole}`);
  };

  return (
    <div className="landing-page">
      {showPopup && (
        <div className="popup">
          Please login with your SRM email (@srmist.edu.in) to continue
        </div>
      )}
      <header>
        <h1>UniMart</h1>
      </header>
      <main>
        <div className="quote-container">
          <p className="quote">{quotes[quoteIndex]}</p>
        </div>
        {!user && (
          <button onClick={handleLogin} className="login-btn">
            Login with SRM Email
          </button>
        )}
        {showRoleSelection && (
          <div className="role-selection">
            <h2>Welcome! What would you like to do?</h2>
            <div className="role-options">
              <button
                className="role-btn"
                onClick={() => handleRoleSelect("buyer")}
              >
                Buy Items
              </button>
              <button
                className="role-btn"
                onClick={() => handleRoleSelect("seller")}
              >
                Sell Items
              </button>
              <button
                className="role-btn"
                onClick={() => handleRoleSelect("browse")}
              >
                Browse Around
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;