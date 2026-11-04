export function safeArchivePath(path:string){return !!path&&!path.includes('\\')&&!path.startsWith('/')&&!/^[a-z]:/i.test(path)&&!path.split('/').some(p=>p==='..'||p==='.'||!p);}
