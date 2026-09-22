-- Training engine. Additive and isolated by existing workspace memberships.
create function sdc_private.is_trainer(t uuid) returns boolean language sql stable security definer set search_path='' as $$
select exists(select 1 from public.memberships where tenant_id=t and user_id=auth.uid() and active and role in ('admin','hr_payroll','trainer')) $$;
revoke all on function sdc_private.is_trainer(uuid) from public,anon;
grant execute on function sdc_private.is_trainer(uuid) to authenticated;
create table public.training_courses (id uuid not null default gen_random_uuid(), tenant_id uuid not null references public.tenants(id),
created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid, updated_by uuid,
row_version integer not null default 0, deleted_at timestamptz, primary key(tenant_id,id),code text not null, title text not null check(length(title) between 3 and 180), category text not null check(category in ('induction','specialist','refresher','leadership')), mandatory_for text[] not null default '{}', duration_hours integer not null default 8 check(duration_hours between 1 and 5000), field_hours integer not null default 0 check(field_hours between 0 and 5000), working_days integer not null default 1 check(working_days between 1 and 365), condensed_hours integer not null default 0 check(condensed_hours between 0 and 5000), mode text not null default 'classroom' check(mode in ('classroom','field','e_learning','on_site')), validity_months integer not null default 12 check(validity_months between 0 and 120), pass_mark integer not null default 70 check(pass_mark between 1 and 100), practical_pass integer not null default 60 check(practical_pass between 0 and 100), question_count integer not null default 10 check(question_count between 1 and 100), max_attempts integer not null default 3 check(max_attempts between 1 and 20), language text not null default 'English' check(language in ('English','Kannada','Hindi')), syllabus text not null default '', prerequisites uuid[] not null default '{}', reviewed boolean not null default false);
alter table public.training_courses enable row level security; revoke all on public.training_courses from anon,authenticated;
grant select on public.training_courses to authenticated; create policy training_read on public.training_courses for select to authenticated using(sdc_private.is_member(tenant_id));
grant insert,update on public.training_courses to authenticated; create policy training_insert on public.training_courses for insert to authenticated with check(sdc_private.is_trainer(tenant_id)); create policy training_update on public.training_courses for update to authenticated using(sdc_private.is_trainer(tenant_id)) with check(sdc_private.is_trainer(tenant_id));
create trigger a_stamp before insert or update on public.training_courses for each row execute function sdc_private.stamp_change();
create index training_courses_page on public.training_courses(tenant_id,created_at desc,id) where deleted_at is null;
create table public.training_sessions (id uuid not null default gen_random_uuid(), tenant_id uuid not null references public.tenants(id),
created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid, updated_by uuid,
row_version integer not null default 0, deleted_at timestamptz, primary key(tenant_id,id),course_id uuid not null, title text not null, trainer_id uuid not null, site_id uuid, venue text not null, starts_at timestamptz not null, ends_at timestamptz not null, capacity integer not null check(capacity between 1 and 1000), status text not null default 'scheduled' check(status in ('scheduled','completed','cancelled')), check(ends_at>starts_at),foreign key(tenant_id,course_id) references public.training_courses(tenant_id,id),foreign key(tenant_id,trainer_id) references public.memberships(tenant_id,id),foreign key(tenant_id,site_id) references public.sites(tenant_id,id));
alter table public.training_sessions enable row level security; revoke all on public.training_sessions from anon,authenticated;
grant select on public.training_sessions to authenticated; create policy training_read on public.training_sessions for select to authenticated using(sdc_private.is_trainer(tenant_id) or sdc_private.is_operator(tenant_id) or (site_id is not null and sdc_private.can_site(tenant_id,site_id)));
grant insert,update on public.training_sessions to authenticated; create policy training_insert on public.training_sessions for insert to authenticated with check(sdc_private.is_trainer(tenant_id)); create policy training_update on public.training_sessions for update to authenticated using(sdc_private.is_trainer(tenant_id)) with check(sdc_private.is_trainer(tenant_id));
create trigger a_stamp before insert or update on public.training_sessions for each row execute function sdc_private.stamp_change();
create index training_sessions_page on public.training_sessions(tenant_id,created_at desc,id) where deleted_at is null;
create table public.training_enrollments (id uuid not null default gen_random_uuid(), tenant_id uuid not null references public.tenants(id),
created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid, updated_by uuid,
row_version integer not null default 0, deleted_at timestamptz, primary key(tenant_id,id),employee_id uuid not null, session_id uuid not null, attendance text not null default 'pending' check(attendance in ('pending','present','absent')), hours_completed numeric not null default 0 check(hours_completed between 0 and 5000), practical_score integer check(practical_score between 0 and 100), practical_notes text not null default '',foreign key(tenant_id,employee_id) references public.employees(tenant_id,id),foreign key(tenant_id,session_id) references public.training_sessions(tenant_id,id));
alter table public.training_enrollments enable row level security; revoke all on public.training_enrollments from anon,authenticated;
grant select on public.training_enrollments to authenticated; create policy training_read on public.training_enrollments for select to authenticated using(sdc_private.is_trainer(tenant_id) or sdc_private.can_employee(tenant_id,employee_id));
grant insert,update on public.training_enrollments to authenticated; create policy training_insert on public.training_enrollments for insert to authenticated with check(sdc_private.is_trainer(tenant_id)); create policy training_update on public.training_enrollments for update to authenticated using(sdc_private.is_trainer(tenant_id)) with check(sdc_private.is_trainer(tenant_id));
create trigger a_stamp before insert or update on public.training_enrollments for each row execute function sdc_private.stamp_change();
create index training_enrollments_page on public.training_enrollments(tenant_id,created_at desc,id) where deleted_at is null;
create table public.training_questions (id uuid not null default gen_random_uuid(), tenant_id uuid not null references public.tenants(id),
created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid, updated_by uuid,
row_version integer not null default 0, deleted_at timestamptz, primary key(tenant_id,id),course_id uuid not null, prompt text not null check(length(prompt) between 5 and 1500), options jsonb not null check(jsonb_typeof(options)='array' and jsonb_array_length(options) between 2 and 6), correct_index integer not null check(correct_index>=0 and correct_index<jsonb_array_length(options)), explanation text not null default '',foreign key(tenant_id,course_id) references public.training_courses(tenant_id,id));
alter table public.training_questions enable row level security; revoke all on public.training_questions from anon,authenticated;
grant select on public.training_questions to authenticated; create policy training_read on public.training_questions for select to authenticated using(sdc_private.is_trainer(tenant_id));
grant insert,update on public.training_questions to authenticated; create policy training_insert on public.training_questions for insert to authenticated with check(sdc_private.is_trainer(tenant_id)); create policy training_update on public.training_questions for update to authenticated using(sdc_private.is_trainer(tenant_id)) with check(sdc_private.is_trainer(tenant_id));
create trigger a_stamp before insert or update on public.training_questions for each row execute function sdc_private.stamp_change();
create index training_questions_page on public.training_questions(tenant_id,created_at desc,id) where deleted_at is null;
create table public.training_attempts (id uuid not null default gen_random_uuid(), tenant_id uuid not null references public.tenants(id),
created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid, updated_by uuid,
row_version integer not null default 0, deleted_at timestamptz, primary key(tenant_id,id),employee_id uuid not null, course_id uuid not null, enrollment_id uuid not null, question_snapshot jsonb not null, course_snapshot jsonb not null, answer_key jsonb not null, submitted_answers jsonb, score integer, passed boolean not null default false, expires_at timestamptz not null default (now()+interval '60 minutes'), submitted_at timestamptz,foreign key(tenant_id,employee_id) references public.employees(tenant_id,id),foreign key(tenant_id,course_id) references public.training_courses(tenant_id,id),foreign key(tenant_id,enrollment_id) references public.training_enrollments(tenant_id,id));
alter table public.training_attempts enable row level security; revoke all on public.training_attempts from anon,authenticated;
create trigger a_stamp before insert or update on public.training_attempts for each row execute function sdc_private.stamp_change();
create index training_attempts_page on public.training_attempts(tenant_id,created_at desc,id) where deleted_at is null;
create table public.training_awards (id uuid not null default gen_random_uuid(), tenant_id uuid not null references public.tenants(id),
created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid, updated_by uuid,
row_version integer not null default 0, deleted_at timestamptz, primary key(tenant_id,id),employee_id uuid not null, course_id uuid not null, attempt_id uuid not null, certificate_id uuid not null, token uuid not null default gen_random_uuid() unique, issued_on date not null, expires_on date, revoked_at timestamptz,foreign key(tenant_id,employee_id) references public.employees(tenant_id,id),foreign key(tenant_id,course_id) references public.training_courses(tenant_id,id),foreign key(tenant_id,attempt_id) references public.training_attempts(tenant_id,id),foreign key(tenant_id,certificate_id) references public.employee_certificates(tenant_id,id));
alter table public.training_awards enable row level security; revoke all on public.training_awards from anon,authenticated;
grant select on public.training_awards to authenticated; create policy training_read on public.training_awards for select to authenticated using(sdc_private.is_trainer(tenant_id) or sdc_private.can_employee(tenant_id,employee_id));
create trigger a_stamp before insert or update on public.training_awards for each row execute function sdc_private.stamp_change();
create index training_awards_page on public.training_awards(tenant_id,created_at desc,id) where deleted_at is null;
create table public.training_requirements (id uuid not null default gen_random_uuid(), tenant_id uuid not null references public.tenants(id),
created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid, updated_by uuid,
row_version integer not null default 0, deleted_at timestamptz, primary key(tenant_id,id),post_id uuid not null, course_id uuid not null, enforcement text not null default 'block' check(enforcement in ('block','warn')),foreign key(tenant_id,post_id) references public.posts(tenant_id,id),foreign key(tenant_id,course_id) references public.training_courses(tenant_id,id));
alter table public.training_requirements enable row level security; revoke all on public.training_requirements from anon,authenticated;
grant select on public.training_requirements to authenticated; create policy training_read on public.training_requirements for select to authenticated using(sdc_private.is_trainer(tenant_id) or sdc_private.can_post(tenant_id,post_id));
grant insert,update on public.training_requirements to authenticated; create policy training_insert on public.training_requirements for insert to authenticated with check(sdc_private.is_operator(tenant_id)); create policy training_update on public.training_requirements for update to authenticated using(sdc_private.is_operator(tenant_id)) with check(sdc_private.is_operator(tenant_id));
create trigger a_stamp before insert or update on public.training_requirements for each row execute function sdc_private.stamp_change();
create index training_requirements_page on public.training_requirements(tenant_id,created_at desc,id) where deleted_at is null;
create unique index training_code on public.training_courses(tenant_id,code) where deleted_at is null;
create unique index training_enrolled on public.training_enrollments(tenant_id,session_id,employee_id) where deleted_at is null;
create unique index training_post_course on public.training_requirements(tenant_id,post_id,course_id) where deleted_at is null;
create unique index training_award_attempt on public.training_awards(tenant_id,attempt_id);
create index training_award_employee on public.training_awards(tenant_id,employee_id,course_id,expires_on);
create index training_session_course on public.training_sessions(tenant_id,course_id,starts_at);
create index training_session_trainer on public.training_sessions(tenant_id,trainer_id);
create index training_enrollment_employee on public.training_enrollments(tenant_id,employee_id,session_id);
create index training_question_course on public.training_questions(tenant_id,course_id);
create index training_attempt_employee on public.training_attempts(tenant_id,employee_id,course_id,created_at);
create policy own_training_session on public.training_sessions for select to authenticated using(exists(select 1 from public.training_enrollments e where e.tenant_id=training_sessions.tenant_id and e.session_id=training_sessions.id and sdc_private.is_employee_self(e.tenant_id,e.employee_id)));
create function sdc_private.training_audit() returns trigger language plpgsql security definer set search_path='' as $$ begin
insert into public.audit_events(tenant_id,actor_user_id,action,entity_type,entity_id,before_data,after_data) values(new.tenant_id,auth.uid(),case when TG_OP='INSERT' then 'created' else 'updated' end,TG_TABLE_NAME,new.id,null,jsonb_build_object('revision',new.row_version)); return new; end $$;
revoke all on function sdc_private.training_audit() from public,anon,authenticated;
create trigger z_audit after insert or update on public.training_courses for each row execute function sdc_private.training_audit();
create trigger z_audit after insert or update on public.training_sessions for each row execute function sdc_private.training_audit();
create trigger z_audit after insert or update on public.training_enrollments for each row execute function sdc_private.training_audit();
create trigger z_audit after insert or update on public.training_questions for each row execute function sdc_private.training_audit();
create trigger z_audit after insert or update on public.training_attempts for each row execute function sdc_private.training_audit();
create trigger z_audit after insert or update on public.training_awards for each row execute function sdc_private.training_audit();
create trigger z_audit after insert or update on public.training_requirements for each row execute function sdc_private.training_audit();
create function sdc_private.training_validate() returns trigger language plpgsql security definer set search_path='' as $$
declare c public.training_courses; s public.training_sessions; n integer; p uuid;
begin
 if TG_TABLE_NAME='training_courses' then
 foreach p in array new.prerequisites loop
 if p=new.id or not exists(select 1 from public.training_courses where tenant_id=new.tenant_id and id=p and deleted_at is null) then raise exception 'Prerequisite must be another active course in this workspace'; end if;
 end loop;
 elsif TG_TABLE_NAME='training_sessions' then
 if not exists(select 1 from public.memberships where tenant_id=new.tenant_id and id=new.trainer_id and active and role in ('admin','hr_payroll','trainer')) then raise exception 'Choose an active trainer'; end if;
 select * into c from public.training_courses where tenant_id=new.tenant_id and id=new.course_id and deleted_at is null;
 if not found then raise exception 'Course is unavailable'; end if;
 if TG_OP='UPDATE' and (new.course_id<>old.course_id or new.starts_at<>old.starts_at or new.ends_at<>old.ends_at) and exists(select 1 from public.training_enrollments where tenant_id=new.tenant_id and session_id=new.id and deleted_at is null) then raise exception 'An enrolled session cannot change course or schedule; create a replacement session'; end if;
 elsif TG_TABLE_NAME='training_enrollments' then
 select * into s from public.training_sessions where tenant_id=new.tenant_id and id=new.session_id and deleted_at is null for update;
 if not found or s.status='cancelled' then raise exception 'Session is unavailable'; end if;
 if TG_OP='UPDATE' and (new.employee_id<>old.employee_id or new.session_id<>old.session_id) then raise exception 'Enrollment ownership is immutable'; end if;
 if not exists(select 1 from public.employees where tenant_id=new.tenant_id and id=new.employee_id and status='active' and deleted_at is null) then raise exception 'Only active employees can enrol'; end if;
 select count(*) into n from public.training_enrollments where tenant_id=new.tenant_id and session_id=new.session_id and id<>new.id and deleted_at is null;
 if new.deleted_at is null and n>=s.capacity then raise exception 'Session capacity reached'; end if;
 select * into c from public.training_courses where tenant_id=new.tenant_id and id=s.course_id;
 foreach p in array c.prerequisites loop
 if not exists(select 1 from public.training_awards where tenant_id=new.tenant_id and employee_id=new.employee_id and course_id=p and revoked_at is null and (expires_on is null or expires_on >= (s.starts_at at time zone 'Asia/Kolkata')::date)) then raise exception 'Prerequisite certification is missing or expired'; end if;
 end loop;
 if exists(select 1 from public.training_enrollments e join public.training_sessions x on x.tenant_id=e.tenant_id and x.id=e.session_id where e.tenant_id=new.tenant_id and e.employee_id=new.employee_id and e.id<>new.id and e.deleted_at is null and x.deleted_at is null and x.status<>'cancelled' and tstzrange(x.starts_at,x.ends_at,'[)') && tstzrange(s.starts_at,s.ends_at,'[)')) then raise exception 'Employee has an overlapping training session'; end if;
 if exists(select 1 from public.training_attempts where tenant_id=new.tenant_id and enrollment_id=new.id) and TG_OP='UPDATE' and (new.attendance<>old.attendance or new.practical_score is distinct from old.practical_score or new.hours_completed<>old.hours_completed) then raise exception 'Assessed attendance and practical scores are immutable; create a new session for reassessment'; end if;
 end if;
 return new;
