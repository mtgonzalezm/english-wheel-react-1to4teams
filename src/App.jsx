import React, { useMemo, useReducer } from 'react';
import Wheel from './components/Wheel.jsx';
import Keyboard from './components/Keyboard.jsx';
import Scoreboard from './components/Scoreboard.jsx';
import InfoBox from './components/InfoBox.jsx';
import TopicManager from './components/TopicManager.jsx';
import { initialTopics } from './topics.js';
import { loadStoredTopics, saveStoredTopics } from './storage.js';

const stored = loadStoredTopics(); 
const mergedTopics = stored ? stored : initialTopics;

const initialState = {
  teams: [{ name: "Equipo 1", score: 0 }, { name: "Equipo 2", score: 0 }],
  currentTeamIndex: 0,
  topics: mergedTopics,
  selectedTopicName: "",
  currentTopicMeta: null,
  currentPanel: null,
  revealed: [],
  guessedLetters: new Set(),
  wheelValue: 0,
  phase: "start",
  message: "¡Bienvenido! Gira la rueda para empezar.",
};

function reducer(state, action){
  switch(action.type){
    case "SET_TEAMS": {
      return { ...state, teams: action.teams };
    }
    case "SET_TEAM_COUNT": {
      const n = Math.min(4, Math.max(1, action.count));
      let teams = state.teams.slice(0, n);
      while (teams.length < n) {
        teams.push({ name: `Equipo ${teams.length + 1}`, score: 0 });
      }
      const currentTeamIndex = Math.min(state.currentTeamIndex, teams.length - 1);
      return { ...state, teams, currentTeamIndex };
    }
    case "SELECT_TOPIC": return { ...state, selectedTopicName: action.name };
    case "START_GAME": {
      const flat = flattenTopics(state.topics);
      const pick = state.selectedTopicName && flat[state.selectedTopicName] ? { name: state.selectedTopicName, ...flat[state.selectedTopicName] } : randomFromFlat(flat);
      const panel = pick && pick.panels.length ? pick.panels[Math.floor(Math.random() * pick.panels.length)] : "HELLO WORLD";
      return { ...state, phase: "playing", currentTopicMeta: { name: pick.name, grammar: pick.grammar, vocabulary: pick.vocabulary }, currentPanel: panel, revealed: maskPanel(panel, []), guessedLetters: new Set(), message: "¡Gira la rueda!" };
    }
    case "SET_WHEEL": return { ...state, wheelValue: action.value };
    case "APPLY_WHEEL_EFFECT": {
      const v = action.value;
      if (v === "BANKRUPT") {
        const teams = state.teams.map((t, i) => i === state.currentTeamIndex ? { ...t, score: 0 } : t);
        return { ...state, teams, currentTeamIndex: (state.currentTeamIndex + 1) % state.teams.length, message: "¡Bankrupt!" };
      }
      if (v === "LOSE TURN") {
        return { ...state, currentTeamIndex: (state.currentTeamIndex + 1) % state.teams.length, message: "Pierdes turno." };
      }
      return { ...state, message: `Tienes ${v}. ¡Elige una letra!` };
    }
    case "GUESS_LETTER": {
      if (!state.currentPanel) return state;
      const letter = action.letter.toUpperCase();
      if (state.guessedLetters.has(letter)) return state;
      const guessed = new Set(state.guessedLetters); guessed.add(letter);
      const occ = countOccurrences(state.currentPanel, letter);
      const gained = typeof state.wheelValue === "number" ? occ * state.wheelValue : 0;
      const teams = state.teams.map((t, i) => i === state.currentTeamIndex ? { ...t, score: t.score + gained } : t);
      const revealed = revealLetters(state.currentPanel, state.revealed, letter);
      const solved = revealed.join("") === normalizePanel(state.currentPanel);
      return { ...state, teams, revealed, guessedLetters: guessed, phase: solved ? "win" : state.phase, message: occ > 0 ? `¡Bien! ${occ} × ${state.wheelValue}` : "Sin aciertos. ¡Siguiente equipo!", currentTeamIndex: occ > 0 ? state.currentTeamIndex : (state.currentTeamIndex + 1) % state.teams.length, wheelValue: 0 };
    }
    case "NEW_GAME": return { ...initialState, topics: state.topics };
    case "SET_TOPICS": return { ...state, topics: action.topics };
    default: return state;
  }
}

function flattenTopics(topics){ const flat = {}; Object.keys(topics).forEach(cat => { Object.keys(topics[cat] || {}).forEach(name => flat[name] = topics[cat][name]); }); return flat; }
function randomFromFlat(flat){ const names = Object.keys(flat); const name = names[Math.floor(Math.random() * names.length)]; return { name, ...flat[name] }; }
function normalizePanel(panel){ return panel.replace(/[^A-Z]/gi, (c)=> c===' ' ? ' ' : '').toUpperCase(); }
function maskPanel(panel, guessed){ const norm=normalizePanel(panel); return [...norm].map(ch => ch===' ' ? ' ' : guessed.includes(ch)? ch : '_'); }
function revealLetters(panel, currentMask, letter){ const norm=normalizePanel(panel); return norm.split('').map((ch,i)=> ch===letter ? letter : currentMask[i]); }
function countOccurrences(panel, letter){ return normalizePanel(panel).split('').filter(c => c===letter).length; }

