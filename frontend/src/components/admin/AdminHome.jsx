import React from "react";
import { Link } from "react-router-dom";
import "./admin.css";

function AdminHome() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const displayName = user?.name || "관리자";

  return (
    <section className="ccad">
      {/* 헤더 */}
      <header className="ccad__header">
        <h1 className="ccad__title">
          <i className="fa-solid fa-shield-halved" aria-hidden="true"></i>
          관리자 홈
        </h1>
        <p className="ccad__subtitle">
          안녕하세요 <strong>{displayName}</strong> 님, 시스템 현황과 관리 메뉴로 빠르게 이동하세요.
        </p>
        <div className="ccad__quick">
          <Link to="/admin/users/create" className="ccad-btn ccad-btn--primary">
            <i className="fa-solid fa-user-plus" aria-hidden="true"></i>
            <span>사용자 생성</span>
          </Link>
          <Link to="/admin/users" className="ccad-btn">
            <i className="fa-solid fa-users" aria-hidden="true"></i>
            <span>사용자 목록</span>
          </Link>
          <Link to="/admin/depts" className="ccad-btn">
            <i className="fa-solid fa-diagram-project" aria-hidden="true"></i>
            <span>부서 관리</span>
          </Link>
          <Link to="/admin/settings" className="ccad-btn">
            <i className="fa-solid fa-gear" aria-hidden="true"></i>
            <span>시스템 설정</span>
          </Link>
        </div>
      </header>

      {/* 카드 메트릭 */}
      <div className="ccad-cards">
        <div className="ccad-card">
          <div className="ccad-card__icon ccad-card__icon--blue">
            <i className="fa-solid fa-users" aria-hidden="true"></i>
          </div>
          <div>
            <div className="ccad-card__label">전체 사용자</div>
            <div className="ccad-card__value">1,248</div>
          </div>
        </div>

        <div className="ccad-card">
          <div className="ccad-card__icon ccad-card__icon--green">
            <i className="fa-solid fa-user-check" aria-hidden="true"></i>
          </div>
          <div>
            <div className="ccad-card__label">활성 사용자</div>
            <div className="ccad-card__value">1,103</div>
          </div>
        </div>

        <div className="ccad-card">
          <div className="ccad-card__icon ccad-card__icon--orange">
            <i className="fa-solid fa-building" aria-hidden="true"></i>
          </div>
          <div>
            <div className="ccad-card__label">부서 수</div>
            <div className="ccad-card__value">32</div>
          </div>
        </div>

        <div className="ccad-card">
          <div className="ccad-card__icon ccad-card__icon--red">
            <i className="fa-solid fa-triangle-exclamation" aria-hidden="true"></i>
          </div>
          <div>
            <div className="ccad-card__label">승인 대기</div>
            <div className="ccad-card__value">7</div>
          </div>
        </div>
      </div>

      {/* 최근 활동 & 빠른 관리 */}
      <div className="ccad-grid">
        <div className="ccad-panel">
          <div className="ccad-panel__head">
            <h3>최근 활동</h3>
            <Link to="/admin/logs" className="ccad-panel__more">
              전체보기 <i className="fa-solid fa-arrow-right" aria-hidden="true"></i>
            </Link>
          </div>

          <div className="ccad-tablewrap">
            <table className="ccad-table">
              <thead>
                <tr>
                  <th>시간</th>
                  <th>작업</th>
                  <th>대상</th>
                  <th>담당</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>10:12</td>
                  <td>사용자 생성</td>
                  <td>lee@coreconnect.co</td>
                  <td>관리자</td>
                </tr>
                <tr>
                  <td>09:55</td>
                  <td>권한 변경</td>
                  <td>kim@coreconnect.co</td>
                  <td>관리자</td>
                </tr>
                <tr>
                  <td>09:21</td>
                  <td>부서 추가</td>
                  <td>R&amp;D 2팀</td>
                  <td>관리자</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="ccad-panel">
          <div className="ccad-panel__head">
            <h3>빠른 관리</h3>
          </div>
          <ul className="ccad-quicklist">
            <li>
              <Link to="/admin/users/create">
                <i className="fa-solid fa-user-plus" aria-hidden="true"></i>
                새 사용자 등록
              </Link>
            </li>
            <li>
              <Link to="/admin/depts">
                <i className="fa-solid fa-diagram-project" aria-hidden="true"></i>
                부서 트리 편집
              </Link>
            </li>
            <li>
              <Link to="/admin/settings">
                <i className="fa-solid fa-lock" aria-hidden="true"></i>
                권한/보안 정책
              </Link>
            </li>
            <li>
              <Link to="/admin/logs">
                <i className="fa-solid fa-file-lines" aria-hidden="true"></i>
                감사 로그
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}

export default AdminHome;
