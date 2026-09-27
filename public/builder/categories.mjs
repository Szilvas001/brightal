import { FASHION_STYLES, DAILY_STYLES } from './state.mjs';
export const CATEGORIES = [
  {id:'classic',name:['Eljegyzési gyűrűk','Engagement rings'],styles:['solitaire','hiddenhalo','bezel','tension','halo','trilogy','vintage','pave','duet','cathedral','split']},
  {id:'daily',name:['Mindennapi gyémánt','Everyday diamonds'],styles:DAILY_STYLES},
  {id:'wedding',name:['Karika és örökkévalóság','Wedding and eternity'],styles:['band','eternity','fullcircle','tapered','fluted']},
  {id:'sculpture',name:['Organikus szoborgyűrűk','Organic sculpture'],styles:['wave','dome','twist','saddle','petal','ripple']},
  {id:'architecture',name:['Geometrikus és rétegzett','Geometry and layers'],styles:['stack','open','rope','fluted','tapered']},
  {id:'statement',name:['Pecsét és hangsúlyos formák','Signets and statement'],styles:['signet','scatter','eastwest','dome','saddle']},
  {id:'contour',name:['Kontúr és korona','Contour and crown'],styles:['chevron','contour','crown','ribbon','curvedoval','wavebezel','openpair']},
  {id:'fashion',name:['Önkifejezés','Self-expression'],styles:FASHION_STYLES},
];
export const inCategory = (style, category) => category==='all' || !!CATEGORIES.find(c=>c.id===category)?.styles.includes(style);
