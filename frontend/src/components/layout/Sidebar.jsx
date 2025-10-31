import React from 'react';
import { NavLink } from 'react-router-dom';

const Sidebar = () => {
  const items = [
    { to: "/home", label: "홈", icon: "fa-solid fa-house" },
    { to: "/mail", label: "메일", icon: "fa-solid fa-envelope" },
    { to: "/e-approval", label: "전자결재", icon: "fa-solid fa-file-signature" },
    { to: "/works", label: "Works", icon: "fa-solid fa-briefcase" },
    { to: "/calendar", label: "캘린더", icon: "fa-solid fa-calendar-days" },
    { to: "/board", label: "게시판", icon: "fa-solid fa-thumbtack" },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar__brand">CoreConnect</div>
      <nav className="sidebar__nav">
        {items.map((it) => (
          <NavLink
            key={it.to}
            to={it.to}
            className={({ isActive }) =>
              "nav__item" + (isActive ? " nav__item--active" : "")
            }
          >
            <i className={it.icon + " nav__icon"}></i>
            <span>{it.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="sidebar__footer">v0.1 • demo</div>
    </aside>
  );
};

export default Sidebar;