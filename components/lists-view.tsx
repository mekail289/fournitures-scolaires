"use client";
import {useMemo,useState} from "react";
import {Check,Plus,Printer,Upload} from "lucide-react";
import {missing} from "@/lib/engine";
import type {AppState,Supply} from "@/lib/types";

type Level=Supply["level"]|"Combinée";

export default function ListsView({state,level,setLevel,update,openImport,saveNow}:{state:AppState;level:Level;setLevel:(x:Level)=>void;update:(id:string,p:Partial<Supply>)=>void;openImport:()=>void;saveNow:()=>Promise<void>}){
 const [extraName,setExtraName]=useState("");
 const [extraQty,setExtraQty]=useState<number|"">("");
 const [justSaved,setJustSaved]=useState(false);
 const xs=state.items.filter(x=>level==="Combinée"||x.level===level);
 const suggestions=useMemo(()=>[...new Set(state.items.filter(x=>x.level!=="Extras").map(x=>x.name))].sort((a,b)=>a.localeCompare(b,"fr")),[state.items]);
 const levelTitle=level==="Combinée"?"Liste combinée":level==="Extras"?"Extras":level;
 const addExtra=()=>{if(!extraName||typeof extraQty!=="number"||extraQty<1)return;update("__extra__",{name:extraName,quantity:extraQty});setExtraName("");setExtraQty("")};
 const confirmSave=async()=>{await saveNow();setJustSaved(true);setTimeout(()=>setJustSaved(false),1800)};
 const printList=()=>{const previous=document.title;document.title=`Mon cartable - ${levelTitle}`;window.print();setTimeout(()=>{document.title=previous},1000)};
 return <>
  <div className="printOnly printHeader"><h1>Mon cartable - {levelTitle}</h1><p>Fournitures scolaires</p></div>
  <div className="row spread noPrint"><h2>{level==="Extras"?"Extras pour l’année":`Liste - ${levelTitle}`}</h2><button className="secondary" onClick={openImport}><Upload size={17}/>Importer</button></div>
  <div className="tabs noPrint">{(["Combinée","2e année","4e année","6e année","Extras"] as const).map(x=><button key={x} className={level===x?"":"ghost"} onClick={()=>setLevel(x)}>{x}</button>)}</div>
  {level==="Extras"&&<div className="card noPrint"><div className="notice">Choisissez un article dans la liste, puis indiquez la quantité supplémentaire désirée.</div><div className="field"><label>Article supplémentaire</label><select value={extraName} onChange={e=>setExtraName(e.target.value)}><option value="">Choisir un article</option>{suggestions.map(name=><option value={name} key={name}>{name}</option>)}</select></div><div className="field"><label>Quantité supplémentaire</label><div className="row"><input aria-label="Quantité supplémentaire" type="number" inputMode="numeric" min="1" placeholder="0" value={extraQty} onFocus={e=>e.currentTarget.select()} onChange={e=>setExtraQty(e.target.value===""?"":Math.max(1,+e.target.value))}/><button disabled={!extraName||extraQty===""} onClick={addExtra}><Plus/>Ajouter</button></div></div></div>}
  <div className="card supplyList">{xs.length===0?<p className="muted">Aucun article dans cette liste.</p>:xs.map(x=>{const owned=x.owned||0,needed=missing(x,state.inventory,state.items);return <div className="item supplyItem" key={x.id}><div><h3>{x.name}{x.color?` - ${x.color}`:""}</h3><p>{[x.format,x.requirements,level==="Combinée"?x.level:""].filter(Boolean).join(" · ")}</p><div className="amounts"><span>Besoin <b>{x.quantity}</b></span><label className="noPrint">J’ai <input aria-label={`Quantité déjà disponible pour ${x.name}`} type="number" inputMode="numeric" min="0" max={x.quantity} placeholder="0" value={x.owned||""} onFocus={e=>e.currentTarget.select()} onChange={e=>update(x.id,{owned:Math.max(0,+e.target.value)})}/></label><span className="printOnly">J’ai <b>{owned}</b></span><span className="missingAmount">Il manque <b>{needed}</b></span></div></div></div>})}</div>
  <div className="listActions noPrint"><button className="wide heroAction" onClick={confirmSave}><Check size={19}/>{justSaved?"Liste enregistrée ✓":"Enregistrer ma liste"}</button><button className="wide ghost" onClick={printList}><Printer size={17}/>Imprimer {levelTitle.toLowerCase()}</button></div>
 </>;
}
