import type {CanvasDocument} from './model';

// Web-preview HTML belongs to the Canvas file, not to Outliner configuration.
// Retain every other extension field, and never mutate Canvas-owned objects.
export function outlinerSnapshot(doc:CanvasDocument):CanvasDocument {
 return {...doc,nodes:doc.nodes.map(node=>{
  if(!Object.prototype.hasOwnProperty.call(node,'websiteContent'))return node;
  const {websiteContent,...rest}=node;return rest;
 })};
}
