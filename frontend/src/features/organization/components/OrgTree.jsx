import OrgTreeNode from "./OrgTreeNode";


const OrgTree = ({ node, keyword, onSelectMember }) => {
  return (
    <OrgTreeNode
      node={node}
      depth={0}
      keyword={keyword}
      onSelectMember={onSelectMember}
      defaultExpanded={true}   // 전체 펼침
    />
  );
};

export default OrgTree;
