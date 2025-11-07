/* forms/VacationForm.js
- NewDocumentPage에 하드코딩되어 있던 휴가신청서 폼을 별도 컴포넌트로 분리
- 부모로부터 formData (데이터)와 onFormChange (핸들러)를 props로 받음
*/

import React from 'react';
import { TableBody } from '@mui/material';

// 부모(NewDocumentPage)로부터 formData와 onFormChange 핸들러를 props로 받습니다.
const VacationForm = ({ formData, onFormChange }) => {
  return (
    <>
      {/* 신청 내용 (하단) */}
      <h3 style={{ marginTop: '30px', marginBottom: '10px', borderBottom: '1px solid #eee', paddingBottom: '5px' }}>신청 내용</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
        <TableBody>
          <tr>
            <td style={{ border: '1px solid #ccc', backgroundColor: '#f8f8f8', padding: '10px', width: '100px', textAlign: 'center', fontWeight: 'bold' }}>* 휴가 종류</td>
            <td style={{ border: '1px solid #ccc', padding: '10px' }}>
              <select
                name="vacationType"
                value={formData.vacationType || ''} // props로 받은 formData 사용
                onChange={onFormChange}              // props로 받은 onFormChange 사용
                style={{ padding: '5px', width: '150px', fontSize: '14px' }}
                required
              >
                <option value="">선택</option>
                <option value="연차">연차</option>
                <option value="반차(오전)">반차(오전)</option>
                <option value="반차(오후)">반차(오후)</option>
                <option value="병가">병가</option>
                <option value="경조휴가">경조휴가</option>
                <option value="기타">기타</option>
              </select>
            </td>
          </tr>
          <tr>
            <td style={{ border: '1px solid #ccc', backgroundColor: '#f8f8f8', padding: '10px', textAlign: 'center', fontWeight: 'bold' }}>* 휴가 기간</td>
            <td style={{ border: '1px solid #ccc', padding: '10px' }}>
              <input
                type="date"
                name="startDate"
                value={formData.startDate || ''} // props로 받은 formData 사용
                onChange={onFormChange}         // props로 받은 onFormChange 사용
                style={{ padding: '5px', fontSize: '14px' }}
                required
              />
              {' ~ '}
              <input
                type="date"
                name="endDate"
                value={formData.endDate || ''} // props로 받은 formData 사용
                onChange={onFormChange}       // props로 받은 onFormChange 사용
                style={{ padding: '5px', fontSize: '14px' }}
                required
              />
              {'  '}
              사용일수:
              <input
                type="number"
                name="duration"
                value={formData.duration || 0} // props로 받은 formData 사용
                readOnly
                style={{ padding: '5px', width: '60px', fontSize: '14px', marginLeft: '5px', backgroundColor: '#eee', border: '1px solid #ccc' }}
              /> 일
            </td>
          </tr>
          <tr>
            <td style={{ border: '1px solid #ccc', backgroundColor: '#f8f8f8', padding: '10px', textAlign: 'center', fontWeight: 'bold' }}>* 휴가 사유</td>
            <td style={{ border: '1px solid #ccc', padding: '10px' }}>
              <textarea
                name="reason"
                rows="8"
                value={formData.reason || ''} // props로 받은 formData 사용
                onChange={onFormChange}      // props로 받은 onFormChange 사용
                style={{ width: '96%', padding: '10px', fontSize: '14px', border: '1px solid #ddd', resize: 'none' }}
                required
              ></textarea>
            </td>
          </tr>
        </TableBody>
      </table>

      {/* 안내 문구 */}
      <p style={{ fontSize: '12px', color: '#777', marginTop: '15px', lineHeight: '1.5' }}>
        [당일 반차 신청시] 시작일만 오전/오후 체크<br />
        [예비군/민방위 신청시] 통지서 스캔하여 파일 첨부<br />
        [경조휴가 신청시] 증빙서류 스캔하여 파일 첨부 (예: 청첩장 등본 등)
      </p>
    </>
  );
};

export default VacationForm;