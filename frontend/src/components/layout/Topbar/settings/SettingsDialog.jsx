import React, { useMemo } from "react";
import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  useTheme,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import OverviewView from "./OverviewView";
import SecurityView from "./SecurityView";
import ProfileDetailView from "./ProfileDetailView";
import PasswordManagement from "../../../../features/user/components/PasswordManagement";

export default function SettingsDialog({
  open,
  onClose,
  settingsView,
  onViewChange,
  // ProfileDetailView props
  avatarUrl,
  userName,
  displayedDept,
  displayedJobGrade,
  displayedEmail,
  userProfile,
  userEmail,
  // PasswordManagement props
  theme,
}) {
  const muiTheme = useTheme();

  const leftMenuItems = useMemo(
    () => [
      { key: "overview", label: "내 정보 관리" },
      { key: "security", label: "보안설정" },
    ],
    []
  );

  const getActiveViewContent = () => {
    if (settingsView === "profileDetail") {
      return (
        <ProfileDetailView
          avatarUrl={avatarUrl}
          userName={userName}
          displayedDept={displayedDept}
          displayedJobGrade={displayedJobGrade}
          displayedEmail={displayedEmail}
          userProfile={userProfile}
          userEmail={userEmail}
          onBack={() => onViewChange("overview")}
        />
      );
    } else if (settingsView === "security") {
      return (
        <SecurityView
          onNavigateToPassword={() => onViewChange("passwordManagement")}
        />
      );
    } else if (settingsView === "passwordManagement") {
      return (
        <PasswordManagement onBack={() => onViewChange("security")} theme={theme} />
      );
    } else {
      return (
        <OverviewView
          onNavigateToProfile={() => onViewChange("profileDetail")}
        />
      );
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="lg"
      PaperProps={{
        sx: {
          borderRadius: 4,
          minHeight: 520,
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 4,
          pt: 3,
        }}
      >
        <Box component="span" sx={{ typography: "h5" }}>설정</Box>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ display: "flex", px: 0, pb: 0 }}>
        <Box
          sx={{
            width: 220,
            borderRight: `1px solid ${muiTheme.palette.divider}`,
            minHeight: 440,
          }}
        >
          <List>
            {leftMenuItems.map((item) => (
              <ListItemButton
                key={item.key}
                selected={
                  item.key === settingsView ||
                  (item.key === "overview" && settingsView === "profileDetail") ||
                  (item.key === "security" &&
                    settingsView === "passwordManagement")
                }
                onClick={() =>
                  onViewChange(
                    item.key === "overview" ? "overview" : item.key
                  )
                }
              >
                <ListItemText primary={item.label} />
              </ListItemButton>
            ))}
          </List>
        </Box>
        <Box sx={{ flex: 1, minHeight: 440 }}>{getActiveViewContent()}</Box>
      </DialogContent>
    </Dialog>
  );
}

