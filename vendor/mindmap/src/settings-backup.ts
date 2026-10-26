export const settingKeys=['mode','width','height','gap','resizeStep','swapTolerance','panDuration','panStep','zoomStepPercent','followCaret','editMinZoom','arrangeDepth','arrangeRange'] as const;
export function settingsOnly(source:any){return Object.fromEntries(settingKeys.map(k=>[k,structuredClone(k==='arrangeDepth'?(source[k]??1):k==='arrangeRange'?(source[k]??3):source[k])]))}
export function parseBackup(text:string){
 const file=JSON.parse(text),s=file?.settings;
 if(s&&typeof s==='object'&&!Array.isArray(s)&&!Object.prototype.hasOwnProperty.call(s,'arrangeDepth'))s.arrangeDepth=1;
 if(s&&typeof s==='object'&&!Array.isArray(s)&&!Object.prototype.hasOwnProperty.call(s,'arrangeRange'))s.arrangeRange=3;
 if(s&&typeof s==='object'&&!Array.isArray(s)&&!Object.prototype.hasOwnProperty.call(s,'panStep')&&!Object.prototype.hasOwnProperty.call(s,'zoomStepPercent')){s.panStep=60;s.zoomStepPercent=(2**0.1-1)*100;}
 // Accept earlier settings-only backups, but never restore removed automatic execution.
 if(s&&Object.prototype.hasOwnProperty.call(s,'autoResize')){if(typeof s.autoResize!=='boolean')throw Error('설정값이 올바르지 않습니다.');delete s.autoResize;}
 if(file?.format!=='canvas-mindmap-settings'||file.version!==1||!s||typeof s!=='object'||Array.isArray(s)||Object.keys(s).length!==settingKeys.length||settingKeys.some(k=>!Object.prototype.hasOwnProperty.call(s,k)))throw Error('지원하지 않는 백업 형식입니다.');
 if(!['create','connect'].includes(s.mode)||typeof s.followCaret!=='boolean')throw Error('설정값이 올바르지 않습니다.');
 for(const k of ['width','height','gap','resizeStep','swapTolerance','panDuration','editMinZoom','panStep','zoomStepPercent']){const v=s[k];if((k==='width'||k==='height')&&v===null)continue;if(typeof v!=='number'||!Number.isFinite(v)||((k==='width'||k==='height'||k==='resizeStep'||k==='panStep'||k==='zoomStepPercent')?v<=0:v<0))throw Error('숫자 설정값이 올바르지 않습니다.');}
 if(s.editMinZoom<6.25||s.editMinZoom>200)throw Error('확대율이 올바르지 않습니다.');
 if(!Number.isInteger(s.arrangeDepth)||s.arrangeDepth<1||s.arrangeDepth>10)throw Error('정렬 연결 단계는 1~10의 정수여야 합니다.');
 if(!Number.isInteger(s.arrangeRange)||s.arrangeRange<1||s.arrangeRange>5)throw Error('정렬 거리 범위는 1~5의 정수여야 합니다.');
 return settingsOnly(s);
}
export function makeBackup(settings:any){const text=JSON.stringify({format:'canvas-mindmap-settings',version:1,settings:settingsOnly(settings)},null,2);parseBackup(text);return text;}
