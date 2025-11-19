/* forms/VacationForm.js
- MUI 컴포넌트 (Table, TableCell, TextField, Select)로 전체 리팩토링
*/

import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableRow, TableCell, TextField, Select, MenuItem, Typography, CircularProgress } from '@mui/material';
import { getLeaveTypes } from '../../leave/api/leaveAPI';
import { getLeaveTypeLabel } from '../../../components/utils/labelUtils';

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

const VacationForm = ({ formData, onFormChange }) => {
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadLeaveTypes = async () => {
      try {
        const types = await getLeaveTypes();
        setLeaveTypes(types);
      } catch (error) {
        console.error('휴가 유형 로딩 실패:', error);
      } finally {
        setLoading(false);
      }
    };
    loadLeaveTypes();
  }, []);

  return (
    <>
      <Typography variant="subtitle1" sx={{ mt: 3, mb: 1, fontWeight: 'bold', borderBottom: '1px solid #eee', pb: 1 }}>
        신청 내용
      </Typography>
      
      <Table sx={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ccc' }}>
        <TableBody>
          <TableRow>
            <TableCell component="th" sx={commonStyles.th}>* 휴가 종류</TableCell>
            <TableCell sx={commonStyles.td}>
              {loading ? (
                <CircularProgress size={20} />
              ) : (
                <Select
                  name="vacationType"
                  value={formData.vacationType || ''}
                  onChange={onFormChange}
                  required
                  fullWidth
                  size="small"
                  displayEmpty
                >
                  <MenuItem value="" disabled><em>선택</em></MenuItem>
                  {leaveTypes.map((type) => (
                    <MenuItem key={type.value} value={getLeaveTypeLabel(type.value)}>
                      {getLeaveTypeLabel(type.value)}
                    </MenuItem>
                  ))}
                </Select>
              )}
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell component="th" sx={commonStyles.th}>* 휴가 기간</TableCell>
            <TableCell sx={commonStyles.td}>
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
                sx={{ ml: 1, mr: 2 }}
                InputLabelProps={{ shirink: true }}
                InputProps={{
                  inputProps: {
                    min: formData.startDate || '',
                  },
                }}
              />
              사용일수:
              <TextField
                type="number"
                name="duration"
                value={formData.duration || 0}
                InputProps={{
                  readOnly: true,
                  endAdornment: '일',
                }}
                size="small"
                sx={{ 
                  ml: 1, 
                  width: '80px', 
                  backgroundColor: '#eee',
                  '& .MuiInputBase-input': { textAlign: 'right' }
                }}
              />
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell component="th" sx={commonStyles.th}>* 휴가 사유</TableCell>
            <TableCell sx={commonStyles.td}>
              <TextField
                name="reason"
                value={formData.reason || ''}
                onChange={onFormChange}
                required
                multiline
                rows={8}
                fullWidth
                variant="outlined"
              />
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>

      <Typography variant="caption" component="p" sx={{ fontSize: '12px', color: '#777', mt: 2, lineHeight: 1.5 }}>
        [당일 반차 신청시] 시작일만 오전/오후 체크<br />
        [예비군/민방위 신청시] 통지서 스캔하여 파일 첨부<br />
        [경조휴가 신청시] 증빙서류 스캔하여 파일 첨부 (예: 청첩장 등본 등)
      </Typography>
    </>
  );
};

export default VacationForm;