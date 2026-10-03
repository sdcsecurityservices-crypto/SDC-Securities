-- Explicitly fictional Training Academy data, only in the existing SDC-DEMO tenant.
-- Courses across industries (mandatory, industry, client-specific, refresher, leadership),
-- question banks, completed batches with attendance, assessments and certificates,
-- upcoming batches and post training requirements.
-- Safe to repeat: it stops if any demo course already exists.
do $$
declare
 t uuid; trainer uuid; cat jsonb; c jsonb; q jsonb; cid uuid; pre uuid[];
 used date[] = '{}'; day date; sid uuid; site uuid; emp uuid[]; e uuid; i integer; b integer; n integer;
 off integer; batches jsonb; course public.training_courses; enr uuid; att uuid; cert uuid;
 snap jsonb; akey jsonb; ans jsonb; score integer; tries integer; issued date; venue text; hrs integer; spec text;
 attempt_ok boolean; pr numeric; cap integer;
begin
 select id into t from public.tenants where code='SDC-DEMO' and is_demo;
 if t is null then raise exception 'Create the SDC-DEMO foundation first. This seed never writes to live tenants.'; end if;
 if exists(select 1 from public.training_courses where tenant_id=t and code='IND-PSARA') then raise notice 'Training seed already applied'; return; end if;
 select id into trainer from public.memberships where tenant_id=t and active and role in ('admin','hr_payroll','trainer') order by role='trainer' desc, created_at limit 1;
 if trainer is null then raise exception 'An active admin, HR or trainer membership is required'; end if;
 perform setseed(0.42);

 cat = $j$[
 {"c":"IND-PSARA","t":"PSARA basic security guard training","k":"induction","m":["full_time","contract","reliever","trainee"],"h":100,"f":60,"d":20,"x":40,"mo":"classroom","v":0,"p":70,"pp":60,
  "s":"Statutory induction under the Private Security Agencies (Regulation) Act, 2005: role of a private guard, access control, patrolling, fire and first response, crowd basics, report writing, legal powers and limits. 100 classroom hours and 60 field hours; ex-servicemen may take the 40-hour condensed course.",
  "co":"nontrainee","b":[760,720,680,640,600],
  "q":[["Under the PSARA framework, how many classroom hours does basic guard training require?",["40","60","100","160"],2,"100 classroom hours plus 60 field hours."],
       ["When on duty, a guard's photo ID card must be:",["Kept in the locker","Displayed and shown on request","Given to the supervisor","Carried only at night"],1,"Identification must be visible and produced on request."],
       ["The first step when you find an unknown person inside a restricted area is to:",["Ignore them","Politely challenge, verify identity and inform the control room","Lock them in a room","Take their phone"],1,"Challenge courteously, verify and escalate."],
       ["Which record is the legal day-by-day log of events at a post?",["Visitor badge","Occurrence book","Duty roster","Salary slip"],1,"The occurrence book is the post's official record."]]},
 {"c":"IND-FIRE","t":"Fire safety and evacuation","k":"induction","m":["full_time","contract","reliever","trainee"],"h":6,"f":2,"d":1,"x":0,"mo":"classroom","v":12,"p":70,"pp":60,
  "s":"Fire triangle, extinguisher classes and the PASS technique, alarm raising, evacuation routes and assembly points, mock drills.","pre":["IND-PSARA"],
  "co":"nontrainee","b":[405,352,210,120,45],"fut":[9,16],"futco":"renew:IND-FIRE",
  "q":[["Which extinguisher is suitable for a live electrical fire?",["Water","CO2","Foam only","Sand bucket only"],1,"CO2 does not conduct electricity."],
       ["PASS stands for:",["Pull, Aim, Squeeze, Sweep","Push, Alert, Spray, Stop","Pull, Alarm, Spray, Shut","Press, Aim, Stop, Sweep"],0,"Pull the pin, aim at the base, squeeze, sweep."],
       ["The national emergency number in India is:",["100","101","112","108"],2,"112 connects police, fire and ambulance."],
       ["During evacuation, lifts should be:",["Used for the elderly","Used by guards only","Avoided","Used after the alarm stops"],2,"Use stairs; lifts can fail or open on the fire floor."]]},
 {"c":"IND-FA","t":"First aid and CPR","k":"induction","m":["full_time","contract","reliever"],"h":8,"f":0,"d":1,"x":0,"mo":"classroom","v":24,"p":70,"pp":60,
  "s":"Scene safety, calling 108, adult CPR, recovery position, bleeding control, burns, fractures and seizures.","pre":["IND-PSARA"],
  "co":"nontrainee","b":[500,260,90],
  "q":[["The adult CPR compression to breath ratio is:",["15:2","30:2","5:1","10:1"],1,"30 compressions to 2 breaths."],
       ["Chest compressions for an adult should be at a rate of:",["60-80 per minute","100-120 per minute","140-160 per minute","As fast as possible"],1,"100-120 compressions per minute."],
       ["The first thing to check at any emergency scene is:",["The victim's wallet","Your own safety and the scene","The CCTV","The visitor log"],1,"Never become a second casualty."],
       ["Ambulance services in most Indian states can be reached on:",["108","101","1098","100"],0,"108 is the emergency ambulance number."]]},
 {"c":"IND-CONDUCT","t":"Code of conduct, POSH and anti-bribery","k":"induction","m":["full_time","contract","reliever","trainee"],"h":4,"f":0,"d":1,"x":0,"mo":"e_learning","v":12,"p":70,"pp":0,
  "s":"Uniform and grooming, courtesy, confidentiality, gifts and bribes, prevention of sexual harassment at the workplace, alcohol and substance policy, reporting concerns.","pre":["IND-PSARA"],
  "co":"nontrainee","b":[300,150,60],
  "q":[["A visitor offers you money to skip the entry check. You should:",["Accept a small amount","Refuse and report it","Ask for more","Ignore and let them in"],1,"Refuse and report every bribe attempt."],
       ["Who can you share site security details with?",["Friends","Social media","Only authorised persons","Any visitor who asks"],2,"Security information is confidential."],
       ["A colleague makes repeated unwelcome remarks to a staff member. You should:",["Laugh along","Report it through the POSH channel","Post it online","Do nothing"],1,"Report it to the Internal Committee or supervisor."],
       ["Reporting for duty under the influence of alcohol is:",["Fine on night shift","Misconduct","Allowed in small amounts","Allowed if off-site"],1,"It is serious misconduct."]]},
 {"c":"IND-EMERG","t":"Emergency response and SOS protocol","k":"induction","m":["full_time","reliever"],"h":4,"f":2,"d":1,"x":0,"mo":"field","v":12,"p":70,"pp":60,
  "s":"Using the SDC Guard SOS, bomb threat calls, suspicious objects, medical emergencies, lockdown and escalation to the control room.","pre":["IND-PSARA"],
  "co":"nontrainee","b":[330,100,20],
  "q":[["When you receive a bomb threat call, you should:",["Hang up quickly","Keep the caller talking and note details","Evacuate without telling anyone","Call back later"],1,"Gather every detail you can."],
       ["Near a suspicious object, avoid using:",["Your eyes","Radios and mobile phones","The stairs","Your notebook"],1,"Radio signals can trigger some devices."],
       ["The SOS button in the guard app:",["Sends your location and alert to the control room","Calls your family","Starts a selfie","Logs you out"],0,"It alerts the control room with your position."],
       ["After raising an alarm, your next step is to:",["Leave the site","Follow the site emergency plan and guide people","Take photos for social media","Wait for the shift to end"],1,"Follow the plan and help people to safety."]]},
 {"c":"IND-FIRE-KN","t":"Fire safety and evacuation (Kannada)","k":"induction","m":[],"h":6,"f":2,"d":1,"x":0,"mo":"classroom","v":12,"p":70,"pp":60,"l":"Kannada",
  "s":"The fire safety and evacuation course delivered in Kannada for Kannada-first guards.","pre":["IND-PSARA"],"co":"sample:18","b":[75],
  "q":[["Which extinguisher is used for an electrical fire?",["Water","CO2","Foam","Wet cloth"],1,""],["Evacuation should use:",["Lifts","Stairs","Windows","Any exit"],1,""],["The emergency number is:",["112","1098","139","155"],0,""]]},
 {"c":"IND-CONDUCT-HI","t":"Code of conduct and POSH (Hindi)","k":"induction","m":[],"h":4,"f":0,"d":1,"x":0,"mo":"e_learning","v":12,"p":60,"pp":0,"l":"Hindi",
  "s":"The conduct and POSH course delivered in Hindi.","pre":["IND-PSARA"],"co":"sample:14","b":[55],
  "q":[["A bribe offer should be:",["Accepted","Refused and reported","Shared","Ignored"],1,""],["Site security details are:",["Public","Confidential","For visitors","For social media"],1,""],["Harassment should be reported to:",["Nobody","The Internal Committee or supervisor","Visitors","Friends"],1,""]]},

 {"c":"HC-101","t":"Hospital security and patient dignity","k":"specialist","m":[],"h":8,"f":0,"d":1,"x":0,"mo":"on_site","v":24,"p":70,"pp":60,
  "s":"Healthcare: visiting hours, patient privacy, attendant passes, managing grieving families, restricted zones such as ICU, pharmacy and records.","pre":["IND-PSARA"],
  "co":"client:Northstar Healthcare","b":[160,70],"site":"Northstar Hospital",
  "q":[["A visitor asks which ward a patient is in. Without authorisation you should:",["Tell them","Refer them to the help desk","Check the records yourself","Guess"],1,"Patient information is confidential."],
       ["Attendant passes are mainly used to:",["Collect fees","Limit the number of people with each patient","Track parking","Count guards"],1,""],
       ["ICU and pharmacy are examples of:",["Public areas","Restricted zones","Parking zones","Waiting rooms"],1,""],
       ["When handling a grieving family, the best approach is:",["Strict and loud","Calm, respectful and patient","Ignore them","Call the police first"],1,""]]},
 {"c":"HC-102","t":"De-escalation in emergency departments","k":"specialist","m":[],"h":6,"f":0,"d":1,"x":0,"mo":"on_site","v":24,"p":70,"pp":60,
  "s":"Healthcare: recognising escalation, verbal de-escalation, safe distance, team response and protecting clinical staff.","pre":["IND-PSARA"],
  "co":"client:Northstar Healthcare","b":[95],"site":"Northstar Hospital","fut":[23],"futco":"client:Northstar Healthcare",
  "q":[["The first tool for an angry relative is:",["Force","Calm voice and listening","Handcuffs","Shouting back"],1,""],["Keep a safe distance of about:",["Touching distance","One to two arms' length","Ten metres","No distance"],1,""],["If violence is imminent you should:",["Act alone","Call for team support and protect staff","Walk away","Record a video"],1,""],["De-escalation aims to:",["Win the argument","Reduce tension and keep everyone safe","Remove the patient","Close the hospital"],1,""]]},
 {"c":"HC-103","t":"Infection control for security staff","k":"specialist","m":[],"h":3,"f":0,"d":1,"x":0,"mo":"e_learning","v":12,"p":60,"pp":0,
  "s":"Healthcare: hand hygiene, masks and gloves, isolation ward entry rules, spill reporting.","pre":["IND-PSARA"],"co":"client:Northstar Healthcare","b":[40],
  "q":[["Hand hygiene is required:",["Only at the end of shift","Before and after contact with patients or surfaces","Never","Only in winter"],1,""],["Entering an isolation ward requires:",["Nothing","The protective equipment set by the ward","A visitor pass only","A supervisor's phone"],1,""],["A blood spill should be:",["Wiped with your hand","Cordoned off and reported to housekeeping","Ignored","Covered with paper"],1,""]]},
 {"c":"HC-104","t":"Infant and child abduction response (Code Pink)","k":"specialist","m":[],"h":4,"f":2,"d":1,"x":0,"mo":"on_site","v":12,"p":70,"pp":60,
  "s":"Healthcare: maternity ward access, Code Pink announcements, exit lockdown and search, description handover.","pre":["IND-PSARA"],
  "co":"client:Northstar Healthcare","b":[30],"site":"Northstar Hospital","fut":[6],"futco":"client:Northstar Healthcare",
  "q":[["When Code Pink is announced, guards should first:",["Continue rounds","Secure all exits and watch for anyone carrying an infant or large bag","Go to the canteen","Call the media"],1,""],["Access to the maternity ward is:",["Open to all","Restricted to authorised people","Open at night","For guards only"],1,""],["A good suspect description includes:",["Only gender","Clothing, height, direction and items carried","Only their name","Nothing"],1,""],["The lockdown is lifted:",["When you are tired","Only on the hospital's all-clear","After ten minutes","When the shift ends"],1,""]]},

 {"c":"EDU-101","t":"Child safeguarding and POCSO awareness","k":"specialist","m":[],"h":6,"f":0,"d":1,"x":0,"mo":"classroom","v":12,"p":70,"pp":60,
  "s":"Education: child safeguarding, appropriate conduct with students, POCSO Act 2012 duty to report, handling disclosures.","pre":["IND-PSARA"],
  "co":"client:Oakridge Education","b":[180,60],
  "q":[["Under the POCSO Act, anyone who learns of a child sexual offence must:",["Keep it private","Report it to the police or the school authority","Ask the child to forget it","Post it online"],1,"Reporting is mandatory under the Act."],
       ["A guard should avoid:",["Being polite","Being alone with a student in a closed room","Watching the gate","Helping a lost child find staff"],1,""],
       ["If a child discloses abuse, you should:",["Interrogate them","Listen, reassure and report without promising secrecy","Ignore it","Call their friends"],1,""],
       ["The Childline number in India is:",["1098","101","112","108"],0,""]]},
 {"c":"EDU-102","t":"School gate and pickup protocol","k":"specialist","m":[],"h":3,"f":1,"d":1,"x":0,"mo":"on_site","v":12,"p":60,"pp":60,
  "s":"Education: authorised pickup lists, pickup cards, late pickups, traffic around the gate.","pre":["IND-PSARA"],"co":"sites:Oakridge School","b":[50],"site":"Oakridge School",
  "q":[["A child may leave with:",["Anyone who knows the name","Only an authorised person with a valid pickup card","A taxi driver","Any adult"],1,""],["An unknown adult insists on taking a child. You should:",["Allow it","Hold the child safely with staff and verify with the school","Call the child's friends","Ask the child"],1,""],["Late pickups should be:",["Left at the gate","Handed to the duty teacher","Sent home alone","Ignored"],1,""]]},
 {"c":"EDU-103","t":"Campus events and crowd safety","k":"specialist","m":[],"h":4,"f":2,"d":1,"x":0,"mo":"field","v":24,"p":60,"pp":60,
  "s":"Education: fests, convocations and sports days; entry flow, capacity, lost children and exits.","pre":["IND-PSARA"],"co":"sites:Oakridge College","b":[110],"site":"Oakridge College",
  "q":[["The biggest crowd risk at an exit is:",["Too many guards","A crush when people surge","Music","Weather only"],1,""],["Emergency exits during an event must be:",["Locked","Kept clear and staffed","Used for storage","Closed for VIPs"],1,""],["A lost child should be taken to:",["The gate","The designated help point","The car park","The stage"],1,""]]},

 {"c":"CORP-101","t":"Corporate access control and badge verification","k":"specialist","m":[],"h":4,"f":0,"d":1,"x":0,"mo":"classroom","v":24,"p":70,"pp":60,
  "s":"Corporate and tech parks: access cards, tailgating, visitor management systems, contractor passes, lost badges.","pre":["IND-PSARA"],
  "co":"sites:Horizon Tech Park|Horizon Business Centre","b":[200,85],
  "q":[["Tailgating means:",["Following an authorised person through a door without your own access","Parking badly","Late arrival","Using the stairs"],0,""],["A lost access card should be:",["Kept by the finder","Reported and deactivated","Shared","Ignored"],1,""],["A contractor without a valid pass should:",["Enter anyway","Wait while the host verifies and issues a pass","Use the back door","Leave a phone as deposit"],1,""],["Visitor badges must be returned:",["Never","At exit","Next week","Only if damaged"],1,""]]},
 {"c":"CORP-102","t":"Mailroom and suspicious package handling","k":"specialist","m":[],"h":3,"f":0,"d":1,"x":0,"mo":"classroom","v":24,"p":60,"pp":0,
  "s":"Corporate: signs of a suspicious package, isolation, no-touch policy, escalation.","pre":["IND-PSARA"],"co":"sites:Horizon Tech Park|Horizon Business Centre","b":[140],
  "q":[["A sign of a suspicious package is:",["A clear return address","Oily stains, wires or excessive tape","Company logo","Correct postage"],1,""],["If you find one you should:",["Open it","Not touch it, isolate the area and report","Shake it","Move it outside"],1,""],["Who decides when the area is safe?",["The guard","Police or bomb disposal","The recipient","The courier"],1,""]]},
 {"c":"CORP-103","t":"Executive protection basics","k":"specialist","m":[],"h":8,"f":0,"d":1,"x":0,"mo":"classroom","v":24,"p":70,"pp":60,
  "s":"Corporate: advance checks, movement planning, vehicle drills, discretion.","pre":["IND-PSARA"],"co":"sample:12","b":[230],
  "q":[["Advance work means:",["Arriving late","Checking routes and venues before the visit","Booking food","Taking photos"],1,""],["A protection officer should be:",["Loud","Discreet and observant","On the phone","In front of cameras"],1,""],["The principal's schedule is:",["Public","Confidential","Posted online","Shared with drivers only"],1,""],["During an incident the priority is to:",["Chase the attacker","Cover and evacuate the principal","Take photos","Call the media"],1,""]]},
 {"c":"CORP-104","t":"Data centre and server room protocol","k":"specialist","m":[],"h":3,"f":0,"d":1,"x":0,"mo":"on_site","v":12,"p":60,"pp":0,
  "s":"Corporate: two-person rule, media in and out, escorting vendors, environmental alarms.","pre":["IND-PSARA"],"co":"sites:Horizon Tech Park","b":[65],"site":"Horizon Tech Park",
  "q":[["A vendor in the server room must be:",["Left alone","Escorted at all times","Allowed in without ID","Given admin access"],1,""],["Storage media leaving the room needs:",["Nothing","A recorded authorisation","A smile","A photo"],1,""],["A temperature alarm should be:",["Silenced","Reported immediately to the facility team","Ignored at night","Unplugged"],1,""]]},

 {"c":"LOG-101","t":"Vehicle gate and document checks","k":"specialist","m":[],"h":4,"f":2,"d":1,"x":0,"mo":"field","v":24,"p":70,"pp":60,
  "s":"Logistics and warehousing: gate passes, delivery challans, invoice and vehicle number match, driver verification, in and out registers.","pre":["IND-PSARA"],
  "co":"sites:Horizon Logistics Hub","b":[190,80],"site":"Horizon Logistics Hub",
  "q":[["Before a truck leaves, the guard checks that:",["The driver is happy","Vehicle number, challan and gate pass match","The radio works","It is daytime"],1,""],["A material without a gate pass should:",["Leave","Be held and reported","Be split","Be photographed only"],1,""],["The in and out register records:",["Weather","Vehicle, driver, time, documents","Lunch orders","Salaries"],1,""],["A mismatch in quantity should be:",["Ignored","Stopped and escalated to the warehouse in-charge","Adjusted by the guard","Settled with the driver"],1,""]]},
 {"c":"LOG-102","t":"Dock, seal and cargo security","k":"specialist","m":[],"h":4,"f":2,"d":1,"x":0,"mo":"field","v":24,"p":70,"pp":60,
  "s":"Logistics: container seal numbers, dock door control, sealing after loading, tamper signs.","pre":["IND-PSARA"],"co":"sites:Horizon Logistics Hub","b":[125],"site":"Horizon Logistics Hub",
  "q":[["A container seal number should be:",["Guessed","Recorded and matched to documents","Removed","Painted over"],1,""],["A broken seal on arrival means:",["Normal","Possible tampering; report before unloading","Nothing","Faster unloading"],1,""],["Dock doors should be:",["Always open","Closed when not loading","Open at night","Left to drivers"],1,""],["Who can break a seal?",["Anyone","Only authorised staff at the right step","Drivers","Visitors"],1,""]]},
 {"c":"LOG-103","t":"Frisking and pilferage prevention","k":"specialist","m":[],"h":3,"f":1,"d":1,"x":0,"mo":"field","v":24,"p":60,"pp":60,
  "s":"Logistics and manufacturing: consent-based frisking, same-gender frisking, bag checks, documenting recoveries.","pre":["IND-PSARA"],"co":"sites:Horizon Logistics Hub","b":[70],
  "q":[["Frisking of a woman must be done by:",["Any guard","A female guard","The supervisor","Nobody"],1,""],["Recovered material should be:",["Kept","Documented and handed to the in-charge","Returned quietly","Sold"],1,""],["Frisking should be:",["Rough","Respectful and as per site policy","Optional for friends","Done in public with insults"],1,""]]},

 {"c":"MFG-101","t":"Industrial safety and PPE","k":"specialist","m":[],"h":6,"f":2,"d":1,"x":0,"mo":"field","v":12,"p":70,"pp":60,
  "s":"Manufacturing: PPE zones, machine guarding, forklift lanes, emergency stops, near-miss reporting.","pre":["IND-PSARA"],"co":"sample:20","b":[150],"fut":[30],"futco":"sample:16",
  "q":[["In a PPE zone, a visitor without safety shoes should:",["Enter quickly","Be stopped until PPE is issued","Walk on tiptoe","Sign a form and enter"],1,""],["Forklift lanes are for:",["Walking","Forklifts; pedestrians use marked walkways","Parking bikes","Storage"],1,""],["A near-miss should be:",["Forgotten","Reported","Hidden","Laughed at"],1,""],["An emergency stop button is used to:",["Start a machine","Stop a machine in danger","Call lunch","Reset the alarm"],1,""]]},
 {"c":"MFG-102","t":"Hazardous materials awareness","k":"specialist","m":[],"h":4,"f":0,"d":1,"x":0,"mo":"classroom","v":24,"p":60,"pp":0,
  "s":"Manufacturing: hazard symbols, safety data sheets, spill response, tanker entry rules.","pre":["IND-PSARA"],"co":"sample:14","b":[220],
  "q":[["A safety data sheet tells you:",["The price","Hazards and safe handling of a chemical","Shift timings","Visitor names"],1,""],["A chemical spill should be:",["Touched to check","Cordoned off and reported","Washed into drains","Ignored"],1,""],["Smoking near a flammables store is:",["Allowed","Prohibited","Fine at night","Fine outdoors"],1,""]]},
 {"c":"MFG-103","t":"Permit-to-work and lockout awareness","k":"specialist","m":[],"h":3,"f":0,"d":1,"x":0,"mo":"classroom","v":24,"p":60,"pp":0,
  "s":"Manufacturing: hot work permits, confined spaces, lockout-tagout, contractor control.","pre":["IND-PSARA"],"co":"sample:12","b":[100],
  "q":[["Welding in a plant usually needs:",["Nothing","A hot work permit","A visitor pass","A selfie"],1,""],["A lockout tag on a machine means:",["Use it","Do not operate; work in progress","It is new","It is for sale"],1,""],["Entry to a confined space requires:",["Courage","A permit and gas testing","A torch only","A friend"],1,""]]},

 {"c":"RET-101","t":"Shoplifting prevention and lawful handling","k":"specialist","m":[],"h":4,"f":2,"d":1,"x":0,"mo":"field","v":24,"p":70,"pp":60,
  "s":"Retail and malls: deterrence, observation, EAS alarms, lawful handling of a suspected shoplifter and police handover.","pre":["IND-PSARA"],"co":"sample:16","b":[170],
  "q":[["When the anti-theft gate alarms, you should:",["Accuse loudly","Politely request a receipt check","Block with force","Ignore it"],1,""],["A person caught committing theft must be handed to police:",["After a day","Without unnecessary delay","Never","After questioning by guards"],1,"A private person must hand over without unnecessary delay."],["Searching a customer's body forcibly is:",["Allowed","Not allowed","Allowed for small items","Allowed by any guard"],1,""],["The best tool against shoplifting is:",["Visible, attentive presence","Shouting","Locking doors","Guessing"],0,""]]},
 {"c":"RET-102","t":"Crowd and queue management","k":"specialist","m":[],"h":3,"f":1,"d":1,"x":0,"mo":"field","v":24,"p":60,"pp":60,
  "s":"Retail, malls and events: sale-day queues, barricades, capacity counts, calm communication.","pre":["IND-PSARA"],"co":"sample:16","b":[135],
  "q":[["Before a big sale, you should agree:",["Nothing","Maximum capacity and entry rate","Free gifts","Lunch breaks"],1,""],["Barricades help to:",["Block exits","Create orderly queues","Store goods","Hide guards"],1,""],["If a queue gets aggressive you should:",["Leave","Communicate calmly and call for support","Push back","Close the store without notice"],1,""]]},

 {"c":"HOS-101","t":"Hotel guest privacy and lobby security","k":"specialist","m":[],"h":4,"f":0,"d":1,"x":0,"mo":"classroom","v":24,"p":70,"pp":60,
  "s":"Hospitality: guest privacy, room number confidentiality, lobby observation, unattended baggage.","pre":["IND-PSARA"],"co":"sample:12","b":[250],
  "q":[["A caller asks for a guest's room number. You should:",["Give it","Never share it; transfer to the front desk","Spell it","Text it"],1,""],["Unattended baggage in the lobby should be:",["Moved to storage","Observed, owner sought and reported","Opened","Ignored"],1,""],["Guest privacy means:",["Talking about guests","Not discussing guests or their visitors","Taking photos","Sharing with staff"],1,""],["Lobby security should be:",["Hidden","Courteous and visible","Loud","Absent at night"],1,""]]},
 {"c":"HOS-102","t":"VIP and event movement","k":"specialist","m":[],"h":3,"f":1,"d":1,"x":0,"mo":"field","v":24,"p":60,"pp":60,
  "s":"Hospitality and events: banquet entry, VIP arrival routes, coordination with personal security teams.","pre":["IND-PSARA"],"co":"sample:10","b":[115],
  "q":[["A VIP arrival route should be:",["Announced on social media","Planned and kept confidential","Random","Through the kitchen always"],1,""],["When a VIP has a personal security team, hotel guards:",["Compete","Coordinate and support","Ignore them","Leave"],1,""],["Banquet entry is controlled by:",["Guessing","Guest list or invitation check","Dress only","Car type"],1,""]]},

 {"c":"BNK-101","t":"Bank branch and ATM security","k":"specialist","m":[],"h":4,"f":2,"d":1,"x":0,"mo":"field","v":12,"p":70,"pp":60,
  "s":"Banking: opening and closing drills, ATM vestibule checks, skimming devices, panic alarms, helmet and face-cover rules.","pre":["IND-PSARA"],"co":"sample:12","b":[205],
  "q":[["A loose device fixed on an ATM card slot may be:",["Normal","A skimmer; report and stop use","Decoration","A camera for the bank"],1,""],["Branch opening should involve:",["One person","At least two authorised people and a perimeter check","The guard alone","Customers"],1,""],["People with full face covers at bank entry should be:",["Allowed","Asked to uncover as per branch policy","Ignored","Refused service forever"],1,""],["The panic alarm is used:",["For testing at will","During a robbery or threat","For lunch","To call a cab"],1,""]]},
 {"c":"BNK-102","t":"Cash-in-transit escort awareness","k":"specialist","m":[],"h":3,"f":1,"d":1,"x":0,"mo":"field","v":12,"p":60,"pp":60,
  "s":"Banking: cash van routines, varying routes and times, pavement crossings, ambush response.","pre":["IND-PSARA"],"co":"sample:8","b":[90],
  "q":[["Cash van routes and times should be:",["Fixed every day","Varied and confidential","Posted online","Chosen by the driver alone"],1,""],["The riskiest moment is usually:",["Driving on highways","Crossing the pavement with cash","Parking at night","Refuelling"],1,""],["In an ambush, the priority is:",["Protect the cash at any cost","Protect life and raise the alarm","Chase the robbers","Take photos"],1,""]]},

 {"c":"RES-101","t":"Gated community security and visitor apps","k":"specialist","m":[],"h":3,"f":1,"d":1,"x":0,"mo":"on_site","v":24,"p":60,"pp":60,
  "s":"Residential: visitor approval apps, delivery handling, resident privacy, night patrols, lift and amenity checks.","pre":["IND-PSARA"],"co":"sample:16","b":[175],
  "q":[["A delivery agent without resident approval should:",["Go up","Wait at the gate until approved","Leave the parcel anywhere","Enter with a guard"],1,""],["Resident details are:",["Shared with visitors","Private","Posted at the gate","Given to vendors"],1,""],["Night patrol should include:",["Sleeping","Common areas, basements and fire exits","Only the gate","The guard room"],1,""]]},
 {"c":"RES-102","t":"Domestic staff and vendor verification","k":"specialist","m":[],"h":2,"f":0,"d":1,"x":0,"mo":"e_learning","v":24,"p":60,"pp":0,
  "s":"Residential: police verification status, ID passes for maids, drivers and vendors, register discipline.","pre":["IND-PSARA"],"co":"sample:12","b":[80],
  "q":[["Domestic staff entry should be checked against:",["Memory","Issued ID passes or the society register","Their phone","Nothing"],1,""],["A new vendor without ID should:",["Enter","Be verified with the resident first","Be sent home rudely","Enter with a deposit"],1,""],["Police verification of staff is arranged by:",["Guards alone","Residents or the society as per local rules","Visitors","Nobody"],1,""]]},

 {"c":"CON-101","t":"Construction site safety and material control","k":"specialist","m":[],"h":4,"f":2,"d":1,"x":0,"mo":"field","v":12,"p":70,"pp":60,
  "s":"Construction: helmet zones, scaffold areas, material inward and outward registers, night security of plant and stock.","pre":["IND-PSARA"],"co":"sample:14","b":[145],
  "q":[["Anyone entering a construction zone must wear:",["Sandals","A helmet and the required PPE","Formal shoes","Nothing special"],1,""],["Cement and steel going out need:",["A smile","An authorised outward pass","Nothing","The driver's word"],1,""],["At night, plant and machinery should be:",["Left unchecked","Checked on patrol and logged","Used by guards","Moved"],1,""],["Children near a site should be:",["Allowed to play","Kept away safely","Given tours","Ignored"],1,""]]},

 {"c":"FM-101","t":"Housekeeping chemical safety","k":"specialist","m":[],"h":3,"f":1,"d":1,"x":0,"mo":"classroom","v":24,"p":60,"pp":60,
  "s":"Facility services: dilution, labelling, never mixing chemicals, gloves and eye protection, wet floor signage.","co":"sample:20","b":[160,50],
  "q":[["Mixing bleach with acid cleaners is:",["Fine","Dangerous; never mix","Better cleaning","Needed weekly"],1,""],["A wet floor must have:",["Nothing","A caution sign","A guard","Music"],1,""],["Chemical bottles must be:",["Unlabelled","Labelled","Reused for water","Kept in pantry"],1,""]]},
 {"c":"FM-102","t":"Biomedical waste segregation","k":"specialist","m":[],"h":3,"f":1,"d":1,"x":0,"mo":"on_site","v":12,"p":70,"pp":60,
  "s":"Facility services in healthcare: colour-coded segregation under the Bio-Medical Waste Management Rules, 2016, sharps handling and spill kits.","co":"client:Northstar Healthcare","b":[85],"site":"Northstar South Care",
  "q":[["Used needles go into:",["Yellow bag","A white puncture-proof container","General bin","Blue bag"],1,""],["Soiled dressings and anatomical waste go into:",["Yellow bag","Red bag","General bin","White container"],0,""],["Contaminated recyclable plastics like tubing go into:",["Red bag","Yellow bag","Blue box","General bin"],0,""],["Broken glass vials go into:",["Blue box or container","Yellow bag","Red bag","General bin"],0,""]]},
 {"c":"FM-103","t":"Pantry and food hygiene","k":"specialist","m":[],"h":2,"f":0,"d":1,"x":0,"mo":"e_learning","v":24,"p":60,"pp":0,
  "s":"Facility services: personal hygiene, safe storage temperatures, cross-contamination, pest sightings.","co":"sample:12","b":[60],
  "q":[["Cooked and raw food should be:",["Stored together","Stored separately","Mixed","Left out"],1,""],["A pest sighting should be:",["Ignored","Reported for pest control","Hidden","Fed"],1,""],["Hand washing is needed:",["Never","Before handling food","Only weekly","After shift only"],1,""]]},

 {"c":"CL-NSH","t":"Northstar Healthcare site induction","k":"specialist","m":[],"h":4,"f":2,"d":1,"x":0,"mo":"on_site","v":12,"p":70,"pp":60,
  "s":"Client-specific: Northstar campuses, emergency codes used by the client, contacts, restricted zones, visiting policy and escalation matrix.","pre":["IND-PSARA"],
  "co":"client:Northstar Healthcare","b":[210,40],"site":"Northstar Hospital","fut":[13],"futco":"client:Northstar Healthcare",
  "q":[["At Northstar, visiting hours are enforced by:",["Any guard's choice","The client's visiting policy","Visitors","Doctors only"],1,""],["The client escalation matrix tells you:",["Lunch menu","Whom to call, in what order, for each incident","Parking rules","Salaries"],1,""],["Restricted zones at Northstar include:",["Cafeteria","ICU, pharmacy and records","Car park","Garden"],1,""],["Client-specific induction must be completed:",["After a year","Before working a post at this client","Never","Only by supervisors"],1,""]]},
 {"c":"CL-OAK","t":"Oakridge Education campus induction","k":"specialist","m":[],"h":3,"f":2,"d":1,"x":0,"mo":"on_site","v":12,"p":70,"pp":60,
  "s":"Client-specific: Oakridge school and college layouts, timings, staff contacts, student ID rules, safeguarding lead and incident routes.","pre":["IND-PSARA"],
  "co":"client:Oakridge Education","b":[190,35],"site":"Oakridge College",
  "q":[["The Oakridge safeguarding lead should be informed of:",["Lunch","Any child safety concern","Parking","Weather"],1,""],["Students must carry:",["Phones","Their Oakridge ID card","Cash","Nothing"],1,""],["Outsiders on campus need:",["Nothing","A visitor pass approved by the office","A bike","A friend inside"],1,""],["Client-specific induction is required:",["Before working an Oakridge post","After a month","Only for supervisors","Never"],0,""]]},
 {"c":"CL-HZW","t":"Horizon Workspaces tenant access protocol","k":"specialist","m":[],"h":3,"f":1,"d":1,"x":0,"mo":"on_site","v":12,"p":70,"pp":60,
  "s":"Client-specific: Horizon tenant companies, access card types, after-hours access approvals, loading bay bookings.","pre":["IND-PSARA"],
  "co":"sites:Horizon Tech Park|Horizon Business Centre","b":[185,30],"site":"Horizon Tech Park",
  "q":[["After-hours access at Horizon needs:",["Nothing","A tenant approval logged with security","A smile","A phone call from anyone"],1,""],["Loading bay use must be:",["Unplanned","Booked in advance","Free for all","Weekends only"],1,""],["Different access card colours indicate:",["Fashion","Access level or holder type","Floor number only","Nothing"],1,""],["This induction is required:",["Before working a Horizon post","Never","After a year","Only at night"],0,""]]},
 {"c":"CL-HLH","t":"Horizon Logistics Hub dock procedure","k":"specialist","m":[],"h":3,"f":2,"d":1,"x":0,"mo":"on_site","v":12,"p":70,"pp":60,
  "s":"Client-specific: hub layout, dock numbering, carrier list, seal register format, night lock-up and escalation.","pre":["IND-PSARA"],
  "co":"sites:Horizon Logistics Hub","b":[175,25],"site":"Horizon Logistics Hub",
  "q":[["At the hub, seal numbers are logged in:",["A notebook","The hub seal register","WhatsApp","Memory"],1,""],["Unlisted carriers should be:",["Allowed","Held until the hub in-charge approves","Turned away rudely","Waved through at night"],1,""],["Night lock-up includes:",["Only the gate","All dock doors and a recorded check","Nothing","The canteen only"],1,""],["This induction is required:",["Before working a hub post","After a year","Never","Only for drivers"],0,""]]},
 {"c":"CL-SDU","t":"SDUAHER medical college campus induction","k":"specialist","m":[],"h":3,"f":2,"d":1,"x":0,"mo":"on_site","v":12,"p":70,"pp":60,
  "s":"Client-specific: medical college and teaching hospital campus layout, hostel rules, examination-day security, anatomy and records restricted areas.","pre":["IND-PSARA"],
  "co":"none","b":[],"site":"Medical College","fut":[20],"futco":"sample:15",
  "q":[["Hostel entry after hours requires:",["Nothing","Warden approval as per campus rules","A friend","A taxi bill"],1,""],["On examination days, guards should:",["Allow everyone","Control access to exam halls as instructed","Leave early","Collect papers"],1,""],["Anatomy and records areas are:",["Public","Restricted","For visitors","For vendors"],1,""],["This induction is completed:",["Before working a campus post","Never","After a year","Only by supervisors"],0,""]]},

 {"c":"REF-LAW","t":"Legal powers refresher: private defence and arrest","k":"refresher","m":[],"h":3,"f":0,"d":1,"x":0,"mo":"classroom","v":12,"p":70,"pp":0,
  "s":"Refresher: right of private defence under the Bharatiya Nyaya Sanhita, arrest by a private person under the Bharatiya Nagarik Suraksha Sanhita, use of reasonable force, handing over to police.","pre":["IND-PSARA"],
  "co":"nontrainee","b":[250,130],"fut":[27],"futco":"sample:24",
  "q":[["The right of private defence allows:",["Revenge","Reasonable force to protect body or property","Punishing offenders","Unlimited force"],1,""],["After a private person arrests someone, they must:",["Keep them overnight","Hand them to police without unnecessary delay","Release them quietly","Take their phone"],1,""],["Force used must be:",["Maximum","Reasonable and proportionate","Hidden","Recorded on social media"],1,""],["The law that replaced the Indian Penal Code is:",["Bharatiya Nyaya Sanhita","Factories Act","PSARA","Motor Vehicles Act"],0,""]]},
 {"c":"REF-RPT","t":"Occurrence book and report writing refresher","k":"refresher","m":[],"h":2,"f":0,"d":1,"x":0,"mo":"e_learning","v":12,"p":60,"pp":0,
  "s":"Refresher: factual reporting, who-what-when-where-how, no erasing, handover notes and incident reports in the guard app.","pre":["IND-PSARA"],"co":"nontrainee","b":[180,70],
  "q":[["A good report is:",["Opinionated","Factual and specific","Short and vague","Written next week"],1,""],["Mistakes in the occurrence book should be:",["Erased","Struck through once and initialled","Torn out","Covered with whitener"],1,""],["Incident times should be:",["Approximate","Exact","Left blank","Guessed later"],1,""]]},
 {"c":"REF-DRILL","t":"Mock drill and evacuation refresher","k":"refresher","m":[],"h":2,"f":2,"d":1,"x":0,"mo":"field","v":6,"p":60,"pp":60,
  "s":"Refresher: quarterly site mock drills, headcounts at assembly points, sweeping floors, drill debriefs.","pre":["IND-PSARA"],"co":"sample:40","b":[150,20],"fut":[34],"futco":"sample:20",
  "q":[["At the assembly point, guards help with:",["Snacks","Headcount","Selfies","Parking"],1,""],["Floor sweeping means:",["Cleaning","Checking every room is empty","Mopping","Closing windows only"],1,""],["After a drill, the team should:",["Go home","Debrief and record improvements","Delete records","Repeat immediately"],1,""]]},
 {"c":"REF-SERV","t":"Customer service and etiquette refresher","k":"refresher","m":[],"h":2,"f":0,"d":1,"x":0,"mo":"e_learning","v":12,"p":60,"pp":0,
  "s":"Refresher: greeting, phone etiquette, handling complaints, assisting the elderly and differently-abled visitors.","pre":["IND-PSARA"],"co":"sample:50","b":[95],
  "q":[["A visitor complains loudly. You should:",["Argue","Listen, stay calm and help or escalate","Walk away","Laugh"],1,""],["Answering the phone at a post starts with:",["Hello who?","Site name, your name and a greeting","Silence","A question"],1,""],["An elderly visitor needs help. You should:",["Ignore","Offer assistance politely","Ask them to hurry","Call security"],1,""]]},

 {"c":"LDR-101","t":"Shift supervisor leadership","k":"leadership","m":[],"h":8,"f":0,"d":1,"x":0,"mo":"classroom","v":36,"p":70,"pp":60,
  "s":"Leadership: briefing and debriefing, post checks, discipline and fairness, coaching, handling relievers, escalation.","pre":["IND-PSARA"],"co":"lead","b":[240,60],
  "q":[["A shift briefing should cover:",["Gossip","Post orders, risks and changes since last shift","Salaries","Nothing"],1,""],["When a guard is absent, the supervisor should:",["Leave the post empty","Arrange a reliever and record it","Close the site","Wait"],1,""],["Feedback is best given:",["Publicly and angrily","Privately, specifically and promptly","Never","Through rumours"],1,""],["Post checks should be:",["Announced and fixed","Regular and varied","Yearly","Skipped at night"],1,""]]},
 {"c":"LDR-102","t":"Control room and CCTV operations","k":"leadership","m":[],"h":6,"f":2,"d":1,"x":0,"mo":"on_site","v":24,"p":70,"pp":60,
  "s":"Leadership: monitoring discipline, camera call-ups, SOS handling in SDC Command, evidence export, privacy and consent rules for CCTV access.","pre":["IND-PSARA"],"co":"lead","b":[155],"site":"Horizon Business Centre",
  "q":[["CCTV footage may be shared:",["With anyone who asks","Only as per policy and client consent","On social media","With the press"],1,""],["When an SOS arrives, the operator first:",["Finishes tea","Acknowledges and locates the guard, then dispatches help","Ignores it","Calls the client for permission"],1,""],["Operator fatigue is reduced by:",["Longer shifts","Regular screen breaks and rotation","Dim lights","Music"],1,""],["Exported evidence must be:",["Edited","Logged with time and chain of custody","Deleted later","Compressed"],1,""]]},
 {"c":"LDR-103","t":"Incident investigation and root cause","k":"leadership","m":[],"h":6,"f":0,"d":1,"x":0,"mo":"classroom","v":36,"p":70,"pp":0,
  "s":"Leadership: preserving the scene, statements, timelines, five whys, corrective actions and client reporting.","pre":["IND-PSARA"],"co":"lead","b":[120],
  "q":[["The first step after a serious incident is to:",["Clean up","Make safe and preserve the scene","Post online","Blame someone"],1,""],["A witness statement should be taken:",["Weeks later","As soon as possible, in the witness's words","By the accused","Never"],1,""],["Five whys helps find:",["The guilty person","The root cause","The weather","Overtime"],1,""],["A corrective action should be:",["Vague","Specific, owned and dated","Secret","Optional"],1,""]]},
 {"c":"LDR-104","t":"Train the trainer","k":"leadership","m":[],"h":16,"f":0,"d":2,"x":0,"mo":"classroom","v":36,"p":70,"pp":70,
  "s":"Leadership: adult learning, lesson plans, demonstrations, practical evaluation and fair assessment for in-house SDC trainers.","pre":["IND-PSARA","LDR-101"],"co":"none","b":[],"fut":[41],"futco":"lead",
  "q":[["Adults learn best when:",["Lectured for hours","They practise and relate it to their work","Tested first","Kept silent"],1,""],["A practical evaluation should use:",["Feelings","A clear checklist","Friendship","Attendance only"],1,""],["A lesson plan states:",["The menu","Objectives, content, method and timing","Salaries","Nothing"],1,""],["Fair assessment means:",["Same standard for everyone","Easier for friends","Random marks","No marks"],0,""]]}
 ]$j$::jsonb;

 -- Courses and question banks.
 for c in select * from jsonb_array_elements(cat) loop
  pre = '{}';
  if c ? 'pre' then
   select coalesce(array_agg(x.id),'{}') into pre from public.training_courses x where x.tenant_id=t and x.deleted_at is null and x.code in (select jsonb_array_elements_text(c->'pre'));
  end if;
  insert into public.training_courses(tenant_id,code,title,category,mandatory_for,duration_hours,field_hours,working_days,condensed_hours,mode,validity_months,pass_mark,practical_pass,question_count,max_attempts,language,syllabus,prerequisites,reviewed)
  values(t,c->>'c',c->>'t',c->>'k',array(select jsonb_array_elements_text(c->'m')),(c->>'h')::int,(c->>'f')::int,(c->>'d')::int,(c->>'x')::int,c->>'mo',(c->>'v')::int,(c->>'p')::int,(c->>'pp')::int,
   jsonb_array_length(c->'q'),3,coalesce(c->>'l','English'),c->>'s',pre,true) returning id into cid;
  for q in select * from jsonb_array_elements(c->'q') loop
   insert into public.training_questions(tenant_id,course_id,prompt,options,correct_index,explanation) values(t,cid,q->>0,q->1,(q->>2)::int,coalesce(q->>3,''));
  end loop;
 end loop;

 -- Completed and upcoming batches.
 for c in select * from jsonb_array_elements(cat) loop
  select * into course from public.training_courses where tenant_id=t and code=c->>'c' and deleted_at is null;
  hrs = course.duration_hours + course.field_hours;
  site = null; venue = 'SDC Training Centre, Bengaluru';
  if c ? 'site' then
   select id into site from public.sites where tenant_id=t and name=c->>'site';
   if site is not null then venue = (c->>'site') || ' (on site)'; end if;
  end if;

  for b in 0..1 loop
   -- b=0: completed batches from "b"; b=1: upcoming batches from "fut".
   batches = case when b=0 then coalesce(c->'b','[]') else coalesce(c->'fut','[]') end;
   n = jsonb_array_length(batches);
   if n=0 then continue; end if;
   spec = case when b=0 then c->>'co' else coalesce(c->>'futco',c->>'co') end;
   if spec='none' then continue; end if;

   -- Cohort: active employees who match the spec, in a stable shuffled order.
   select array_agg(x.id order by md5(x.employee_code||course.code||b::text)) into emp from (
    select distinct e.id, e.employee_code from public.employees e
    left join public.grades g on g.tenant_id=e.tenant_id and g.id=e.grade_id
    where e.tenant_id=t and e.deleted_at is null and e.status='active' and e.category<>'trainee'
     and case
      when spec in ('nontrainee') then true
      when spec='lead' then g.code in ('SUP','HEAD')
      when spec like 'client:%' or spec like 'sites:%' then exists(
        select 1 from public.employee_postings p join public.sites s on s.tenant_id=p.tenant_id and s.id=p.site_id
        join public.clients cl on cl.tenant_id=s.tenant_id and cl.id=s.client_id
        where p.tenant_id=t and p.employee_id=e.id and p.deleted_at is null and p.starts_on<=current_date and (p.ends_on is null or p.ends_on>=current_date)
         and ((spec like 'client:%' and cl.name=substr(spec,8)) or (spec like 'sites:%' and s.name=any(string_to_array(substr(spec,7),'|')))))
      when spec like 'renew:%' then exists(
        select 1 from public.training_awards a join public.training_courses rc on rc.tenant_id=a.tenant_id and rc.id=a.course_id
        where a.tenant_id=t and a.employee_id=e.id and rc.code=substr(spec,7) and a.revoked_at is null and a.expires_on < current_date+45)
        and not exists(
        select 1 from public.training_awards a join public.training_courses rc on rc.tenant_id=a.tenant_id and rc.id=a.course_id
        where a.tenant_id=t and a.employee_id=e.id and rc.code=substr(spec,7) and a.revoked_at is null and (a.expires_on is null or a.expires_on >= current_date+45))
      else true end) x;
   if emp is null then continue; end if;
   if spec like 'sample:%' then emp = emp[1:least(array_length(emp,1),split_part(spec,':',2)::int)]; end if;

   for i in 0..n-1 loop
    off = (batches->>i)::int;
    cap = ceil(array_length(emp,1)::numeric/n)::int + 5;
    -- A free calendar day (no Sundays) so no employee has overlapping sessions.
    if course.code='IND-PSARA' then
     day = current_date - off;
    else
     day = case when b=0 then current_date - off else current_date + off end;
     while day = any(used) or extract(isodow from day)=7 loop day = day + case when b=0 then -1 else 1 end; end loop;
     used = used || day;
    end if;

    insert into public.training_sessions(tenant_id,course_id,title,trainer_id,site_id,venue,starts_at,ends_at,capacity,status)
    values(t,course.id,
     case when b=0 then course.title||' · Batch '||to_char(day,'Mon YYYY') else course.title||' · '||case when spec like 'renew:%' then 'Renewal batch' else 'Upcoming batch' end||' '||to_char(day,'DD Mon') end,
     trainer,site,venue,
     (day + time '09:00') at time zone 'Asia/Kolkata',
     case when course.code='IND-PSARA' then ((day + 27) + time '17:30') at time zone 'Asia/Kolkata' else ((day + time '09:00') at time zone 'Asia/Kolkata') + make_interval(hours=>least(hrs,9)) end,
     greatest(cap,20), case when b=0 then 'completed' else 'scheduled' end)
    returning id into sid;

    foreach e in array emp[(i*ceil(array_length(emp,1)::numeric/n))::int+1 : ((i+1)*ceil(array_length(emp,1)::numeric/n))::int] loop
     -- Skip anyone missing a valid prerequisite on the session date.
     if exists(select 1 from unnest(course.prerequisites) p where not exists(
       select 1 from public.training_awards a where a.tenant_id=t and a.employee_id=e and a.course_id=p and a.revoked_at is null and a.issued_on<=day and (a.expires_on is null or a.expires_on>=day))) then continue; end if;
     if b=1 then
      insert into public.training_enrollments(tenant_id,employee_id,session_id) values(t,e,sid);
      continue;
     end if;
     if random() < 0.03 then
      insert into public.training_enrollments(tenant_id,employee_id,session_id,attendance,practical_notes) values(t,e,sid,'absent','Absent on the batch day; rebook.');
      continue;
     end if;
     insert into public.training_enrollments(tenant_id,employee_id,session_id,attendance,hours_completed,practical_score,practical_notes)
     values(t,e,sid,'present',hrs,case when course.practical_pass>0 then 62+floor(random()*36)::int else null end,
      case when random()<0.15 then 'Strong practical demonstration.' else '' end)
     returning id into enr;

     -- Assessment: most pass first time, a few need a second attempt, a very few fail twice.
     select jsonb_agg(jsonb_build_object('id',id,'prompt',prompt,'options',options)), jsonb_object_agg(id::text,correct_index) into snap, akey
      from public.training_questions where tenant_id=t and course_id=course.id and deleted_at is null;
     attempt_ok = false; tries = 0;
     while not attempt_ok and tries < 2 loop
      tries = tries + 1;
      pr = case when tries=1 and random()<0.08 then 0.35 else 0.93 end;
      select jsonb_object_agg(k.key, case when random() < pr then k.value else to_jsonb(((k.value::text)::int+1) % 3) end)
       into ans from jsonb_each(akey) k;
      select round(100.0*count(*) filter(where ans->k.key=k.value)/count(*)) into score from jsonb_each(akey) k;
      insert into public.training_attempts(tenant_id,employee_id,course_id,enrollment_id,question_snapshot,course_snapshot,answer_key,submitted_answers,score,passed,expires_at,submitted_at)
      values(t,e,course.id,enr,snap,to_jsonb(course),akey,ans,score,score>=course.pass_mark,
       ((day + time '16:00') at time zone 'Asia/Kolkata') + make_interval(mins=>60*tries),
       ((day + time '16:00') at time zone 'Asia/Kolkata') + make_interval(mins=>40*tries))
      returning id into att;
      attempt_ok = score >= course.pass_mark;
     end loop;
     if not attempt_ok then continue; end if;

     issued = case when course.code='IND-PSARA' then day + 27 else day end;
     insert into public.employee_certificates(tenant_id,employee_id,course_title,certificate_number,issued_on,expires_on,status,provider,hours,notes)
     values(t,e,course.title,'SDC-TR-'||upper(substr(att::text,1,8)),issued,
      case when course.validity_months=0 then null else (issued + make_interval(months=>course.validity_months))::date end,
      'passed','SDC Training Academy',hrs,'Demonstration record; issued through the Training Academy')
     returning id into cert;
     insert into public.training_awards(tenant_id,employee_id,course_id,attempt_id,certificate_id,issued_on,expires_on)
     values(t,e,course.id,att,cert,issued,case when course.validity_months=0 then null else (issued + make_interval(months=>course.validity_months))::date end);
    end loop;
   end loop;
  end loop;
 end loop;

 -- Trainees: a PSARA batch in progress (started ten days ago).
 select * into course from public.training_courses where tenant_id=t and code='IND-PSARA';
 insert into public.training_sessions(tenant_id,course_id,title,trainer_id,venue,starts_at,ends_at,capacity,status)
 values(t,course.id,course.title||' · Trainee batch '||to_char(current_date-10,'Mon YYYY'),trainer,'SDC Training Centre, Bengaluru',
  ((current_date-10) + time '09:00') at time zone 'Asia/Kolkata',((current_date+17) + time '17:30') at time zone 'Asia/Kolkata',40,'scheduled')
 returning id into sid;
 insert into public.training_enrollments(tenant_id,employee_id,session_id,attendance,hours_completed)
 select t,id,sid,'present',56 from public.employees where tenant_id=t and deleted_at is null and status='active' and category='trainee';

 -- Post requirements: what each client's posts need before rostering.
 insert into public.training_requirements(tenant_id,post_id,course_id,enforcement)
 select t,p.id,rc.id,r.enforcement from public.posts p
 join public.sites s on s.tenant_id=p.tenant_id and s.id=p.site_id
 join public.clients cl on cl.tenant_id=s.tenant_id and cl.id=s.client_id
 join (values
  ('Northstar Healthcare',null,null,'CL-NSH','block'),('Northstar Healthcare',null,null,'HC-101','block'),('Northstar Healthcare',null,'Main entrance','HC-102','warn'),
  ('Oakridge Education',null,null,'CL-OAK','block'),('Oakridge Education',null,null,'EDU-101','block'),('Oakridge Education','Oakridge School','Main entrance','EDU-102','block'),
  ('Horizon Workspaces','Horizon Tech Park',null,'CL-HZW','block'),('Horizon Workspaces','Horizon Business Centre',null,'CL-HZW','block'),
  ('Horizon Workspaces','Horizon Tech Park','Visitor reception','CORP-101','warn'),('Horizon Workspaces','Horizon Business Centre','Visitor reception','CORP-101','warn'),
  ('Horizon Workspaces','Horizon Logistics Hub',null,'CL-HLH','block'),('Horizon Workspaces','Horizon Logistics Hub','Service gate','LOG-101','block'),('Horizon Workspaces','Horizon Logistics Hub','Perimeter patrol','LOG-102','warn'),
  (null,null,'Control room','LDR-102','warn')
 ) as r(client,site,post,code,enforcement)
  on (r.client is null or r.client=cl.name) and (r.site is null or r.site=s.name) and (r.post is null or r.post=p.name)
 join public.training_courses rc on rc.tenant_id=t and rc.code=r.code
 where p.tenant_id=t and p.deleted_at is null
 on conflict do nothing;
end $$;
