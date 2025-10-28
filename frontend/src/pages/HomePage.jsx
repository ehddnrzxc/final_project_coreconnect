import React, { useState, useEffect } from "react";
import { NavLink, Link } from "react-router-dom";
import { getMyProfileImage, uploadMyProfileImage } from "../api/userAPI";
import "../app.css";

/* ─ helpers ─ */
const Card = ({ title, right, children }) => (
  <div className="card">
    <div className="card__header">
      <h3 className="card__title">{title}</h3>
      {right && <div className="card__right">{right}</div>}
    </div>
    <div className="card__body">{children}</div>
  </div>
);
const Stat = ({ label, value }) => (
  <div className="stat">
    <span className="stat__label">{label}</span>
    <span className="stat__value">{value}</span>
  </div>
);

/* ─ layout ─ */
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

const Topbar = ({ onLogout, avatarUrl }) => (
  <header className="topbar">
    <div className="topbar__inner">
      <div className="search">
        <span className="search__icon">🔎</span>
        <input className="search__input" placeholder="검색어를 입력하세요" />
      </div>
      <div className="topbar__actions">
        <button className="icon-btn">🎁</button>
        <button className="icon-btn">🔔</button>
        <img className="avatar" src={avatarUrl} alt="me" />
        <button className="btn btn--ghost" onClick={onLogout}>
          로그아웃
        </button>
      </div>
    </div>
  </header>
);

const Shell = ({ children, onLogout, avatarUrl }) => (
  <div className="app">
    <Topbar onLogout={onLogout} avatarUrl={avatarUrl} />
    <div className="layout">
      <Sidebar />
      <main className="content">{children}</main>
    </div>
  </div>
);

