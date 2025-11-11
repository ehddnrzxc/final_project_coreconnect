import React from 'react';
import { Table, TableBody, TableRow, TableCell, TextField, Typography } from '@mui/material';

// 공통 스타일 정의
const commonStyles = {
  th: {
    border: '1px solid #ccc',
    backgroundColor: '#f8f8f8',
    padding: '10px',
    width: '120px',
    textAlign: 'center',
    fontWeight: 'bold',
    whiteSpace: 'nowrap',
  },
  td: {
    border: '1px solid #ccc',
    padding: '10px',
  },
};

const BusinessTripForm = ({ formData, onFormChange }) => {
  return (
    <>
      {/* 1. 출장 내용 */}
      <Typography variant="subtitle1" sx={{ mt: 3, mb: 1, fontWeight: 'bold', borderBottom: '1px solid #eee', pb: 1 }}>
        출장 내용
      </Typography>
      <Table sx={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ccc' }}>
        <TableBody>
          <TableRow>
            <TableCell component="th" sx={commonStyles.th}>* 출장기간</TableCell>
            <TableCell sx={commonStyles.td} colSpan={3}>
              <TextField
                type="date"
                name="startDate"
                value={formData.startDate || ''}
                onChange={onFormChange}
                required
                size="small"
                InputLabelProps={{ shrink: true }}
                sx={{ mr: 1 }}
              />
              ~
              <TextField
                type="date"
                name="endDate"
                value={formData.endDate || ''}
                onChange={onFormChange}
                required
                size="small"
                InputLabelProps={{ shrink: true }}
                sx={{ ml: 1 }}
              />
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell component="th" sx={commonStyles.th}>* 출장지</TableCell>
            <TableCell sx={commonStyles.td} colSpan={3}>
              <TextField
                type="text"
                name="destination"
                value={formData.destination || ''}
                onChange={onFormChange}
                placeholder="예: 서울 본사, 부산 지사"
                required
                fullWidth
                size="small"
              />
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell component="th" sx={commonStyles.th}>* 교통편</TableCell>
            <TableCell sx={commonStyles.td} colSpan={3}>
              <TextField
                type="text"
                name="transportation"
                value={formData.transportation || ''}
                onChange={onFormChange}
                placeholder="예: KTX, 자가용"
                required
                fullWidth
                size="small"
              />
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell component="th" sx={commonStyles.th}>* 출장목적</TableCell>
            <TableCell sx={commonStyles.td} colSpan={3}>
              <TextField
                name="purpose"
                value={formData.purpose || ''}
                onChange={onFormChange}
                required
                multiline
                rows={4}
                fullWidth
              />
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell component="th" sx={commonStyles.th}>비고</TableCell>
            <TableCell sx={commonStyles.td} colSpan={3}>
              <TextField
                name="note"
                value={formData.note || ''}
                onChange={onFormChange}
                multiline
                rows={2}
                fullWidth
              />
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>

      {/* 2. 출장자 정보 */}
      <Typography variant="subtitle1" sx={{ mt: 3, mb: 1, fontWeight: 'bold', borderBottom: '1px solid #eee', pb: 1 }}>
        출장자 정보
      </Typography>
      <Table sx={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ccc' }}>
        <TableBody>
          <TableRow>
            <TableCell component="th" sx={commonStyles.th}>* 사번</TableCell>
            <TableCell sx={commonStyles.td}>
              <TextField
                type="text"
                name="travelerEmpNo"
                value={formData.travelerEmpNo || ''}
                onChange={onFormChange}
                required
                fullWidth
                size="small"
              />
            </TableCell>
            <TableCell component="th" sx={commonStyles.th}>* 성명</TableCell>
            <TableCell sx={commonStyles.td}>
              <TextField
                type="text"
                name="travelerName"
                value={formData.travelerName || ''}
                onChange={onFormChange}
                required
                fullWidth
                size="small"
              />
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell component="th" sx={commonStyles.th}>* 직급</TableCell>
            <TableCell sx={commonStyles.td}>
              <TextField
                type="text"
                name="travelerPosition"
                value={formData.travelerPosition || ''}
                onChange={onFormChange}
                required
                fullWidth
                size="small"
              />
            </TableCell>
            <TableCell component="th" sx={commonStyles.th}>* 소속</TableCell>
            <TableCell sx={commonStyles.td}>
              <TextField
                type="text"
                name="travelerDept"
                value={formData.travelerDept || ''}
                onChange={onFormChange}
                required
                fullWidth
                size="small"
              />
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </>
  );
};

export default BusinessTripForm;