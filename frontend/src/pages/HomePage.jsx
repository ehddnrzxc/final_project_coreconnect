import React, { useState, useEffect } from "react";
import { NavLink, Link } from "react-router-dom";
import { getMyProfileImage, uploadMyProfileImage } from "../api/userAPI";
import "../app.css";

/* ─ helpers ─ */
const Card = ({ title, right, children }) => (
  <div className="card">
    {(title || right) && (
      <div className="card__header">
        {title && <h3 className="card__title">{title}</h3>}
        {right && <div className="card__right">{right}</div>}
      </div>
    )}
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

/* ─ Topbar ─ */
const Topbar = ({ onLogout, avatarUrl }) => (
  <header className="topbar">
    <div className="topbar__inner">
      <div className="search">
        <i className="fa-solid fa-magnifying-glass search__icon" />
        <input className="search__input" placeholder="검색어를 입력하세요" />
      </div>
      <div className="topbar__actions">
        <button className="icon-btn" aria-label="Gifts">
          <i className="fa-solid fa-gift" />
        </button>
        <button className="icon-btn" aria-label="Notifications">
          <i className="fa-regular fa-bell" />
        </button>
        {avatarUrl ? (
          <img className="avatar" src={avatarUrl || undefined} alt="me" />
        ) : null}
        <button className="btn btn--ghost" onClick={onLogout}>
          로그아웃
        </button>
      </div>
    </div>
  </header>
);

/* ─ Shell ─ */
const Shell = ({ children, onLogout, avatarUrl }) => (
  <div className="app">
    <Topbar onLogout={onLogout} avatarUrl={avatarUrl} />
    <div className="layout">
      <Sidebar />
      <main className="content">{children}</main>
    </div>
  </div>
);

/* ─ Page ─ */
export default function Home({ onLogout }) {
  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const email = storedUser.email || "";
  const displayName = storedUser.name || storedUser.email || "사용자";

  const DEFAULT_AVATAR = "https://i.pravatar.cc/80?img=12";
  const withBust = (url) =>
    url ? `${url}${url.includes("?") ? "&" : "?"}t=${Date.now()}` : url;

  const [profileImage, setProfileImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 프로필 이미지 조회
  useEffect(() => {
    const load = async () => {
      try {
        const url = await getMyProfileImage(); // 서버 프로필 URL
        const normalized = url && url.trim() !== "" ? withBust(url) : null;
        setProfileImage(normalized);
      } catch (err) {
        console.warn(
          "프로필 이미지 조회 실패:",
          err?.response?.status,
          err?.response?.data
        );
        setProfileImage(null);
      }
    };
    if (email) load();
  }, [email]);

  // 파일 선택 → 즉시 업로드
  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("이미지 파일을 선택해주세요.");
      event.target.value = "";
      return;
    }
    if (!email) {
      setError("로그인 정보가 없습니다. 다시 로그인해주세요.");
      event.target.value = "";
      return;
    }

    try {
      setError(null);
      setLoading(true);

      // 미리보기
      const preview = URL.createObjectURL(file);
      setProfileImage(preview);

      // 업로드 실행
      await uploadMyProfileImage(file);

      // 업로드 후 서버 URL 재조회
      const newUrl = await getMyProfileImage();
      const normalized = newUrl && newUrl.trim() !== "" ? withBust(newUrl) : null;
      setProfileImage(normalized);

      // 새로고침 대비 저장(원본 URL 저장)
      localStorage.setItem(
        "user",
        JSON.stringify({ ...storedUser, imageUrl: newUrl || "" })
      );
    } catch (err) {
      console.error("이미지 업로드 실패:", err?.response?.data || err);
      setError("이미지 업로드에 실패했습니다.");
    } finally {
      setLoading(false);
      event.target.value = ""; // 같은 파일 재선택 가능
    }
  };

  // 안전한 아바타 경로 계산
  const safeAvatarSrc =
    (profileImage && profileImage.trim() !== "" ? profileImage : null) ||
    (storedUser.imageUrl && storedUser.imageUrl.trim() !== ""
      ? withBust(storedUser.imageUrl)
      : null) ||
    DEFAULT_AVATAR;

  return (
    <Shell
      onLogout={() => {
        localStorage.removeItem("user");
        localStorage.removeItem("accessToken");
        onLogout();
      }}
      avatarUrl={safeAvatarSrc}
    >
      <div className="container">
        {/* Row 1 */}
        <div className="grid grid--3">
      <Card title="">
        <div className="profile-card">
          {/* 상단: 아바타/이름/부서 */}
          <div className="profile-card__head">
  {/* 왼쪽: 아바타 + 변경 링크 */}
  <div className="profile-card__avatarCol">
          {safeAvatarSrc ? (
            <img
              src={safeAvatarSrc || undefined}
              className="profile-card__avatar"
              alt="프로필 이미지"
            />
          ) : (
            <div className="profile-card__avatar profile-card__avatar--placeholder">
              <i className="fa-regular fa-user" />
            </div>
          )}

          {/* 👇 사진 아래, 왼쪽 정렬 */}
          <label
            className="profile-card__editLink"
            style={{ opacity: loading ? 0.6 : 1 }}
          >
            {loading ? (
              <>
                <i className="fa-solid fa-spinner fa-spin" /> 업로드 중...
              </>
            ) : (
              <>
                <i className="fa-regular fa-pen-to-square" /> 프로필 사진 변경
              </>
            )}
            <input
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleFileChange}
              disabled={loading}
            />
          </label>
        </div>

        {/* 오른쪽: 이름/부서 */}
        <div className="profile-card__meta">
          <div className="profile-card__name">{displayName || "사용자"}</div>
          <div className="profile-card__dept">경영</div>
        </div>
      </div>

          

          {/* 가운데: 오늘의 일정 숫자 */}
          <div className="profile-card__metric">
            <div className="profile-card__metric-num">0</div>
            <div className="profile-card__metric-label">오늘의 일정</div>
          </div>

          {/* 하단 리스트 */}
          <ul className="profile-card__list">
            <li>
              <span>내 커뮤니티 새글</span>
              <b>0</b>
            </li>
            <li>
              <span>내 예약/대여 현황</span>
              <b>0</b>
            </li>
            <li>
              <span>참여할 설문</span>
              <b className="is-blue">1</b>
            </li>
            <li>
              <span>작성할 보고</span>
              <b className="is-blue">14</b>
            </li>
            <li>
              <span>결재할 문서</span>
              <b className="is-blue">1</b>
            </li>
            <li>
              <span>결재 수신 문서</span>
              <b>0</b>
            </li>
            <li>
              <span>내 잔여 연차</span>
              <b className="is-blue">5d</b>
            </li>
          </ul>

          {error && <p className="text--danger">{error}</p>}
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