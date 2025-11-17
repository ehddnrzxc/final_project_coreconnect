import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Collapse,
  Avatar,
  ListItemButton,
} from "@mui/material";
import ArrowRightIcon from "@mui/icons-material/ArrowRight";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";


const OrgTreeNode = ({
  node,
  depth,
  keyword,
  onSelectMember,
  defaultExpanded = true,
}) => {
  const [expanded, setExpanded] = useState(defaultExpanded);

  useEffect(() => {
    setExpanded(defaultExpanded);
  }, [defaultExpanded]);

  const matchKeyword = (text) =>
    text?.toLowerCase().includes(keyword.toLowerCase());

  const highlight = (text) => {
    if (!keyword) return text;
    const idx = text.toLowerCase().indexOf(keyword.toLowerCase());
    if (idx === -1) return text;

    return (
      <>
        {text.slice(0, idx)}
        <span style={{ background: "#ffe082" }}>
          {text.slice(idx, idx + keyword.length)}
        </span>
        {text.slice(idx + keyword.length)}
      </>
    );
  };

  // 재귀적으로 전체 트리에서 keyword 있는지 검사 
  const hasMatch = (n) => {
    // 부서명 매칭
    if (matchKeyword(n.deptName)) return true;

    // 구성원 매칭 (이름/직급/부서)
    if (
      n.members.some(
        (m) =>
          matchKeyword(m.name) ||
          matchKeyword(m.jobGrade) ||
          matchKeyword(m.deptName)
      )
    ) {
      return true;
    }

    // 하위 부서 매칭
    if (n.children.some((child) => hasMatch(child))) return true;

    return false;
  };

  const showDept = hasMatch(node);
  if (!showDept) return null;

  return (
    <Box sx={{ ml: depth * 1.5 }}>
      {/* 부서 클릭 영역 */}
      <ListItemButton
        onClick={() => setExpanded((prev) => !prev)}
        sx={{ py: 0.5 }}
      >
        {expanded ? (
          <ArrowDropDownIcon fontSize="small" />
        ) : (
          <ArrowRightIcon fontSize="small" />
        )}
        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
          {highlight(node.deptName)} ({node.members.length})
        </Typography>
      </ListItemButton>

      <Collapse in={expanded}>
        {/* 구성원 */}
        {node.members.map((m) => (
          <ListItemButton
            key={m.userId}
            onClick={() => onSelectMember(m)}
            sx={{
              pl: 5,
              py: 0.8,
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <Avatar
              src={m.profileUrl || ""}
              sx={{ width: 28, height: 28 }}
            />
            <Typography variant="body2">
              {highlight(`${m.name} ${m.jobGrade || ""}`)}
            </Typography>
          </ListItemButton>
        ))}

        {/* 하위 부서 */}
        {node.children.map((child) => (
          <OrgTreeNode
            key={child.deptId}
            node={child}
            depth={depth + 1}
            keyword={keyword}
            onSelectMember={onSelectMember}
            defaultExpanded={true}
          />
        ))}
      </Collapse>
    </Box>
  );
};

export default OrgTreeNode;
