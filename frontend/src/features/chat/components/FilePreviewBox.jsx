import React from "react";
import { Box, IconButton, Typography, Paper } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ImageIcon from "@mui/icons-material/Image";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";

// 파일 미리보기 컴포넌트
function FilePreviewBox({ files, onRemove }) {
  if (!files || files.length === 0) return null;

  const isImageFile = (file) => {
    return file.type && file.type.startsWith("image/");
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexWrap: "wrap",
        gap: 1,
        p: 2,
        borderTop: "1px solid #e3e8ef",
        background: "#fff",
        maxHeight: 200,
        overflowY: "auto",
      }}
    >
      {files.map((file, index) => (
        <Paper
          key={index}
          elevation={2}
          sx={{
            position: "relative",
            width: 120,
            height: 120,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
            borderRadius: 1,
          }}
        >
          {/* 삭제 버튼 */}
          <IconButton
            size="small"
            onClick={() => onRemove(index)}
            sx={{
              position: "absolute",
              top: 4,
              right: 4,
              bgcolor: "rgba(0,0,0,0.5)",
              color: "#fff",
              width: 24,
              height: 24,
              "&:hover": {
                bgcolor: "rgba(0,0,0,0.7)",
              },
            }}
          >
            <CloseIcon sx={{ fontSize: 16 }} />
          </IconButton>

          {/* 이미지 미리보기 */}
          {isImageFile(file) ? (
            <>
              <img
                src={URL.createObjectURL(file)}
                alt={file.name}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
              <Box
                sx={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  bgcolor: "rgba(0,0,0,0.6)",
                  color: "#fff",
                  p: 0.5,
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    fontSize: 10,
                    display: "block",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {file.name}
                </Typography>
                <Typography variant="caption" sx={{ fontSize: 9 }}>
                  {formatFileSize(file.size)}
                </Typography>
              </Box>
            </>
          ) : (
            <>
              <InsertDriveFileIcon sx={{ fontSize: 40, color: "#666", mb: 1 }} />
              <Typography
                variant="caption"
                sx={{
                  fontSize: 10,
                  textAlign: "center",
                  px: 0.5,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  width: "100%",
                }}
              >
                {file.name}
              </Typography>
              <Typography variant="caption" sx={{ fontSize: 9, color: "#999" }}>
                {formatFileSize(file.size)}
              </Typography>
            </>
          )}
        </Paper>
      ))}
    </Box>
  );
}

export default FilePreviewBox;

