import {it,expect} from 'vitest';
import {chatCookieName,chatIdentity,chatNetworkHash} from '../../src/lib/service-chat-session';
const key='private-test-key'.repeat(3),now=1_792_368_000_000;
it('accepts a signed fresh cookie but rotates expired and forged identities',()=>{
  const first=chatIdentity(null,key,now);
  expect(chatIdentity(`${chatCookieName}=${first.token}`,key,now+1)).toMatchObject({hash:first.hash,fresh:false});
  expect(chatIdentity(`${chatCookieName}=${first.token}0`,key,now+1).fresh).toBe(true);
  expect(chatIdentity(`${chatCookieName}=${first.token}`,key,now+1_800_000).fresh).toBe(true);
  expect(chatIdentity(`${chatCookieName}=${first.token}`,key,now-1).fresh).toBe(true);
});
it('does not persist a raw network address and rotates network hashes by UTC date',()=>{
  const value=chatNetworkHash('192.0.2.1',key,new Date('2026-10-19T00:00:00Z'));
  expect(value).toMatch(/^[a-f0-9]{64}$/);expect(value).not.toBe(chatNetworkHash('192.0.2.1',key,new Date('2026-10-20T00:00:00Z')));
});
