import React from 'react';

const RunManager = (props) => {
  return (
    <div className="card">
      <h2>Run Manager Page</h2>
      <p>This is a placeholder for the Run Manager content. Data: {JSON.stringify(props.runs?.length)} runs.</p>
    </div>
  );
};

export default RunManager;