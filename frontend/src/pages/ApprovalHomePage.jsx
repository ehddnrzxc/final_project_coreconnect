import { Link } from 'react-router-dom';
import './ApprovalLayout.css';

// 임시 목업 데이터
const pendingDocs = [
  { id: 101, date: '2025-10-29', form: '휴가신청서', title: '휴가신청서', line: '홍길동 > 김팀장', status: '진행중' },
  { id: 102, date: '2025-10-28', form: '차량운행일지', title: '차량운행일지', line: '홍길동 > 김팀장', status: '진행중' },
  { id: 103, date: '2025-10-27', form: '휴가신청', title: '휴가신청', line: '홍길동 > 김팀장', status: '진행중' },
];

const completedDocs = [
  { id: 201, date: '2025-10-22', form: '개인경비 사용내역서', title: '개인경비 사용내역서', docId: '다우오피스 4.0-2025-00231', status: '편집' },
  { id: 202, date: '2025-10-27', form: '사무용품신청', title: '사무용품신청', docId: '다우오피스 4.0-2025-00229', status: '편집' },
  { id: 203, date: '2025-10-27', form: '월간근무표', title: '월간근무표', docId: '다우오피스 4.0-2025-00228', status: '편집' },
];

/**
 * 테이블을 그리는 재사용 컴포넌트 (선택 사항)
 */
const ApprovalTable = ({ title, docs, isCompleted = false }) => (
  <section className="approval-section">
    <div className="section-header">
      <h3>{title} <i className="fa-solid fa-circle-info"></i></h3>
      <Link to="#" className="text-muted">더보기 +</Link>
    </div>
    <div className="table-wrapper">
      <table className="approval-table-compact">
        <thead>
          <tr>
            <th>기안일</th>
            <th>결재양식</th>
            <th>제목</th>
            {isCompleted ? <th>문서번호</th> : <th>결재선</th>}
            <th>{isCompleted ? '수정' : '첨부'}</th>
            <th>결재상태</th>
          </tr>
        </thead>
        <tbody>
          {docs.length === 0 ? (
            <tr>
              <td colSpan="6" className="no-data">결재 문서가 없습니다.</td>
            </tr>
          ) : (
            docs.map(doc => (
              <tr key={doc.id}>
                <td>{doc.date}</td>
                <td>{doc.form}</td>
                {/* main.jsx에 정의한 상세 페이지 라우트(/doc/:id)로 링크 */}
                <td><Link to={`/e-approval/doc/${doc.id}`}>{doc.title}</Link></td>
                <td>{isCompleted ? doc.docId : doc.line}</td>
                <td>{isCompleted ? <span className="status-badge status--edit">{doc.status}</span> : ''}</td>
                <td>
                  <span className={`status-badge ${!isCompleted ? 'status--pending' : ''}`}>
                    {isCompleted ? '' : doc.status}
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
  return (
    <div className="approval-dashboard">
      <div className="dashboard-header">
        <h2>전자결재 홈</h2>
        <button className="btn btn--ghost">
          <i className="fa-solid fa-ellipsis"></i>
        </button>
      </div>

      {/* 데이터가 없을 때 표시 (임시) */}
      {/* <p className="text-muted">결재 문서가 없습니다.</p> */}

      {/* "기안 진행 문서" 테이블 */}
      <ApprovalTable title="기안 진행 문서" docs={pendingDocs} />

      {/* "완료 문서" 테이블 */}
      <ApprovalTable title="완료 문서" docs={completedDocs} isCompleted={true} />
    </div>
  );
};

export default ApprovalHomePage;
