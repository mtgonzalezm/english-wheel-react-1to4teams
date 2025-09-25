import React from 'react';
export default function InfoBox({ title, value }) {
  return (
    <div className="card">
      <div className="label">{title}</div>
      <div className="value">{value || "-"}</div>
    </div>
  );
}
