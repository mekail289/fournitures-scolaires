"use client";
import {useEffect,useState} from "react";
import {LogIn,LogOut,UserRound} from "lucide-react";
import {supabase} from "@/lib/supabase-client";

const frenchError=(text:string)=>text.includes("invalid format")?"L’adresse courriel n’est pas valide.":text.includes("Password should")?"Le mot de passe doit contenir au moins 6 caractères.":text.includes("already registered")?"Ce courriel possède déjà un compte. Utilisez Connexion.":text.includes("Invalid login")?"Courriel ou mot de passe incorrect.":`Impossible de continuer : ${text}`;

export default function AccountPanel(){
 const [email,setEmail]=useState("");
 const [password,setPassword]=useState("");
 const [userEmail,setUserEmail]=useState<string|null>(null);
 const [open,setOpen]=useState(false);
 const [message,setMessage]=useState("");
 const [loading,setLoading]=useState(false);
 useEffect(()=>{if(!supabase)return;supabase.auth.getUser().then(({data})=>setUserEmail(data.user?.email||null));const{data}=supabase.auth.onAuthStateChange((_event,session)=>setUserEmail(session?.user.email||null));return()=>data.subscription.unsubscribe()},[]);
 if(!supabase)return <div className="accountBar"><UserRound size={18}/><span>Compte personnel à activer</span></div>;
 const submit=async(mode:"in"|"up")=>{if(!email.includes("@")){setMessage("Inscrivez une adresse courriel complète.");return}if(password.length<6){setMessage("Le mot de passe doit contenir au moins 6 caractères.");return}setLoading(true);setMessage("");const result=mode==="up"?await supabase.auth.signUp({email,password}):await supabase.auth.signInWithPassword({email,password});setLoading(false);setMessage(result.error?frenchError(result.error.message):mode==="up"?"Compte créé. Consultez votre courriel pour confirmer votre inscription.":"Connexion réussie. Vos données sont synchronisées.")};
 if(userEmail)return <div className="accountBar"><UserRound size={18}/><span>{userEmail} · Synchronisation activée</span><button className="ghost" onClick={()=>supabase.auth.signOut()}><LogOut size={17}/>Déconnexion</button></div>;
 return <div className="accountWrap"><button className="accountBar" onClick={()=>setOpen(!open)}><LogIn size={18}/>Me connecter à mon compte</button>{open&&<div className="accountCard"><label>Courriel</label><input type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)}/><label>Mot de passe</label><input type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)}/><p className="muted">Minimum 6 caractères.</p><div className="row"><button disabled={loading} onClick={()=>submit("in")}>{loading?"Un instant…":"Connexion"}</button><button className="secondary" disabled={loading} onClick={()=>submit("up")}>{loading?"Un instant…":"Créer mon compte"}</button></div>{message&&<div className="notice" role="status" style={{marginTop:12}}>{message}</div>}</div>}</div>;
}
