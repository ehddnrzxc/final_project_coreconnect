import React from "react";
import { Link } from "react-router-dom";
import "./admin.css";

function AdminHome() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  return (
    <section className="admin-home">
      {/* 헤드 */}
      <header className="admin-home__header">
        <h1 className="admin-home__title">
          <i className="fa-solid fa-shield-halved"></i>
          관리자 홈
        </h1>
        <p className="admin-home__subtitle">
          안녕하세요 {user?.name ? <strong>{user.name}</strong> : "관리자"} 님,
          시스템 현황과 관리 메뉴로 빠르게 이동하세요.
        </p>
        <div className="admin-home__quick">
          <Link to="/admin/users/create" className="btn btn--primary">
            <i className="fa-solid fa-user-plus"></i> 사용자 생성
          </Link>
          <Link to="/admin/users" className="btn">
            <i className="fa-solid fa-users"></i> 사용자 목록
          </Link>
          <Link to="/admin/depts" className="btn">
            <i className="fa-solid fa-diagram-project"></i> 부서 관리
          </Link>
          <Link to="/admin/settings" className="btn">
            <i className="fa-solid fa-gear"></i> 시스템 설정
          </Link>
        </div>
      </header>

      {/* 카드 메트릭 */}
      <div className="cards">
        <div className="card">
          <div className="card__icon card__icon--blue">
            <i className="fa-solid fa-users"></i>
          </div>
          <div className="card__meta">
            <div className="card__label">전체 사용자</div>
            <div className="card__value">1,248</div>
          </div>
        </div>

        <div className="card">
          <div className="card__icon card__icon--green">
            <i className="fa-solid fa-user-check"></i>
          </div>
          <div className="card__meta">
            <div className="card__label">활성 사용자</div>
            <div className="card__value">1,103</div>
          </div>
        </div>

        <div className="card">
          <div className="card__icon card__icon--orange">
            <i className="fa-solid fa-building"></i>
          </div>
          <div className="card__meta">
            <div className="card__label">부서 수</div>
            <div className="card__value">32</div>
          </div>
        </div>

        <div className="card">
          <div className="card__icon card__icon--red">
            <i className="fa-solid fa-triangle-exclamation"></i>
          </div>
          <div className="card__meta">
            <div className="card__label">승인 대기</div>
            <div className="card__value">7</div>
          </div>
        </div>
      </div>

      {/* 최근 활동 + 빠른 링크 */}
      <div className="grid">
        <div className="panel">
          <div className="panel__head">
            <h3>최근 활동</h3>
            <Link to="/admin/logs" className="panel__more">
              전체보기 <i className="fa-solid fa-arrow-right"></i>
            </Link>
          </div>
          <table className="table">
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
                <td>R&D 2팀</td>
                <td>관리자</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="panel">
          <div className="panel__head">
            <h3>빠른 관리</h3>
          </div>
          <ul className="quicklist">
            <li>
              <Link to="/admin/users/create">
                <i className="fa-solid fa-user-plus"></i> 새 사용자 등록
              </Link>
            </li>
            <li>
              <Link to="/admin/depts">
                <i className="fa-solid fa-diagram-project"></i> 부서 트리 편집
              </Link>
            </li>
            <li>
              <Link to="/admin/settings">
                <i className="fa-solid fa-lock"></i> 권한/보안 정책
              </Link>
            </li>
            <li>
              <Link to="/admin/logs">
                <i className="fa-solid fa-file-lines"></i> 감사 로그
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}

export default AdminHome;