import React from 'react';
export default function Scoreboard({ teams, current }) {
  return (
    <div className="grid-auto">
      {teams.map((t, i) => (
        <div key={i} className={`card ${i === current ? "active" : ""}`}>
          <div className="title">{t.name}</div>
          <div className="points">{t.score}</div>
        </div>
      ))}
    </div>
  );
}
