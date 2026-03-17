"use client";
import { useState, useRef, useEffect, useCallback } from "react";

/* ═══════════════ STORY ARC ═══════════════ */
const CHAPTERS = [
  { id: 1, title: "第一章", subtitle: "出会い", desc: "新学期の風が吹く。偶然の出会いが、物語の始まり。", maxTurns: 8, icon: "🌱" },
  { id: 2, title: "第二章", subtitle: "近づく距離", desc: "少しずつ縮まる二人の距離。日常が、特別に変わり始める。", maxTurns: 9, icon: "🌿" },
  { id: 3, title: "第三章", subtitle: "揺れる心", desc: "気持ちに気づき始める。けれど、素直になれない。", maxTurns: 9, icon: "🌊" },
  { id: 4, title: "第四章", subtitle: "すれ違い", desc: "想いが交錯する。近くて遠い、もどかしい時間。", maxTurns: 9, icon: "🌧️" },
  { id: 5, title: "第五章", subtitle: "桜色の約束", desc: "すべてが収束する。あなたの言葉が、結末を決める。", maxTurns: 10, icon: "🌸" },
];
const CHAPTER_PROMPTS = [
  "物語の序盤です。キャラクターはプレイヤーとまだ出会ったばかり。よそよそしくも好奇心がある態度で接してください。",
  "少しずつ打ち解けてきた段階です。共通の話題や趣味を通じて距離が縮まる様子を描いてください。キャラらしい一面を見せてください。",
  "キャラクターは自分の気持ちに気づき始めています。好意を匂わせつつも、照れや戸惑いを見せてください。重要な感情の揺れ動きを描写してください。",
  "すれ違いや誤解が生まれやすい時期です。プレイヤーの言葉に敏感に反応し、感情が大きく揺れる場面を作ってください。小さな衝突や不安を描いてください。",
  "物語のクライマックスです。これまでの会話の蓄積を踏まえ、キャラクターの本心が表れる場面を演出してください。プレイヤーへの想いを核心に迫る形で表現してください。",
];

const TP_PROMPT = (ch: any, from: number, to: number, aff: number, evts: string[]) =>
`あなたは恋愛ノベルゲームのナレーターです。キャラクター「${ch.full}」の物語で、${CHAPTERS[from].subtitle}から${CHAPTERS[to].subtitle}への転換点を描写してください。
【好感度】${aff}/100
【出来事】${evts.length ? evts.join("\n") : "（なし）"}
JSON形式で返答:{"turning_point_narration":"150字以内","turning_point_dialogue":"60字以内（空可）","new_mood":"happy|shy|angry|sad|normal|love","scene_change":"school|cafe|park|night|room"}
必ず1つのJSONのみ返してください`;

const END_PROMPT = (ch: any, aff: number, evts: string[], allMsgs: any[]) => {
  const last = allMsgs.slice(-30).filter((m: any) => m.type==="player"||m.type==="dialogue").map((m: any) => m.type==="player"?`プレイヤー: ${m.text}`:`${ch.name}: ${m.text}`).join("\n");
  return `あなたは恋愛ノベルゲームのナレーターです。結末を生成してください。
【キャラ】${ch.full} - ${ch.personality}
【好感度】${aff}/100
【出来事】${evts.join("\n")||"なし"}
【最近の会話】${last}
JSON:{"ending_title":"10字以内","ending_narration":"200字以内","ending_dialogue":"80字以内","ending_epilogue":"150字以内","ending_mood":"happy|shy|love|sad|normal","ending_type":"good|normal|bittersweet|bad"}
80以上:両想い, 50-79:希望ある結末, 30-49:ほろ苦い, 30未満:切ない別れ。会話の固有エピソードを結末に織り込んでください。1つのJSONのみ。`;
};

/* ═══════════════ DATA ═══════════════ */
const CHARACTERS: Record<string, any> = {
  hina: { name: "陽菜", full: "陽菜（ひな）", personality: "明るく元気で、少しドジなところがある大学2年生。料理が得意で、カフェでバイトしている。照れると関西弁が出る。笑顔が素敵で、周りを明るくする存在。趣味は写真撮影と散歩。", color: "#e8a0bf", hair: "#5c3a1e", skin: "#fde8d0", eyes: "#d4729a", hairStyle: "long-wavy" },
  rin: { name: "凛", full: "凛（りん）", personality: "クールで知的な図書委員の大学2年生。本が大好きで、いつも文庫本を持ち歩いている。口数は少ないが、心を許した相手にはデレる一面がある。紅茶とクラシック音楽が好き。", color: "#7eb8da", hair: "#1a1a2e", skin: "#fce4d6", eyes: "#4a90b8", hairStyle: "short-straight" },
  sakura: { name: "咲良", full: "咲良（さくら）", personality: "天真爛漫でちょっと不思議な雰囲気の大学2年生。美術部に所属し、絵を描くのが大好き。マイペースだけど、核心をつく発言をすることも。甘いものに目がない。", color: "#c4a7e7", hair: "#8b6c5c", skin: "#fde8d8", eyes: "#9b72cf", hairStyle: "medium-wavy" },
};
const SCENES: Record<string, any> = {
  school: { name: "大学キャンパス", time: "昼", icon: "🏫", bg: "linear-gradient(180deg,#87CEEB 0%,#B0E0E6 40%,#90EE90 70%,#228B22 100%)", elements: ["sun","clouds"] },
  cafe: { name: "カフェ", time: "午後", icon: "☕", bg: "linear-gradient(180deg,#8B7355 0%,#A0826D 30%,#D2B48C 60%,#DEB887 100%)", elements: ["warm-light"] },
  park: { name: "公園", time: "夕方", icon: "🌳", bg: "linear-gradient(180deg,#FF7F50 0%,#FFA07A 25%,#FFD700 50%,#90EE90 75%,#2E8B57 100%)", elements: ["sunset"] },
  night: { name: "夜の帰り道", time: "夜", icon: "🌙", bg: "linear-gradient(180deg,#0a0a2e 0%,#1a1a4e 30%,#2a2a5e 60%,#3a3a6e 100%)", elements: ["stars","moon","lamplight"] },
  room: { name: "自分の部屋", time: "夜", icon: "🏠", bg: "linear-gradient(180deg,#2c2c54 0%,#474787 30%,#FFA500 80%,#FFD700 100%)", elements: ["warm-light"] },
};
const MOODS: Record<string, any> = {
  normal: { label: "普通", eyeL: "•", eyeR: "•", mouth: "‿", brows: "flat", blush: false },
  happy: { label: "嬉しい", eyeL: "◠", eyeR: "◠", mouth: "▽", brows: "up", blush: false },
  shy: { label: "照れている", eyeL: ">", eyeR: "<", mouth: "~", brows: "worried", blush: true },
  angry: { label: "怒っている", eyeL: "•", eyeR: "•", mouth: "へ", brows: "angry", blush: false },
  sad: { label: "悲しい", eyeL: "•", eyeR: "•", mouth: "⌒", brows: "worried", blush: false },
  love: { label: "ドキドキ", eyeL: "♡", eyeR: "♡", mouth: "▽", brows: "up", blush: true },
};

