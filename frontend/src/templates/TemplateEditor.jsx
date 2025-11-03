import React, { useState } from 'react';
// [수정] CDN 링크 대신 다시 NPM 패키지 경로로 변경합니다.
import { CKEditor } from "@ckeditor/ckeditor5-react"; 
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";

const TemplateEditor = () => {
  const [editorData, setEditorData] = useState('<p>여기에 초기 내용을 입력하세요.</p>');

  return (
    <div className="App" style={{ padding: '20px' }}>
      <h2>CKEditor 5 - React 연동 예제</h2>
      
      <CKEditor
        editor={ClassicEditor}
        data={editorData} 
        
        onReady={editor => {
          console.log('Editor is ready to use!', editor);
        }}
        
        onChange={(event, editor) => {
          const data = editor.getData();
          setEditorData(data); 
        }}
        
        onBlur={(event, editor) => {
          console.log('Blur.', editor);
        }}
        
        onFocus={(event, editor) => {
          console.log('Focus.', editor);
        }}
      />

      <div style={{ marginTop: '20px', border: '1px solid #ccc', padding: '10px' }}>
        <h3>에디터 실시간 데이터 (HTML)</h3>
        <textarea 
          value={editorData}  
          style={{ width: '100%', minHeight: '100px', border: 'none', resize: 'none' }} 
        />
      </div>

      <div style={{ marginTop: '20px', border: '1px solid #ccc', padding: '10px' }}>
        <h3>HTML 렌더링 결과 (참고용)</h3>
        <div dangerouslySetInnerHTML={{ __html: editorData }} />
      </div>
    </div>
  );
};

export default TemplateEditor;