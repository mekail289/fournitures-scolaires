"use client";
import {merchants} from "@/lib/seed";
import type {AppState,MerchantId} from "@/lib/types";
export default function MerchantSettings({state,setState}:{state:AppState;setState:React.Dispatch<React.SetStateAction<AppState>>}){
 const settings=state.merchantSettings||merchants.map(m=>({merchantId:m.id,mode:"store" as const,shippingFee:0}));
 const change=(id:MerchantId,patch:Record<string,unknown>)=>setState(s=>({...s,merchantSettings:settings.map(x=>x.merchantId===id?{...x,...patch}:x)}));
 return <><h2>Achat en ligne ou en magasin</h2>{merchants.map(m=>{const x=settings.find(s=>s.merchantId===m.id)!;return <div className="card" key={m.id}><strong>{m.name}</strong><div className="field"><label>Mode d’achat</label><select value={x.mode} onChange={e=>change(m.id,{mode:e.target.value})}><option value="store">En succursale</option><option value="online">En ligne</option></select></div>{x.mode==="store"?<div className="field"><label>Succursale choisie</label><input placeholder="Nom ou adresse de la succursale" value={x.branch||""} onChange={e=>change(m.id,{branch:e.target.value})}/></div>:<div className="grid"><div className="field"><label>Frais de livraison</label><input type="number" min="0" step=".01" value={x.shippingFee} onChange={e=>change(m.id,{shippingFee:+e.target.value})}/></div><div className="field"><label>Livraison gratuite dès</label><input type="number" min="0" step=".01" value={x.freeShippingThreshold||0} onChange={e=>change(m.id,{freeShippingThreshold:+e.target.value||undefined})}/></div></div>}</div>})}</>
}