const GAME_PROMPT = (c: any, s: any, aff: number, chapter: number, chapTurns: number, events: string[]) => {
  const ch = CHAPTERS[chapter]; const rem = ch.maxTurns - chapTurns;
  return `あなたは恋愛ノベルゲームのキャラクター「${c.full}」です。
【設定】${c.personality}
【場所】${s.name}（${s.time}）
【好感度】${aff}/100
【進行】${ch.title}「${ch.subtitle}」残り約${rem}回
【指針】${CHAPTER_PROMPTS[chapter]}
【出来事記録】${events.length?events.slice(-5).join(" / "):"なし"}
1つのJSONのみ返してください:
{"narration":"地の文80字以内","dialogue":"台詞120字以内","affection_change":0,"mood":"normal","suggested_scene":null,"scene_keywords":"kw1,kw2,kw3","story_event":"重要な出来事20字以内（なければ空）"}
narration=情景・仕草のみ、dialogue=声のみ（片方空可）。複数JSON禁止。${rem<=2?"章の結末に向けて盛り上げてください":"自然な展開を"}`;
};

/* ═══════════════ JSON PARSER ═══════════════ */
function parseJSON(raw: string) {
  if (!raw?.trim()) return null;
  try {
    const str = raw.substring(raw.indexOf("{"));
    let depth = 0, end = -1, inStr = false, esc = false;
    for (let i = 0; i < str.length; i++) {
      const c = str[i];
      if (esc) { esc = false; continue; }
      if (c === "\\") { esc = true; continue; }
      if (c === '"') { inStr = !inStr; continue; }
      if (inStr) continue;
      if (c === "{") depth++;
      if (c === "}") { depth--; if (depth === 0) { end = i; break; } }
    }
    if (end > 0) {
      const first = JSON.parse(str.substring(0, end + 1));
      const rest = str.substring(end + 1).trim();
      if (rest.startsWith("{")) {
        try { const rm = rest.match(/\{[\s\S]*?\}/); if (rm) { const sec = JSON.parse(rm[0]); if (!first.dialogue && sec.dialogue) first.dialogue = sec.dialogue; if (!first.narration && sec.narration) first.narration = sec.narration; } } catch {}
      }
      return first;
    }
  } catch {}
  return null;
}

/* ═══════════════ SVG SCENE ═══════════════ */
const KW_EL: Record<string, (i:number) => any> = {
  cherry_blossoms: i => ({ t:"c",cx:30+i*80,cy:15+(i%3)*12,r:3,f:"#ffb7c5",o:0.8 }),
  blossoms: i => ({ t:"c",cx:40+i*70,cy:10+(i%3)*15,r:3,f:"#ffb7c5",o:0.7 }),
  sunshine: () => ({ t:"c",cx:320,cy:20,r:18,f:"#FFD700",o:0.6 }),
  trees: i => ({ t:"c",cx:60+i*90,cy:50,r:18,f:"#5a9e4b",o:0.5 }),
  clouds: i => ({ t:"e",cx:80+i*120,cy:18,rx:30,ry:10,f:"#fff",o:0.4 }),
  sunset: () => ({ t:"c",cx:200,cy:25,r:20,f:"#FF6347",o:0.6 }),
  stars: i => ({ t:"c",cx:20+i*60,cy:8+(i%4)*10,r:1.5,f:"#fff",o:0.7 }),
  moon: () => ({ t:"c",cx:340,cy:18,r:12,f:"#fffacd",o:0.8 }),
  warm_light: () => ({ t:"c",cx:200,cy:40,r:40,f:"#ffa500",o:0.15 }),
  flowers: i => ({ t:"c",cx:40+i*50,cy:68,r:4,f:["#ff69b4","#ff6347","#ffd700","#da70d6"][i%4],o:0.6 }),
  rain: i => ({ t:"l",x1:30+i*45,y1:5+(i%3)*8,x2:28+i*45,y2:15+(i%3)*8,s:"#aaccee",o:0.5 }),
  bench: () => ({ t:"r",x:160,y:62,w:80,h:8,f:"#8B6914",o:0.5 }),
  park: i => ({ t:"c",cx:80+i*100,cy:48,r:20,f:"#3a8a3a",o:0.4 }),
  books: i => ({ t:"r",x:140+i*20,y:50,w:12,h:18,f:["#8B0000","#00008B","#006400","#4B0082"][i%4],o:0.5 }),
  campus: i => ({ t:"r",x:50+i*100,y:45,w:60,h:35,f:"#d4c5a9",o:0.5 }),
};
const MULTI = ["stars","rain","flowers","cherry_blossoms","blossoms","clouds","trees","park","books"];

