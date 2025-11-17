import { useEffect, useState } from "react";
import {
  Drawer,
  Box,
  Typography,
  TextField,
  Divider,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { fetchOrganizationTree } from "../api/organizationAPI";
import OrgTree from "./OrgTree";
import MemberDetailModal from "./MemberDetailModal";


const OrgChartDrawer = ({ open, onClose }) => {
  const [tree, setTree] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [selectedMember, setSelectedMember] = useState(null);

  useEffect(() => {
    if (open) {
      load();
    }
  }, [open]);

  const load = async () => {
    const data = await fetchOrganizationTree();
    setTree(data);
  };

  return (
    <>
      <Drawer anchor="left" open={open} onClose={onClose}>
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
            onChange={(e) => setKeyword(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1 }} />,
            }}
          />

          <Divider sx={{ my: 2 }} />

          <Box sx={{ flex: 1, overflowY: "auto" }}>
            {tree.map((node) => (
              <OrgTree
                key={node.deptId}
                node={node}
                keyword={keyword}
                onSelectMember={(m) => setSelectedMember(m)}
              />
            ))}
          </Box>
        </Box>
      </Drawer>

      {/* 상세정보 모달 */}
      <MemberDetailModal
        open={Boolean(selectedMember)}
        member={selectedMember}
        onClose={() => setSelectedMember(null)}
      />
    </>
  );
};

export default OrgChartDrawer;
