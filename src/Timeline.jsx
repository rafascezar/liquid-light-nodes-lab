import React,{useSyncExternalStore} from 'react';
import {SkipBack,Play,Pause,Repeat2} from 'lucide-react';
import {Button} from './ui.jsx';
export function TimeLabel({clock}){const time=useSyncExternalStore(clock.subscribe,clock.getSnapshot);return <>{time.toFixed(2)}</>;}
export function Transport({clock,playing,setPlaying,duration}){
 const time=useSyncExternalStore(clock.subscribe,clock.getSnapshot);
 return <footer className="transport"><Button title="Restart time" onClick={()=>clock.set(0)}><SkipBack size={16}/></Button><Button title={playing?'Pause (Space)':'Play (Space)'} active={playing} onClick={()=>setPlaying(!playing)}>{playing?<Pause size={17}/>:<Play size={17}/>}</Button><Repeat2 size={15} className="loop-icon"/><span className="timecode">00:{time.toFixed(2).padStart(5,'0')}</span><input aria-label="Animation time" type="range" min="0" max={duration} step="0.01" value={time} onChange={e=>{clock.set(Number(e.target.value));setPlaying(false);}}/><span className="duration">{duration.toFixed(1)} s</span><span className="transport-label">PARAMETRIC / OPTICAL</span></footer>;
}
