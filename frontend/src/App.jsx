import { useState, useEffect } from "react";
import { auth } from "./firebase";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import axios from "axios";
import "./App.css";

function App() {
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [user, setUser] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [showRoleSelection, setShowRoleSelection] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [location, setLocation] = useState("");
  const [image, setImage] = useState(null);
  const [uploadStatus, setUploadStatus] = useState("");

  // Array of catchy quotes
  const quotes = [
    "Ditch WhatsApp chaos—sell and buy smarter with UniMart!",
    "Skip the store trips—find campus deals at UniMart!",
    "Stop wasting money on new—grab second-hand gems on UniMart!",
    "Say goodbye to old ways—UniMart is your campus marketplace!",
  ];

  // Rotate quotes every 5 seconds with rolling animation
  useEffect(() => {
    const interval = setInterval(() => {
      setQuoteIndex((prevIndex) => (prevIndex + 1) % quotes.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [quotes.length]);

  // Reset states on mount to ensure login is required
  useEffect(() => {
    setUser(null);
    setShowRoleSelection(false);
    setSelectedRole(null);
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        if (user.email.endsWith("@srmist.edu.in")) {
          setUser(user);
          setShowPopup(false);
          setShowRoleSelection(true);
          setSelectedRole(null);
        } else {
          auth.signOut();
          setUser(null);
          setShowPopup(true);
          setShowRoleSelection(false);
          setTimeout(() => setShowPopup(false), 5000);
        }
      } else {
        setUser(null);
        setShowRoleSelection(false);
        setSelectedRole(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed:", error.message);
      setShowRoleSelection(false);
    }
  };

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    setUploadStatus("");
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onloadend = () => setImage(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!image) {
      setUploadStatus("Please upload an image.");
      return;
    }
    try {
      await axios.post("http://localhost:3500/addListing", {
        title,
        price,
        location,
        imageBase64: image,
      });
      setUploadStatus("Listing added successfully!");
      setTitle("");
      setPrice("");
      setLocation("");
      setImage(null);
    } catch (error) {
      setUploadStatus("Failed to add listing: " + error.message);
    }
  };

  return (
    <div className="landing-page">
      {showPopup && (
        <div className="popup">
          Only SRM emails (@srmist.edu.in) are allowed!
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
        {user && showRoleSelection && !selectedRole && (
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
                className="role-btn underlined"
                onClick={() => handleRoleSelect("browse")}
              >
                Browse Around
              </button>
            </div>
          </div>
        )}
        {user && selectedRole === "seller" && (
          <div className="seller-form">
            <h2>Sell Your Item</h2>
            <form onSubmit={handleSubmit}>
              <input
                type="text"
                placeholder="Item Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <input
                type="number"
                placeholder="Price"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
              <input
                type="text"
                placeholder="Location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
              <input type="file" accept="image/*" onChange={handleImageChange} />
              <button type="submit" className="login-btn">
                Submit Listing
              </button>
            </form>
            {uploadStatus && <p className="status">{uploadStatus}</p>}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;