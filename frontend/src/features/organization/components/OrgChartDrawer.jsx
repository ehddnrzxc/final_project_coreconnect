import { useEffect, useState } from "react";
import { Drawer, Box, Typography, TextField, Divider } from "@mui/material";
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
      <Drawer anchor="left" open={open} onClose={onClose}> {/* 왼쪽에서 열리는 Drawer */}
        <Box
          sx={{
            width: 360,
            p: 2,
            display: "flex",
            flexDirection: "column",
            height: "100%",
          }}
        >
          <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
            조직도
          </Typography>

          <TextField
            placeholder="이름, 직위, 부서 검색"
            size="small"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)} // 입력값 상태 업데이트
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1 }} />,
            }}
          />

          <Divider sx={{ my: 2 }} />

          <Box sx={{ flex: 1, overflowY: "auto" }}> {/* 트리 영역 (스크롤 가능) */}
            {tree.map((node) => (
              <OrgTree
                key={node.deptId}
                node={node} // 하나의 최상위 부서 노드
                keyword={keyword} 
                onSelectMember={(m) => setSelectedMember(m)} // 구성원 클릭 시 실행
              />
            ))}
          </Box>
        </Box>
      </Drawer>

      {/* 상세정보 모달 */}
      <MemberDetailModal
        open={Boolean(selectedMember)}
        member={selectedMember}
        onClose={() => setSelectedMember(null)} // 모달 닫기
        onCloseDrawer={() => onClose()}   // 드로워 닫기
      />
    </>
  );
};

export default OrgChartDrawer;
