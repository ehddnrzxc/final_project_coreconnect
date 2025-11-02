import React from "react";
import { useNavigate } from "react-router-dom";
import "./ApprovalLayout.css"; // 폼 스타일 등을 위해 재사용

const ApprovalWritePage = () => {
  const navigate = useNavigate();

  return (
    <div className="approval-write-page">
      <div className="dashboard-header">
        <h2>새 결재 진행</h2>
      </div>
      <div className="form-container">
        <h3>결재 양식 선택</h3>
        <p>여기서 양식 선택하고 문서 작성하는 곳임</p>

        <button
          className="btn btn--ghost"
          onClick={() => navigate("/e-approval")} // 홈으로 돌아가기
        >
          <i className="fa-solid fa-arrow-left" /> 목록으로 돌아가기
        </button>
      </div>
    </div>
  );
};

export default ApprovalWritePage;
