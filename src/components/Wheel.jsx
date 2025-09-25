import React, { useEffect, useRef } from 'react';
const WHEEL_VALUES = [10,9,8,7,6,"LOSE TURN",5,4,3,2,1,"BANKRUPT"];
const WHEEL_COLORS = ["#3B82F6","#10B981","#F59E0B","#EF4444","#8B5CF6","#DC2626","#06B6D4","#84CC16","#F97316","#EC4899","#6366F1","#991B1B"];
export default function Wheel({ value, onSpinEnd }){
  const canvasRef = useRef(null);
  const draw = (ctx) => {
    const c = ctx.canvas; const r = Math.min(c.width, c.height)/2 - 10; const cx = c.width/2, cy=c.height/2;
    ctx.clearRect(0,0,c.width,c.height);
    const seg = (2*Math.PI)/WHEEL_VALUES.length;
    for(let i=0;i<WHEEL_VALUES.length;i++){ const start=i*seg - Math.PI/2; const end=start+seg;
      ctx.beginPath(); ctx.moveTo(cx,cy); ctx.arc(cx,cy,r,start,end); ctx.closePath(); ctx.fillStyle=WHEEL_COLORS[i%WHEEL_COLORS.length]; ctx.fill();
      ctx.strokeStyle="#fff"; ctx.lineWidth=3; ctx.stroke();
      ctx.save(); ctx.translate(cx,cy); ctx.rotate(start+seg/2); ctx.translate(r*0.7,0); ctx.rotate(Math.PI/2);
      ctx.fillStyle="#fff"; ctx.font="bold 14px system-ui,sans-serif"; ctx.textAlign="center"; ctx.textBaseline="middle";
      const txt=String(WHEEL_VALUES[i]); if(txt.length>8){ const w=txt.split(' '); const m=Math.ceil(w.length/2); ctx.fillText(w.slice(0,m).join(' '),0,-8); ctx.fillText(w.slice(m).join(' '),0,8);} else { ctx.fillText(txt,0,0); }
      ctx.restore();
    }
    ctx.beginPath(); ctx.arc(cx,cy,20,0,Math.PI*2); ctx.fillStyle="#374151"; ctx.fill(); ctx.strokeStyle="#fff"; ctx.lineWidth=3; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx,cy-r-6); ctx.lineTo(cx-10,cy-r-26); ctx.lineTo(cx+10,cy-r-26); ctx.closePath(); ctx.fillStyle="#111827"; ctx.fill();
  };
  useEffect(()=>{ const c=canvasRef.current; if(!c) return; const ctx=c.getContext('2d'); draw(ctx); });
  const spin = ()=>{ const spins=5+Math.random()*3, dur=2500, start=performance.now(); const seg=(2*Math.PI)/WHEEL_VALUES.length;
    const step=(now)=>{ const t=Math.min(1,(now-start)/dur); const ease=1-Math.pow(1-t,3); const angle=ease*spins*Math.PI*2;
      const c=canvasRef.current, ctx=c.getContext('2d'); ctx.save(); ctx.translate(c.width/2,c.height/2); ctx.rotate(angle); ctx.translate(-c.width/2,-c.height/2); draw(ctx); ctx.restore();
      if(t<1) requestAnimationFrame(step); else { const total=angle%(2*Math.PI); const fromTop=(3*Math.PI)/2-total; const idx=Math.floor((((fromTop%(2*Math.PI))+2*Math.PI)%(2*Math.PI))/seg); onSpinEnd(WHEEL_VALUES[idx]); }
    }; requestAnimationFrame(step); };
  return (<div className="wheel-wrap"><canvas ref={canvasRef} width={300} height={300} className="wheel-canvas"/><button onClick={spin} className="btn primary">Gira la rueda</button><div className="muted">{typeof value==="number"?`Valor: ${value}`:value||"—"}</div></div>);
}
