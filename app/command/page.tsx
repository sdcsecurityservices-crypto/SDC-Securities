import {requireChatGPTUser} from '@/app/chatgpt-auth';
import Command from './workspace';
import Control from '../control/control';
export const dynamic='force-dynamic';
export const metadata={title:'SDC Command | Operations centre',description:'A private demonstration of connected security operations.'};
export default async function Page(){if(process.env.SDC_RUNTIME!=='sites')return <Control/>;await requireChatGPTUser('/command');return <Command/>}
