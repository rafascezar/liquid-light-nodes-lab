// The animation clock belongs to the preview, not the document or node editor.
export function createClock(){
 const ref={current:0};let snapshot=0;const listeners=new Set();
 return {ref,getSnapshot:()=>snapshot,subscribe:listener=>{listeners.add(listener);return()=>listeners.delete(listener);},set(value){ref.current=value;if(value===snapshot)return;snapshot=value;for(const listener of listeners)listener();}};
}
