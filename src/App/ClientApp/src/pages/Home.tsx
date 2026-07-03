import { useEffect, useState } from "react";
import api from "../api/api";
import "./Home.scss";

function Home() {
  const [users, setUsers] = useState<any[]>([]);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    api
      .get("/api/user")
      .then((res) => {
        setUsers(res.data);
        setError("");
      })
      .catch((err) => {
        console.error("API error:", err);
        setError("Failed to connect to backend");
      });
  }, []);

  return (
    <div className="home">
      <h1 className="home-title">AppointWeb</h1>

      {error && <p className="home-error">{error}</p>}

      <h2 className="home-subtitle">Users</h2>

      {users.length === 0 ? (
        <p className="home-empty">No users found.</p>
      ) : (
        <ul className="home-list">
          {users.map((u) => (
            <li key={u.id}>{u.email}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default Home;
