import { Link } from "react-router-dom";
import "./ApprovalLayout.css";
import { useState, useEffect } from "react";
import http from "../api/http.js"; // 예: src/api/http.js

// 1. 날짜 포맷팅 헬퍼 함수
// "2025-11-03T10:30:00" -> "2025-11-03"
const formatDate = (dateTimeString) => {
  if (!dateTimeString) return "";
  return dateTimeString.split("T")[0];
};

// 2. 상태(Enum) 한글 변환 헬퍼 함수 (Enum 정보 반영)
const mapStatusToKorean = (statusEnum) => {
  switch (statusEnum) {
    case "IN_PROGRESS":
      return "진행중";
    case "DRAFT":
      return "임시저장";
    case "COMPLETED":
      return "완료";
    case "REJECTED":
      return "반려";
    default:
      return statusEnum; // 모르는 값은 Enum 이름 그대로 표시
  }
};

/**
 * 테이블을 그리는 재사용 컴포넌트
 */
const ApprovalTable = ({ title, docs }) => (
  <section className="approval-section">
    <div className="section-header">
      <h3>
        {title} <i className="fa-solid fa-circle-info"></i>
      </h3>
      <Link to="#" className="text-muted">
        더보기 +
      </Link>
    </div>
    <div className="table-wrapper">
      <table className="approval-table-compact">
        <thead>
          <tr>
            <th>기안일</th>
            <th>결재양식</th>
            <th>제목</th>
            <th>기안자</th>
            <th>결재상태</th>
          </tr>
        </thead>
        <tbody>
          {docs.length === 0 ? (
            <tr>
              <td colSpan="5" className="no-data">
                결재 문서가 없습니다.
              </td>
            </tr>
          ) : (
            docs.map((doc) => (
              <tr key={doc.documentId}>
                {/* 1. 기안일 (createdAt) */}
                <td>{formatDate(doc.createdAt)}</td>

                {/* 2. 결재양식 (templateName) - DTO에 추가한 필드 */}
                <td>{doc.templateName}</td>

                {/* 3. 제목 (documentTitle) */}
                <td>
                  <Link to={`/e-approval/doc/${doc.documentId}`}>
                    {doc.documentTitle}
                  </Link>
                </td>

                {/* 4. 기안자 (writerName) - (기존 '결재선' 대신 기안자 표시) */}
                <td>{doc.writerName}</td>

                {/* 5. 결재상태 (documentStatus) */}
                <td>
                  <span
                    className={`status-badge ${
                      doc.documentStatus === "IN_PROGRESS"
                        ? "status--pending" // 진행중
                        : doc.documentStatus === "REJECTED"
                        ? "status--danger" // 반려
                        : doc.documentStatus === "COMPLETED"
                        ? "status--completed" // 완료
                        : "" // 임시저장(DRAFT) 등
                    }`}
                  >
                    {mapStatusToKorean(doc.documentStatus)}
                  </span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  </section>
);

/**
 * "전자결재 홈" 대시보드 페이지
 */
const ApprovalHomePage = () => {
  const [pendingDocs, setPendingDocs] = useState([]);
  const [completedDocs, setCompletedDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // API 호출 로직 (두 API를 동시에 호출)
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // 1. 두 개의 API를 동시에 병렬로 호출 (Promise.all)
        // http.js의 baseURL(/api/v1)과 컨트롤러(@RequestMapping)가 조합됨
        const [pendingResponse, completedResponse] = await Promise.all([
          http.get("/approvals/my-documents/pending"), // 1. 진행중 API
          http.get("/approvals/my-documents/completed"), // 2. 완료 API
        ]);

        // 2. 받아온 데이터를 state에 바로 저장 (필터링 필요 없음)
        setPendingDocs(pendingResponse.data);
        setCompletedDocs(completedResponse.data);

      } catch (err) {
        // http.js가 401을 처리하므로, 여기서는 500, 404 등 다른 에러가 잡힙니다.
        setError("데이터를 불러오는 데 실패했습니다.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []); // [] : 컴포넌트가 처음 마운트될 때 딱 한 번만 실행

  // 로딩 UI
  if (loading) {
    return (
      <div className="approval-dashboard">
        <div className="dashboard-header">
          <h2>전자결재 홈</h2>
        </div>
        <p>데이터를 불러오는 중입니다...</p>
      </div>
    );
  }

  // (추가) 에러 UI
  if (error) {
    return (
      <div className="approval-dashboard">
        <div className="dashboard-header">
          <h2>전자결재 홈</h2>
        </div>
        <p style={{ color: "red" }}>{error}</p>
      </div>
    );
  }

  // (수정) 렌더링 부분 (isCompleted prop 제거)
  return (
    <div className="approval-dashboard">
      <div className="dashboard-header">
        <h2>전자결재 홈</h2>
        <button className="btn btn--ghost">
          <i className="fa-solid fa-ellipsis"></i>
        </button>
      </div>

      {/* '기안 진행 문서' 테이블 (DRAFT, IN_PROGRESS) */}
      <ApprovalTable title="기안 진행 문서" docs={pendingDocs} />

      {/* '완료 문서' 테이블 (COMPLETED, REJECTED) */}
      <ApprovalTable title="완료 문서" docs={completedDocs} />
    </div>
  );
};

export default ApprovalHomePage;