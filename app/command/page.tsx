import {requireChatGPTUser} from '@/app/chatgpt-auth';
import Command from './workspace';
import Entry from './entry';
export const dynamic='force-dynamic';
export const metadata={title:'SDC Command | Operations centre',description:'A private demonstration of connected security operations.'};
// Outside the Sites demo runtime, /command is the website's entry point: it
// routes each person to their role's home screen or to sign-in.
export default async function Page(){if(process.env.SDC_RUNTIME!=='sites')return <Entry/>;await requireChatGPTUser('/command');return <Command/>}
