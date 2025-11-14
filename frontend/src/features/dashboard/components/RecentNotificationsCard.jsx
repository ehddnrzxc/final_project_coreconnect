import React from "react";
import Card from "../../../components/ui/Card";
import { List, ListItem, ListItemText } from "@mui/material";

export default function RecentNotificationsCard() {
  return (
    <Card title="최근 알림">
      <List dense sx={{ pl: 1 }}>
        <ListItem sx={{ px: 0, py: 0.5 }}>
          <ListItemText
            primary="알림1 : 구현 예정... • 1시간 전"
            primaryTypographyProps={{ variant: "body2" }}
          />
        </ListItem>
        <ListItem sx={{ px: 0, py: 0.5 }}>
          <ListItemText
            primary="알림2 : 구현 예정... • 2시간 전"
            primaryTypographyProps={{ variant: "body2" }}
          />
        </ListItem>
        <ListItem sx={{ px: 0, py: 0.5 }}>
          <ListItemText
            primary="알림3 : 구현 예정... • 오늘"
            primaryTypographyProps={{ variant: "body2" }}
          />
        </ListItem>
      </List>
    </Card>
  );
}

