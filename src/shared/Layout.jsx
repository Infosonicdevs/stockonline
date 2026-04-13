import React from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Sidebar from "../components/navigation/Sidebar";
import { navigationConfig } from "../config/navigation";
import "../styles/buttons.css";

const Layout = () => {
  const navigate = useNavigate();
  const username = localStorage.getItem("username");
  const loginDate = localStorage.getItem("loginDate");
  const branch = localStorage.getItem("branch");
  const roleId = localStorage.getItem("Role_id");

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  const filteredNavigation = navigationConfig.filter((item) => {
    if (roleId === "1") {
      return true;
    }
    return !["Master", "Setting", "Utility"].includes(item.title);
  });

  return (
    <div className="d-flex flex-column vh-100">
      {/* Navbar */}
      <nav
        className="navbar navbar-expand-lg px-4 shadow-sm flex-shrink-0"
        style={{ backgroundColor: "#365b80" }}
      >
        <div className="container-fluid">
          <h2 className="brand text-white mb-0">
            <i className="bi bi-clipboard-data me-2"></i>
            Stock Sachiv
          </h2>

          <div className="d-flex align-items-center bg-warning text-dark px-3 py-1 rounded-pill shadow-sm small gap-4 ms-auto">
            <div className="d-flex align-items-center">
              <i className="bi bi-building me-1 fs-6"></i>
              <span>{branch}</span>
            </div>

            <div className="d-flex align-items-center">
              <i className="bi bi-person-circle me-1 fs-6"></i>
              <span>{username}</span>
            </div>

            <div className="d-flex align-items-center">
              <i className="bi bi-calendar3 me-1 fs-6"></i>
              <span>
                {loginDate
                  ? new Date(loginDate).toLocaleDateString("en-GB")
                  : "N/A"}
              </span>
            </div>
          </div>
        </div>
      </nav>

      {/* Body */}
      <div className="d-flex flex-grow-1 overflow-hidden">
        {/* Dynamic Sidebar */}
        <div
          className="d-flex flex-column border-end bg-light"
          style={{ width: "280px" }}
        >
          <Sidebar config={filteredNavigation} />

          {/* Logout Button at bottom of Sidebar area */}
          <div className="p-3 mt-auto border-top">
            <button
              className="btn btn-outline-danger w-100 d-flex align-items-center justify-content-center gap-2"
              onClick={handleLogout}
            >
              <i className="bi bi-box-arrow-right"></i>
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-grow-1 p-4 overflow-auto bg-white">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default Layout;
