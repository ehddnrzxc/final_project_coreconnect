import React from "react";
import { Box, Typography } from "@mui/material";

function MyDraftsPage() {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        임시저장함
      </Typography>
      <Typography variant="body1">
        작성 중 임시저장한 문서 목록이 여기에 표시됩니다.
      </Typography>
    </Box>
  );
}

export default MyDraftsPage;