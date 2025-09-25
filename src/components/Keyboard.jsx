import React from 'react';
export default function Keyboard({ letters, disabled, onPick }) {
  return (
    <div className="keys notranslate">
      {letters.map((l) => (
        <button
          key={l}
          disabled={disabled}
          onClick={() => onPick(l)}
          className="btn key"
          aria-label={`letter ${l}`}
          autoComplete="off"
          translate="no"
          data-letter={l}
        >
          <span aria-hidden="true">{l}</span>
        </button>
      ))}
    </div>
  );
}
