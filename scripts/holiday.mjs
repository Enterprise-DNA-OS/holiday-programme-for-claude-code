#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { randomUUID } from 'node:crypto';
import { getDb, REPO_ROOT } from './lib/db.mjs';
import { parseCsv } from './lib/csv.mjs';
import { table } from './lib/format.mjs';

// Whitelists are also the documented field dictionary. Never interpolate user identifiers.
export const entities={
 families:'name email phone',
 children:'family_id name birth_date medical_notes medical_reviewed_on self_medication medication_instructions medication_plan court_order_notes safety_plan reviewed_on',
 contacts:'child_id name phone relationship authorised_pickup',
 programmes:'name venue starts_on ends_on status',
 sessions:'programme_id name starts_at ends_at capacity children_per_staff offsite risk_plan status',
 bookings:'child_id session_id status consent_on notes',
 attendance:'booking_id child_id signed_in_at signed_in_by signed_out_at collected_by_id recorded_by absence_reason',
 staff:'name first_aid_until safety_check_due active',
 roster:'session_id staff_id',
 incidents:'booking_id occurred_at location details injury treatment staff_id parent_informed_at confirmation follow_up_due status',
 invoices:'family_id name issued_on due_on total_cents paid_cents currency status',
 drills:'programme_id occurred_at name notes recorded_by',
 notes:'family_id name body recorded_by'
};
const refs={family_id:'families',child_id:'children',programme_id:'programmes',session_id:'sessions',booking_id:'bookings',staff_id:'staff',collected_by_id:'contacts'};
const labels={bookings:"(select c.name||' / '||s.name from children c,sessions s where c.id=t.child_id and s.id=t.session_id)",attendance:"t.booking_id::text",roster:"(select st.name||' / '||s.name from staff st,sessions s where st.id=t.staff_id and s.id=t.session_id)",incidents:'t.details'};
const source='https://www.xn--tekhuikhu-7bbe.govt.nz/assets/accreditation-approval/specialist-standards/February-2026-versions/OSCAR-Specialist-Standard-Feb-2026.pdf';
const need=(x,msg)=>{if(x===undefined||x===null||String(x).trim()==='')throw Error(msg);return x;};
function parse(args){const positional=[],flags={};for(const a of args){if(a.startsWith('--')){const i=a.indexOf('=');flags[a.slice(2,i<0?undefined:i)]=i<0?true:a.slice(i+1);}else positional.push(a);}return {positional,flags};}
function allowed(flags,names){for(const key of Object.keys(flags))if(key!=='json'&&!names.includes(key))throw Error(`Unknown option --${key}`);}
function realDate(v,key){if(!/^\d{4}-\d{2}-\d{2}$/.test(v)||!Number.isFinite(Date.parse(v))||new Date(v).toISOString().slice(0,10)!==v)throw Error(`${key} needs a real YYYY-MM-DD date`);}
function validate(key,value){
 if(value===null)return null;
 if(['self_medication','authorised_pickup','offsite','active'].includes(key)){if(!['true','false'].includes(String(value)))throw Error(`${key} must be true or false`);return String(value)==='true';}
 if(['capacity','children_per_staff','total_cents','paid_cents'].includes(key)){if(!/^\d+$/.test(String(value))||!Number.isSafeInteger(Number(value)))throw Error(`${key} needs a nonnegative integer`);return Number(value);}
 if(/(_on|_due|_until)$/.test(key)||key==='birth_date')realDate(String(value),key);
 if(key.endsWith('_at')){if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/.test(String(value))||!Number.isFinite(Date.parse(value)))throw Error(`${key} needs an ISO timestamp with timezone`);realDate(String(value).slice(0,10),key);}
 return value;
}
export async function resolve(db,kind,input){
 if(!entities[kind])throw Error(`Unknown record type ${kind}`);need(input,`Supply a ${kind} name or id`);
 const rows=await db.query(`select t.*, ${labels[kind]||'t.name'} as label from ${kind} t order by t.id`);
 const key=String(input).toLowerCase();let hits=rows.filter(x=>x.id===input||String(x.label).toLowerCase()===key);
 if(!hits.length)hits=rows.filter(x=>x.id.startsWith(key)||String(x.label).toLowerCase().includes(key));
 if(hits.length!==1){const e=Error(hits.length?`Ambiguous ${kind}: ${input}`:`No ${kind} match: ${input}`);e.matches=hits.map(x=>({id:x.id,name:x.label}));throw e;}const {label,...row}=hits[0];return row;
}
async function transaction(db,fn){await db.exec('BEGIN');try{const result=await fn();await db.exec('COMMIT');return result;}catch(e){await db.exec('ROLLBACK');throw e;}}
async function write(db,kind,fields,id=null){
 if(!entities[kind])throw Error(`Unknown record type ${kind}`);
 const clean={};for(const [k,v]of Object.entries(fields)){
  if(![...entities[kind].split(' '),'external_id'].includes(k))throw Error(`Unknown field ${kind}.${k}`);
  clean[k]=refs[k]&&v!==null?(await resolve(db,refs[k],v)).id:validate(k,v);
 }
 if(!Object.keys(clean).length)throw Error('Supply at least one field');
 const previous=id?(await db.query(`select * from ${kind} where id=$1 for update`,[id]))[0]:{};
 const next={...previous,...clean};
 if(kind==='sessions'){
  const p=await resolve(db,'programmes',need(next.programme_id,'programme_id required'));
  for(const key of ['starts_at','ends_at']){const d=new Date(next[key]);if(!Number.isFinite(+d))throw Error(`${key} required`);const local=new Intl.DateTimeFormat('en-CA',{timeZone:'Pacific/Auckland',year:'numeric',month:'2-digit',day:'2-digit'}).format(d);if(local<String(p.starts_on)||local>String(p.ends_on))throw Error('Session falls outside programme dates');}
  if(id){const booked=Number((await db.query("select count(*) n from bookings where session_id=$1 and status='confirmed'",[id]))[0].n);if(Number(next.capacity)<booked)throw Error('Capacity is below confirmed bookings');}
  if(id&&next.status==='cancelled'&&(await db.query('select a.id from attendance a join bookings b on b.id=a.booking_id where b.session_id=$1',[id])).length)throw Error('Attendance exists; keep session history');
 }
 if(kind==='bookings'){
  if(id&&(next.child_id!==previous.child_id||next.session_id!==previous.session_id))throw Error('Keep booking identity; cancel and add a new booking');
  const s=(await db.query('select * from sessions where id=$1 for update',[need(next.session_id,'session_id required')]))[0];
  if(!s||s.status==='cancelled')throw Error('Session unavailable');
  if((next.status||'confirmed')==='confirmed'){
   const n=Number((await db.query("select count(*) n from bookings where session_id=$1 and status='confirmed' and ($2::uuid is null or id<>$2)",[s.id,id]))[0].n);
   if(n>=s.capacity)throw Error('Session full; use waitlist');
  }
  if(next.status==='cancelled'&&id&&(await db.query('select id from attendance where booking_id=$1',[id])).length)throw Error('Attendance exists; keep booking history');
 }
 if(kind==='attendance'){
  const b=await resolve(db,'bookings',need(next.booking_id,'booking_id required'));
  if(b.status!=='confirmed')throw Error('Attendance requires a confirmed booking');
  const session=await resolve(db,'sessions',b.session_id);
  if(session.status==='cancelled')throw Error('Session unavailable');
  if(next.child_id!==b.child_id)throw Error('Attendance child does not match booking');
  if(next.collected_by_id){const c=await resolve(db,'contacts',next.collected_by_id);if(c.child_id!==b.child_id||!c.authorised_pickup)throw Error('Collector is not authorised for this child');}
  for(const k of ['signed_in_at','signed_out_at'])if(next[k]&&new Date(next[k])>new Date())throw Error('Do not record attendance in the future');
  if(next.signed_in_at){const dateOf=v=>new Intl.DateTimeFormat('en-CA',{timeZone:'Pacific/Auckland',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(v));if(dateOf(next.signed_in_at)<dateOf(session.starts_at)||dateOf(next.signed_in_at)>dateOf(session.ends_at))throw Error('Arrival date does not match session dates');}
 }
 if(kind==='contacts'&&id&&next.child_id!==previous.child_id)throw Error('Keep contact child identity');
 const keys=Object.keys(clean),vals=Object.values(clean);
 return (await db.query(id?`update ${kind} set ${keys.map((k,i)=>`${k}=$${i+1}`).join(',')} where id=$${keys.length+1} returning *`:`insert into ${kind}(${keys.join(',')}) values(${keys.map((_,i)=>'$'+(i+1)).join(',')}) returning *`,id?[...vals,id]:vals))[0];
}
export const questions=[
 ['Which upcoming sessions have a waiting list and no spare places?',"select session,booked,waiting,capacity from session_readiness where starts_at>=now() and waiting>0 and booked>=capacity and status='scheduled'"],
 ['Which upcoming sessions need more rostered staff under our own ratio?',"select session,booked,staff_count,children_per_staff from session_readiness where starts_at>=now() and status='scheduled' and booked>staff_count*children_per_staff"],
 ['Which booked children have fewer than two contact people?',"select c.name as child,count(co.id) as contacts from children c left join contacts co on co.child_id=c.id where exists(select 1 from bookings b join sessions s on s.id=b.session_id where b.child_id=c.id and b.status='confirmed' and s.starts_at>=now() and s.status='scheduled') group by c.id having count(co.id)<2"],
 ['Which children have no authorised collection contact?',"select c.name as child from children c where not exists(select 1 from contacts co where co.child_id=c.id and co.authorised_pickup)"],
 ['Which finished sessions still have children recorded on site?',"select session,child,signed_in_at from daily_roll where ends_at<now() and attendance_state='on site'"],
 ['Which expected arrivals in past sessions remain unexplained?',"select session,child,starts_at from daily_roll where ends_at<now() and attendance_state='unrecorded'"],
 ['Which open incidents have no record that the parent was informed?',"select c.name as child,i.details,i.occurred_at from incidents i join bookings b on b.id=i.booking_id join children c on c.id=b.child_id where i.status='open' and (i.parent_informed_at is null or trim(i.confirmation)='')"],
 ['Which families owe money and also have future confirmed bookings?',"select fb.family,fb.currency,fb.overdue_cents from family_balances fb where fb.overdue_cents>0 and exists(select 1 from children c join bookings b on b.child_id=c.id join sessions s on s.id=b.session_id where c.family_id=fb.id and b.status='confirmed' and s.starts_at>=now() and s.status='scheduled')"],
 ['Which upcoming sessions lack a rostered first aider with a current certificate?',"select session,starts_at,staff_count from session_readiness where starts_at>=now() and status='scheduled' and booked>0 and first_aiders=0"],
 ['Which confirmed children need their enrolment details reviewed before returning?',"select distinct c.name as child,c.reviewed_on from children c join bookings b on b.child_id=c.id join sessions s on s.id=b.session_id where b.status='confirmed' and s.starts_at>=now() and s.status='scheduled' and (c.reviewed_on is null or c.reviewed_on<current_date-180)"],
];
async function compliance(db){
 const out=[];const check=async(rule,sql,message,criterion)=>{for(const row of await db.query(sql))out.push({rule,record:row.record,finding:message,source:source+'#page='+criterion});};
 await check('OSCAR-CONTACTS',"select c.name as record from children c left join contacts co on co.child_id=c.id group by c.id having count(co.id)<2",'Fewer than two contact people recorded',4);
 await check('OSCAR-PICKUP',"select name as record from children c where not exists(select 1 from contacts co where co.child_id=c.id and authorised_pickup)",'No authorised collector recorded',4);
 await check('OSCAR-MEDICAL',"select name as record from children where medical_reviewed_on is null or (self_medication and (trim(medication_instructions)='' or trim(medication_plan)=''))",'Medical review or self-medication instructions and plan missing',4);
 await check('OSCAR-SAFETY-PLAN',"select name as record from children where trim(court_order_notes)<>'' and trim(safety_plan)=''",'Court order recorded without a safety plan',5);
 await check('OSCAR-ATTENDANCE',"select session||': '||child as record from daily_roll where ends_at<now() and attendance_state in ('unrecorded','on site')",'Past session has an unexplained absence or missing collection record',5);
 await check('OSCAR-INCIDENT',"select details as record from incidents where parent_informed_at is null or trim(confirmation)='' or trim(location)='' or trim(details)='' or trim(injury)='' or trim(treatment)=''",'Incident details or parent acknowledgement incomplete',6);
 await check('OSCAR-FIRST-AID',"select session as record from session_readiness where status='scheduled' and ends_at>=now() and booked>0 and first_aiders=0",'No current first aider rostered for the whole session',3);
 await check('POLICY-RATIO',"select session as record from session_readiness where status='scheduled' and ends_at>=now() and booked>staff_count*children_per_staff",'Booked children exceed the programme staffing ratio',3);
 await check('OSCAR-RAMS',"select session as record from session_readiness where status='scheduled' and offsite and trim(risk_plan)=''",'Off-site risk assessment reference missing',3);
 await check('OSCAR-DRILL',"select p.name as record from programmes p where p.starts_on<=current_date and p.status<>'planned' and not exists(select 1 from drills d where d.programme_id=p.id and (d.occurred_at at time zone 'Pacific/Auckland')::date between p.starts_on and p.ends_on)",'No drill recorded during this holiday programme; review before it ends',7);
 await check('LOCAL-STAFF-REVIEW',"select name as record from staff where active and (safety_check_due is null or safety_check_due<current_date)",'Local staff review date missing or overdue; not a legal interval assessment',2);
 return out;
}
function draft(name,text){const dir=path.resolve(process.env.OUTPUT_DIR||REPO_ROOT,'drafts');fs.mkdirSync(dir,{recursive:true});const file=path.join(dir,name+'-'+randomUUID()+'.md');fs.writeFileSync(file,text,{flag:'wx',mode:0o600});return {file,sent:false};}
const reads={
 'session-plan':"select session,starts_at,booked,waiting,capacity,staff_count,first_aiders from session_readiness where starts_at>=now() and status='scheduled' order by starts_at",
 'roll-call':"select session,child,starts_at,attendance_state,signed_in_at,signed_out_at from daily_roll order by starts_at,child",
 'pickup-check':"select session,child,attendance_state,signed_in_at from daily_roll where ends_at<now() and attendance_state in ('on site','unrecorded') order by starts_at,child",
 'waitlist':"select c.name as child,s.name as session,b.created_at from bookings b join children c on c.id=b.child_id join sessions s on s.id=b.session_id where b.status='waitlist' and s.status='scheduled' order by b.created_at,b.id",
 'staff-cover':"select session,starts_at,booked,staff_count,children_per_staff,first_aiders from session_readiness where status='scheduled' and ends_at>=now() order by starts_at",
 'balances':'select family,currency,balance_cents,overdue_cents,earliest_due from family_balances order by overdue_cents desc',
 'incident-follow-up':"select c.name as child,i.details,i.follow_up_due,i.parent_informed_at,i.confirmation from incidents i join bookings b on b.id=i.booking_id join children c on c.id=b.child_id where i.status='open' order by i.follow_up_due nulls last",
 'attention':"select 'collection' as kind,child as record,session as detail from daily_roll where ends_at<now() and attendance_state='on site' union all select 'unexplained absence',child,session from daily_roll where ends_at<now() and attendance_state='unrecorded' union all select 'incident',details,'Follow-up overdue' from incidents where status='open' and follow_up_due<current_date union all select 'balance',family,'Overdue invoice' from family_balances where overdue_cents>0"
};
export async function execute(db,args){
 const {positional:p,flags:f}=parse(args),[cmd='help',kind,ref]=p;
 if(cmd==='help'){allowed(f,[]);return {commands:[...Object.keys(entities),...Object.keys(reads),'show','add','update','check-in','check-out','absent','compliance','insights','log','weekly-review','draft-reminder','import','export']};}
 if(reads[cmd]){allowed(f,[]);return db.query(reads[cmd]);}
 if(entities[cmd]){allowed(f,[]);return db.query(`select * from ${cmd} order by created_at,id`);}
 if(cmd==='show'){allowed(f,[]);return resolve(db,kind,ref);}
 if(cmd==='compliance'){allowed(f,[]);return compliance(db);}
 if(cmd==='insights'){
  allowed(f,[]);if(kind&&(!/^\d+$/.test(kind)||Number(kind)<1||Number(kind)>10))throw Error('Choose 1 through 10');
  const out=[];for(let i=0;i<questions.length;i++){if(kind&&Number(kind)!==i+1)continue;out.push({number:i+1,question:questions[i][0],rows:await db.query(questions[i][1])});}return out;
 }
 if(cmd==='add'||cmd==='update'){
  if(kind==='attendance')throw Error('Use check-in, check-out or absent for attendance');
  const fields=Object.fromEntries(Object.entries(f).filter(([k])=>k!=='json').map(([k,v])=>[k,v==='null'?null:v]));
  return transaction(db,async()=>write(db,kind,fields,cmd==='update'?(await resolve(db,kind,ref)).id:null));
 }
 if(['check-in','check-out','absent'].includes(cmd)){
  allowed(f,['at','by','collector','reason']);return transaction(db,async()=>{
   const b=await resolve(db,'bookings',kind);await db.query('select id from bookings where id=$1 for update',[b.id]);
   const old=(await db.query('select * from attendance where booking_id=$1',[b.id]))[0];
   if(cmd==='check-out'){
    if(!old?.signed_in_at||old.signed_out_at)throw Error('Check-out requires an open sign-in');
    return write(db,'attendance',{signed_out_at:need(f.at,'--at required'),collected_by_id:need(f.collector,'--collector required'),recorded_by:need(f.by,'--by required')},old.id);
   }
   if(old)throw Error('Attendance already recorded; preserve history and review corrections explicitly');
   const fields={booking_id:b.id,child_id:b.child_id,recorded_by:need(f.by,'--by required')};
   if(cmd==='absent')fields.absence_reason=need(f.reason,'--reason required');else{fields.signed_in_at=need(f.at,'--at required');fields.signed_in_by=f.by;}
   return write(db,'attendance',fields);
  });
 }
 if(cmd==='log'){allowed(f,['by']);return transaction(db,async()=>write(db,'notes',{family_id:need(kind,'Family required'),name:'Operator note',body:need(ref,'Note required'),recorded_by:need(f.by,'--by required')}));}
 if(cmd==='weekly-review'){
  allowed(f,[]);const data={sessions:await execute(db,['session-plan']),attention:await execute(db,['attention']),compliance:await execute(db,['compliance'])};
  return {...draft('weekly-review','# Weekly programme review\n\n'+Object.entries(data).map(([k,v])=>'## '+k+'\n\n'+human(v)).join('\n\n')),data};
 }
 if(cmd==='draft-reminder'){
  allowed(f,[]);const family=await resolve(db,'families',kind);const invoices=await db.query("select name,due_on,currency,total_cents-paid_cents as balance_cents from invoices where family_id=$1 and status='open' and due_on<current_date and paid_cents<total_cents order by due_on",[family.id]);
  if(!invoices.length)throw Error('No overdue invoices');return draft('balance-reminder',`# Draft only\n\nTo: ${family.email}\n\nHello ${family.name},\n\nOur records show these outstanding invoices. Please check them and let us know if a payment has already been made.\n\n${human(invoices)}\n\nPrepared for staff review. Nothing sent.\n`);
 }
 if(cmd==='export'){
  allowed(f,['out']);const out=path.resolve(need(f.out,'--out required'));const records=await transaction(db,async()=>{await db.exec('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ');const data={};for(const k of Object.keys(entities))data[k]=await db.query(`select * from ${k} order by id`);return data;});fs.writeFileSync(out,JSON.stringify({format:'holiday-programme-v1',exported_at:new Date().toISOString(),records},null,2)+'\n',{flag:'wx',mode:0o600});return {file:out,counts:Object.fromEntries(Object.entries(records).map(([k,v])=>[k,v.length]))};
 }
 if(cmd==='import'){
  allowed(f,['file','kind','map','dry-run']);if(kind!=='enrolmy')throw Error('Supported source: enrolmy');const type=f.kind||'children';if(!['families','children','contacts','bookings','invoices'].includes(type))throw Error('Import supports families, children, contacts, bookings, invoices');
  const file=need(f.file,'--file required');if(!file.toLowerCase().endsWith('.csv'))throw Error('Supply a reviewed CSV export, not an Excel workbook');
  const rows=parseCsv(fs.readFileSync(file,'utf8'));if(!rows.length)throw Error('No data rows');
  const map=f.map?JSON.parse(fs.readFileSync(f.map,'utf8')):{};if(!map||typeof map!=='object'||Array.isArray(map))throw Error('Map must be an object of field to source header');
  const fields=['external_id',...entities[type].split(' ')];for(const k of Object.keys(map))if(!fields.includes(k)||typeof map[k]!=='string')throw Error(`Unknown mapping field ${k}`);
  for(const col of Object.values(map))if(!Object.hasOwn(rows[0],col))throw Error(`Missing source column: ${col}`);
  await db.exec('BEGIN');try{let count=0;const seen=new Set();
   for(const row of rows){const data={};for(const key of fields){const header=map[key]||key;const found=Object.keys(row).find(x=>x.toLowerCase()===header.toLowerCase());if(found!==undefined&&row[found]!=='')data[key]=row[found];}
    const ext=String(need(data.external_id,'Each row needs a stable external_id; map the exported identifier')).trim();if(seen.has(ext))throw Error('Duplicate external_id in this import');seen.add(ext);data.external_id='enrolmy:'+ext;
    const old=(await db.query(`select id from ${type} where external_id=$1`,[data.external_id]))[0];await write(db,type,data,old?.id);count++;
   }await db.exec(f['dry-run']?'ROLLBACK':'COMMIT');return {kind:type,rows:count,dry_run:Boolean(f['dry-run'])};
  }catch(e){await db.exec('ROLLBACK');throw e;}
 }
 throw Error(`Unknown command ${cmd}; run help`);
}
export function human(data){
 if(Array.isArray(data)){if(!data.length)return '(none)';if(data[0].question)return data.map(x=>`${x.number}. ${x.question}\n${human(x.rows)}`).join('\n\n');
 const rows=data.map(r=>Object.fromEntries(Object.entries(r).map(([k,v])=>[k,v instanceof Date?v.toISOString():v!==null&&typeof v==='object'?JSON.stringify(v):v])));
 const keys=Object.keys(rows[0]);return table(rows,keys.map(key=>({key,label:key.replaceAll('_',' '),width:key==='source'?34:key==='finding'?70:38})));
 }return JSON.stringify(data,null,2);
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){let db;try{db=await getDb();const data=await execute(db,process.argv.slice(2));console.log(process.argv.includes('--json')?JSON.stringify(data,null,2):human(data));}catch(e){if(process.argv.includes('--json'))console.log(JSON.stringify({error:e.message,...(e.matches?{matches:e.matches}:{})}));else console.error(e.message+(e.matches?'\n'+human(e.matches):''));process.exitCode=1;}finally{if(db)await db.close();}}