/* ─ page ─ */
export default function Home({ onLogout }) {
  // ✅ 저장된 유저 읽기 (없으면 비어있는 객체)
  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const email = storedUser.email || ""; // 업로드 시 사용할 이메일
  const displayName = storedUser.name || storedUser.email || "사용자";

  // 프로필 이미지 상태
  const [profileImage, setProfileImage] = useState("https://i.pravatar.cc/80?img=12"); // 기본
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 프로필 이미지 조회
  useEffect(() => {
    const load = async () => {
      try {
        const url = await getMyProfileImage();
        setProfileImage(url);
      } catch (err) {
        console.error("프로필 이미지 조회 실패:", err?.response?.data || err);
        setError("프로필 이미지를 불러오지 못했습니다.");
      }
    };
    if (email) load();
  }, [email]);

  // 파일 선택 핸들러
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith("image/")) {
      setSelectedFile(file);
      setError(null);
    } else {
      setError("이미지 파일을 선택해주세요.");
      setSelectedFile(null);
    }
  };

  // 이미지 업로드 핸들러
  const handleUpload = async () => {
  if (!selectedFile) {
    setError("업로드할 파일을 선택해주세요.");
    return;
  }
  if (!email) {
    setError("로그인 정보가 없습니다. 다시 로그인해주세요.");
    return;
  }

  try {
    setLoading(true);
      // 업로드
      await uploadMyProfileImage(email, selectedFile);
      // 최신 URL 재조회
      const newUrl = await getMyProfileImage();
      setProfileImage(newUrl);

    // localStorage에 사용자 정보 업데이트
    localStorage.setItem(
      "user",
      JSON.stringify({ ...storedUser, imageUrl: newUrl })
    );

    setLoading(false);
    setSelectedFile(null);
  } catch (err) {
    setError("이미지 업로드에 실패했습니다.");
    setLoading(false);
    console.error("이미지 업로드 실패:", err?.response?.data || err);
  }
};

  return (
    <Shell
      onLogout={() => {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        onLogout();
      }}
      avatarUrl={profileImage}
    >
      <div className="container">
        {/* Row 1 */}
        <div className="grid grid--3">
          <Card title="프로필">
            <div className="profile">
              <div className="profile__avatar-wrapper">
                <img
                  src={profileImage}
                  className="profile__avatar"
                  alt="프로필 이미지"
                />
                <label className="btn btn--ghost btn--small profile__edit-btn">
                  수정
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={handleFileChange}
                  />
                </label>
                {selectedFile && (
                  <button
                    className="btn btn--primary btn--small"
                    onClick={handleUpload}
                    disabled={loading}
                  >
                    {loading ? "업로드 중..." : "업로드"}
                  </button>
                )}
              </div>
              {error && <p className="text--danger">{error}</p>}
              <div className="profile__meta">
                <div className="profile__dept">전산/보안</div>
                <div className="profile__name">{displayName}</div>
                <div className="profile__stats">
                  <Stat label="오늘 온 메일" value="1" />
                  <Stat label="오늘의 일정" value="2" />
                </div>
              </div>
            </div>
          </Card>

          <Card title="메일 리스트" right={<Link to="#">받은메일함</Link>}>
            <ul className="list list--divide">
              {[
                { from: "권시정", title: "[커뮤니티 폐쇄] '테스트 커뮤니티'" },
                { from: "postmaster", title: "[NDR] Delivery Failure Notice" },
                { from: "오늘", title: "[Approval] 결재 문서" },
              ].map((m, i) => (
                <li key={i} className="list__row">
                  <div className="list__text">
                    <span className="text--muted">{m.from}</span>
                    <span className="text--title">{m.title}</span>
                  </div>
                  <button className="btn btn--ghost">보기</button>
                </li>
              ))}
            </ul>
          </Card>

          <Card title="근태" right={<span>2025-10-24</span>}>
            <div className="attendance">
              <div className="attendance__left">
                <div className="attendance__icon">🕒</div>
                <div>
                  <div className="text--muted">출근 시간</div>
                  <div className="text--bold">09:31</div>
                </div>
              </div>
              <div className="attendance__right">
                <div>
                  <div className="text--muted">주간누적</div>
                  <div className="text--bold">38h 20m</div>
                </div>
                <button className="btn btn--primary">퇴근하기</button>
              </div>
            </div>
            <div className="progress">
              <div className="progress__bar" style={{ width: "60%" }} />
            </div>
          </Card>
        </div>

        {/* Row 2 */}
        <div className="grid grid--3">
          <div className="grid grid--2 span-2">
            <Card title="작성할 보고" right={<Link to="#">보고 작성</Link>}>
              <div className="report">
                <div>
                  <div className="badge badge--green">제 2회차</div>
                  <div className="report__date">10/29 (수)</div>
                  <div className="text--muted">test</div>
                </div>
                <button className="btn btn--ghost">작성하기</button>
              </div>
            </Card>

            <Card title="Quick Menu">
              <div className="quick-grid">
                {[
                  { label: "메일쓰기", emoji: "✉️" },
                  { label: "연락처 추가", emoji: "👤" },
                  { label: "일정등록", emoji: "🗓️" },
                  { label: "게시판 글쓰기", emoji: "📝" },
                  { label: "설문작성", emoji: "📊" },
                  { label: "다운로드", emoji: "💾" },
                ].map((q) => (
                  <button key={q.label} className="quick">
                    <span className="quick__emoji">{q.emoji}</span>
                    <span className="quick__label">{q.label}</span>
                  </button>
                ))}
              </div>
            </Card>

            <Card title="전사게시판 최근글">
              <ul className="bullet">
                <li>공지 테스트[2] — 2025-09-18</li>
                <li>보안 공지 — 2025-09-05</li>
              </ul>
            </Card>

            <Card title="메일함 바로가기">
              <div className="mail-shortcut">
                <div className="text--muted">
                  받은메일함 1 • 오늘메일함 0 • 중요메일함 0
                </div>
                <button className="btn btn--primary">이동</button>
              </div>
            </Card>
          </div>

          <div className="grid">
            <Card title="캘린더" right={"2025.10"}>
              <div className="calendar">
                <div className="calendar__head">
                  {["일", "월", "화", "수", "목", "금", "토"].map((d) => (
                    <div key={d}>{d}</div>
                  ))}
                </div>
                <div className="calendar__body">
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((n) => (
                    <div
                      key={n}
                      className={"calendar__cell" + (n === 24 ? " is-today" : "")}
                    >
                      {n}
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            <Card title="최근 알림">
              <ul className="list">
                <li>근무상태가 출근으로 변경되었습니다. • 1시간 전</li>
                <li>커뮤니티 폐쇄 알림 • 2시간 전</li>
                <li>지각 처리되었습니다 • 오늘</li>
              </ul>
            </Card>
          </div>
        </div>

        {/* Row 3 */}
        <div className="grid grid--2">
          <Card title="내 경비관리" right="2025.10">
            <div className="expense">
              <div>법인카드 0원 • 경비/일반 영수증 172,013원</div>
              <button className="btn btn--ghost">영수증 제출</button>
            </div>
            <div className="tile-grid">
              <div className="tile">
                <div className="text--muted">미결재</div>
                <div className="text--bold">2건</div>
              </div>
              <div className="tile">
                <div className="text--muted">결재중</div>
                <div className="text--bold">0건</div>
              </div>
              <div className="tile">
                <div className="text--muted">결재완료</div>
                <div className="text--bold">1건</div>
              </div>
            </div>
          </Card>

          <Card title="차량운행일지" right="2025.10">
            <div className="vehicle">
              <div>
                <div className="text--bold">영업 3 (소나타)</div>
                <div className="text--muted">
                  미결재된 운행일지가 1건 있습니다
                </div>
              </div>
              <button className="btn btn--ghost">결재 요청하기</button>
            </div>
          </Card>
        </div>
      </div>
    </Shell>
  );
}