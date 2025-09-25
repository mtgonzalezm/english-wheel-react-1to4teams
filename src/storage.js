const STORAGE_KEY = "ew_topics_v1";
export function loadStoredTopics(){ try{ const raw = localStorage.getItem(STORAGE_KEY); return raw? JSON.parse(raw): null; }catch(_e){ return null; } }
export function saveStoredTopics(data){ try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }catch(_e){} }
