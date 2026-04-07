import React, { useState } from "react";
import { NavLink } from "react-router-dom";

const SidebarItem = ({ item, isSubmenu = false }) => {
  const [isOpen, setIsOpen] = useState(false);

  const hasSubmenu = item.submenu && item.submenu.length > 0;

  const toggleSubmenu = (e) => {
    if (hasSubmenu) {
      e.preventDefault();
      setIsOpen(!isOpen);
    }
  };

  return (
    <li className={`nav-item ${isSubmenu ? "" : "mb-2"}`}>
      {hasSubmenu ? (
        <>
          <a
            className={`nav-link sidebar-link text-dark d-flex justify-content-between align-items-center ${
              isOpen ? "active-parent" : ""
            }`}
            onClick={toggleSubmenu}
            style={{ cursor: "pointer" }}
          >
            <span>
              <i className={`${item.icon || "bi bi-circle"} me-2`}></i>
              {item.title}
            </span>
            <i className={`bi bi-chevron-${isOpen ? "up" : "down"} small`}></i>
          </a>
          <div className={`collapse ${isOpen ? "show" : ""}`}>
            <ul className="nav flex-column ms-3 submenu">
              {item.submenu.map((subItem, index) => (
                <SidebarItem key={index} item={subItem} isSubmenu={true} />
              ))}
            </ul>
          </div>
        </>
      ) : (
        <NavLink
          to={item.path}
          className={({ isActive }) =>
            `nav-link sidebar-link ${
              isActive ? "active text-white" : "text-dark"
            } ${isSubmenu ? "ps-4" : ""}`
          }
        >
          <i className={`${item.icon || "bi bi-circle"} me-2`}></i>
          {item.title}
        </NavLink>
      )}
    </li>
  );
};

const Sidebar = ({ config, onLogout }) => {
  return (
    <div
      className="bg-light p-3 border-end d-flex flex-column shadow-sm"
      style={{
        width: "280px",
        height: "100%",
        overflowY: "auto",
        transition: "width 0.3s ease",
      }}
    >
      <ul className="nav nav-pills flex-column mb-auto">
        {config.map((item, index) => (
          <SidebarItem key={index} item={item} />
        ))}
      </ul>
    </div>
  );
};

export default Sidebar;
