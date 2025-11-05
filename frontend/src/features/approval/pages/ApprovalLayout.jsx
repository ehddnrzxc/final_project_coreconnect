import { NavLink, Outlet } from "react-router-dom";
import "./ApprovalLayout.css";

/**
 * ApprovalLayout의 왼쪽 서브 사이드바 컴포넌트
 */
const ApprovalSidebar = () => {
  return (
    <aside className="e-approval-sidebar">
      {/* 새 결재 진행 버튼 */}
      {/* NavLink 대신 Link나 useNavigate를 사용할 수 있습니다. */}
      <NavLink to="/e-approval/new" className="btn-new-approval">
        <i className="fa-solid fa-plus" /> 새 결재 진행
      </NavLink>

      {/* 메뉴 그룹 1: 바로가기 */}
      <nav className="sub-nav">
        {/* 'end' prop은 /e-approval/new 등 하위 경로에서 '전자결재 홈'이 활성화되는 것을 방지합니다. */}
        <NavLink
          to="/e-approval"
          end
          className={({ isActive }) =>
            "sub-nav-item" + (isActive ? " active" : "")
          }
        >
          <i className="fa-solid fa-house" /> 전자결재 홈
        </NavLink>
        <NavLink
          to="/e-approval/forms"
          className={({ isActive }) =>
            "sub-nav-item" + (isActive ? " active" : "")
          }
        >
          <i className="fa-regular fa-file-lines" /> 자주 쓰는 양식
        </NavLink>
      </nav>

      {/* 메뉴 그룹 2: 결재하기 */}
      <div className="sub-nav-group">
        <h4 className="sub-nav-title">결재하기</h4>
        <NavLink to="/e-approval/pending" className="sub-nav-item">
          결재 대기 문서
        </NavLink>
        <NavLink to="/e-approval/received" className="sub-nav-item">
          결재 수신 문서
        </NavLink>
      </div>

      {/* 메뉴 그룹 3: 기안 문서함 */}
      <div className="sub-nav-group">
        <h4 className="sub-nav-title">기안 문서함</h4>
        <NavLink to="/e-approval/drafts" className="sub-nav-item">
          기안 문서함
        </NavLink>
        <NavLink to="/e-approval/completed" className="sub-nav-item">
          결재 완료함
        </NavLink>
        <NavLink to="/e-approval/rejected" className="sub-nav-item">
          반려 문서함
        </NavLink>
      </div>

      {/* 더 추가 할 것이 있으면 추가가가가가ㅏㅏㅏㅏㅏㅇㅇㅁㄴㄻㅇㄻㄴㅇㄻㄴㅇㄻㄴㅇㄻㄴㄹ */}
    </aside>
  );
};

/**
 * 전자결재 전체의 2단 레이아웃
 * App.jsx의 <Outlet> 안에 렌더링됩니다.
 */
const ApprovalLayout = () => {
  return (
    <div className="e-approval-layout">
      {/* 왼쪽: 서브 사이드바 */}
      <ApprovalSidebar />

      {/* 오른쪽: 메인 콘텐츠 (main.jsx의 자식 라우트가 여기 렌더링됨) */}
      <main className="e-approval-main">
        <Outlet />{" "}
        {/* 여기가 ApprovalHomePage, ApprovalWritePage 등으로 교체됨 */}
      </main>
    </div>
  );
};

export default ApprovalLayout;
