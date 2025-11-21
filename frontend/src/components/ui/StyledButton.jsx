import React from "react";
import { Button } from "@mui/material";

/**
 * 스타일이 적용된 버튼 컴포넌트
 * MailWriteButton의 디자인과 모양을 따온 범용 버튼 컴포넌트
 * 
 * @param {Object} props
 * @param {boolean} [props.fullWidth=true] - 버튼 전체 너비 사용 여부 (기본값: true)
 * @param {string} [props.size="small"] - 버튼 크기 (기본값: small)
 * @param {string} [props.variant="outlined"] - 버튼 variant (기본값: outlined)
 * @param {Object} [props.sx] - 추가 스타일
 * @param {Function} [props.onClick] - 클릭 핸들러
 * @param {React.ReactNode} [props.children] - 버튼 내용
 */
const StyledButton = ({
  fullWidth = true,
  size = "small",
  variant = "outlined",
  sx = {},
  onClick,
  children,
  ...otherProps
}) => {
  return (
    <Button
      variant={variant}
      fullWidth={fullWidth}
      size={size}
      onClick={onClick}
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

export default StyledButton;

