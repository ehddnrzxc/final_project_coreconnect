import React, { useState } from "react";
import {
  Dialog,
  IconButton,
  Box,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";

// 이미지 캐러셀 다이얼로그
function ImageCarouselDialog({ open, onClose, images, currentIndex = 0 }) {
  const [activeIndex, setActiveIndex] = useState(currentIndex);

  React.useEffect(() => {
    setActiveIndex(currentIndex);
  }, [currentIndex, open]);

  if (!images || images.length === 0) return null;

  const handlePrevious = () => {
    setActiveIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: "rgba(0,0,0,0.9)",
          maxHeight: "90vh",
        },
      }}
    >
      <Box sx={{ position: "relative", width: "100%", height: "90vh" }}>
        {/* 닫기 버튼 */}
        <IconButton
          onClick={onClose}
          sx={{
            position: "absolute",
            top: 16,
            right: 16,
            zIndex: 10,
            color: "#fff",
            bgcolor: "rgba(0,0,0,0.5)",
            "&:hover": {
              bgcolor: "rgba(0,0,0,0.7)",
            },
          }}
        >
          <CloseIcon />
        </IconButton>

        {/* 이전 버튼 */}
        {images.length > 1 && (
          <IconButton
            onClick={handlePrevious}
            sx={{
              position: "absolute",
              left: 16,
              top: "50%",
              transform: "translateY(-50%)",
              zIndex: 10,
              color: "#fff",
              bgcolor: "rgba(0,0,0,0.5)",
              "&:hover": {
                bgcolor: "rgba(0,0,0,0.7)",
              },
            }}
          >
            <ArrowBackIosIcon />
          </IconButton>
        )}

        {/* 이미지 */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
            p: 4,
          }}
        >
          <img
            src={images[activeIndex]}
            alt={`이미지 ${activeIndex + 1}`}
            style={{
              maxWidth: "100%",
              maxHeight: "100%",
              objectFit: "contain",
            }}
          />
        </Box>

        {/* 다음 버튼 */}
        {images.length > 1 && (
          <IconButton
            onClick={handleNext}
            sx={{
              position: "absolute",
              right: 16,
              top: "50%",
              transform: "translateY(-50%)",
              zIndex: 10,
              color: "#fff",
              bgcolor: "rgba(0,0,0,0.5)",
              "&:hover": {
                bgcolor: "rgba(0,0,0,0.7)",
              },
            }}
          >
            <ArrowForwardIosIcon />
          </IconButton>
        )}

        {/* 이미지 인덱스 표시 */}
        {images.length > 1 && (
          <Box
            sx={{
              position: "absolute",
              bottom: 16,
              left: "50%",
              transform: "translateX(-50%)",
              bgcolor: "rgba(0,0,0,0.5)",
              color: "#fff",
              px: 2,
              py: 1,
              borderRadius: 2,
            }}
          >
            <Typography variant="body2">
              {activeIndex + 1} / {images.length}
            </Typography>
          </Box>
        )}
      </Box>
    </Dialog>
  );
}

export default ImageCarouselDialog;

