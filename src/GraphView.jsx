import React,{memo,useCallback,useEffect,useMemo,useRef,useState} from 'react';
import {ReactFlow,Background,BackgroundVariant,BaseEdge,EdgeLabelRenderer,getBezierPath,applyNodeChanges} from '@xyflow/react';
import {Plus,Unplug} from 'lucide-react';
import {nodeDefinition,REGISTRY,TYPES,validateConnection} from './model.js';
import {EffectNode} from './ui.jsx';
const nodeTypes={effect:EffectNode};
const Wire=memo(function Wire(props){const [path,cx,cy]=getBezierPath(props);return <><BaseEdge id={props.id} path={path} markerStart={props.markerStart} markerEnd={props.markerEnd} style={{...props.style,strokeWidth:props.selected?2.4:1.4}} interactionWidth={20}/>{props.selected&&<EdgeLabelRenderer><div className="wire-actions nodrag nopan" style={{transform:`translate(-50%,-50%) translate(${cx}px,${cy}px)`}}><button onClick={()=>props.data.insert(props.id)} title="Insert a node on this wire"><Plus size={13}/>Insert</button><button onClick={()=>props.data.disconnect(props.id)} title="Unplug this connection"><Unplug size={13}/></button></div></EdgeLabelRenderer>}</>;});
const edgeTypes={wire:Wire},fitOptions={padding:.12,minZoom:.35,maxZoom:1},proOptions={hideAttribution:false};
export default memo(function GraphView({graph,selected,selectedEdge,openGroup,preview,openAdd,disconnect,selectNode,selectEdge,clearSelection,moveNode,connectPorts,notify,setGraphStatus}){
 const [nodes,setNodes]=useState([]),dataCache=useRef(new Map()),edgeCache=useRef(new Map());
 // Retain measured dimensions and every unaffected object while dragging. Document
 // positions are committed only on drop, without invalidating evaluation inputs.
 useEffect(()=>{setNodes(previous=>{const prior=new Map(previous.map(n=>[n.id,n]));return graph.nodes.map(n=>{
  const incoming=graph.edges.filter(e=>e.target===n.id),bound=incoming.filter(e=>e.targetHandle.startsWith('param:')).map(e=>e.targetHandle.slice(6)),error=nodeDefinition(n).inputs.some(p=>p.required&&!incoming.some(e=>e.targetHandle===p.id));
  const signature=bound.join('|')+':'+error+':'+(n.id===graph.preview),old=dataCache.current.get(n.id);
  let data;if(old&&old.source===n.data&&old.signature===signature&&old.preview===preview)data=old.value;else{data={...n.data,onPreview:preview,preview:n.id===graph.preview,bound,error};dataCache.current.set(n.id,{source:n.data,signature,preview,value:data});}
  const p=prior.get(n.id),isSelected=n.id===selected;
  if(p&&p.data===data&&p.selected===isSelected&&p.position.x===n.position.x&&p.position.y===n.position.y)return p;
  return {...p,...n,data,selected:isSelected};
 });});const ids=new Set(graph.nodes.map(n=>n.id));for(const id of dataCache.current.keys())if(!ids.has(id))dataCache.current.delete(id);},[graph.nodes,graph.edges,graph.preview,selected,preview]);
 const edges=useMemo(()=>{const definitions=new Map(graph.nodes.map(n=>[n.id,nodeDefinition(n)])),ids=new Set();const result=graph.edges.map(e=>{ids.add(e.id);const selected=e.id===selectedEdge,color=TYPES[definitions.get(e.source)?.out]||'#777',old=edgeCache.current.get(e.id);if(old&&old.source===e&&old.selected===selected&&old.color===color&&old.insert===openAdd&&old.disconnect===disconnect)return old.value;const value={...e,type:'wire',selected,style:{stroke:color},data:{insert:openAdd,disconnect}};edgeCache.current.set(e.id,{source:e,selected,color,insert:openAdd,disconnect,value});return value;});for(const id of edgeCache.current.keys())if(!ids.has(id))edgeCache.current.delete(id);return result;},[graph.edges,graph.nodes,selectedEdge,openAdd,disconnect]);
 const onNodesChange=useCallback(changes=>setNodes(ns=>applyNodeChanges(changes,ns)),[]);
 const onNodeClick=useCallback((e,n)=>selectNode(n.id),[selectNode]);
 const onEdgeClick=useCallback((e,edge)=>selectEdge(edge.id),[selectEdge]);
 const onNodeDragStop=useCallback((e,n)=>moveNode(n.id,n.position),[moveNode]);
 const onEdgesChange=useCallback(changes=>{for(const c of changes)if(c.type==='remove')disconnect(c.id);},[disconnect]);
 const onConnect=useCallback(c=>connectPorts(c),[connectPorts]);
 const onReconnect=useCallback((old,c)=>connectPorts(c,old.id),[connectPorts]);
 const isValidConnection=useCallback(c=>!validateConnection(graph,c),[graph]);
 const onConnectStart=useCallback(()=>setGraphStatus('Connect matching types. Existing inputs are replaced safely.'),[setGraphStatus]);
 const onConnectEnd=useCallback((event,state)=>{if(!state.isValid&&state.toNode&&state.fromNode){const msg=validateConnection(graph,{source:state.fromNode.id,target:state.toNode.id,targetHandle:state.toHandle?.id});setGraphStatus(msg||'Choose a compatible input.');if(msg)notify(msg,'error');}else setGraphStatus('Drag a node, or double-click a wire to insert.');},[graph,setGraphStatus,notify]);
 const onEdgeDoubleClick=useCallback((e,edge)=>{e.preventDefault();openAdd(edge.id);},[openAdd]);
 return <ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} edgeTypes={edgeTypes} fitView fitViewOptions={fitOptions} minZoom={.15} maxZoom={2} onNodeDoubleClick={(e,n)=>{if(n.data.kind==='group')openGroup(n.id);}} onNodeClick={onNodeClick} onEdgeClick={onEdgeClick} onPaneClick={clearSelection} onNodesChange={onNodesChange} onNodeDragStop={onNodeDragStop} onEdgesChange={onEdgesChange} onConnect={onConnect} isValidConnection={isValidConnection} onReconnect={onReconnect} edgesReconnectable onConnectStart={onConnectStart} onConnectEnd={onConnectEnd} onEdgeDoubleClick={onEdgeDoubleClick} connectionRadius={24} deleteKeyCode={null} colorMode="dark" proOptions={proOptions} preventScrolling selectionOnDrag={false} nodesFocusable edgesFocusable><Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#ffffff13"/></ReactFlow>;
});
