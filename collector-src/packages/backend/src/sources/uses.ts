export const readsWhole=(s:{participation_mode:string;uses?:readonly string[]})=>s.participation_mode==="editorial"||(s.uses?.length??0)>0;
