import React from "react";
import { Box, Typography } from "@mui/material";

function MyDocumentsPage() {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        내 상신함
      </Typography>
      <Typography variant="body1">
        내가 상신한 문서 목록이 여기에 표시됩니다.
      </Typography>
    </Box>
  );
}

export default MyDocumentsPage;