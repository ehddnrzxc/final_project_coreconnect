import { useState, useEffect } from "react";
import { Box, Typography, Collapse, Avatar, ListItemButton } from "@mui/material";
import ArrowRightIcon from "@mui/icons-material/ArrowRight";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";


const OrgTreeNode = ({ node, depth, keyword, onSelectMember, defaultExpanded = true }) => {
  const [expanded, setExpanded] = useState(defaultExpanded); // 현재 노드 펼침 여부

  useEffect(() => {
    setExpanded(defaultExpanded); // 상위에서 기본값 바뀌면 동기화
  }, [defaultExpanded]);

  // 문자열이 검색어를 포함하는지 검사
  const matchKeyword = (text) =>
    text?.toLowerCase().includes(keyword.toLowerCase());

  // 검색어 부분만 하이라이트
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

  // 이 노드 또는 하위 노드에 검색어가 포함되는지 재귀 검사 
  const hasMatch = (n) => {
    if (matchKeyword(n.deptName)) return true; // 부서명 매칭

    // 구성원 이름/직급/부서 검사
    if (n.members.some((m) =>
      matchKeyword(m.name) ||
      matchKeyword(m.jobGrade) ||
      matchKeyword(m.deptName)
    )
    ) {
      return true;
    }

    // 자식 부서 검사
    if (n.children.some((child) => hasMatch(child))) return true;

    return false;
  };

  const showDept = hasMatch(node); // 검색 결과에 포함되는 부서만 표시
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

      {/* 펼쳐졌을 때 내용 표시 */}
      <Collapse in={expanded}>
        {/* 구성원 목록 */}
        {node.members.map((m) => (
          <ListItemButton
            key={m.userId}
            onClick={() => onSelectMember(m)} // 구성원 클릭 → 모달 표시
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

        {/* 하위 부서 (재귀 호출) */}
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
