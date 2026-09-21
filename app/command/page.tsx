import {requireChatGPTUser} from '@/app/chatgpt-auth';
import Command from './workspace';
import Foundation from '../workspace/workspace';
export const dynamic='force-dynamic';
export const metadata={title:'SDC Command | Operations centre',description:'A private demonstration of connected security operations.'};
export default async function Page(){if(process.env.SDC_RUNTIME!=='sites')return <Foundation/>;await requireChatGPTUser('/command');return <Command/>}
