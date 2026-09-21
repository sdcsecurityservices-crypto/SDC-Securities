import type {DeploymentDraft, Publication} from './deployment';
export type Role = 'Admin'|'Operations Manager'|'Site Lead'|'Senior Manager'|'Employee';
export type Employee={id:string;name:string;designation:string;site:string;status:'Active'|'On leave';joined:string;training:string};
export type Duty={id:string;employeeId:string;site:string;post:string;shift:string;date:string;attendance:'Scheduled'|'Present'|'Absent';publishedAt:string};
export type Incident={id:string;site:string;title:string;priority:'High'|'Medium'|'Low';status:'Open'|'Resolved';time:string};
export type Leave={id:string;employeeId:string;type:string;from:string;to:string;status:'Pending'|'Approved'|'Declined'};
export type Audit={id:string;action:string;time:string;role:Role};
export type State={employees:Employee[];duties:Duty[];incidents:Incident[];leaves:Leave[];audit:Audit[];deploymentDrafts?:DeploymentDraft[];rosterPublications?:Publication[]};
export const sites=['All sites','Northstar Hospital','Oakridge College','Horizon Tech Park'];
export const shifts=['06:00 – 14:00','14:00 – 22:00','22:00 – 06:00'];
export const DEMO_DATE='2026-09-21';
export function seed():State{
 const names=['Arjun Rao','Vikram Shetty','Ravi Kumar','Suresh Naik','Anil Gowda','Prakash Reddy','Manoj Singh','Deepak Hegde','Kiran Das','Naveen Bhat','Santosh Poojary','Ramesh Yadav'];
 const employees:Employee[]=names.map((name,i)=>({id:`SDC-${String(101+i).padStart(4,'0')}`,name,designation:i%4===0?'Site Supervisor':'Security Officer',site:sites[Math.floor(i/4)+1],status:i===11?'On leave':'Active',joined:`202${i%3+3}-0${i%8+1}-15`,training:i===7?'Refresher due':'Up to date'}));
 const duties:Duty[]=employees.filter((_,i)=>i!==3&&i!==11).map((e,i)=>({id:`D-${i}`,employeeId:e.id,site:e.site,post:['Main entrance','Emergency block','Visitor reception'][i%3],shift:shifts[i%3],date:DEMO_DATE,attendance:i<7?'Present':'Scheduled',publishedAt:'2026-09-20T16:30:00+05:30'}));
 return {employees,duties,incidents:[{id:'INC-1002',site:sites[1],title:'Visitor access reader offline at Gate 02',priority:'High',status:'Open',time:'2026-09-21T09:42:00+05:30'},{id:'INC-1001',site:sites[2],title:'Delivery vehicle awaiting access clearance',priority:'Medium',status:'Open',time:'2026-09-21T09:18:00+05:30'},{id:'INC-1000',site:sites[3],title:'Perimeter inspection completed',priority:'Low',status:'Resolved',time:'2026-09-21T08:55:00+05:30'}],leaves:[{id:'L-1',employeeId:employees[2].id,type:'Casual leave',from:'2026-09-24',to:'2026-09-25',status:'Pending'},{id:'L-2',employeeId:employees[6].id,type:'Earned leave',from:'2026-09-28',to:'2026-09-30',status:'Pending'}],audit:[{id:'A-1',action:'Weekly duty roster published · 10 assignments',time:'2026-09-20T16:30:00+05:30',role:'Operations Manager'},{id:'A-2',action:'September training records reviewed',time:'2026-09-20T10:00:00+05:30',role:'Admin'}]};
}