export default function App(){
  const [state, dispatch] = useReducer(reducer, initialState);
  const [teacher, setTeacher] = React.useState(false);
  const [showManager, setShowManager] = React.useState(false);
  const flatTopics = useMemo(()=> flattenTopics(state.topics), [state.topics]);
  const topicNames = Object.keys(flatTopics);
  const consonants = useMemo(()=> "BCDFGHJKLMNPQRSTVWXYZ".split(""), []);
  const vowels = useMemo(()=> "AEIOU".split(""), []);
  const masked = state.currentPanel ? state.revealed.join(" ") : "";
  const handleSpinEnd = (val)=>{ dispatch({ type: "SET_WHEEL", value: val }); dispatch({ type: "APPLY_WHEEL_EFFECT", value: val }); };
  const pickLetter = (l)=> dispatch({ type: "GUESS_LETTER", letter: l });

  return (
    <div className="page">
      <div className="container">
        <header className="center">
          <h1>🎯 ENGLISH WHEEL</h1>
          <p className="muted">Paneles de gramática y vocabulario</p>
        </header>
        <div className="header-row">
          {!teacher ? (
            <button className="btn" onClick={()=>{ const pin = prompt('Teacher PIN'); if(pin==='2468'){ setTeacher(true); alert('Modo profesor activado'); } else { alert('PIN incorrecto'); } }}>Teacher</button>
          ) : (
            <>
              <button className="btn" onClick={()=> setShowManager(true)}>Manage Topics</button>
              <button className="btn" onClick={()=> setTeacher(false)}>Lock</button>
            </>
          )}
        </div>

        {state.phase === "start" && (
          <section className="stack">
            <div className="center">
              <div className="big">⭐</div>
              <h2>¡Listo para jugar!</h2>
            </div>

            <div className="card">
              <h3>👥 Equipos</h3>
              <div className="row" style={{ justifyContent:'space-between', alignItems:'center' }}>
                <div className="label-inline">Número de equipos</div>
                <div className="row">
                  <button className="btn" onClick={()=> dispatch({ type:'SET_TEAM_COUNT', count: state.teams.length - 1 })} disabled={state.teams.length <= 1}>-</button>
                  <div className="badge">{state.teams.length}</div>
                  <button className="btn" onClick={()=> dispatch({ type:'SET_TEAM_COUNT', count: state.teams.length + 1 })} disabled={state.teams.length >= 4}>+</button>
                </div>
              </div>
              <div className="grid-auto" style={{ marginTop: 12 }}>
                {state.teams.map((t, i) => (
                  <div key={i} className="row">
                    <label className="label-inline">Equipo {i + 1}</label>
                    <input className="input" value={t.name} onChange={(e)=>{
                      const teams = state.teams.map((tt, idx)=> idx===i ? { ...tt, name: e.target.value } : tt);
                      dispatch({ type: 'SET_TEAMS', teams });
                    }}/>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="center">Elige un tema</h3>
              <div className="grid-3 gap">
                <button onClick={()=> dispatch({ type: 'SELECT_TOPIC', name: '' })} className={`card btn-ghost ${state.selectedTopicName === '' ? 'active' : ''}`}>
                  <div className="title">(ALEATORIO)</div>
                  <div className="muted small">Gramática: mixta</div>
                </button>
                {topicNames.map((name) => (
                  <button key={name} onClick={()=> dispatch({ type: 'SELECT_TOPIC', name })} className={`card btn-ghost left ${state.selectedTopicName === name ? 'active' : ''}`}>
                    <div className="title">{name}</div>
                    <div className="muted tiny">Gramática: {flatTopics[name].grammar}</div>
                    <div className="accent tiny">{flatTopics[name].panels.length} frases</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="center">
              <button onClick={()=> dispatch({ type:'START_GAME' })} className="btn primary lg">EMPEZAR</button>
            </div>
          </section>
        )}

        {state.phase !== "start" && (
          <section className="stack">
            <div className="grid-4 gap">
              <div className="grid-3 gap">
                <InfoBox title="Tema" value={state.currentTopicMeta?.name} />
                <InfoBox title="Gramática" value={state.currentTopicMeta?.grammar} />
                <InfoBox title="Vocabulario" value={state.currentTopicMeta?.vocabulary} />
              </div>
              <InfoBox title="Turno" value={state.teams[state.currentTeamIndex].name} />
            </div>
            <div className="grid-2 gap align-start">
              <Wheel value={state.wheelValue} onSpinEnd={handleSpinEnd} />
              <div className="stack">
                <Scoreboard teams={state.teams} current={state.currentTeamIndex} />
                <div className="panel">{masked}</div>
                <div className="muted">{state.message}</div>
                <div className="stack">
                  <div>
                    <div className="label-inline">Consonantes</div>
                    <Keyboard letters={consonants} disabled={typeof state.wheelValue !== "number" || state.wheelValue === 0} onPick={pickLetter} />
                  </div>
                  <div>
                    <div className="label-inline">Vocales</div>
                    <Keyboard letters={vowels} disabled={typeof state.wheelValue !== "number" || state.wheelValue === 0} onPick={pickLetter} />
                  </div>
                </div>
              </div>
            </div>
            <div className="row">
              <button className="btn warn" onClick={()=> dispatch({ type:'NEW_GAME' })}>Nuevo juego</button>
            </div>
          </section>
        )}

        {showManager && teacher && (
          <TopicManager topics={state.topics} onClose={()=> setShowManager(false)} onApply={(data)=>{ saveStoredTopics(data); dispatch({ type:'SET_TOPICS', topics: data }); }} />
        )}
      </div>
    </div>
  );
}
