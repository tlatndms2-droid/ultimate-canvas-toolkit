import {Plugin} from "obsidian";
import {CanvasAdapter} from "./canvas/canvas-adapter";
import {TitleResolver} from "./collapse/title-resolver";
import {EditorManager} from "./editor/editor-manager";
import {MetadataStore} from "./storage/metadata-store";
export default class UctEditor extends Plugin {
 settings:any;canvasAdapter:any;editorManager:any;store:any;
 async onload(){this.store=new MetadataStore(this);await this.store.load();this.settings=this.store.settings;this.settings.collapsibleCardsEnabled=false;this.canvasAdapter=new CanvasAdapter(this.app);this.editorManager=new EditorManager(this.app,this as any,this.canvasAdapter,this.store,new TitleResolver(this.canvasAdapter));}
 async savePluginData(){await this.store.save();}
 async refreshOpenCanvases(){}
 async onunload(){await this.editorManager?.close();}
}
