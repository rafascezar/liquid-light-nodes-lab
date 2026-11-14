import React from 'react';
import {Circle,Square,Hexagon,Star} from 'lucide-react';
import Dropdown from './Dropdown.jsx';
const shapes=[{value:'circle',label:'Circle',Icon:Circle},{value:'rectangle',label:'Rectangle',Icon:Square},{value:'polygon',label:'Polygon',Icon:Hexagon},{value:'star',label:'Star',Icon:Star}];
export default function ShapeSelector({id,value,onChange}){return <Dropdown id={id} aria-label="Shape" value={value} onValueChange={onChange} options={shapes}/>;}
