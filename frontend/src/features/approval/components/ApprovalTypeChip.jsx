import React from 'react';
import { Chip } from '@mui/material';

const ApprovalTypeChip = ({ type, ...props }) => {
  
  // 타입에 따른 라벨과 스타일 정의
  const getTypeConfig = (type) => {
    switch (type) {
      case 'APPROVE':
      case '결재':
        return {
          label: '결재',
          sx: { 
            bgcolor: '#e3f2fd', // 연한 파랑
            color: '#1565c0',   // 진한 파랑
            border: '1px solid #90caf9' 
          }
        };
      case 'AGREE':
      case '합의':
        return {
          label: '합의',
          sx: { 
            bgcolor: '#fff3e0', // 연한 주황
            color: '#ef6c00',   // 진한 주황
            border: '1px solid #ffcc80'
          }
        };
      case 'REFER':
      case '참조':
        return {
          label: '참조',
          sx: { 
            bgcolor: '#f5f5f5', // 연한 회색
            color: '#616161',   // 진한 회색
            border: '1px solid #e0e0e0'
          }
        };
      default:
        return {
          label: type,
          sx: { bgcolor: '#eee', color: '#333' }
        };
    }
  };

  const config = getTypeConfig(type);

  return (
    <Chip
      label={config.label}
      size="small"
      variant="filled"
      {...props} 
      sx={{
        fontWeight: 'bold',
        borderRadius: '6px', // 모서리를 살짝 둥글게
        minWidth: '50px',    // 글자 수 달라도 너비 비슷하게 맞춤
        height: '24px',
        fontSize: '12px',
        ...config.sx, 
        ...props.sx
      }}
    />
  );
};

export default ApprovalTypeChip;