import { useEffect, useState } from "react";
import api from "./api/api";

function App() {
  const [users, setUsers] = useState<any[]>([]);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    api.get("/api/user")
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
    <div style={{ padding: 20 }}>
      <h1>AppointWeb Frontend</h1>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <h2>Users:</h2>

      {users.length === 0 ? (
        <p>No users found.</p>
      ) : (
        <ul>
          {users.map((u) => (
            <li key={u.id}>{u.email}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default App;
