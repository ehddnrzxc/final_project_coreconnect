import OrgTreeNode from "./OrgTreeNode";


// 최상위 부서 노드를 받아 트리 렌더링을 시작하는 컴포넌트
const OrgTree = ({ node, keyword, onSelectMember }) => {
  return (
    <OrgTreeNode
      node={node} // 시작 부서 노드
      depth={0} // 최상위는 depth 0부터 시작
      keyword={keyword}
      onSelectMember={onSelectMember} // 멤버 클릭 시 부모로 전달
      defaultExpanded={true}   // 최상위는 기본 펼침 상태
    />
  );
};

export default OrgTree;