end $$;
revoke all on function sdc_private.training_validate() from public,anon,authenticated;
create trigger b_validate before insert or update on public.training_courses for each row execute function sdc_private.training_validate();
create trigger b_validate before insert or update on public.training_sessions for each row execute function sdc_private.training_validate();
create trigger b_validate before insert or update on public.training_enrollments for each row execute function sdc_private.training_validate();

-- RPCs need private answers and self-service issuance; explicit membership checks precede every read.
create function public.training_start(p_tenant uuid,p_enrollment uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare e public.training_enrollments; c public.training_courses; a public.training_attempts; q jsonb; k jsonb; n integer;
begin
 select * into e from public.training_enrollments where tenant_id=p_tenant and id=p_enrollment and deleted_at is null for update;
 if not found or auth.uid() is null or not (sdc_private.is_employee_self(p_tenant,e.employee_id) or sdc_private.is_trainer(p_tenant)) then raise exception 'Access denied' using errcode='42501'; end if;
 select c1.* into c from public.training_courses c1 join public.training_sessions s on s.tenant_id=c1.tenant_id and s.course_id=c1.id where s.tenant_id=p_tenant and s.id=e.session_id and s.status<>'cancelled' and s.deleted_at is null and c1.deleted_at is null;
 if not found or not c.reviewed then raise exception 'Course must be reviewed by a trainer before assessment'; end if;
 if e.attendance<>'present' or e.hours_completed<c.duration_hours+c.field_hours or coalesce(e.practical_score,-1)<c.practical_pass then raise exception 'Complete attendance, required hours and practical evaluation before assessment'; end if;
 select * into a from public.training_attempts where tenant_id=p_tenant and enrollment_id=e.id and submitted_at is null and expires_at>now() order by created_at desc limit 1;
 if found then return jsonb_build_object('id',a.id,'questions',a.question_snapshot,'expires_at',a.expires_at); end if;
 select count(*) into n from public.training_attempts where tenant_id=p_tenant and enrollment_id=e.id;
 if n>=c.max_attempts then raise exception 'Maximum attempts reached; arrange a new training session'; end if;
 select jsonb_agg(jsonb_build_object('id',id,'prompt',prompt,'options',options)),jsonb_object_agg(id::text,correct_index) into q,k from (select * from public.training_questions where tenant_id=p_tenant and course_id=c.id and deleted_at is null order by random() limit c.question_count) bank;
 if coalesce(jsonb_array_length(q),0)<c.question_count then raise exception 'Add enough reviewed questions to the course question bank'; end if;
 insert into public.training_attempts(tenant_id,employee_id,course_id,enrollment_id,question_snapshot,course_snapshot,answer_key) values(p_tenant,e.employee_id,c.id,e.id,q,to_jsonb(c),k) returning * into a;
 return jsonb_build_object('id',a.id,'questions',q,'expires_at',a.expires_at);
end $$;
create function public.training_submit(p_tenant uuid,p_attempt uuid,p_answers jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare a public.training_attempts; c public.training_courses; v_score integer; cert uuid; award public.training_awards; d date=(now() at time zone 'Asia/Kolkata')::date; expiry date;
begin
 select * into a from public.training_attempts where tenant_id=p_tenant and id=p_attempt for update;
 if not found or auth.uid() is null or not (sdc_private.is_employee_self(p_tenant,a.employee_id) or sdc_private.is_trainer(p_tenant)) then raise exception 'Access denied' using errcode='42501'; end if;
 if a.submitted_at is not null then return jsonb_build_object('score',a.score,'passed',a.passed,'submitted_at',a.submitted_at); end if;
 if a.expires_at<now() then raise exception 'Assessment expired; start another attempt'; end if;
 if jsonb_typeof(p_answers)<>'object' then raise exception 'Answers must be an object'; end if;
 if (select count(*) from jsonb_object_keys(p_answers))<>(select count(*) from jsonb_object_keys(a.answer_key)) or exists(select 1 from jsonb_each(a.answer_key) k where not p_answers ? k.key) then raise exception 'Answer every question'; end if;
 select round(100.0*count(*) filter(where p_answers->key=value)/count(*)) into v_score from jsonb_each(a.answer_key);
 select * into c from jsonb_populate_record(null::public.training_courses,a.course_snapshot);
 update public.training_attempts set submitted_at=now(),submitted_answers=p_answers,score=v_score,passed=v_score>=c.pass_mark,row_version=row_version+1 where tenant_id=p_tenant and id=a.id;
 if v_score>=c.pass_mark then
 expiry=case when c.validity_months=0 then null else (d+make_interval(months=>c.validity_months))::date end;
 insert into public.employee_certificates(tenant_id,employee_id,course_title,certificate_number,issued_on,expires_on,status,provider,hours,notes) values(p_tenant,a.employee_id,c.title,'SDC-TR-'||upper(substr(a.id::text,1,8)),d,expiry,'passed','SDC Training',c.duration_hours+c.field_hours,'Assessment issued; immutable source retained in training awards') returning id into cert;
 insert into public.training_awards(tenant_id,employee_id,course_id,attempt_id,certificate_id,issued_on,expires_on) values(p_tenant,a.employee_id,c.id,a.id,cert,d,expiry) returning * into award;
 end if;
 return jsonb_build_object('score',v_score,'passed',v_score>=c.pass_mark,'award_id',award.id);
end $$;
create function public.training_revoke(p_tenant uuid,p_award uuid,p_reason text) returns void language plpgsql security definer set search_path='' as $$
declare a public.training_awards;
begin
 if auth.uid() is null or not sdc_private.is_trainer(p_tenant) then raise exception 'Access denied' using errcode='42501'; end if;
 if length(trim(p_reason))<5 then raise exception 'A reason is required'; end if;
 select * into a from public.training_awards where tenant_id=p_tenant and id=p_award for update;
 if not found then raise exception 'Certificate unavailable'; end if;
 update public.training_awards set revoked_at=now(),row_version=row_version+1 where tenant_id=p_tenant and id=a.id;
 update public.employee_certificates set status='revoked',notes=p_reason,row_version=row_version+1 where tenant_id=p_tenant and id=a.certificate_id;
end $$;
create function public.training_verify(p_token uuid) returns jsonb language sql stable security definer set search_path='' as $$
select jsonb_build_object('employee',e.full_name,'course',c.title,'issued_on',a.issued_on,'expires_on',a.expires_on,'status',case when a.revoked_at is not null or e.status='exited' then 'revoked' when a.expires_on<(now() at time zone 'Asia/Kolkata')::date then 'expired' else 'valid' end) from public.training_awards a join public.employees e on e.tenant_id=a.tenant_id and e.id=a.employee_id join public.training_courses c on c.tenant_id=a.tenant_id and c.id=a.course_id where a.token=p_token $$;
revoke all on function public.training_start(uuid,uuid),public.training_submit(uuid,uuid,jsonb),public.training_revoke(uuid,uuid,text),public.training_verify(uuid) from public,anon,authenticated;
grant execute on function public.training_start(uuid,uuid),public.training_submit(uuid,uuid,jsonb),public.training_revoke(uuid,uuid,text) to authenticated;
grant execute on function public.training_verify(uuid) to anon,authenticated;
create function public.training_people(p_tenant uuid,p_query text default '',p_offset integer default 0) returns jsonb language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or not sdc_private.is_member(p_tenant) then raise exception 'Access denied' using errcode='42501'; end if;
 return coalesce((select jsonb_agg(row_to_json(x)) from (select id,full_name,employee_code,category from public.employees e where tenant_id=p_tenant and deleted_at is null and status='active' and (sdc_private.is_trainer(p_tenant) or sdc_private.can_employee(p_tenant,e.id)) and (full_name ilike '%'||left(p_query,80)||'%' or employee_code ilike '%'||left(p_query,80)||'%') order by employee_code,id limit 50 offset greatest(0,least(p_offset,100000))) x),'[]'::jsonb);
end $$;
create function public.training_trainers(p_tenant uuid) returns jsonb language plpgsql security definer set search_path='' as $$ begin
 if auth.uid() is null or not sdc_private.is_trainer(p_tenant) then raise exception 'Access denied' using errcode='42501'; end if;
 return coalesce((select jsonb_agg(jsonb_build_object('id',id,'display_name',display_name)) from public.memberships where tenant_id=p_tenant and active and role in ('admin','hr_payroll','trainer')),'[]'::jsonb); end $$;
create function public.training_eligibility(p_tenant uuid,p_employee uuid,p_post uuid default null,p_on date default current_date) returns jsonb language plpgsql security definer set search_path='' as $$
declare e public.employees;
begin
 if auth.uid() is null or not (sdc_private.is_trainer(p_tenant) or sdc_private.can_employee(p_tenant,p_employee)) then raise exception 'Access denied' using errcode='42501'; end if;
 select * into e from public.employees where tenant_id=p_tenant and id=p_employee and deleted_at is null;
 if not found then raise exception 'Employee unavailable'; end if;
 if p_post is not null and not sdc_private.can_post(p_tenant,p_post) then raise exception 'Post access denied' using errcode='42501'; end if;
 return jsonb_build_object('active',e.status='active','missing',coalesce((select jsonb_agg(jsonb_build_object('course_id',c.id,'title',c.title,'enforcement',case when e.category=any(c.mandatory_for) then 'block' else r.enforcement end)) from public.training_courses c left join public.training_requirements r on r.tenant_id=c.tenant_id and r.course_id=c.id and r.post_id=p_post and r.deleted_at is null where c.tenant_id=p_tenant and c.deleted_at is null and (e.category=any(c.mandatory_for) or r.id is not null) and not exists(select 1 from public.training_awards a where a.tenant_id=p_tenant and a.employee_id=p_employee and a.course_id=c.id and a.revoked_at is null and a.deleted_at is null and a.issued_on<=p_on and (a.expires_on is null or a.expires_on>=p_on))),'[]'::jsonb));
end $$;
revoke all on function public.training_people(uuid,text,integer),public.training_trainers(uuid),public.training_eligibility(uuid,uuid,uuid,date) from public,anon,authenticated;
grant execute on function public.training_people(uuid,text,integer),public.training_trainers(uuid),public.training_eligibility(uuid,uuid,uuid,date) to authenticated;
