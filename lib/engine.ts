import {AppState,Inventory,MerchantId,PlanLine,Strategy,Supply} from "./types";

export function inventoryUsed(item:Supply,inventory:Inventory[]){return inventory.filter(x=>x.name.toLowerCase()===item.name.toLowerCase()&&(!item.color||x.color?.toLowerCase()===item.color.toLowerCase())&&(!item.format||x.format?.toLowerCase()===item.format.toLowerCase())).reduce((n,x)=>n+x.quantity,0)}
export function missing(item:Supply,inventory:Inventory[],allItems:Supply[]=[item]){if(["Acheté","Commandé","J’en ai déjà"].includes(item.status))return 0;const compatible=(x:Supply)=>x.name.toLowerCase()===item.name.toLowerCase()&&(!item.color||x.color?.toLowerCase()===item.color.toLowerCase())&&(!item.format||x.format?.toLowerCase()===item.format.toLowerCase());const index=allItems.findIndex(x=>x.id===item.id);const allocated=allItems.slice(0,index<0?0:index).filter(compatible).filter(x=>!["Acheté","Commandé","J’en ai déjà"].includes(x.status)).reduce((n,x)=>n+x.quantity,0);const fromInventory=Math.max(0,inventoryUsed(item,inventory)-allocated);return Math.max(0,item.quantity-(item.owned||0)-fromInventory)}
export function isOptimizableSupply(item:Supply){const name=item.name.toLowerCase();return !["boîte ou sac à lunch","bouteille d’eau réutilisable","écouteurs","sac à dos","souliers","vêtements"].some(term=>name.includes(term))}

export function optimize(state:AppState,strategy:Strategy,avoidStoreCost=10):PlanLine[]{
 const grouped=new Map<string,{itemIds:string[];item:Supply;price:AppState["prices"][number]}>();
 state.items.forEach(item=>{
  if(!isOptimizableSupply(item)||missing(item,state.inventory,state.items)<=0)return;
  state.prices.filter(p=>p.itemId===item.id&&p.available&&(!!p.verifiedAt||p.matchStatus==="candidate")&&p.matchStatus!=="rejected"&&state.selectedMerchants.includes(p.merchantId)&&(!item.mandatoryMerchant||p.merchantId===item.mandatoryMerchant)).forEach(price=>{
   const offerKey=[price.merchantId,price.productName||item.name,price.packagePrice,price.packageQuantity,price.sourceUrl||""].join("|");
   const existing=grouped.get(offerKey);
   if(existing){if(!existing.itemIds.includes(item.id))existing.itemIds.push(item.id)}else grouped.set(offerKey,{itemIds:[item.id],item,price});
  });
 });
 const choices:PlanLine[]=[...grouped.values()].map(({itemIds,item,price})=>{const needed=itemIds.reduce((total,id)=>{const supply=state.items.find(x=>x.id===id);return total+(supply?missing(supply,state.inventory,state.items):0)},0),packages=Math.ceil(needed/Math.max(1,price.packageQuantity));return{item,itemIds:[...itemIds].sort(),merchantId:price.merchantId,needed,packages,cost:packages*price.packagePrice,priceStatus:price.matchStatus==="candidate"?"candidate" as const:"verified" as const,productName:price.productName,sourceUrl:price.sourceUrl,matchNote:price.matchNote}});
 const pricedIds=new Set(choices.flatMap(x=>x.itemIds||[x.item.id])),active=state.selectedMerchants,plans:{lines:PlanLine[];score:number}[]=[];
 for(let mask=1;mask<(1<<active.length);mask++){
  const allowed=new Set(active.filter((_,i)=>mask&(1<<i))),lines=cheapest(choices.filter(x=>allowed.has(x.merchantId))),covered=new Set(lines.flatMap(x=>x.itemIds||[x.item.id]));
  if(covered.size!==pricedIds.size)continue;
  const stores=new Set(lines.map(x=>x.merchantId)).size,items=lines.reduce((n,x)=>n+x.cost,0),fees=shippingTotal(lines,state),discount=couponDiscount(lines,state)+promotionDiscount(lines,state),penalty=strategy==="few"?stores*avoidStoreCost*4:strategy==="balanced"?stores*avoidStoreCost:0;
  plans.push({lines,score:items+fees-discount+penalty});
 }
 return plans.sort((a,b)=>a.score-b.score)[0]?.lines||[];
}

