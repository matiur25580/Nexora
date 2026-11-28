import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { Building2, Check, Plus, RefreshCw, ShieldCheck, Trash2, Users } from 'lucide-react';

type Organization = { id: string; name: string; slug: string; role: string };
type Member = { id: string; user: { id: string; email: string; displayName: string }; role: string; status: string; joinedAt: string };
type Props = { userId: string; accessToken: string; onAccessTokenChange: (token: string) => void };
const API = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:4000/api/v1';
const roleLabels: Record<string,string> = { owner:'Owner',admin:'Admin',csm_manager:'CSM manager',csm:'Customer success',analyst:'Analyst',viewer:'Viewer' };

export default function OrganizationWorkspace({userId,accessToken,onAccessTokenChange}:Props){
 const [organizations,setOrganizations]=useState<Organization[]>([]);
 const [selectedId,setSelectedId]=useState('');
 const [organizationName,setOrganizationName]=useState('');
 const [newOrganizationName,setNewOrganizationName]=useState('');
 const [members,setMembers]=useState<Member[]>([]);
 const [memberEmail,setMemberEmail]=useState('');
 const [memberRole,setMemberRole]=useState('csm');
 const [loading,setLoading]=useState(true),[busy,setBusy]=useState(false);
 const [error,setError]=useState(''),[notice,setNotice]=useState('');

 const request=useCallback(async<T,>(path:string,init:RequestInit={})=>{
  const headers=new Headers(init.headers);headers.set('Authorization','Bearer '+accessToken);
  if(init.body)headers.set('Content-Type','application/json');
  let response=await fetch(API+path,{...init,headers,credentials:'include'});
  if(response.status===401){
   const refresh=await fetch(API+'/auth/refresh',{method:'POST',credentials:'include'});
   if(refresh.ok){const token=await refresh.json();onAccessTokenChange(token.data.accessToken);headers.set('Authorization','Bearer '+token.data.accessToken);response=await fetch(API+path,{...init,headers,credentials:'include'});}
  }
  const payload=await response.json().catch(()=>({}));
  if(!response.ok)throw new Error(payload.error?.message??'Organization request failed.');
  return payload.data as T;
 },[accessToken,onAccessTokenChange]);

 const loadOrganizations=useCallback(async()=>{
  setLoading(true);setError('');
  try{
   const data=await request<Organization[]>('/organizations');
   setOrganizations(data);
   setSelectedId(current=>data.some(org=>org.id===current)?current:data[0]?.id??'');
  }catch(e){setError(e instanceof Error?e.message:'Unable to load organizations.');}
  finally{setLoading(false);}
 },[request]);
 useEffect(()=>{void loadOrganizations();},[loadOrganizations]);

 const selected=useMemo(()=>organizations.find(org=>org.id===selectedId)??null,[organizations,selectedId]);
 const canManage=selected?.role==='owner'||selected?.role==='admin';
 const canGrantAdmin=selected?.role==='owner';

 const loadMembers=useCallback(async()=>{
  if(!selectedId){setMembers([]);return;}
  try{
   const [organization,membersData]=await Promise.all([
    request<{id:string;name:string;slug:string;role:string}>('/organizations/'+selectedId),
    request<Member[]>('/organizations/'+selectedId+'/members')
   ]);
   setOrganizationName(organization.name);setMembers(membersData);
  }catch(e){setError(e instanceof Error?e.message:'Unable to load organization members.');}
 },[request,selectedId]);
 useEffect(()=>{void loadMembers();},[loadMembers]);

 const createOrganization=async(event:FormEvent)=>{
  event.preventDefault();setBusy(true);setError('');setNotice('');
  try{
   const created=await request<Organization>('/organizations',{method:'POST',body:JSON.stringify({name:newOrganizationName})});
   setNewOrganizationName('');setNotice('Organization workspace created. You are its owner.');
   await loadOrganizations();setSelectedId(created.id);
  }catch(e){setError(e instanceof Error?e.message:'Unable to create organization.');}
  finally{setBusy(false);}
 };
 const saveOrganization=async(event:FormEvent)=>{
  event.preventDefault();if(!selected)return;setBusy(true);setError('');setNotice('');
  try{await request('/organizations/'+selected.id,{method:'PATCH',body:JSON.stringify({name:organizationName})});setNotice('Organization profile updated.');await loadOrganizations();await loadMembers();}
  catch(e){setError(e instanceof Error?e.message:'Unable to update organization.');}
  finally{setBusy(false);}
 };
 const addMember=async(event:FormEvent)=>{
  event.preventDefault();if(!selected)return;setBusy(true);setError('');setNotice('');
  try{await request('/organizations/'+selected.id+'/members',{method:'POST',body:JSON.stringify({email:memberEmail,role:memberRole})});setMemberEmail('');setNotice('Existing Nexora user added to the organization.');await loadMembers();}
  catch(e){setError(e instanceof Error?e.message:'Unable to add member.');}
  finally{setBusy(false);}
 };
 const changeRole=async(member:Member,role:string)=>{
  if(!selected)return;setBusy(true);setError('');setNotice('');
  try{await request('/organizations/'+selected.id+'/members/'+member.id,{method:'PATCH',body:JSON.stringify({role})});setNotice('Member role updated.');await loadMembers();}
  catch(e){setError(e instanceof Error?e.message:'Unable to update member role.');}
  finally{setBusy(false);}
 };
 const removeMember=async(member:Member)=>{
  if(!selected||!window.confirm('Remove '+member.user.displayName+' from '+selected.name+'?'))return;
  setBusy(true);setError('');setNotice('');
  try{await request('/organizations/'+selected.id+'/members/'+member.id,{method:'DELETE'});setNotice('Member access removed.');await loadMembers();}
  catch(e){setError(e instanceof Error?e.message:'Unable to remove member.');}
  finally{setBusy(false);}
 };

 return <section className="organization-workspace" id="organization-workspace">
  <div className="org-heading"><div><p className="eyebrow">MILESTONE 3 · MULTI-TENANT ACCESS</p><h2>Organization & access</h2><p>Separate customer workspaces with explicit membership and role boundaries.</p></div><span className="org-security"><ShieldCheck size={15}/> Server-verified membership</span></div>
  {error&&<p className="org-error" role="alert">{error}</p>}{notice&&<p className="org-notice" role="status">{notice}</p>}
  {loading?<div className="org-empty">Loading your organization workspaces…</div>:organizations.length===0?<article className="org-panel org-create"><span className="org-icon"><Building2 size={20}/></span><h3>Create your first organization</h3><p>Your account is ready. Create a tenant workspace to start separating members and customer operations.</p><form onSubmit={createOrganization}><input required minLength={2} maxLength={140} value={newOrganizationName} onChange={e=>setNewOrganizationName(e.target.value)} placeholder="Northstar Customer Success"/><button disabled={busy}><Plus size={15}/>{busy?'Creating…':'Create organization'}</button></form></article>:<>
   <div className="org-toolbar"><label><Building2 size={15}/><select value={selectedId} onChange={e=>setSelectedId(e.target.value)}>{organizations.map(org=><option key={org.id} value={org.id}>{org.name} · {roleLabels[org.role]??org.role}</option>)}</select></label><span className="org-slug">{selected?.slug}</span><button className="org-refresh" onClick={()=>void loadOrganizations()} disabled={loading}><RefreshCw size={13}/>Refresh</button></div>
   <div className="org-grid">
    <article className="org-panel"><div className="org-panel-head"><span className="org-icon"><Building2 size={18}/></span><div><h3>Workspace profile</h3><p>Organization identity and access context.</p></div></div>
     <form className="org-form" onSubmit={saveOrganization}><label>Organization name<input value={organizationName} onChange={e=>setOrganizationName(e.target.value)} required minLength={2} maxLength={140} disabled={!canManage}/></label><label>Workspace slug<input value={selected?.slug??''} disabled readOnly/></label><div className="org-facts"><span>Current role</span><strong>{roleLabels[selected?.role??'']??selected?.role}</strong><span>Active organizations</span><strong>{organizations.length}</strong></div>{canManage&&<button disabled={busy}><Check size={14}/>Save profile</button>}</form>
    </article>
    <article className="org-panel"><div className="org-panel-head"><span className="org-icon"><Users size={18}/></span><div><h3>Membership directory</h3><p>{members.length} active member(s) · existing registered users only</p></div></div>
     {canManage&&<form className="org-add-member" onSubmit={addMember}><input type="email" required value={memberEmail} onChange={e=>setMemberEmail(e.target.value)} placeholder="colleague@company.com"/><select value={memberRole} onChange={e=>setMemberRole(e.target.value)}>{(canGrantAdmin?['admin','csm_manager','csm','analyst','viewer']:['csm_manager','csm','analyst','viewer']).map(role=><option key={role} value={role}>{roleLabels[role]}</option>)}</select><button disabled={busy}><Plus size={14}/>Add</button></form>}
     <div className="org-members">{members.map(member=><div className="org-member" key={member.id}><span className="org-avatar">{member.user.displayName.split(/\s+/).map(x=>x[0]).join('').slice(0,2).toUpperCase()}</span><span className="org-member-info"><b>{member.user.displayName}{member.user.id===userId?' (you)':''}</b><small>{member.user.email}</small></span>{member.role==='owner'?<span className="org-role owner">Owner</span>:canManage?<select className="org-role-select" value={member.role} disabled={busy} onChange={e=>void changeRole(member,e.target.value)}>{(canGrantAdmin?['admin','csm_manager','csm','analyst','viewer']:['csm_manager','csm','analyst','viewer']).map(role=><option key={role} value={role}>{roleLabels[role]}</option>)}</select>:<span className="org-role">{roleLabels[member.role]??member.role}</span>}{canManage&&member.role!=='owner'&&<button className="org-remove" aria-label={'Remove '+member.user.displayName} disabled={busy} onClick={()=>void removeMember(member)}><Trash2 size={14}/></button>}</div>)}</div>
     {!canManage&&<p className="org-readonly">Your role can view members but cannot change organization access.</p>}
    </article>
   </div>
  </>}
  <p className="org-footnote">Only users who have already registered can be added. Email invitations, ownership transfer, SSO and MFA are planned separately. Organization IDs in API paths are selectors; the API checks active membership before returning tenant data.</p>
 </section>;
}
