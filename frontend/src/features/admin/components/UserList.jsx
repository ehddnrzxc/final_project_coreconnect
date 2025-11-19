import React, { useEffect, useState } from "react";
import { getAdminUsers } from "../../user/api/userAPI";
import { jobGradeLabel } from "../../../utils/jobGradeUtils";
import {
  Box,
  Card,
  CardHeader,
  CardContent,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  Typography,
  Chip,
  CircularProgress,
  Stack,
  Divider,
} from "@mui/material";
import { useSnackbarContext } from "../../../components/utils/SnackbarContext";

export default function UserList() {
  const { showSnack } = useSnackbarContext();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await getAdminUsers();
        setUsers(data);
      } catch (e) {
        console.error(e);
        showSnack("사용자 목록을 불러오지 못했습니다.", "error");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // 역할별 색상
  const roleColor = (role) => {
    switch (role) {
      case "ADMIN":
        return "secondary";
      case "MANAGER":
        return "primary";
      default:
        return "default";
    }
  };

  // 상태별 색상
  const statusColor = (status) => {
    switch (status) {
      case "ACTIVE":
        return "success";
      case "INACTIVE":
        return "error";
      default:
        return "default";
    }
  };

  return (
    <Box sx={{ maxWidth: 1000, mx: "auto", mt: 4, px: 2 }}>
      <Card elevation={3} sx={{ borderRadius: 3 }}>
        <CardHeader
          title={
            <Typography variant="h5" fontWeight={600}>
              사용자 목록
            </Typography>
          }
          subheader="등록된 사용자 정보를 확인합니다."
        />
        <Divider />

        <CardContent sx={{ pt: 3, pb: 3 }}>
          <Stack spacing={2.5}>
            {loading ? (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  py: 6,
                }}
              >
                <CircularProgress />
              </Box>
            ) : (
              <TableContainer
                sx={{
                  maxHeight: 480,
                  borderRadius: 2,
                  border: "1px solid",
                  borderColor: "divider",
                }}
              >
                <Table stickyHeader size="medium">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>ID</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>이름</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>이메일</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>역할</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>상태</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>직급</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {users.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                          <Typography color="text.secondary">
                            등록된 사용자가 없습니다.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      users.map((u) => (
                        <TableRow
                          key={u.id}
                          hover
                          sx={{
                            "&:last-child td, &:last-child th": { borderBottom: 0 },
                          }}
                        >
                          <TableCell sx={{ py: 1.5 }}>{u.id}</TableCell>
                          <TableCell sx={{ py: 1.5 }}>{u.name}</TableCell>
                          <TableCell sx={{ py: 1.5 }}>{u.email}</TableCell>

                          {/* 역할 */}
                          <TableCell sx={{ py: 1.5 }}>
                            <Chip
                              label={u.role}
                              size="small"
                              color={roleColor(u.role)}
                              sx={{
                                fontWeight: 600,
                                color:
                                  u.role === "USER"
                                    ? "text.primary"
                                    : "white",
                              }}
                            />
                          </TableCell>

                          {/* 상태 */}
                          <TableCell sx={{ py: 1.5 }}>
                            <Chip
                              label={u.status}
                              size="small"
                              color={statusColor(u.status)}
                              sx={{
                                fontWeight: 600,
                                color:
                                  u.status === "INACTIVE"
                                    ? "white"
                                    : "white",
                              }}
                            />
                          </TableCell>

                          {/* 직급 - 한글 변환 */}
                          <TableCell sx={{ py: 1.5 }}>
                            {jobGradeLabel(u.jobGrade)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
