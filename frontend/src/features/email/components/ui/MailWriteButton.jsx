import React from "react";
import { Button } from "@mui/material";
import { useNavigate } from "react-router-dom";

/**
 * 메일쓰기 버튼 컴포넌트
 * 
 * @param {Object} props
 * @param {string} [props.to="/email/write"] - 이동할 경로 (기본값: /email/write)
 * @param {boolean} [props.fullWidth=true] - 버튼 전체 너비 사용 여부 (기본값: true)
 * @param {string} [props.size="small"] - 버튼 크기 (기본값: small)
 * @param {Object} [props.sx] - 추가 스타일
 * @param {Function} [props.onClick] - 클릭 핸들러 (기본 동작: navigate)
 * @param {string} [props.children="메일쓰기"] - 버튼 텍스트 (기본값: 메일쓰기)
 */
const MailWriteButton = ({
  to = "/email/write",
  fullWidth = true,
  size = "small",
  sx = {},
  onClick,
  children = "메일쓰기",
  ...otherProps
}) => {
  const navigate = useNavigate();

  const handleClick = (e) => {
    if (onClick) {
      onClick(e);
    } else {
      navigate(to);
    }
  };

  return (
    <Button
      variant="outlined"
      fullWidth={fullWidth}
      size={size}
      onClick={handleClick}
      sx={{
        fontWeight: 700,
        borderRadius: 2,
        bgcolor: "#f6f7fc",
        borderColor: "#e1e3ea",
        py: 1,
        ...sx,
      }}
      {...otherProps}
    >
      {children}
    </Button>
  );
};

export default MailWriteButton;

