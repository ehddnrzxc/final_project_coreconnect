import React, { useRef, useEffect, useContext } from "react";
import { Box, Typography, Link, Avatar } from "@mui/material";
import { UserProfileContext } from "../../../App";

// 첨부파일 유형 이미지 감지
const isImageFile = (url = "") => {
  if (!url) return false;
  const cleanUrl = url.split("?")[0].toLowerCase();
  return /\.(png|jpe?g|gif|bmp|webp|svg)$/i.test(cleanUrl);
};

// 시간 포맷 변환 (예: "오후 02:26")
const formatTime = (time) => {
  if (!time) return "";
  const date = new Date(time);
  if (Number.isNaN(date.getTime())) return time;
  return date.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
};

function ChatMessageList({ messages, roomType = "group", onLoadMore, hasMoreAbove, loadingAbove }) {
  // 👇 로그인 정보 받기!
  const { userProfile } = useContext(UserProfileContext) || {};
  const userEmail = userProfile?.email;
  
  const scrollRef = useRef();

  // 무한 스크롤(위로 올릴 때 loadMore)
  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el || !onLoadMore || !hasMoreAbove || loadingAbove) return;
    if (el.scrollTop <= 24) onLoadMore && onLoadMore();
  };

  // 새 메시지 오면 항상 맨 아래로 스크롤
  useEffect(() => {
    const el = scrollRef.current;
    if (el && messages.length > 0) el.scrollTop = el.scrollHeight;
  }, [messages]);

  return (
    <Box
      ref={scrollRef}
      onScroll={handleScroll}
      sx={{
        // 채팅 영역을 고정 높이로, 내부 스크롤 적용
        height: "55vh",
        maxHeight: 600,
        overflowY: "auto",
        background: "#fafbff",
        px: 3,
        pt: 2,
        pb: 2,
      }}
    >
      {/* 로딩 상태 표시 (무한스크롤용) */}
      {loadingAbove && (
        <Box sx={{ textAlign: "center", py: 1, color: "#889" }}>불러오는 중...</Box>
      )}

      {/* 메시지가 없을 때 안내 */}
      {(!messages || messages.length === 0) ? (
        <Box sx={{ minHeight: 320, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Typography sx={{ color: "text.disabled", fontSize: 16, textAlign: "center" }}>
            아직 메시지가 없습니다.<br />
            메시지를 입력해 대화를 시작해보세요.
          </Typography>
        </Box>
      ) : (
        // 메시지 목록 map
        messages.map((msg, idx) => {
          // ⭐ 내 메시지 판별 로직
          // 1순위: senderEmail로 비교 (가장 정확함) - 백엔드에서 항상 포함하도록 수정됨
          // 2순위: senderEmail이 없을 경우 senderId로 비교 (fallback - 비권장)
          // 대소문자/공백 차이를 방지하기 위해 trim().toLowerCase() 적용
          let isMine = false;
          
          if (msg.senderEmail && userEmail) {
            // ✅ senderEmail이 있으면 이메일로 비교 (가장 정확한 방법)
            // 백엔드에서 모든 메시지에 senderEmail을 명시적으로 설정하도록 수정됨
            isMine = msg.senderEmail.trim().toLowerCase() === userEmail.trim().toLowerCase();
          } else if (msg.senderId && userProfile) {
            // ⚠️ Fallback: senderEmail이 없을 경우 senderId로 비교
            // 주의: 이 방법은 덜 정확할 수 있으므로 백엔드에서 senderEmail을 항상 포함하도록 수정 필요
            // userProfile.id 또는 userProfile.userId 등 사용 가능한 필드 확인 필요
            const userId = userProfile.id || userProfile.userId;
            if (userId) {
              isMine = msg.senderId === userId;
              console.warn("⚠️ senderEmail이 없어 senderId로 판별합니다 (fallback):", {
                senderId: msg.senderId,
                userId: userId,
                senderName: msg.senderName,
                senderEmail: msg.senderEmail
              });
            }
          }
          
          // ⚠️ 디버깅용 콘솔 로그 (senderEmail이 없을 때만 출력)
          // 백엔드 수정 후에는 이 로그가 나타나지 않아야 함
          if (!msg.senderEmail) {
            console.error("❌ MSG에 senderEmail이 없습니다! 백엔드 수정 필요:", {
              senderName: msg.senderName,
              senderEmail: msg.senderEmail,
              senderId: msg.senderId,
              userEmail: userEmail,
              userProfile: userProfile,
              isMine: isMine
            });
          }

          // ========== 내가 보낸 메시지 (오른쪽, 이름 없음, 파란 테마) ==========
          if (isMine) {
            return (
              <Box
                key={msg.id ?? idx}
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-end",
                  mb: 2,
                  textAlign: "right",
                }}
              >
                <Box
                  sx={{
                    // 밝은 파란색 배경, 파란색 글씨로 스타일링
                    bgcolor: "#e3f2fd",
                    color: "#1976d2",
                    borderRadius: 2,
                    px: 2,
                    py: 1.2,
                    maxWidth: 380,
                    minWidth: 120,
                    wordBreak: "break-word",
                    boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.03)",
                  }}
                >
                  {/* 메시지 내용 */}
                  {msg.messageContent && (
                    <Typography sx={{ color: "#1976d2" }}>
                      {msg.messageContent}
                    </Typography>
                  )}

                  {/* 첨부파일(이미지/파일 링크, 색상은 유지) */}
                  {msg.fileYn && msg.fileUrl && (
                    isImageFile(msg.fileUrl) ? (
                      <Box
                        component="img"
                        src={msg.fileUrl}
                        alt="첨부 이미지"
                        sx={{
                          width: "100%",
                          maxWidth: 280,
                          borderRadius: 1.5,
                          border: "1px solid #e1e4eb",
                          objectFit: "cover",
                          mt: 1
                        }}
                      />
                    ) : (
                      <Box
                        sx={{
                          bgcolor: "#fff",
                          border: "1px solid #90caf9",
                          borderRadius: 1.5,
                          px: 1.5,
                          py: 0.8,
                          mt: 1
                        }}
                      >
                        <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 0.5, color: "#1976d2" }}>
                          첨부 파일
                        </Typography>
                        <Link
                          href={msg.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          underline="hover"
                          sx={{ fontSize: 13, wordBreak: "break-all", color: "#1976d2" }}
                        >
                          {decodeURIComponent(msg.fileUrl.split("/").pop()?.split("?")[0] || "파일 다운로드")}
                        </Link>
                      </Box>
                    )
                  )}
                </Box>

                {/* 전송 시간 (하단) */}
                <Typography sx={{ fontSize: 12, color: "#90caf9", mt: 0.5 }}>
                  {formatTime(msg.sendAt)}
                </Typography>
              </Box>
            );
          }

          // ========== 상대방 메시지 (왼쪽, 이름/프로필/회색 테마) ==========
          return (
            <Box
              key={msg.id ?? idx}
              sx={{
                display: "flex",
                alignItems: "flex-start",
                gap: 1.5,
                mb: 2,
              }}
            >
              {/* 프로필 아바타 - user_profile_image_key에서 가져온 이미지 표시 */}
              <Avatar
                src={msg.senderProfileImageUrl ? msg.senderProfileImageUrl : undefined}
                sx={{
                  bgcolor: "#bdbdbd",
                  width: 36,
                  height: 36,
                  fontSize: 16,
                  fontWeight: 700,
                  color: "#212121",
                }}
                imgProps={{
                  onError: (e) => {
                    // 이미지 로드 실패 시 fallback 처리
                    e.target.style.display = 'none';
                  }
                }}
              >
                {(!msg.senderProfileImageUrl || msg.senderProfileImageUrl.trim() === '') && (msg.senderName?.[0]?.toUpperCase() || "?")}
              </Avatar>

              <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                {/* 이름(어두운 회색) */}
                <Typography sx={{ fontSize: 13, fontWeight: 700, color: "#212121", mb: 0.5 }}>
                  {msg.senderName}
                  {roomType === "group" && msg.senderTitle ? ` (${msg.senderTitle})` : ""}
                </Typography>

                <Box
                  sx={{
                    bgcolor: "#f5f5f5",
                    color: "#212121",
                    borderRadius: 2,
                    px: 2,
                    py: 1.2,
                    maxWidth: 380,
                    minWidth: 120,
                    wordBreak: "break-word",
                    boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.03)",
                  }}
                >
                  {/* 메시지 내용(어두운 회색) */}
                  {msg.messageContent && (
                    <Typography sx={{ color: "#212121" }}>
                      {msg.messageContent}
                    </Typography>
                  )}

                  {/* 첨부파일 (배경색은 유지) */}
                  {msg.fileYn && msg.fileUrl && (
                    isImageFile(msg.fileUrl) ? (
                      <Box
                        component="img"
                        src={msg.fileUrl}
                        alt="첨부 이미지"
                        sx={{
                          width: "100%",
                          maxWidth: 280,
                          borderRadius: 1.5,
                          border: "1px solid #bdbdbd",
                          objectFit: "cover",
                          mt: 1
                        }}
                      />
                    ) : (
                      <Box
                        sx={{
                          bgcolor: "#eeeeee",
                          border: "1px solid #ccc",
                          borderRadius: 1.5,
                          px: 1.5,
                          py: 0.8,
                          mt: 1
                        }}
                      >
                        <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 0.5, color: "#212121" }}>
                          첨부 파일
                        </Typography>
                        <Link
                          href={msg.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          underline="hover"
                          sx={{ fontSize: 13, wordBreak: "break-all", color: "#1565c0" }}
                        >
                          {decodeURIComponent(msg.fileUrl.split("/").pop()?.split("?")[0] || "파일 다운로드")}
                        </Link>
                      </Box>
                    )
                  )}
                </Box>

                {/* 전송 시간 (하단) */}
                <Typography sx={{ fontSize: 12, color: "#757575", mt: 0.5 }}>
                  {formatTime(msg.sendAt)}
                </Typography>
              </Box>
            </Box>
          );
        })
      )}
    </Box>
  );
}

export default ChatMessageList;