const SceneIllust = ({ keywords, sceneKey }: { keywords: string; sceneKey: string }) => {
  if (!keywords) return null;
  const kws = keywords.split(",").map(k => k.trim().toLowerCase().replace(/\s+/g, "_"));
  const elems: any[] = [];
  kws.forEach((kw, ki) => { const gen = KW_EL[kw]; if (!gen) return; const n = MULTI.includes(kw) ? (kw==="stars"?5:3) : 1; for (let i=0;i<n;i++) { const el=gen(i+ki); if(el) elems.push({...el,key:`${kw}-${i}-${ki}`}); } });
  if (!elems.length) return null;
  const gr = sceneKey==="night"?["#0a0a2e","#2a2a5e"]:sceneKey==="cafe"?["#8B7355","#DEB887"]:sceneKey==="park"?["#FF7F50","#2E8B57"]:sceneKey==="room"?["#2c2c54","#FFD700"]:["#87CEEB","#90EE90"];
  const gnd = sceneKey==="night"?"#1a1a3e":sceneKey==="cafe"?"#8B7355":sceneKey==="room"?"#3a3050":"#4a8a3a";
  return (
    <div style={{width:"100%",padding:"4px 12px",animation:"fadeInNarr 0.8s ease"}}>
      <svg viewBox="0 0 400 80" width="100%" height="70" style={{borderRadius:10,overflow:"hidden",filter:"drop-shadow(0 2px 6px rgba(0,0,0,0.15))"}}>
        <defs><linearGradient id="sgr" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={gr[0]}/><stop offset="100%" stopColor={gr[1]}/></linearGradient></defs>
        <rect width="400" height="80" fill="url(#sgr)" opacity="0.5"/><rect x="0" y="65" width="400" height="15" fill={gnd} opacity="0.4"/>
        {elems.map(el => {
          if(el.t==="c") return <circle key={el.key} cx={el.cx} cy={el.cy} r={el.r} fill={el.f} opacity={el.o}/>;
          if(el.t==="e") return <ellipse key={el.key} cx={el.cx} cy={el.cy} rx={el.rx} ry={el.ry} fill={el.f} opacity={el.o}/>;
          if(el.t==="r") return <rect key={el.key} x={el.x} y={el.y} width={el.w} height={el.h} rx={3} fill={el.f} opacity={el.o}/>;
          if(el.t==="l") return <line key={el.key} x1={el.x1} y1={el.y1} x2={el.x2} y2={el.y2} stroke={el.s} strokeWidth={1} opacity={el.o}/>;
          return null;
        })}
      </svg>
    </div>
  );
};

/* ═══════════════ COMPONENTS ═══════════════ */
const SceneBG = ({ sceneKey, children }: { sceneKey: string; children: React.ReactNode }) => {
  const s = SCENES[sceneKey];
  return (
    <div style={{position:"relative",minHeight:"100vh",display:"flex",flexDirection:"column",background:s.bg,transition:"background 1.2s ease",overflow:"hidden"}}>
      {s.elements.includes("stars")&&[...Array(20)].map((_,i)=><div key={`s${i}`} style={{position:"absolute",width:i%3===0?3:2,height:i%3===0?3:2,background:"#fff",borderRadius:"50%",left:`${(i*37+13)%100}%`,top:`${(i*23+7)%50}%`,opacity:0.3+(i%5)*0.12,animation:`twinkle ${2+i%3}s ease ${i*0.3}s infinite`}}/>)}
      {s.elements.includes("moon")&&<div style={{position:"absolute",right:40,top:80,width:50,height:50,borderRadius:"50%",background:"#fffacd",boxShadow:"0 0 30px 10px rgba(255,250,205,0.3)",opacity:0.9}}/>}
      {s.elements.includes("sun")&&<div style={{position:"absolute",right:60,top:20,width:40,height:40,borderRadius:"50%",background:"#FFD700",boxShadow:"0 0 40px 15px rgba(255,215,0,0.25)",opacity:0.7}}/>}
      {s.elements.includes("clouds")&&[...Array(3)].map((_,i)=><div key={`c${i}`} style={{position:"absolute",top:15+i*25,left:`${10+i*30}%`,width:80+i*20,height:25,borderRadius:20,background:"rgba(255,255,255,0.35)",animation:`drift ${20+i*5}s linear ${i*3}s infinite`}}/>)}
      {s.elements.includes("sunset")&&<div style={{position:"absolute",left:"50%",top:"25%",width:60,height:60,borderRadius:"50%",transform:"translateX(-50%)",background:"radial-gradient(circle,#FF6347,#FF4500 50%,transparent 70%)",boxShadow:"0 0 60px 20px rgba(255,99,71,0.25)"}}/>}
      {s.elements.includes("lamplight")&&[...Array(4)].map((_,i)=><div key={`l${i}`} style={{position:"absolute",bottom:0,left:`${15+i*22}%`,width:4,height:60,background:"rgba(200,200,200,0.3)"}}><div style={{position:"absolute",top:-8,left:-8,width:20,height:20,borderRadius:"50%",background:"rgba(255,200,100,0.5)",boxShadow:"0 0 20px 8px rgba(255,200,100,0.2)"}}/></div>)}
      <div style={{position:"absolute",inset:0,background:"rgba(255,250,240,0.08)",pointerEvents:"none"}}/>{children}
    </div>
  );
};

