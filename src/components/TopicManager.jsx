import React, { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { saveStoredTopics } from '../storage.js';

export default function TopicManager({ topics, onClose, onApply }) {
  const portalRoot = document.getElementById('portal-root') || document.body;
  const [draft, setDraft] = useState(() => JSON.parse(JSON.stringify(topics)));
  const categories = Object.keys(draft);
  const [cat, setCat] = useState(categories[0] || "ENGLISH");
  const firstTopic = (obj, c) => { const keys = Object.keys(obj[c] || {}); return keys[0] || ""; };
  const [selected, setSelected] = useState(firstTopic(draft, cat));
  const topicNames = useMemo(() => Object.keys(draft[cat] || {}), [draft, cat]);
  const data = (draft[cat] && draft[cat][selected]) || { grammar: "", vocabulary: "", panels: [] };

  const [newCat, setNewCat] = useState("");
  const [newTopic, setNewTopic] = useState("");

  const addCategory = () => { const name = newCat.trim(); if (!name) return; if (!draft[name]) { const copy = JSON.parse(JSON.stringify(draft)); copy[name] = {}; setDraft(copy); setCat(name); setSelected(""); } setNewCat(""); };
  const deleteCategory = () => { const copy = JSON.parse(JSON.stringify(draft)); delete copy[cat]; const next = Object.keys(copy)[0] || "ENGLISH"; if (!copy[next]) copy[next] = {}; setDraft(copy); setCat(next); setSelected(firstTopic(copy, next)); };
  const addTopic = () => { const name = newTopic.trim(); if (!name) return; const copy = JSON.parse(JSON.stringify(draft)); if (!copy[cat]) copy[cat] = {}; if (!copy[cat][name]) copy[cat][name] = { grammar:"", vocabulary:"", panels:[] }; setDraft(copy); setSelected(name); setNewTopic(""); };
  const deleteTopic = () => { const copy = JSON.parse(JSON.stringify(draft)); if (copy[cat] && copy[cat][selected]) delete copy[cat][selected]; setDraft(copy); setSelected(firstTopic(copy, cat)); };
  const setField = (field, value) => { const copy = JSON.parse(JSON.stringify(draft)); if (!copy[cat]) copy[cat] = {}; if (!copy[cat][selected]) copy[cat][selected] = { grammar:"", vocabulary:"", panels:[] }; copy[cat][selected][field] = value; setDraft(copy); };
  const addPanel = (text) => { const t = text.toUpperCase().replace(/\s+/g, ' ').trim(); if (!t) return; const copy = JSON.parse(JSON.stringify(draft)); copy[cat][selected].panels.push(t); setDraft(copy); };
  const removePanel = (idx) => { const copy = JSON.parse(JSON.stringify(draft)); copy[cat][selected].panels.splice(idx,1); setDraft(copy); };
  const apply = () => { saveStoredTopics(draft); onApply(draft); onClose(); };

  const modal = (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal">
        <div className="modal-header">
          <h3>Manage Topics <span className="badge">Teacher</span></h3>
          <button className="btn" onClick={onClose} aria-label="Close">Close</button>
        </div>
        <div className="grid-3 gap">
          <div className="card left">
            <div className="row">
              <select className="input" value={cat} onChange={(e)=>{setCat(e.target.value); setSelected(firstTopic(draft, e.target.value))}}>
                {Object.keys(draft).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <button className="btn" onClick={deleteCategory} disabled={Object.keys(draft).length<=1}>Delete cat</button>
            </div>
            <div className="row">
              <input className="input" placeholder="New category..." value={newCat} onChange={e=>setNewCat(e.target.value)} />
              <button className="btn" onClick={addCategory}>Add</button>
            </div>
            <hr/>
            <div className="stack" style={{maxHeight: 300, overflow: 'auto'}}>
              {topicNames.map(name => (
                <button key={name} className={`btn-ghost card ${selected===name?"active":""}`} onClick={()=>setSelected(name)}>{name}</button>
              ))}
            </div>
            <div className="row">
              <input className="input" placeholder="New topic..." value={newTopic} onChange={e=>setNewTopic(e.target.value)} />
              <button className="btn" onClick={addTopic}>Add topic</button>
              <button className="btn warn" onClick={deleteTopic} disabled={!selected}>Delete</button>
            </div>
          </div>
          <div className="card left" style={{gridColumn: "span 2"}}>
            {selected ? (
              <>
                <div className="row">
                  <div className="label-inline">Topic</div>
                  <input className="input" value={selected} onChange={(e)=>{
                    const newName = e.target.value;
                    const copy = JSON.parse(JSON.stringify(draft));
                    if (!copy[cat]) copy[cat] = {}; if (!copy[cat][selected]) copy[cat][selected] = { grammar:"", vocabulary:"", panels:[] };
                    copy[cat][newName] = copy[cat][selected]; if (newName !== selected) delete copy[cat][selected];
                    setDraft(copy); setSelected(newName);
                  }}/>
                </div>
                <div className="row">
                  <div className="label-inline">Grammar</div>
                  <input className="input" value={data.grammar} onChange={(e)=>setField("grammar", e.target.value)} />
                </div>
                <div className="row">
                  <div className="label-inline">Vocabulary</div>
                  <input className="input" value={data.vocabulary} onChange={(e)=>setField("vocabulary", e.target.value)} />
                </div>
                <PanelEditor panels={data.panels} onAdd={addPanel} onRemove={removePanel} />
              </>
            ) : (
              <div className="muted">Create or select a topic to edit.</div>
            )}
            <div className="row" style={{marginTop:12}}>
              <button className="btn primary" onClick={apply}>Save changes</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
  return createPortal(modal, portalRoot);
}
function PanelEditor({ panels, onAdd, onRemove }){
  const [text, setText] = useState("");
  return (
    <div className="stack">
      <div className="row">
        <input className="input" placeholder="Type a phrase and press Add" value={text} onChange={e=>setText(e.target.value)} />
        <button className="btn" onClick={()=>{ onAdd(text); setText(""); }}>Add</button>
      </div>
      <div className="card" style={{maxHeight:220, overflow:'auto'}}>
        {panels.length===0 && <div className="muted tiny">No panels yet.</div>}
        {panels.map((p, i)=>(
          <div key={i} className="row" style={{justifyContent:'space-between'}}>
            <div className="tiny">{p}</div>
            <button className="btn" onClick={()=>onRemove(i)}>Remove</button>
          </div>
        ))}
      </div>
    </div>
  );
}
