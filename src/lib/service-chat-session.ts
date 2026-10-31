import {createHmac,randomUUID,timingSafeEqual} from 'node:crypto';

const sign=(key:string,value:string)=>createHmac('sha256',key).update(value).digest('hex');
export const chatCookieName='__Host-agency_chat';
export function chatIdentity(cookie:string|null,key:string,now=Date.now()) {
  const candidate=cookie?.split(';').map(part=>part.trim()).find(part=>part.startsWith(`${chatCookieName}=`))?.slice(chatCookieName.length+1)??'';
  const match=/^(\d{13})\.([a-f0-9-]{36})\.([a-f0-9]{64})$/.exec(candidate);
  if(match&&Number(match[1])<=now&&now-Number(match[1])<1_800_000){
    const expected=sign(key,`${match[1]}.${match[2]}`);
    if(timingSafeEqual(Buffer.from(expected),Buffer.from(match[3])))return {token:candidate,hash:sign(key,`session:${candidate}`),fresh:false};
  }
  const value=`${now}.${randomUUID()}`;const token=`${value}.${sign(key,value)}`;
  return {token,hash:sign(key,`session:${token}`),fresh:true};
}
export function chatNetworkHash(network:string,key:string,now=new Date()) {
  return sign(key,`network:${now.toISOString().slice(0,10)}:${network}`);
}
