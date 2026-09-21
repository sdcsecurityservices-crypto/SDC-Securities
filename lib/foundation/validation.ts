import {z} from 'zod';
const text=z.string().trim().max(4000),name=text.min(2).max(150),code=z.string().trim().toUpperCase().regex(/^[A-Z0-9_-]{2,30}$/,'Use 2–30 letters, digits, dashes or underscores.');
const uuid=z.string().uuid();
const date=z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(s=>!isNaN(Date.parse(s))&&new Date(s).toISOString().slice(0,10)===s,'Enter a valid date.');
const contacts=z.array(z.object({type:z.enum(['police','fire','hospital','emergency']),name,phone:z.string().trim().max(25)})).max(20);
export const resources={
 clients:{label:'Clients',search:'name',schema:z.object({code,name,legal_name:text.max(150),gstin:z.string().trim().toUpperCase().refine(s=>!s||/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(s),'Invalid GSTIN format.'),billing_address:text,billing_cycle:z.enum(['monthly','fortnightly','quarterly']),contact_name:text.max(150),contact_email:z.union([z.literal(''),z.string().email()]),contact_phone:text.max(25),notes:text}).strict()},
 sites:{label:'Sites',search:'name',schema:z.object({client_id:uuid,code,name,site_type:z.enum(['IT park','Residential','Hospital','Factory','Bank','School','Event','Warehouse','College']),address:text,latitude:z.number().min(-90).max(90).nullable(),longitude:z.number().min(-180).max(180).nullable(),geofence_radius:z.number().int().min(10).max(5000),emergency_contacts:contacts,sop_notes:text,starts_on:date,ends_on:date.nullable()}).strict().refine(x=>!x.ends_on||x.ends_on>=x.starts_on,'End date must follow start date.').refine(x=>(x.latitude===null)===(x.longitude===null),'Provide both coordinates or neither.')},
 posts:{label:'Posts',search:'name',schema:z.object({site_id:uuid,code,name,grade_id:uuid,location_notes:text}).strict()},
 shift_templates:{label:'Shift templates',search:'name',schema:z.object({code,name,starts_at:z.string().regex(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/),duration_minutes:z.union([z.literal(480),z.literal(720)]),break_minutes:z.number().int().min(0).max(719)}).strict().refine(x=>x.break_minutes<x.duration_minutes,'Break must be shorter than the shift.')},
 staffing_requirements:{label:'Staffing requirements',search:null,schema:z.object({post_id:uuid,shift_id:uuid,headcount:z.number().int().min(1).max(100),weekdays:z.array(z.number().int().min(1).max(7)).min(1).max(7).transform(x=>[...new Set(x)]),effective_from:date,effective_to:date.nullable()}).strict().refine(x=>!x.effective_to||x.effective_to>=x.effective_from,'End date must follow start date.')},
 grades:{label:'Grades',search:'name',schema:z.object({code,name,rank:z.number().int().min(1).max(100)}).strict()},
 contracts:{label:'Contracts',search:'number',schema:z.object({client_id:uuid,number:name,starts_on:date,ends_on:date,sla_terms:text,penalty_terms:text,escalation_matrix:z.array(z.object({name,phone:text.max(25),delay_minutes:z.number().int().min(0)})).max(20)}).strict().refine(x=>x.ends_on>=x.starts_on,'End date must follow start date.')},
 rate_card_lines:{label:'Rate cards',search:null,schema:z.object({contract_id:uuid,grade_id:uuid,monthly_rate_paise:z.number().int().min(0).max(1000000000),overtime_hour_paise:z.number().int().min(0).max(10000000)}).strict()}
} as const;
export type Resource=keyof typeof resources;
export const writeRequest=z.object({tenant_id:uuid,id:uuid.optional(),row_version:z.number().int().nonnegative().optional(),archive:z.boolean().optional(),data:z.record(z.unknown()).optional()}).strict();
export const tenantId=uuid;
export const operatorRoles=['admin','operations_manager','senior_manager'];
export const roleNames:Record<string,string>={admin:'Super Admin',operations_manager:'Ops Manager',senior_manager:'Senior Manager',site_lead:'Field Supervisor',employee:'Guard / Employee',hr_payroll:'HR / Payroll',trainer:'Trainer',client_user:'Client User'};
