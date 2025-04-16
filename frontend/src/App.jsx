import { useState, useEffect } from "react";
import { auth, db } from "./firebase";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { collection, addDoc, onSnapshot, query, orderBy } from "firebase/firestore";
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
  const [listings, setListings] = useState([]);
  const [societyFilter, setSocietyFilter] = useState("all");
  const [selectedListing, setSelectedListing] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");

  const quotes = [
    "Ditch WhatsApp chaos—sell and buy smarter with UniMart!",
    "Skip the store trips—find campus deals at UniMart!",
    "Stop wasting money on new—grab second-hand gems on UniMart!",
    "Say goodbye to old ways—UniMart is your campus marketplace!",
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setQuoteIndex((prevIndex) => (prevIndex + 1) % quotes.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [quotes.length]);

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

  useEffect(() => {
    if ((selectedRole === "buyer" || selectedRole === "browse") && user) {
      const fetchListings = async () => {
        try {
          const response = await axios.get("http://localhost:3500/listings", {
            params: { society: societyFilter !== "all" ? societyFilter : undefined },
          });
          setListings(response.data);
        } catch (error) {
          console.error("Failed to fetch listings:", error);
        }
      };
      fetchListings();
    }
  }, [selectedRole, societyFilter, user]);

  useEffect(() => {
    if (selectedRole === "buyer" && selectedListing && user) {
      const chatId = [user.uid, selectedListing.sellerId].sort().join('_');
      const chatRef = collection(db, `chats/${chatId}/messages`);
      const q = query(chatRef, orderBy("timestamp"));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });
      return () => unsubscribe();
    }
  }, [selectedRole, selectedListing, user]);

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
    setSelectedListing(null);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setUploadStatus("Image too large. Max 2MB.");
      return;
    }
    const reader = new FileReader();
    reader.onloadstart = () => setUploadStatus("Uploading...");
    reader.onloadend = () => {
      setImage(reader.result);
      setUploadStatus("");
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !price) {
      setUploadStatus("Title and price are required.");
      return;
    }
    if (title.length > 100) {
      setUploadStatus("Title must be under 100 characters.");
      return;
    }
    if (isNaN(price) || price <= 0) {
      setUploadStatus("Price must be a positive number.");
      return;
    }
    try {
      const response = await axios.post("http://localhost:3500/addListing", {
        title,
        price,
        location,
        imageBase64: image,
        sellerId: user.uid,
        sellerEmail: user.email,
      });
      setUploadStatus("Listing added successfully!");
      const listingId = response.data.insertedId;
      const shareText = `Selling: ${title} for ₹${price} on UniMart! Check it out: http://localhost:3000/listing/${listingId}`;
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
      window.open(whatsappUrl, '_blank');
      setTitle("");
      setPrice("");
      setLocation("");
      setImage(null);
    } catch (error) {
      setUploadStatus("Failed to add listing: " + error.message);
    }
  };

  const sendMessage = async () => {
    if (!newMessage || !selectedListing) return;
    const chatId = [user.uid, selectedListing.sellerId].sort().join('_');
    try {
      await addDoc(collection(db, `chats/${chatId}/messages`), {
        text: newMessage,
        senderId: user.uid,
        timestamp: new Date(),
      });
      setNewMessage("");
    } catch (error) {
      console.error("Failed to send message:", error);
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
                placeholder="Item Title (e.g., Used Chair)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                maxLength={100}
              />
              <input
                type="number"
                placeholder="Price (₹)"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                inputMode="numeric"
                required
                min="1"
              />
              <input
                type="text"
                placeholder="Location (optional, e.g., Society S1)"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
              <input type="file" accept="image/*" onChange={handleImageChange} />
              <button type="submit" className="login-btn">
                Post Listing
              </button>
            </form>
            {uploadStatus && <p className="status">{uploadStatus}</p>}
          </div>
        )}
        {(selectedRole === "buyer" || selectedRole === "browse") && (
          <div className="listings">
            <h2>Available Listings</h2>
            <select onChange={(e) => setSocietyFilter(e.target.value)} value={societyFilter}>
              <option value="all">All Societies</option>
              <option value="S1">Society S1</option>
              <option value="S2">Society S2</option>
              <option value="S3">Society S3</option>
            </select>
            <div className="listing-grid">
              {listings.map((listing) => (
                <div key={listing._id} className="listing-card">
                  <img src={listing.imageBase64 || "/placeholder.png"} alt={listing.title} />
                  <h3>{listing.title}</h3>
                  <p>₹{listing.price}</p>
                  <p>{listing.location || "Campus"}</p>
                  {selectedRole === "buyer" && (
                    <button
                      className="login-btn"
                      onClick={() => setSelectedListing(listing)}
                    >
                      Contact Seller
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        {selectedRole === "buyer" && selectedListing && (
          <div className="chat-box">
            <h3>Chat with Seller</h3>
            <button
              className="login-btn"
              onClick={() => setSelectedListing(null)}
              style={{ marginBottom: '10px' }}
            >
              Back to Listings
            </button>
            <div className="messages">
              {messages.map((msg) => (
                <p
                  key={msg.id}
                  className={msg.senderId === user.uid ? "sent" : "received"}
                >
                  {msg.text}
                </p>
              ))}
            </div>
            <input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
            />
            <button className="login-btn" onClick={sendMessage}>
              Send
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;