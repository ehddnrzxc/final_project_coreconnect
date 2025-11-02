import React from 'react';
import { useNavigate } from 'react-router-dom';

const Topbar = ({ onLogout, avatarUrl }) => {

  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isAdmin = user?.role === "ADMIN";

  return (
    <header className="topbar">
      <div className="topbar__inner">
        <div className="search">
          <i className="fa-solid fa-magnifying-glass search__icon" />
          <input className="search__input" placeholder="검색어를 입력하세요" />
        </div>
        <div className="topbar__actions">
          {isAdmin && (
            <button className="btn btn--admin" onClick={() => navigate("/admin")}>
              관리자 콘솔
            </button>
          )}
          <button className="icon-btn" aria-label="Gifts">
            <i className="fa-solid fa-gift" />
          </button>
          <button className="icon-btn" aria-label="Notifications">
            <i className="fa-regular fa-bell" />
          </button>
          {avatarUrl && <img className="avatar" src={avatarUrl} alt="me" />}
          <button className="btn btn--ghost" onClick={onLogout}>
            로그아웃
          </button>
        </div>
      </div>
    </header>
  );
};

export default Topbar;