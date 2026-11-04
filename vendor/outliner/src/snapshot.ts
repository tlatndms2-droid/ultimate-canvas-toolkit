import type {CanvasDocument} from './model';
const ownedSnapshots=new WeakSet<object>();
// Call only for JSON parsed by Outliner, never for Canvas-owned runtime objects.
export function ownSnapshot(doc:CanvasDocument):CanvasDocument {
 const freeze=(value:any):void=>{if(!value||typeof value!=='object')return;for(const child of Object.values(value))freeze(child);Object.freeze(value);};
 freeze(doc);ownedSnapshots.add(doc);return doc;
}
export const isOwnedSnapshot=(value:unknown):value is CanvasDocument=>!!value&&typeof value==='object'&&ownedSnapshots.has(value as object);

// Web-preview HTML belongs to the Canvas file, not to Outliner configuration.
// Retain every other extension field, and never mutate Canvas-owned objects.
export function outlinerSnapshot(doc:CanvasDocument):CanvasDocument {
 return {...doc,nodes:doc.nodes.map(node=>{
  if(!Object.prototype.hasOwnProperty.call(node,'websiteContent'))return node;
  const {websiteContent,...rest}=node;return rest;
 })};
}
