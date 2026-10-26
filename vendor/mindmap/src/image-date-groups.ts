export const creationGroups=['오늘','어제','이번 주','이번 달','이전'] as const;
/** Local calendar boundaries; Monday starts the week. Earlier groups take precedence. */
export function creationGroup(timestamp:number,now=new Date()):number{
 const today=new Date(now.getFullYear(),now.getMonth(),now.getDate());
 const yesterday=new Date(today);yesterday.setDate(yesterday.getDate()-1);
 const week=new Date(today);week.setDate(week.getDate()-(week.getDay()+6)%7);
 const month=new Date(now.getFullYear(),now.getMonth(),1);
 if(timestamp>=today.getTime())return 0;
 if(timestamp>=yesterday.getTime())return 1;
 if(timestamp>=week.getTime())return 2;
 if(timestamp>=month.getTime())return 3;
 return 4;
}
