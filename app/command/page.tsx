import {requireChatGPTUser} from '@/app/chatgpt-auth';
import Command from './workspace';
export const dynamic='force-dynamic';
export const metadata={title:'SDC Command | Operations centre',description:'A private demonstration of connected security operations.'};
export default async function Page(){await requireChatGPTUser('/command');return <Command/>}