const CharPortrait = ({ char, mood, size=140 }: { char: any; mood: string; size?: number }) => {
  const m = MOODS[mood]||MOODS.normal; const s=size,cx=s/2,hR=s*0.22,bT=cx+hR*1.05;
  return (
    <svg width={s} height={s*1.35} viewBox={`0 0 ${s} ${s*1.35}`} style={{filter:"drop-shadow(0 4px 12px rgba(0,0,0,0.15))"}}>
      {char.hairStyle==="long-wavy"&&<ellipse cx={cx} cy={cx-2} rx={hR+8} ry={hR+20} fill={char.hair} opacity="0.9"/>}
      {char.hairStyle==="medium-wavy"&&<ellipse cx={cx} cy={cx} rx={hR+6} ry={hR+12} fill={char.hair} opacity="0.9"/>}
      <ellipse cx={cx} cy={bT+28} rx={s*0.22} ry={s*0.25} fill={char.color}/>
      <rect x={cx-6} y={bT-8} width={12} height={14} rx={4} fill={char.skin}/>
      <circle cx={cx} cy={cx} r={hR} fill={char.skin}/>
      {char.hairStyle==="long-wavy"&&<><ellipse cx={cx} cy={cx-hR*0.6} rx={hR+4} ry={hR*0.55} fill={char.hair}/><ellipse cx={cx-hR-2} cy={cx+4} rx={6} ry={18} fill={char.hair} opacity="0.85"/><ellipse cx={cx+hR+2} cy={cx+4} rx={6} ry={18} fill={char.hair} opacity="0.85"/></>}
      {char.hairStyle==="short-straight"&&<><ellipse cx={cx} cy={cx-hR*0.65} rx={hR+3} ry={hR*0.5} fill={char.hair}/><rect x={cx-hR-2} y={cx-hR*0.4} width={8} height={16} rx={4} fill={char.hair} opacity="0.8"/><rect x={cx+hR-6} y={cx-hR*0.4} width={8} height={16} rx={4} fill={char.hair} opacity="0.8"/></>}
      {char.hairStyle==="medium-wavy"&&<><ellipse cx={cx} cy={cx-hR*0.6} rx={hR+5} ry={hR*0.55} fill={char.hair}/><ellipse cx={cx-hR} cy={cx+2} rx={7} ry={14} fill={char.hair} opacity="0.85"/><ellipse cx={cx+hR} cy={cx+2} rx={7} ry={14} fill={char.hair} opacity="0.85"/></>}
      {m.brows==="angry"&&<><line x1={cx-12} y1={cx-8} x2={cx-5} y2={cx-5} stroke="#6a4a3a" strokeWidth="1.5" strokeLinecap="round"/><line x1={cx+5} y1={cx-5} x2={cx+12} y2={cx-8} stroke="#6a4a3a" strokeWidth="1.5" strokeLinecap="round"/></>}
      {m.brows==="worried"&&<><line x1={cx-12} y1={cx-5} x2={cx-5} y2={cx-8} stroke="#6a4a3a" strokeWidth="1.2" strokeLinecap="round"/><line x1={cx+5} y1={cx-8} x2={cx+12} y2={cx-5} stroke="#6a4a3a" strokeWidth="1.2" strokeLinecap="round"/></>}
      <text x={cx-10} y={cx+2} fontSize="11" textAnchor="middle" fill={char.eyes} fontFamily="serif">{m.eyeL}</text>
      <text x={cx+10} y={cx+2} fontSize="11" textAnchor="middle" fill={char.eyes} fontFamily="serif">{m.eyeR}</text>
      {m.blush&&<><ellipse cx={cx-16} cy={cx+6} rx={6} ry={3.5} fill="#ff9999" opacity="0.4"/><ellipse cx={cx+16} cy={cx+6} rx={6} ry={3.5} fill="#ff9999" opacity="0.4"/></>}
      <text x={cx} y={cx+14} fontSize="10" textAnchor="middle" fill="#c47a7a" fontFamily="serif">{m.mouth}</text>
    </svg>
  );
};

const HeartBar = ({value}:{value:number}) => { const p=Math.min(100,Math.max(0,value)); const c=p<20?"#ccc":p<40?"#f9c4d2":p<60?"#f78da7":p<80?"#ff6b8a":"#ff2d6b"; const l=p<20?"初対面":p<40?"知り合い":p<60?"友達":p<80?"特別な存在":"両想い ♡"; return <div style={{width:"100%"}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:3,fontSize:10,color:"#a08090"}}><span>♡ {l}</span><span>{value}/100</span></div><div style={{width:"100%",height:8,borderRadius:4,background:"#f0e0e8",overflow:"hidden"}}><div style={{width:`${p}%`,height:"100%",borderRadius:4,transition:"all 0.8s ease",background:`linear-gradient(90deg,${c}88,${c})`,boxShadow:p>60?`0 0 6px ${c}80`:"none"}}/></div></div>; };
const NarrationBubble = ({text}:{text:string}) => <div style={{width:"100%",textAlign:"center",padding:"4px 8px",animation:"fadeInNarr 0.7s ease"}}><p style={{display:"inline-block",maxWidth:"94%",fontSize:12,lineHeight:2,color:"rgba(255,255,255,0.93)",fontStyle:"italic",letterSpacing:1,background:"rgba(0,0,0,0.28)",backdropFilter:"blur(6px)",padding:"7px 20px",borderRadius:6,margin:0,borderLeft:"3px solid rgba(255,255,255,0.4)"}}>{text}</p></div>;
const DialogueBubble = ({text,charName,color,affChange}:{text:string;charName:string;color:string;affChange:number}) => <div style={{display:"flex",justifyContent:"flex-start",animation:"slideUp 0.4s ease",paddingLeft:4}}><div style={{maxWidth:"82%"}}><div style={{fontSize:10,fontWeight:700,color,marginBottom:2,marginLeft:12,letterSpacing:2,textShadow:`0 0 8px ${color}40`}}>{charName}</div><div style={{padding:"10px 16px",borderRadius:"4px 16px 16px 16px",fontSize:14,lineHeight:1.9,background:"linear-gradient(135deg,rgba(255,255,255,0.85),rgba(255,255,255,0.68))",backdropFilter:"blur(8px)",border:`1.5px solid ${color}50`,color:"#3a2030",boxShadow:`0 3px 14px ${color}18`}}>「{text}」{affChange!==0&&<span style={{marginLeft:6,fontSize:10,color:affChange>0?"#e91e63":"#78909c"}}>{affChange>0?`♡+${affChange}`:`♡${affChange}`}</span>}</div></div></div>;
const PlayerBubble = ({text}:{text:string}) => <div style={{display:"flex",justifyContent:"flex-end",animation:"slideUp 0.35s ease"}}><div style={{maxWidth:"78%",padding:"10px 16px",borderRadius:"16px 4px 16px 16px",fontSize:14,lineHeight:1.8,background:"rgba(255,255,255,0.72)",backdropFilter:"blur(6px)",color:"#5a3a4a",boxShadow:"0 2px 8px rgba(0,0,0,0.06)"}}>{text}</div></div>;
const SystemBubble = ({text}:{text:string}) => <div style={{width:"100%",textAlign:"center",padding:"4px 12px",animation:"fadeInNarr 0.8s ease"}}><span style={{display:"inline-block",fontSize:12,color:"rgba(255,255,255,0.85)",fontStyle:"italic",letterSpacing:2,lineHeight:1.8,background:"rgba(0,0,0,0.2)",padding:"5px 16px",borderRadius:6}}>{text}</span></div>;

