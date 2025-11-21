import React from "react";
import { FormControl, Select, MenuItem, Box, Tooltip } from "@mui/material";
import PaletteIcon from "@mui/icons-material/Palette";

export default function ThemeSelect({
  themeMode,
  themeOptions,
  onThemeChange,
}) {
  return (
    <Tooltip title="테마 변경" arrow>
      <FormControl size="small" sx={{ minWidth: 120 }}>
        <Select
          value={themeMode}
          onChange={(e) => onThemeChange(e.target.value)}
          sx={{
            height: 36,
            fontSize: "0.875rem",
            "& .MuiOutlinedInput-notchedOutline": {
              borderColor: "#e5e7eb",
            },
            "&:hover .MuiOutlinedInput-notchedOutline": {
              borderColor: "#e5e7eb",
            },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderColor: "#00a0e9",
            },
          }}
          startAdornment={
            <Box sx={{ display: "flex", alignItems: "center", mr: 1 }}>
              <PaletteIcon
                sx={{ fontSize: 18, color: "text.secondary", mr: 0.5 }}
              />
            </Box>
          }
        >
          {themeOptions &&
            Object.entries(themeOptions).map(([key, theme]) => (
              <MenuItem key={key} value={key}>
                {theme.name}
              </MenuItem>
            ))}
        </Select>
      </FormControl>
    </Tooltip>
  );
}

