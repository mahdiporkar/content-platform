import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useTenant } from "../app/tenant";
import { authStore } from "../app/auth";

export const AppLayout = () => {
  const { applicationId, setApplicationId } = useTenant();

  const handleLogout = () => {
    authStore.clearToken();
    window.location.href = "/login";
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <h1>Content Platform</h1>
        <nav>
          <NavLink className="nav-link" to="/applications">
            Applications
          </NavLink>
          <NavLink className="nav-link" to="/posts">
            Posts
          </NavLink>
          <NavLink className="nav-link" to="/articles">
            Articles
          </NavLink>
          <NavLink className="nav-link" to="/videos">
            Videos
          </NavLink>
          <button className="button secondary" type="button" onClick={handleLogout}>
            Log out
          </button>
        </nav>
        <div style={{ marginTop: "24px" }}>
          <div className="input">
            <label>Application ID</label>
            <input
              value={applicationId}
              onChange={(event) => setApplicationId(event.target.value)}
              placeholder="app UUID"
            />
          </div>
        </div>
      </aside>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
};