const ChapterCard = ({chapter,onDone}:{chapter:number;onDone:()=>void}) => { const ch=CHAPTERS[chapter]; useEffect(()=>{const t=setTimeout(onDone,4000);return()=>clearTimeout(t);},[onDone]); return <div style={{position:"fixed",inset:0,zIndex:200,background:"rgba(0,0,0,0.85)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",animation:"chapterFade 4s ease forwards"}}><div style={{animation:"chapterSlide 1s ease 0.5s both",textAlign:"center"}}><div style={{fontSize:40,marginBottom:16}}>{ch.icon}</div><div style={{fontSize:12,color:"rgba(255,255,255,0.5)",letterSpacing:6,marginBottom:8}}>{ch.title}</div><h2 style={{fontSize:28,color:"#fff",fontWeight:300,letterSpacing:8,margin:0}}>{ch.subtitle}</h2><div style={{width:60,height:1,background:"rgba(255,255,255,0.3)",margin:"16px auto"}}/><p style={{fontSize:13,color:"rgba(255,255,255,0.6)",letterSpacing:2,lineHeight:1.8,maxWidth:300}}>{ch.desc}</p></div></div>; };
const TurningPointCard = ({narration,dialogue,charName,onDone}:{narration:string;dialogue:string;charName:string;onDone:()=>void}) => { useEffect(()=>{const t=setTimeout(onDone,6000);return()=>clearTimeout(t);},[onDone]); return <div style={{position:"fixed",inset:0,zIndex:200,background:"rgba(0,0,0,0.9)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24,animation:"chapterFade 6s ease forwards"}}><div style={{animation:"chapterSlide 1s ease 0.3s both",textAlign:"center",maxWidth:400}}><div style={{fontSize:10,color:"rgba(255,255,255,0.4)",letterSpacing:6,marginBottom:20}}>── 転換点 ──</div><p style={{fontSize:14,color:"rgba(255,255,255,0.85)",lineHeight:2.2,fontStyle:"italic",letterSpacing:1,marginBottom:24}}>{narration}</p>{dialogue&&<p style={{fontSize:16,color:"#f8bbd0",lineHeight:2,letterSpacing:1}}>「{dialogue}」<br/><span style={{fontSize:10,color:"rgba(255,255,255,0.4)",letterSpacing:3}}>── {charName}</span></p>}</div></div>; };

const EndingScreen = ({ending,char,onRestart}:{ending:any;char:any;onRestart:()=>void}) => {
  const tc:Record<string,string> = {good:"#ff69b4",normal:"#87CEEB",bittersweet:"#DDA0DD",bad:"#778899"}; const col=tc[ending.ending_type]||"#f8bbd0";
  return <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:`linear-gradient(180deg,#0a0a1a 0%,${col}30 50%,#0a0a1a 100%)`,padding:24,fontFamily:"'Noto Serif JP',serif",animation:"fadeIn 2s ease"}}><div style={{textAlign:"center",maxWidth:440,animation:"chapterSlide 1.5s ease both"}}><div style={{fontSize:10,color:"rgba(255,255,255,0.4)",letterSpacing:8,marginBottom:12}}>ENDING</div><h1 style={{fontSize:28,color:col,fontWeight:300,letterSpacing:6,margin:"0 0 24px"}}>{ending.ending_title}</h1><div style={{display:"flex",justifyContent:"center",marginBottom:24,opacity:0.8}}><CharPortrait char={char} mood={ending.ending_mood||"normal"} size={100}/></div><p style={{fontSize:13,color:"rgba(255,255,255,0.8)",lineHeight:2.2,fontStyle:"italic",letterSpacing:1,marginBottom:20}}>{ending.ending_narration}</p>{ending.ending_dialogue&&<p style={{fontSize:15,color:col,lineHeight:2,letterSpacing:1,marginBottom:20}}>「{ending.ending_dialogue}」</p>}<div style={{width:60,height:1,background:"rgba(255,255,255,0.2)",margin:"20px auto"}}/><p style={{fontSize:12,color:"rgba(255,255,255,0.5)",lineHeight:2,letterSpacing:1}}>{ending.ending_epilogue}</p><div style={{marginTop:40,fontSize:10,color:"rgba(255,255,255,0.3)",letterSpacing:4}}>── 桜色の約束 ──</div><button onClick={onRestart} style={{marginTop:30,padding:"12px 36px",fontSize:14,letterSpacing:3,background:`${col}40`,border:`1px solid ${col}60`,color:"#fff",borderRadius:24,cursor:"pointer",fontFamily:"inherit"}}>もう一度はじめる</button></div></div>;
};

const StoryProgress = ({chapter,chapTurns,color}:{chapter:number;chapTurns:number;color:string}) => {
  const ch=CHAPTERS[chapter]; const pct=Math.min(100,(chapTurns/ch.maxTurns)*100);
  return <div style={{padding:"6px 16px",background:"rgba(0,0,0,0.15)",backdropFilter:"blur(4px)"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}><span style={{fontSize:10,color:"rgba(255,255,255,0.7)",letterSpacing:2}}>{ch.icon} {ch.title}「{ch.subtitle}」</span><span style={{fontSize:9,color:"rgba(255,255,255,0.5)"}}>{chapTurns}/{ch.maxTurns}</span></div><div style={{width:"100%",height:3,borderRadius:2,background:"rgba(255,255,255,0.15)",marginBottom:4}}><div style={{width:`${pct}%`,height:"100%",borderRadius:2,background:color,transition:"width 0.6s ease",boxShadow:pct>70?`0 0 6px ${color}`:"none"}}/></div><div style={{display:"flex",gap:3}}>{CHAPTERS.map((c,i)=><div key={i} style={{flex:1,height:2,borderRadius:1,background:i<chapter?color:i===chapter?`${color}80`:"rgba(255,255,255,0.1)",transition:"background 0.5s"}}/>)}</div></div>;
};

const CSS = `@import url('https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@300;500;700&display=swap');*{box-sizing:border-box;margin:0;padding:0}@keyframes blink{0%,100%{opacity:1}50%{opacity:0}}@keyframes fadeInNarr{from{opacity:0}to{opacity:1}}@keyframes slideUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}@keyframes fadeIn{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}@keyframes drift{0%{transform:translateX(-100px)}100%{transform:translateX(calc(100vw + 100px))}}@keyframes twinkle{0%,100%{opacity:0.3}50%{opacity:0.9}}@keyframes petals{0%{transform:translateY(-20px) rotate(0);opacity:0}10%{opacity:1}90%{opacity:1}100%{transform:translateY(100vh) rotate(720deg);opacity:0}}@keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.05)}}@keyframes sceneChangeIn{0%{opacity:0}40%{opacity:1}60%{opacity:1}100%{opacity:0}}@keyframes chapterFade{0%{opacity:0}15%{opacity:1}80%{opacity:1}100%{opacity:0}}@keyframes chapterSlide{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:translateY(0)}}input::placeholder{color:#c0a0b0}`;

/* ═══════════════ MAIN ═══════════════ */
export default function Page() {
  const [phase, setPhase] = useState("title");
  const [charKey, setCharKey] = useState<string|null>(null);
  const [scene, setScene] = useState("school");
  const [aff, setAff] = useState(20);
  const [mood, setMood] = useState("normal");
  const [msgs, setMsgs] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [turns, setTurns] = useState(0);
  const [sceneTrans, setSceneTrans] = useState(false);
  const [chapter, setChapter] = useState(0);
  const [chapTurns, setChapTurns] = useState(0);
  const [storyEvents, setStoryEvents] = useState<string[]>([]);
  const [showChapterCard, setShowChapterCard] = useState(true);
  const [turningPoint, setTurningPoint] = useState<any>(null);
  const [ending, setEnding] = useState<any>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const inpRef = useRef<HTMLInputElement>(null);
  const font = "'Noto Serif JP','Hiragino Mincho ProN',serif";

  useEffect(() => { endRef.current?.scrollIntoView({behavior:"smooth"}); }, [msgs]);

  /* ── API call through our proxy ── */
  const callAPI = useCallback(async (system: string, messages: any[]) => {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ system, messages }),
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    return data.content?.map((c: any) => c.text || "").join("") || "";
  }, []);

  const triggerTransition = useCallback(async (fromCh: number, toCh: number) => {
    if (toCh >= CHAPTERS.length) {
      setBusy(true);
      try {
        const ch = CHARACTERS[charKey!];
        const raw = await callAPI(END_PROMPT(ch, aff, storyEvents, msgs), [{role:"user",content:"結末を生成してください"}]);
        const p = parseJSON(raw);
        setEnding(p || { ending_title:"物語の終わり", ending_narration:"二人の物語は、静かに幕を閉じた。", ending_dialogue:"", ending_epilogue:"それぞれの道を歩みながら、あの日々を忘れることはなかった。", ending_mood:aff>60?"love":"normal", ending_type:aff>80?"good":aff>50?"normal":aff>30?"bittersweet":"bad" });
      } catch { setEnding({ ending_title:"物語の終わり", ending_narration:"物語は、静かに幕を閉じた。", ending_dialogue:"", ending_epilogue:"", ending_mood:"normal", ending_type:"normal" }); }
      setPhase("ending"); setBusy(false); return;
    }
    setBusy(true);
    try {
      const ch = CHARACTERS[charKey!];
      const raw = await callAPI(TP_PROMPT(ch, fromCh, toCh, aff, storyEvents), [{role:"user",content:"転換点を生成してください"}]);
      const p = parseJSON(raw);
      if (p) {
        setTurningPoint({narration:p.turning_point_narration||"",dialogue:p.turning_point_dialogue||"",charName:ch.full});
        if (p.new_mood) setMood(p.new_mood);
        if (p.scene_change && SCENES[p.scene_change]) setScene(p.scene_change);
        if (p.turning_point_narration) setStoryEvents(ev=>[...ev,`[転換点] ${p.turning_point_narration.slice(0,40)}`]);
        setTimeout(()=>{setTurningPoint(null);setChapter(toCh);setChapTurns(0);setShowChapterCard(true);},6000);
      } else { setChapter(toCh);setChapTurns(0);setShowChapterCard(true); }
    } catch { setChapter(toCh);setChapTurns(0);setShowChapterCard(true); }
    setBusy(false);
  }, [charKey, aff, storyEvents, msgs, callAPI]);

  const send = useCallback(async (txt: string) => {
    if (!txt.trim()||busy||!charKey) return;
    const ch=CHARACTERS[charKey]; const sc=SCENES[scene];
    const all=[...msgs,{type:"player",text:txt}];
    setMsgs(all); setInput(""); setBusy(true);

    const hist: any[] = [];
    all.slice(-20).forEach(m => { if(m.type==="player") hist.push({role:"user",content:m.text}); else if((m.type==="dialogue"||m.type==="narration")&&(!hist.length||hist[hist.length-1].role!=="assistant")) hist.push({role:"assistant",content:m.text}); });

    try {
      const raw = await callAPI(GAME_PROMPT(ch,sc,aff,chapter,chapTurns,storyEvents), hist);
      const p = parseJSON(raw) || {narration:"",dialogue:raw.slice(0,200),affection_change:0,mood:"normal"};
      const ac=p.affection_change||0;
      setAff(v=>Math.min(100,Math.max(0,v+ac)));
      setMood(p.mood||"normal");
      setTurns(t=>t+1);
      const nct=chapTurns+1; setChapTurns(nct);
      if(p.story_event?.trim()) setStoryEvents(ev=>[...ev,`[${CHAPTERS[chapter].subtitle}] ${p.story_event}`]);
      const nm: any[]=[];
      if(p.narration?.trim()) nm.push({type:"narration",text:p.narration.trim()});
      if(p.scene_keywords?.trim()) nm.push({type:"scene_image",keywords:p.scene_keywords.trim(),sceneKey:scene});
      if(p.dialogue?.trim()) nm.push({type:"dialogue",text:p.dialogue.trim(),mood:p.mood,affChange:ac});
      if(!nm.length) nm.push({type:"dialogue",text:"……",mood:"normal",affChange:0});
      setMsgs(prev=>[...prev,...nm]);
      if(p.suggested_scene&&SCENES[p.suggested_scene]&&p.suggested_scene!==scene) setTimeout(()=>{setSceneTrans(true);setTimeout(()=>{setScene(p.suggested_scene);setSceneTrans(false);},1200);},1500);
      if(nct>=CHAPTERS[chapter].maxTurns) setTimeout(()=>triggerTransition(chapter,chapter+1),1500);
    } catch { setMsgs(prev=>[...prev,{type:"system",text:"通信エラーが発生しました。もう一度お試しください。"}]); }
    setBusy(false);
    setTimeout(()=>inpRef.current?.focus(),100);
  }, [busy,charKey,scene,aff,msgs,chapter,chapTurns,storyEvents,callAPI,triggerTransition]);

  const restart = () => { setPhase("title");setCharKey(null);setScene("school");setAff(20);setMood("normal");setMsgs([]);setInput("");setTurns(0);setChapter(0);setChapTurns(0);setStoryEvents([]);setEnding(null);setShowChapterCard(true); };

  if (phase==="ending"&&ending) return <><style>{CSS}</style><EndingScreen ending={ending} char={CHARACTERS[charKey!]} onRestart={restart}/></>;

  if (phase==="title") return (
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:"linear-gradient(180deg,#fff5f5 0%,#fce4ec 30%,#f8bbd0 70%,#f48fb1 100%)",fontFamily:font,position:"relative",overflow:"hidden"}}>
      <style>{CSS}</style>
      {[...Array(12)].map((_,i)=><div key={i} style={{position:"absolute",fontSize:[18,14,22,16,20,12][i%6],left:`${8+(i*8)%90}%`,top:-20,opacity:0.6,animation:`petals ${6+i*0.7}s linear ${i*0.8}s infinite`,color:["#f8bbd0","#ce93d8","#ffab91","#ef9a9a","#f48fb1","#e1bee7"][i%6]}}>🌸</div>)}
      <div style={{animation:"fadeIn 1.2s ease",textAlign:"center",zIndex:1}}>
        <div style={{fontSize:56,marginBottom:8,animation:"float 3s ease infinite"}}>🌸</div>
        <h1 style={{fontSize:36,fontWeight:700,color:"#ad1457",letterSpacing:8,textShadow:"0 2px 12px #f8bbd080"}}>桜色の約束</h1>
        <p style={{fontSize:14,color:"#c2185b",marginTop:8,letterSpacing:4,fontWeight:300}}>─ Sakura-iro no Yakusoku ─</p>
        <p style={{fontSize:12,color:"#e91e6380",marginTop:24,letterSpacing:2}}>あなたの言葉が、物語を紡ぐ</p>
        <div style={{marginTop:16,display:"flex",gap:6,justifyContent:"center"}}>{CHAPTERS.map(c=><span key={c.id} style={{fontSize:16}}>{c.icon}</span>)}</div>
        <p style={{fontSize:10,color:"#e91e6350",marginTop:6,letterSpacing:1}}>全5章の物語</p>
        <button onClick={()=>setPhase("charSelect")} style={{marginTop:32,padding:"14px 48px",fontSize:16,letterSpacing:4,background:"linear-gradient(135deg,#f48fb1,#ce93d8)",color:"#fff",border:"none",borderRadius:30,cursor:"pointer",fontFamily:font,boxShadow:"0 4px 20px #f48fb140",animation:"pulse 2s ease infinite"}}>はじめる</button>
      </div>
    </div>
  );

  if (phase==="charSelect") return (
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:"linear-gradient(180deg,#fce4ec 0%,#f3e5f5 100%)",fontFamily:font,padding:20}}>
      <style>{CSS}</style>
      <h2 style={{fontSize:22,color:"#ad1457",letterSpacing:6,marginBottom:8,fontWeight:500}}>想い人を選んでください</h2>
      <p style={{fontSize:12,color:"#c2185b80",marginBottom:32,letterSpacing:2}}>Who will you meet?</p>
      <div style={{display:"flex",gap:20,flexWrap:"wrap",justifyContent:"center"}}>
        {Object.entries(CHARACTERS).map(([k,ch],i)=>(
          <div key={k} onClick={()=>{setCharKey(k);setPhase("game");setMsgs([{type:"system",text:`${ch.full}と大学のキャンパスで出会った。新学期の春──`}]);}}
            style={{width:190,padding:20,borderRadius:20,cursor:"pointer",textAlign:"center",background:`linear-gradient(180deg,${ch.color}20,${ch.color}10)`,border:`2px solid ${ch.color}40`,transition:"all 0.3s",animation:`fadeIn 0.6s ease ${i*0.15}s both`}}
            onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.transform="translateY(-8px)";(e.currentTarget as HTMLElement).style.boxShadow=`0 12px 32px ${ch.color}30`;}}
            onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.transform="";(e.currentTarget as HTMLElement).style.boxShadow="";}}>
            <div style={{display:"flex",justifyContent:"center",marginBottom:8}}><CharPortrait char={ch} mood="happy" size={100}/></div>
            <div style={{fontSize:18,fontWeight:700,color:"#555",marginBottom:6}}>{ch.full}</div>
            <div style={{fontSize:11,color:"#888",lineHeight:1.7}}>{ch.personality.slice(0,50)}…</div>
          </div>
        ))}
      </div>
    </div>
  );

  const ch=CHARACTERS[charKey!]; const sc=SCENES[scene];
  return (
    <SceneBG sceneKey={scene}>
      <style>{CSS}</style>
      {showChapterCard&&<ChapterCard chapter={chapter} onDone={()=>setShowChapterCard(false)}/>}
      {turningPoint&&<TurningPointCard narration={turningPoint.narration} dialogue={turningPoint.dialogue} charName={turningPoint.charName} onDone={()=>setTurningPoint(null)}/>}
      {sceneTrans&&<div style={{position:"fixed",inset:0,zIndex:100,background:"#000",display:"flex",alignItems:"center",justifyContent:"center",animation:"sceneChangeIn 1.2s ease forwards",fontFamily:font}}><span style={{color:"#fff",fontSize:18,letterSpacing:6}}>{sc.icon} 場面転換...</span></div>}
      <div style={{padding:"10px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",background:"rgba(255,255,255,0.2)",backdropFilter:"blur(12px)",borderBottom:"1px solid rgba(255,255,255,0.25)",fontFamily:font,position:"relative",zIndex:2}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:18}}>{sc.icon}</span><div><div style={{fontSize:12,fontWeight:500,color:"#5a3a4a"}}>{sc.name}</div><div style={{fontSize:9,color:"#8a6a7a"}}>{sc.time}</div></div></div>
        <div style={{display:"flex",gap:6}}>{Object.entries(SCENES).map(([k,s])=><button key={k} onClick={()=>{if(k!==scene&&!busy){setSceneTrans(true);setTimeout(()=>{setScene(k);setSceneTrans(false);},1200);}}} style={{fontSize:14,background:k===scene?"rgba(255,255,255,0.5)":"rgba(255,255,255,0.15)",border:k===scene?"2px solid rgba(255,255,255,0.6)":"1px solid rgba(255,255,255,0.2)",borderRadius:8,width:32,height:32,cursor:"pointer",transition:"all 0.3s"}} title={s.name}>{s.icon}</button>)}</div>
      </div>
      <StoryProgress chapter={chapter} chapTurns={chapTurns} color={ch.color}/>
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",position:"relative",zIndex:2,fontFamily:font}}>
        <div style={{display:"flex",alignItems:"flex-start",gap:14,padding:"12px 16px",background:"rgba(255,255,255,0.12)",backdropFilter:"blur(8px)"}}>
          <div style={{animation:"float 3s ease infinite",flexShrink:0}}><CharPortrait char={ch} mood={mood} size={110}/></div>
          <div style={{flex:1,paddingTop:6,minWidth:0}}>
            <div style={{fontSize:14,fontWeight:700,color:"#5a3a4a",marginBottom:3}}>{ch.full}</div>
            <div style={{fontSize:10,color:"#8a6a7a",marginBottom:8}}>気分: {(MOODS[mood]||MOODS.normal).label}</div>
            <HeartBar value={aff}/>
            <div style={{fontSize:9,color:"#a08090",marginTop:4}}>会話数: {turns} ｜ イベント: {storyEvents.length}</div>
          </div>
        </div>
        <div style={{flex:1,overflowY:"auto",padding:"10px 12px",display:"flex",flexDirection:"column",gap:10}}>
          {msgs.map((m,i)=>{
            if(m.type==="system") return <SystemBubble key={i} text={m.text}/>;
            if(m.type==="narration") return <NarrationBubble key={i} text={m.text}/>;
            if(m.type==="scene_image") return <SceneIllust key={i} keywords={m.keywords} sceneKey={m.sceneKey}/>;
            if(m.type==="dialogue") return <DialogueBubble key={i} text={m.text} charName={ch.full} color={ch.color} affChange={m.affChange||0}/>;
            if(m.type==="player") return <PlayerBubble key={i} text={m.text}/>;
            return null;
          })}
          {busy&&<div style={{display:"flex",justifyContent:"flex-start",animation:"slideUp 0.4s ease"}}><div style={{padding:"8px 18px",borderRadius:14,fontSize:18,letterSpacing:4,background:`${ch.color}20`,border:`1px solid ${ch.color}20`}}><span style={{animation:"blink 1s infinite"}}>…</span></div></div>}
          <div ref={endRef}/>
        </div>
      </div>
      <div style={{padding:"10px 14px 18px",background:"rgba(255,255,255,0.3)",backdropFilter:"blur(12px)",borderTop:"1px solid rgba(255,255,255,0.25)",position:"relative",zIndex:2,fontFamily:font}}>
        <div style={{display:"flex",gap:8,maxWidth:560,margin:"0 auto"}}>
          <input ref={inpRef} value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!(e.nativeEvent as any).isComposing) send(input);}} placeholder={`${ch.name}に話しかける...`} disabled={busy||showChapterCard||!!turningPoint} style={{flex:1,padding:"11px 16px",borderRadius:18,border:`2px solid ${ch.color}40`,background:"rgba(255,255,255,0.7)",fontSize:14,color:"#4a3040",fontFamily:font,outline:"none",transition:"border-color 0.3s"}} onFocus={e=>(e.target as HTMLElement).style.borderColor=ch.color} onBlur={e=>(e.target as HTMLElement).style.borderColor=`${ch.color}40`}/>
          <button onClick={()=>send(input)} disabled={busy||!input.trim()||showChapterCard||!!turningPoint} style={{padding:"11px 22px",borderRadius:18,border:"none",cursor:busy?"wait":"pointer",background:busy?"#ccc":`linear-gradient(135deg,${ch.color},${ch.color}cc)`,color:"#fff",fontSize:14,fontFamily:font,letterSpacing:2,boxShadow:busy?"none":`0 3px 14px ${ch.color}40`,transition:"all 0.3s"}}>送る</button>
        </div>
      </div>
    </SceneBG>
  );
}
