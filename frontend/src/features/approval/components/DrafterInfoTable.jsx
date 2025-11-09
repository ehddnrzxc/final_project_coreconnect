import { TableBody } from '@mui/material';
import React from 'react';

const DrafterInfoTable = ({ drafter, createDate, documentId }) => {
  return (
    <div style={{ width: '55%' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
        <TableBody>
          <tr>
            <td style={{ border: '1px solid #ccc', backgroundColor: '#f8f8f8', padding: '10px', width: '100px', textAlign: 'center', fontWeight: 'bold' }}>기안자</td>
            <td style={{ border: '1px solid #ccc', padding: '10px' }}>{drafter?.userName}</td>
          </tr>
          <tr>
            <td style={{ border: '1px solid #ccc', backgroundColor: '#f8f8f8', padding: '10px', textAlign: 'center', fontWeight: 'bold' }}>소속</td>
            <td style={{ border: '1px solid #ccc', padding: '10px' }}>{drafter?.deptName}</td>
          </tr>
          <tr>
            <td style={{ border: '1px solid #ccc', backgroundColor: '#f8f8f8', padding: '10px', textAlign: 'center', fontWeight: 'bold' }}>기안일</td>
            <td style={{ border: '1px solid #ccc', padding: '10px' }}>{createDate ? createDate.split('T')[0] : ''}</td>
          </tr>
          <tr>
            <td style={{ border: '1px solid #ccc', backgroundColor: '#f8f8f8', padding: '10px', textAlign: 'center', fontWeight: 'bold' }}>문서번호</td>
            <td style={{ border: '1px solid #ccc', padding: '10px' }}>{documentId}</td>
          </tr>
        </TableBody>
      </table>
    </div>
  );
};

export default DrafterInfoTable;