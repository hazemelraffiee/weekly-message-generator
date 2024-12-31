"use strict";(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[586],{2586:(e,a,t)=>{t.r(a),t.d(a,{default:()=>j});var s=t(5155),r=t(2115);let l=e=>e.replace(/([a-z0-9])([A-Z])/g,"$1-$2").toLowerCase(),n=function(){for(var e=arguments.length,a=Array(e),t=0;t<e;t++)a[t]=arguments[t];return a.filter((e,a,t)=>!!e&&""!==e.trim()&&t.indexOf(e)===a).join(" ").trim()};var i={xmlns:"http://www.w3.org/2000/svg",width:24,height:24,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round"};let d=(0,r.forwardRef)((e,a)=>{let{color:t="currentColor",size:s=24,strokeWidth:l=2,absoluteStrokeWidth:d,className:c="",children:o,iconNode:m,...u}=e;return(0,r.createElement)("svg",{ref:a,...i,width:s,height:s,stroke:t,strokeWidth:d?24*Number(l)/Number(s):l,className:n("lucide",c),...u},[...m.map(e=>{let[a,t]=e;return(0,r.createElement)(a,t)}),...Array.isArray(o)?o:[o]])}),c=(e,a)=>{let t=(0,r.forwardRef)((t,s)=>{let{className:i,...c}=t;return(0,r.createElement)(d,{ref:s,iconNode:a,className:n("lucide-".concat(l(e)),i),...c})});return t.displayName="".concat(e),t},o=c("LoaderCircle",[["path",{d:"M21 12a9 9 0 1 1-6.219-8.56",key:"13zald"}]]),m=c("GraduationCap",[["path",{d:"M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z",key:"j76jl0"}],["path",{d:"M22 10v6",key:"1lu8f3"}],["path",{d:"M6 12.5V16a6 3 0 0 0 12 0v-3.5",key:"1r8lef"}]]),u=c("Users",[["path",{d:"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2",key:"1yyitq"}],["circle",{cx:"9",cy:"7",r:"4",key:"nufk8"}],["path",{d:"M22 21v-2a4 4 0 0 0-3-3.87",key:"kshegd"}],["path",{d:"M16 3.13a4 4 0 0 1 0 7.75",key:"1da9ce"}]]),g=c("PenLine",[["path",{d:"M12 20h9",key:"t2du7b"}],["path",{d:"M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z",key:"1ykcvy"}]]),h=c("Calendar",[["path",{d:"M8 2v4",key:"1cmpym"}],["path",{d:"M16 2v4",key:"4m81vk"}],["rect",{width:"18",height:"18",x:"3",y:"4",rx:"2",key:"1hopcy"}],["path",{d:"M3 10h18",key:"8toen8"}]]),x=c("Clock",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["polyline",{points:"12 6 12 12 16 14",key:"68esgv"}]]),p=c("Plus",[["path",{d:"M5 12h14",key:"1ays0h"}],["path",{d:"M12 5v14",key:"s699le"}]]),y=c("Trash2",[["path",{d:"M3 6h18",key:"d0wm0j"}],["path",{d:"M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6",key:"4alrt4"}],["path",{d:"M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2",key:"v07s0e"}],["line",{x1:"10",x2:"10",y1:"11",y2:"17",key:"1uufr5"}],["line",{x1:"14",x2:"14",y1:"11",y2:"17",key:"xtxkd"}]]),b=c("Check",[["path",{d:"M20 6 9 17l-5-5",key:"1gmf2c"}]]),f=c("Copy",[["rect",{width:"14",height:"14",x:"8",y:"8",rx:"2",ry:"2",key:"17jyea"}],["path",{d:"M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2",key:"zix9uf"}]]),v=(e,a)=>{let[t,s]=(0,r.useState)(()=>{try{let t=localStorage.getItem("weeklyMessage_".concat(e));return t?JSON.parse(t):a}catch(t){return console.error("Error loading ".concat(e," from localStorage:"),t),a}});return(0,r.useEffect)(()=>{try{let a=void 0===t?null:t;localStorage.setItem("weeklyMessage_".concat(e),JSON.stringify(a))}catch(a){console.error("Error saving ".concat(e," to localStorage:"),a)}},[e,t]),[t,s]},j=()=>{let[e,a]=(0,r.useState)(!1),[t,l]=(0,r.useState)(!1),[n,i]=v("reportDate",new Date().toISOString().split("T")[0]);(0,r.useEffect)(()=>{a(!0)},[]),new Date().toISOString().split("T")[0];let[d,c]=v("className",""),[j,k]=v("students",[]),[N,w]=v("sections",{weekStudy:{enabled:!0,fields:[]},notes:{enabled:!0,fields:[]},reminders:{enabled:!0,fields:[]},custom:{enabled:!1,fields:[]}}),[C,D]=v("formattedDate",""),[M,S]=v("attendance",{}),[E,I]=(0,r.useState)(""),[T,O]=(0,r.useState)("initial"),[L,_]=v("homework",{general:{enabled:!0,content:""},specific:{assignments:[]}}),A=(0,r.useCallback)(e=>{let a=new Date(e),t={weekday:"long",year:"numeric",month:"long",day:"numeric"},s=new Intl.DateTimeFormat("ar",t).formatToParts(a),r="";s.forEach(e=>{"weekday"===e.type?r+=e.value+"، ":["day","month","year"].includes(e.type)?r+=e.value+" ":"literal"===e.type&&"، "!==e.value&&(r+=e.value)}),r=r.trim()+" م";let l=new Intl.DateTimeFormat("ar-SA-u-ca-islamic",t).formatToParts(a),n="";return l.forEach(e=>{"weekday"===e.type?n+=e.value+"، ":["day","month","year"].includes(e.type)?n+=e.value+" ":"literal"===e.type&&"، "!==e.value&&(n+=e.value)}),n=n.trim()+" هـ","".concat(n," الموافق ").concat(r)},[]),z=(0,r.useCallback)(()=>{Object.keys(localStorage).forEach(e=>{e.startsWith("weeklyMessage_")&&localStorage.removeItem(e)}),c(d),k(j),i(()=>new Date().toISOString().split("T")[0]),D(""),S({}),_({general:{enabled:!0,content:""},specific:{enabled:!1,assignments:[]}}),w({weekStudy:{enabled:!0,fields:[]},notes:{enabled:!0,fields:[]},reminders:{enabled:!0,fields:[]},custom:{enabled:!1,fields:[]}})},[d,j,c,k,i,D,S,_,w]);(0,r.useEffect)(()=>{D(A(n))},[n,A]);let P=(0,r.useCallback)(()=>{E.trim()&&(k(e=>[...e,{id:Date.now().toString(),name:E.trim()}]),I(""))},[E,k]),V=(0,r.useCallback)(e=>{k(a=>a.filter(a=>a.id!==e))},[k]),F=(0,r.useCallback)(function(e,a){let t=arguments.length>2&&void 0!==arguments[2]?arguments[2]:"";S(s=>({...s,[e]:{present:a,lateMinutes:t}}))},[]),W=(0,r.useCallback)(e=>{w(a=>({...a,[e]:{...a[e],enabled:!a[e].enabled}}))},[]),B=(0,r.useCallback)((e,a,t,s)=>{w(r=>({...r,[e]:{...r[e],fields:r[e].fields.map(e=>e.id===a?{...e,[t]:s}:e)}}))},[w]),H=(0,r.useCallback)(e=>{w(a=>({...a,[e]:{...a[e],fields:[...a[e].fields,{id:Date.now().toString(),key:"",value:""}]}}))},[w]),J=(0,r.useCallback)((e,a)=>{w(t=>({...t,[e]:{...t[e],fields:t[e].fields.filter(e=>e.id!==a)}}))},[w]),R=(0,r.useCallback)((e,a)=>{_(t=>({...t,general:{...t.general,[e]:a}}))},[]),$=(0,r.useCallback)((e,a,t)=>{_(s=>{switch(e){case"add":return{...s,specific:{...s.specific,assignments:[...s.specific.assignments,{studentIds:[],content:""}]}};case"remove":return{...s,specific:{...s.specific,assignments:s.specific.assignments.filter((e,t)=>t!==a)}};case"update":return{...s,specific:{...s.specific,assignments:s.specific.assignments.map((e,s)=>s===a?{...e,...t}:e)}};case"toggle":return{...s,specific:{...s.specific,enabled:!s.specific.enabled}};default:return s}})},[]),q=(0,r.useCallback)(()=>{let e=j.filter(e=>{var a;return null===(a=M[e.id])||void 0===a?void 0:a.present}),a=j.filter(e=>{var a;return!(null===(a=M[e.id])||void 0===a?void 0:a.present)}),t="";return e.length>0&&(t+="*الطلاب الحاضرون:*\n",e.sort((e,a)=>{var t,s;let r=null===(t=M[e.id])||void 0===t?void 0:t.lateMinutes,l=null===(s=M[a.id])||void 0===s?void 0:s.lateMinutes;return r&&!l?1:!r&&l?-1:e.name.localeCompare(a.name)}).forEach(e=>{var a;let s=null===(a=M[e.id])||void 0===a?void 0:a.lateMinutes;t+=s?"⏰ ".concat(e.name," (متأخر ").concat(s," دقيقة)\n"):"✅ ".concat(e.name,"\n")})),a.length>0&&(t&&(t+="\n"),t+="*الطلاب الغائبون:*\n",a.sort((e,a)=>e.name.localeCompare(a.name)).forEach(e=>{t+="❌ ".concat(e.name,"\n")})),t},[M,j]),G=(0,r.useCallback)(()=>{if(!L.general.enabled)return"";let e="";if(L.general.content&&(e+="*الواجب العام:*\n",e+="".concat(L.general.content,"\n\n")),L.specific.enabled&&L.specific.assignments.length>0){let a=L.specific.assignments.filter(e=>e.studentIds.length>0&&e.content);a.length>0&&(e+="*واجبات خاصة:*\n",a.forEach(a=>{let t=a.studentIds.map(e=>{var a;return null===(a=j.find(a=>a.id===e))||void 0===a?void 0:a.name}).filter(Boolean).join("، ");e+="\uD83D\uDD38 *".concat(t,":*\n"),e+="".concat(a.content,"\n\n")}))}return e?"\uD83D\uDCDD *الواجبات:*\n".concat(e):""},[L,j]),K=(0,r.useCallback)(()=>{let e="بسم الله الرحمن الرحيم\n";e+="السلام عليكم ورحمة الله وبركاته\n\n",e+="\uD83D\uDC65 *أولياء أمورنا الكرام في فصل ".concat(d,"*\n"),e+="\uD83D\uDCC5 *تقرير يوم ".concat(C,"*\n\n"),j.length>0&&(e+=q()+"\n"),Object.entries(N).forEach(a=>{let[t,s]=a;s.enabled&&s.fields.some(e=>e.key&&e.value)&&(e+="".concat({weekStudy:"\uD83D\uDCD6",notes:"\uD83D\uDCCB",reminders:"⚠️",custom:"\uD83D\uDCCC"}[t]," *").concat({weekStudy:"ما تم دراسته هذا الأسبوع",notes:"ملاحظات المعلم",reminders:"تذكيرات مهمة",custom:"معلومات إضافية"}[t],"*\n"),s.fields.forEach(a=>{a.key&&a.value&&(e+="\uD83D\uDD38 *".concat(a.key,":*\n"),a.value.split("\n").forEach(a=>{a.trim()&&(e+="".concat(a.trim(),"\n"))}),e+="\n")}))});let a=G();return a&&(e+=a+"\n"),e+="\uD83E\uDD32 جزاكم الله خيراً\n",e+="وتفضلوا بقبول فائق الاحترام والتقدير"},[d,C,j,N,q,G]),U=(0,r.useCallback)(()=>{let e=K(),a=document.createElement("textarea");a.value=e,a.style.position="fixed",a.style.opacity="0",a.style.pointerEvents="none",document.body.appendChild(a);try{O("copying"),a.select(),document.execCommand("copy"),O("copied"),l(!0),setTimeout(()=>{O("initial"),l(!1)},2e3)}catch(a){console.error("Failed to copy:",a),navigator.clipboard?navigator.clipboard.writeText(e).then(()=>{O("copied"),l(!0),setTimeout(()=>{O("initial"),l(!1)},2e3)}).catch(e=>{console.error("Clipboard API failed:",e),O("initial")}):O("initial")}finally{document.body.removeChild(a)}},[K]);return e?(0,s.jsxs)("div",{className:"container mx-auto p-4 max-w-4xl text-gray-100",dir:"rtl",children:[(0,s.jsxs)("div",{className:"flex items-center gap-3 mb-8",children:[(0,s.jsx)(m,{className:"h-8 w-8 text-blue-500"}),(0,s.jsx)("h1",{className:"text-2xl font-bold",children:"منشئ الرسائل الأسبوعية"})]}),(0,s.jsxs)("div",{className:"mb-4 rounded-lg border border-gray-700 bg-gray-800/50 shadow-sm backdrop-blur-sm",children:[(0,s.jsxs)("div",{className:"flex items-center gap-3 p-6 border-b border-gray-700",children:[(0,s.jsx)(u,{className:"h-5 w-5 text-blue-400"}),(0,s.jsx)("h3",{className:"text-lg font-semibold",children:"معلومات الفصل"})]}),(0,s.jsxs)("div",{className:"p-6 pt-0 space-y-4",children:[(0,s.jsxs)("div",{className:"space-y-2",children:[(0,s.jsxs)("label",{className:"text-sm font-medium flex items-center gap-2",children:[(0,s.jsx)(g,{className:"h-4 w-4 text-gray-400"}),"اسم الفصل"]}),(0,s.jsx)("input",{className:"flex h-10 w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",value:d,onChange:e=>c(e.target.value),placeholder:"أدخل اسم الفصل",dir:"rtl"})]}),(0,s.jsxs)("div",{className:"space-y-2",children:[(0,s.jsxs)("label",{className:"text-sm font-medium flex items-center gap-2",children:[(0,s.jsx)(h,{className:"h-4 w-4 text-gray-400"}),"التاريخ"]}),(0,s.jsx)("input",{type:"date",value:n,onChange:e=>i(e.target.value),className:"flex h-10 w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 text-right"}),(0,s.jsxs)("div",{className:"text-sm text-gray-400 mt-2 flex items-center gap-2",children:[(0,s.jsx)(x,{className:"h-4 w-4"}),C]})]})]})]}),(0,s.jsxs)("div",{className:"mb-4 rounded-lg border border-gray-700 bg-gray-800 shadow-sm",children:[(0,s.jsx)("div",{className:"flex flex-col space-y-1.5 p-6",children:(0,s.jsx)("h3",{className:"text-lg font-semibold leading-none tracking-tight",children:"الحضور والغياب"})}),(0,s.jsxs)("div",{className:"p-6 pt-0 space-y-4",children:[(0,s.jsxs)("div",{className:"flex gap-2",children:[(0,s.jsx)("input",{className:"flex-1 h-10 rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100",value:E,onChange:e=>I(e.target.value),placeholder:"اسم الطالب",dir:"rtl",onKeyDown:e=>{"Enter"===e.key&&(e.preventDefault(),P())}}),(0,s.jsxs)("button",{onClick:P,className:"inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-gray-700 hover:bg-gray-700 h-10 px-4 py-2",children:[(0,s.jsx)(p,{className:"h-4 w-4 inline-block ml-2"}),"إضافة طالب"]})]}),j.length>0&&(0,s.jsx)("div",{className:"border rounded-lg p-4 space-y-3",children:j.map(e=>{var a,t,r;return(0,s.jsxs)("div",{className:"flex items-center gap-3 p-2 bg-gray-700 rounded",children:[(0,s.jsx)("input",{type:"checkbox",className:"h-4 w-4 rounded border border-gray-600 bg-gray-700",checked:(null===(a=M[e.id])||void 0===a?void 0:a.present)||!1,onChange:a=>F(e.id,a.target.checked)}),(0,s.jsx)("span",{className:"flex-1",children:e.name}),(null===(t=M[e.id])||void 0===t?void 0:t.present)&&(0,s.jsx)("input",{type:"number",placeholder:"دقائق التأخير",className:"w-32 text-center h-10 rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2",value:(null===(r=M[e.id])||void 0===r?void 0:r.lateMinutes)||"",onChange:a=>F(e.id,!0,a.target.value)}),(0,s.jsx)("button",{onClick:()=>V(e.id),className:"inline-flex items-center justify-center rounded-md text-sm font-medium h-10 w-10 hover:bg-red-600/10 text-red-600 transition-colors",title:"حذف الطالب",children:(0,s.jsx)(y,{className:"h-4 w-4"})})]},e.id)})})]})]}),(0,s.jsxs)("div",{className:"mb-4 rounded-lg border border-gray-700 bg-gray-800 shadow-sm",children:[(0,s.jsxs)("div",{className:"flex items-center gap-2 p-6 pb-2",children:[(0,s.jsx)("input",{type:"checkbox",className:"h-4 w-4 rounded border border-gray-600 bg-gray-700",checked:L.general.enabled,onChange:e=>R("enabled",e.target.checked)}),(0,s.jsx)("h3",{className:"text-lg font-semibold leading-none tracking-tight",children:"الواجبات"})]}),L.general.enabled&&(0,s.jsxs)("div",{className:"p-6 pt-0 space-y-4",children:[(0,s.jsxs)("div",{className:"space-y-2",children:[(0,s.jsx)("label",{className:"text-sm font-medium",children:"الواجب العام (لجميع الطلاب)"}),(0,s.jsx)("textarea",{className:"w-full min-h-[100px] rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100",value:L.general.content,onChange:e=>R("content",e.target.value),placeholder:"اكتب الواجب العام هنا",dir:"rtl"})]}),(0,s.jsxs)("div",{className:"border-t pt-4",children:[(0,s.jsx)("div",{className:"flex justify-between items-center mb-4",children:(0,s.jsx)("h4",{className:"text-sm font-medium",children:"الواجبات الخاصة"})}),(0,s.jsxs)("div",{className:"space-y-4",children:[L.specific.assignments.map((e,a)=>(0,s.jsx)("div",{className:"border rounded-lg p-4",children:(0,s.jsxs)("div",{className:"flex justify-between items-start gap-2",children:[(0,s.jsxs)("div",{className:"flex-1 space-y-4",children:[(0,s.jsxs)("div",{className:"bg-gray-900 rounded-lg p-3 border border-gray-700",children:[(0,s.jsx)("div",{className:"text-sm text-gray-400 mb-2",children:"اختر الطلاب:"}),(0,s.jsx)("div",{className:"grid grid-cols-2 gap-2",children:j.map(t=>(0,s.jsxs)("div",{className:"flex items-center gap-2 p-1",children:[(0,s.jsx)("input",{type:"checkbox",className:"h-4 w-4 rounded border border-gray-600 bg-gray-700",checked:e.studentIds.includes(t.id),onChange:s=>{$("update",a,{studentIds:s.target.checked?[...e.studentIds,t.id]:e.studentIds.filter(e=>e!==t.id)})}}),(0,s.jsx)("span",{className:"text-sm",children:t.name})]},t.id))})]}),(0,s.jsx)("div",{children:(0,s.jsx)("textarea",{className:"w-full min-h-[100px] rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100",value:e.content,onChange:e=>$("update",a,{content:e.target.value}),placeholder:"اكتب الواجب الخاص هنا",dir:"rtl"})})]}),(0,s.jsx)("button",{onClick:()=>$("remove",a),className:"inline-flex items-center justify-center rounded-md text-sm font-medium h-10 w-10 hover:bg-red-600/10 text-red-600 transition-colors",title:"حذف الواجب",children:(0,s.jsx)(y,{className:"h-4 w-4"})})]})},a)),(0,s.jsxs)("button",{onClick:()=>$("add"),className:"w-full border-2 border-dashed rounded-md p-3 hover:bg-gray-700/50 border-gray-700 transition-colors",children:[(0,s.jsx)(p,{className:"h-4 w-4 inline-block ml-2"}),"إضافة واجب خاص"]})]})]})]})]}),Object.entries(N).map(e=>{let[a,t]=e;return(0,s.jsxs)("div",{className:"mb-4 rounded-lg border border-gray-700 bg-gray-800 shadow-sm",children:[(0,s.jsxs)("div",{className:"flex items-center gap-2 p-6 pb-2",children:[(0,s.jsx)("input",{type:"checkbox",className:"h-4 w-4 rounded border border-gray-600 bg-gray-700",checked:t.enabled,onChange:()=>W(a)}),(0,s.jsx)("h3",{className:"text-lg font-semibold leading-none tracking-tight",children:{weekStudy:"ما تم دراسته",notes:"ملاحظات المعلم",reminders:"تذكيرات",custom:"قسم مخصص"}[a]})]}),t.enabled&&(0,s.jsxs)("div",{className:"p-6 pt-0 grid gap-4",children:[t.fields.map(e=>(0,s.jsxs)("div",{className:"grid gap-2",children:[(0,s.jsxs)("div",{className:"flex gap-2",children:[(0,s.jsx)("input",{className:"flex-1 h-10 rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100",value:e.key,onChange:t=>B(a,e.id,"key",t.target.value),placeholder:"العنوان",dir:"rtl"}),(0,s.jsx)("button",{onClick:()=>J(a,e.id),className:"inline-flex items-center justify-center rounded-md text-sm font-medium h-10 w-10 hover:bg-red-600/10 text-red-600 transition-colors",title:"حذف الحقل",children:(0,s.jsx)(y,{className:"h-4 w-4"})})]}),(0,s.jsx)("textarea",{className:"w-full min-h-[100px] rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100",value:e.value,onChange:t=>B(a,e.id,"value",t.target.value),placeholder:"المحتوى",dir:"rtl"})]},e.id)),(0,s.jsxs)("button",{onClick:()=>H(a),className:"w-full border-2 border-dashed rounded-md p-2 hover:bg-gray-700 border-gray-700",children:[(0,s.jsx)(p,{className:"h-4 w-4 inline-block ml-2"}),"إضافة حقل جديد"]})]})]},a)}),(0,s.jsxs)("div",{className:"flex gap-4 mt-8",children:[(0,s.jsxs)("div",{className:"relative flex-1",children:["copied"===T&&(0,s.jsx)("div",{className:"absolute -top-12 left-1/2 transform -translate-x-1/2",children:(0,s.jsx)("div",{className:"bg-green-600 text-white px-4 py-2 rounded-md shadow-lg text-sm animate-fade-in",children:(0,s.jsxs)("div",{className:"flex items-center gap-2",children:[(0,s.jsx)(b,{className:"h-4 w-4"}),(0,s.jsx)("span",{children:"تم نسخ الرسالة بنجاح"})]})})}),(0,s.jsx)("button",{onClick:U,disabled:"copying"===T,className:"\n        w-full inline-flex items-center justify-center rounded-md text-sm font-medium\n        h-12 px-6 py-2 transition-all duration-300\n        disabled:opacity-70 disabled:cursor-not-allowed\n        ".concat("copied"===T?"bg-green-600 hover:bg-green-700":"bg-blue-600 hover:bg-blue-700","\n      "),children:(0,s.jsxs)("div",{className:"flex items-center gap-2",children:["copying"===T?(0,s.jsx)(o,{className:"h-5 w-5 animate-spin"}):"copied"===T?(0,s.jsx)(b,{className:"h-5 w-5 animate-scale-up"}):(0,s.jsx)(f,{className:"h-5 w-5"}),(0,s.jsx)("span",{className:"font-medium",children:"copying"===T?"جاري النسخ...":"copied"===T?"تم النسخ!":"نسخ الرسالة"})]})})]}),(0,s.jsx)("button",{onClick:z,className:"flex-1 inline-flex items-center justify-center rounded-md text-sm font-medium  bg-red-600 hover:bg-red-700 h-12 px-6 py-2 transition-colors duration-200 group",children:(0,s.jsxs)("div",{className:"flex items-center gap-2",children:[(0,s.jsx)(y,{className:"h-5 w-5 transition-transform group-hover:scale-110"}),(0,s.jsx)("span",{className:"font-medium",children:"مسح البيانات"})]})})]})]}):(0,s.jsx)("div",{className:"flex items-center justify-center min-h-screen",children:(0,s.jsxs)("div",{className:"flex items-center gap-3 text-lg",children:[(0,s.jsx)(o,{className:"h-6 w-6 animate-spin text-blue-500"}),(0,s.jsx)("span",{children:"جاري التحميل..."})]})})}}}]);