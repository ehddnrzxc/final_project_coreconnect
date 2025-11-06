// MUI Snackbar용 커스텀 훅 (전역 알림 메시지 관리)
// - 어떤 페이지에서도 import 후 showSnack()을 호출하면 하단에 알림 표시 가능
// - Alert severity("success", "error", "info", "warning")와 함께 사용됨

import { useState, useCallback } from "react";

export default function useSnackbar() {
  /**
   * snack 상태 객체
   * - open: Snackbar가 열려 있는지 여부
   * - message: 표시할 텍스트 메시지
   * - severity: 알림 종류 (info, success, warning, error)
   */
  const [snack, setSnack] = useState({
    open: false,
    message: "",
    severity: "info",
  });

  /**
   * showSnack(message, severity)
   * Snackbar를 띄우는 함수
   * - message: 표시할 문구
   * - severity: 색상/종류 ('success' | 'error' | 'info' | 'warning')
   * 예: showSnack("등록 성공!", "success");
   *
   * useCallback으로 감싸서 불필요한 리렌더링 방지
   */
  const showSnack = useCallback((message, severity = "info") => {
    setSnack({ open: true, message, severity });
  }, []);

  /**
   * closeSnack()
   * Snackbar를 닫는 함수
   * - 자동 닫힘(autohide) 또는 닫기 버튼 클릭 시 호출됨
   * - open 값을 false로 변경하여 숨김 처리
   */
  const closeSnack = useCallback(() => {
    setSnack((prev) => ({ ...prev, open: false }));
  }, []);

  /**
   * 반환값
   * - snack: 현재 Snackbar 상태 객체
   * - showSnack: Snackbar 열기 함수
   * - closeSnack: Snackbar 닫기 함수
   *
   * 사용 예시:
   *   const { snack, showSnack, closeSnack } = useSnackbar();
   *   showSnack("일정 등록 완료!", "success");
   */
  return { snack, showSnack, closeSnack };
}