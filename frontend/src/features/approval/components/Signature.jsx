const Signature = ({ name, status }) => {

  if (status === 'REJECTED') {
    return <div style={{ color: 'red', fontWeight: 'bold' }}>반려</div>;
  }

  if (!name) return null;

  const displayName = name.length > 2 ? name.slice(1) : name;

  return (
    <div
      style={{
        width: '50px',
        height: '50px',
        border: '3px solid red',
        borderRadius: '50%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        color: 'red',
        fontWeight: 'bold',
        fontSize: '14px',
        margin: '0 auto',
        fontFamily: '"Malgun Gothic", sans-serif',
        letterSpacing: '-1px'
      }}
    >
      {displayName}
      <span style={{ fontSize: '10px', marginLeft: '2px' }}>인</span>
    </div>
  );

};

export default Signature;