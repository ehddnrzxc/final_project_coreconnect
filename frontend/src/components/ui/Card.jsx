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
      p: 3,
      minWidth: 320,
      display: "flex",
      flexDirection: "column",
      height: "100%",
      ...sx,
    }}
  >
    {(title || right) && (
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
          flexShrink: 0,
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
    <CardContent 
      sx={{ 
        p: 0,
        flex: 1,
        overflow: "visible",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {children}
    </CardContent>
  </MuiCard>
);

export default Card;