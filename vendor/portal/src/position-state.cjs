// Preserve only the saved position belonging to the exact tab and Canvas file.
function savedPositions(layout){
  const positions=new Map();
  const visit=item=>{
    if(!item||typeof item!=='object')return;
    const state=item.state,position=state?.state?.canvasPortalPosition;
    if(item.type==='leaf'&&typeof item.id==='string'&&state?.type==='canvas'&&position?.version===1&&position.file===state.state.file&&Array.isArray(position.path))positions.set(item.id,JSON.parse(JSON.stringify(position)));
    if(Array.isArray(item.children))item.children.forEach(visit);
  };
  if(layout&&typeof layout==='object')for(const value of Object.values(layout))visit(value);
  return positions;
}
module.exports={savedPositions};
