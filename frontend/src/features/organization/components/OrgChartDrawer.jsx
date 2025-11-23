import { useEffect, useState } from "react";
import { Drawer, Box, Typography, TextField } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { fetchOrganizationTree } from "../api/organizationAPI";
import OrgTree from "./OrgTree";
import MemberDetailModal from "./MemberDetailModal";


const OrgChartDrawer = ({ open, onClose }) => {
  const [tree, setTree] = useState([]); // 조직도 전체 데이터 (부서 트리 구조)
  const [keyword, setKeyword] = useState(""); // 검색어 (이름/직급/부서 필터링에 사용)
  const [selectedMember, setSelectedMember] = useState(null); // 클릭된 구성원 정보 → 모달에 전달

  useEffect(() => {
    if (open) {
      load(); // Drawer 열릴 때 데이터 로드
    }
  }, [open]);

  const load = async () => {
    const data = await fetchOrganizationTree(); // 서버에서 트리 조회
    setTree(data);
  };

  return (
    <>
      <Drawer
        anchor="left"
        open={open}
        onClose={onClose}
        PaperProps={{
          sx: {
            width: 360,
            borderRadius: "0px 12px 12px 0px",
            boxShadow: "4px 0 20px rgba(0,0,0,0.12)",
            overflow: "hidden",
          },
        }}
      >
        {/* 상단 그라데이션 헤더 */}
        <Box
          sx={{
            background: "linear-gradient(135deg, #5AA9E6 0%, #7FC8F8 100%)",
            p: 2,
            pb: 3,
            color: "#fff",
          }}
        >
          <Typography variant="h6" fontWeight={700}>
            조직도
          </Typography>

          {/* 검색창 */}
          <Box
            sx={{
              mt: 2,
              background: "rgba(255,255,255,0.95)",
              borderRadius: 2,
              px: 1.5,
              py: 0.7,
              display: "flex",
              alignItems: "center",
              boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
            }}
          >
            <SearchIcon sx={{ color: "#999", fontSize: 20, mr: 1 }} />
            <TextField
              placeholder="이름, 직위, 부서 검색"
              variant="standard"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              fullWidth
              InputProps={{
                disableUnderline: true,
                sx: { fontSize: 14 },
              }}
            />
          </Box>
        </Box>

        {/* 트리 영역 */}
        <Box
          sx={{
            p: 2,
            pt: 1,
            height: "100%",
            overflowY: "auto",

            /* 스크롤바 디자인 */
            "&::-webkit-scrollbar": {
              width: "8px",
            },
            "&::-webkit-scrollbar-thumb": {
              backgroundColor: "rgba(0,0,0,0.25)",
              borderRadius: "4px",
            },
          }}
        >
          {tree.map((node) => (
            <OrgTree
              key={node.deptId}
              node={node}
              keyword={keyword}
              onSelectMember={(m) => setSelectedMember(m)}
            />
          ))}
        </Box>
      </Drawer>

      {/* 상세 모달 */}
      <MemberDetailModal
        open={Boolean(selectedMember)}
        member={selectedMember}
        onClose={() => setSelectedMember(null)}
        onCloseDrawer={() => onClose()} // Drawer 닫기
      />
    </>
  );
};

export default OrgChartDrawer;