function cheapest(choices:PlanLine[]){
 const pending=new Set(choices.flatMap(x=>x.itemIds||[x.item.id])),result:PlanLine[]=[];
 while(pending.size){
  const first=pending.values().next().value as string,componentIds=new Set([first]),componentChoices=new Set<PlanLine>();
  let changed=true;
  while(changed){
   changed=false;
   for(const choice of choices){
    const ids=choice.itemIds||[choice.item.id];
    if(!ids.some(id=>componentIds.has(id)))continue;
    if(!componentChoices.has(choice)){componentChoices.add(choice);changed=true}
    for(const id of ids)if(!componentIds.has(id)){componentIds.add(id);changed=true}
   }
  }
  for(const id of componentIds)pending.delete(id);
  const ids=[...componentIds],offers=[...componentChoices];
  if(ids.length<=20){
   const positions=new Map(ids.map((id,index)=>[id,index])),full=(1<<ids.length)-1,dp=new Array<{cost:number;lines:PlanLine[]} | undefined>(full+1);
   dp[0]={cost:0,lines:[]};
   for(let mask=0;mask<=full;mask++){
    const current=dp[mask];if(!current)continue;
    for(const offer of offers){
     const offerMask=(offer.itemIds||[offer.item.id]).reduce((value,id)=>value|(1<<(positions.get(id)??0)),0),next=mask|offerMask,cost=current.cost+offer.cost;
     if(next===mask)continue;
     if(!dp[next]||cost<dp[next]!.cost)dp[next]={cost,lines:[...current.lines,offer]};
    }
   }
   result.push(...(dp[full]?.lines||[]));
  }else{
   const uncovered=new Set(ids);
   while(uncovered.size){
    const best=offers.filter(x=>(x.itemIds||[x.item.id]).some(id=>uncovered.has(id))).sort((a,b)=>a.cost/Math.max(1,(a.itemIds||[a.item.id]).filter(id=>uncovered.has(id)).length)-b.cost/Math.max(1,(b.itemIds||[b.item.id]).filter(id=>uncovered.has(id)).length))[0];
    if(!best)break;result.push(best);for(const id of best.itemIds||[best.item.id])uncovered.delete(id);
   }
  }
 }
 return result;
}
export function couponDiscount(lines:PlanLine[],state:AppState){return state.coupon.active&&lines.some(x=>x.merchantId==="commande-scolaire")?Math.min(state.coupon.value,lines.filter(x=>x.merchantId==="commande-scolaire").reduce((n,x)=>n+x.cost,0)):0}
export function promotionDiscount(lines:PlanLine[],state:AppState){return (state.promotions||[]).filter(p=>p.active&&p.code&&p.value>0).reduce((total,p)=>{const subtotal=lines.filter(x=>x.merchantId===p.merchantId).reduce((n,x)=>n+x.cost,0);const discount=p.kind==="percent"?subtotal*Math.min(p.value,100)/100:p.value;return total+Math.min(discount,subtotal)},0)}
export function fulfillmentOption(lines:PlanLine[],state:AppState,merchantId:MerchantId){const s=(state.merchantSettings||[]).find(x=>x.merchantId===merchantId),subtotal=lines.filter(x=>x.merchantId===merchantId).reduce((n,x)=>n+x.cost,0);if(!s)return{mode:"shop" as const,label:"Magasinage en personne",cost:0};const raw=s.mode==="online"?"delivery":s.mode==="store"?"shop":s.mode,delivery=s.freeShippingThreshold&&subtotal>=s.freeShippingThreshold?0:s.shippingFee,pickup=s.pickupFee||0,options=[{mode:"delivery" as const,label:"Livraison à domicile",cost:delivery},{mode:"pickup" as const,label:"Ramassage en magasin",cost:pickup},{mode:"shop" as const,label:"Magasinage en personne",cost:0}];return raw==="auto"?options.sort((a,b)=>a.cost-b.cost)[0]:options.find(x=>x.mode===raw)||options[2]}
export function shippingTotal(lines:PlanLine[],state:AppState){return [...new Set(lines.map(x=>x.merchantId))].reduce((total,id)=>total+fulfillmentOption(lines,state,id).cost,0)}
