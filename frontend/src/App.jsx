import { useState, useEffect } from "react";
import { auth } from "./firebase";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import axios from "axios";

function App() {
  const [user, setUser] = useState(null);
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [image, setImage] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        if (user.email.endsWith("@srmist.edu.in")) {
          setUser(user);
          setError("");
        } else {
          auth.signOut();
          setError("Please use an SRM email (@srmist.edu.in).");
        }
      } else {
        setUser(null);
      }
    });
    return unsubscribe;
  }, []);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      setError("Login failed: " + error.message);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onloadend = () => setImage(reader.result); // Converts to base64
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      setError("Please log in first.");
      return;
    }
    if (!image) {
      setError("Please upload an image.");
      return;
    }
    try {
      await axios.post("http://localhost:3500/addListing", {
        title,
        price,
        imageBase64: image,
      });
      setTitle("");
      setPrice("");
      setImage(null);
      setError("Listing added!");
    } catch (err) {
      setError("Failed to add listing: " + err.message);
    }
  };

  return (
    <div style={{ textAlign: "center", padding: "50px" }}>
      <h1>SRM Marketplace</h1>
      {user ? (
        <div>
          <p>Welcome, {user.displayName}!</p>
          <form onSubmit={handleSubmit}>
            <input
              type="text"
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <input
              type="number"
              placeholder="Price"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
            <input type="file" accept="image/*" onChange={handleImageChange} />
            <button type="submit">Add Listing</button>
          </form>
        </div>
      ) : (
        <div>
          <button onClick={handleLogin}>Login with SRM Email</button>
          {error && <p style={{ color: "red" }}>{error}</p>}
        </div>
      )}
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}

export default App;