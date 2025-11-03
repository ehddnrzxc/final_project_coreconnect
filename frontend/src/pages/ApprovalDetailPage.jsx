import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import http from "../api/http.js"; 
import "./ApprovalDetailPage.css"; // (CSS 파일)

// 날짜/시간 포맷팅 헬퍼 ("2025-11-03T10:30:00" -> "2025-11-03 10:30")
const formatDateTime = (dateTimeString) => {
  if (!dateTimeString) return "";
  return dateTimeString.replace("T", " ");
};

// 결재선 상태(Enum) 한글 변환
const mapApprovalStatusToKorean = (status) => {
  switch (status) {
    case "WAITING":
      return "대기";
    case "APPROVED":
      return "승인";
    case "REJECTED":
      return "반려";
    default:
      return status;
  }
};

const ApprovalDetailPage = () => {
  // 1. URL 경로에서 :documentId 값을 가져옵니다.
  const { documentId } = useParams(); 
  
  const [doc, setDoc] = useState(null); // DocumentDetailResponseDTO
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 2. documentId를 기반으로 API 호출
  useEffect(() => {
    const fetchDocumentDetail = async () => {
      try {
        setLoading(true);
        setError(null);

        // 백엔드 상세 조회 API 호출
        // GET /api/v1/approvals/{documentId}
        const response = await http.get(`/approvals/${documentId}`);
        
        setDoc(response.data); // state에 DTO 저장
      } catch (err) {
        setError("문서를 불러오는 데 실패했습니다.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDocumentDetail();
  }, [documentId]); // documentId가 바뀔 때마다 다시 호출

  // 3. 로딩 및 에러 UI
  if (loading) {
    return <div className="approval-detail-container"><p>상세 문서를 불러오는 중입니다...</p></div>;
  }
  if (error) {
    return <div className="approval-detail-container"><p style={{ color: "red" }}>{error}</p></div>;
  }
  if (!doc) {
    return <div className="approval-detail-container"><p>문서 정보가 없습니다.</p></div>;
  }

  // 4. 상세 DTO(doc)를 사용한 상세 페이지 렌더링
  return (
    <div className="approval-detail-container">
      <div className="detail-header">
        <Link to="/e-approval" className="btn btn--text">
          &lt; 목록으로
        </Link>
        <div className="detail-header-buttons">
          <button className="btn btn--outline">승인(바뀔예정이에요)</button>
          <button className="btn btn--danger">반려(바뀔예정)</button>
        </div>
      </div>

      <div className="document-info-box">
        {/* 결재선 표시 */}
        <div className="approval-line-display">
          {/* DTO 구조에 맞게 중첩 객체(approver)에 접근합니다. */}
          {doc.approvalLines && doc.approvalLines.length > 0 ? (
            doc.approvalLines.map((line) => (
              <div
                // line.approvalLineId (또는 DTO의 고유 ID)
                key={line.approvalLineId} 
                className="approver-box"
                data-status={line.status} 
              >
                <div className="approver-status">
                  {mapApprovalStatusToKorean(line.status)}
                </div>
                {/* line.approver.userName으로 접근 */}
                <div className="approver-name">{line.approver.userName}</div>
                {/* line.approver.deptName으로 접근 */}
                <div className="approver-position">{line.approver.deptName}</div>
                
                {line.approvedAt && (
                  <div className="approver-date">
                    {formatDateTime(line.approvedAt)}
                  </div>
                )}
              </div>
            ))
          ) : (
            <p style={{ padding: "16px", color: "#888" }}>결재선 정보가 없습니다.</p>
          )}
        </div>

        {/* 문서 기본 정보 */}
        <div className="document-meta">
          <div className="meta-row">
            <span className="meta-label">문서제목</span>
            <span className="meta-value">{doc.documentTitle}</span>
          </div>
          <div className="meta-row">
            <span className="meta-label">기안자</span>
            {/* 기안자 정보도 중첩 객체(writer)이므로 수정 */}
            <span className="meta-value">{doc.writer.userName} ({doc.writer.deptName})</span>
          </div>
          <div className="meta-row">
            <span className="meta-label">기안일</span>
            <span className="meta-value">{formatDateTime(doc.createdAt)}</span>
          </div>
          <div className="meta-row">
            <span className="meta-label">결재양식</span>
            <span className="meta-value">{doc.templateName}</span>
          </div>
        </div>
      </div>

      {/* 문서 본문 (HTML 렌더링) */}
      <div className="document-content-wrapper">
        <div 
          className="document-content" 
          dangerouslySetInnerHTML={{ __html: doc.documentContent }} 
        />
      </div>

      {/* 첨부 파일 목록 */}
      {doc.files && doc.files.length > 0 && (
        <div className="document-files-wrapper">
          <h4>첨부파일</h4>
          <ul>
            {doc.files.map((file) => (
              // 파일 DTO의 고유 ID (fileId 또는 fileUrl)로 key 설정
              <li key={file.fileId || file.fileUrl}>
                <a href={file.fileUrl} target="_blank" rel="noopener noreferrer">
                  {file.fileName} ({Math.round(file.fileSize / 1024)} KB)
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ApprovalDetailPage;