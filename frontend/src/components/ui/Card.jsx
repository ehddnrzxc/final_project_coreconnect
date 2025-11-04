import React from "react";
import {
  Card as MuiCard,
  CardContent,
  Box,
  Typography,
} from "@mui/material";

const Card = ({ title, right, children, sx }) => (
  <MuiCard
    variant="outlined"
    sx={{
      borderRadius: 2,
      boxShadow: 1,
      p: 2,
      height: "100%",
      display: "flex",
      flexDirection: "column",
      ...sx,
    }}
  >
    {(title || right) && (
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 1.5,
        }}
      >
        {title && (
          <Typography variant="subtitle1" fontWeight={600}>
            {title}
          </Typography>
        )}
        {right && <Box>{right}</Box>}
      </Box>
    )}
    <CardContent sx={{ p: 0, flex: 1 }}>{children}</CardContent>
  </MuiCard>
);

export default Card;