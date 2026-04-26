import { Link } from "react-router-dom";
import { useState } from "react";

export const ADMIN_KEY_STORAGE = "riffrank.adminKey";

export default function AdminDashboardPage() {
  const [adminKey, setAdminKey] = useState(localStorage.getItem(ADMIN_KEY_STORAGE) ?? "dev-admin-key");

  function persistKey(key: string) {
    localStorage.setItem(ADMIN_KEY_STORAGE, key);
    setAdminKey(key);
  }

  return (
    <div className="card">
      <h2 style={{ marginTop: 0 }}>Admin</h2>
      <div className="muted" style={{ marginBottom: 10 }}>
        Uses header <code>X-ADMIN-KEY</code> for create and edit endpoints.
      </div>
      <div className="row">
        <input value={adminKey} onChange={(e) => persistKey(e.target.value)} placeholder="X-ADMIN-KEY" />
      </div>
      <div className="row" style={{ marginTop: 12 }}>
        <Link className="pill" to="/admin/artists">
          Create artist
        </Link>
        <Link className="pill" to="/admin/artists/edit">
          Edit artist
        </Link>
        <Link className="pill" to="/admin/songs">
          Create song
        </Link>
        <Link className="pill" to="/admin/songs/edit">
          Edit song
        </Link>
      </div>
      <div className="muted" style={{ marginTop: 10 }}>
        Edit uses PATCH and only sends changed fields.
      </div>
    </div>
  );
}
