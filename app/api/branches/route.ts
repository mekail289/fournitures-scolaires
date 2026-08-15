import {NextRequest} from "next/server";
type Place={display_name:string;lat:string;lon:string};
const headers={"User-Agent":"MonCartable/1.0 (school-supply branch finder)"};
const knownAreas:Record<string,Place>={J7E:{display_name:"Sainte-Thérèse, Québec",lat:"45.643349",lon:"-73.851551"}};

async function geocode(postal:string){
  const compact=postal.replace(/\s/g,"");
  const searches=[
    `format=json&country=Canada&postalcode=${encodeURIComponent(compact)}&limit=1`,
    `format=json&q=${encodeURIComponent(`${compact.slice(0,3)} ${compact.slice(3)}, Canada`)}&limit=1`,
    `format=json&q=${encodeURIComponent(`${compact.slice(0,3)}, Québec, Canada`)}&limit=1`,
  ];
  for(const search of searches){
    const response=await fetch(`https://nominatim.openstreetmap.org/search?${search}`,{headers,next:{revalidate:86400}});
    if(response.ok){const place=(await response.json() as Place[])[0];if(place)return place}
  }
  return knownAreas[compact.slice(0,3)];
}

export async function GET(request:NextRequest){const postal=(request.nextUrl.searchParams.get("postalCode")||"").trim().toUpperCase();if(!/^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/.test(postal))return Response.json({error:"Code postal invalide"},{status:400});try{const origin=await geocode(postal);if(!origin)return Response.json({error:"Code postal introuvable"},{status:404});const find=async(query:string)=>{const delta=.35,viewbox=`${+origin.lon-delta},${+origin.lat+delta},${+origin.lon+delta},${+origin.lat-delta}`,res=await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&viewbox=${viewbox}&bounded=1&limit=3&addressdetails=1`,{headers,next:{revalidate:86400}});return(await res.json() as Place[]).map(x=>({name:x.display_name,lat:+x.lat,lon:+x.lon}))};const jean=await find("Jean Coutu"),bureau=await find("Bureau en Gros Staples");return Response.json({"jean-coutu":jean,"bureau-en-gros":bureau})}catch{return Response.json({error:"Recherche temporairement indisponible"},{status:503})}}
