import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
const mock=vi.hoisted(()=>({getUser:vi.fn(),updateUserById:vi.fn(),createUser:vi.fn(),deleteUser:vi.fn(),from:vi.fn(),rpc:vi.fn()}));
vi.mock('@supabase/supabase-js',()=>({createClient:()=>({auth:{getUser:mock.getUser,admin:{updateUserById:mock.updateUserById,createUser:mock.createUser,deleteUser:mock.deleteUser}},from:mock.from,rpc:mock.rpc})}));
vi.mock('../lib/apiSecurity',async()=>{const actual=await vi.importActual<object>('../lib/apiSecurity');return {...actual,checkRateLimit:()=>null};});
import {POST as selectOrg} from './select-org/route';
import {POST as invite} from './invite-user/route';
const org='00000000-0000-4000-8000-000000000001',branch='00000000-0000-4000-8000-000000000011';
const requester={id:'actor',app_metadata:{roles:['Firma Yöneticisi']},user_metadata:{roles:['Firma Yöneticisi']}};
function result(data: unknown,error: unknown=null){const chain: Record<string,unknown>={};for(const key of ['select','eq','single','maybeSingle'])chain[key]=()=>chain;chain.then=(resolve:(v:unknown)=>unknown)=>Promise.resolve({data,error}).then(resolve);return chain;}
function req(body: unknown,token=true){return new NextRequest('http://localhost/api/test',{method:'POST',headers:{'content-type':'application/json',...(token?{authorization:'Bearer valid'}:{})},body:JSON.stringify(body)});}
const body={orgId:org,branchId:branch,roles:['Sekreter'],email:'new@example.invalid',password:'a-long-password',firstName:'New',lastName:'User'};
beforeEach(()=>{
 vi.clearAllMocks();process.env.NEXT_PUBLIC_SUPABASE_URL='https://example.supabase.co';process.env.SUPABASE_SERVICE_ROLE_KEY='test-only';
 mock.getUser.mockResolvedValue({data:{user:requester},error:null});
 mock.updateUserById.mockResolvedValue({error:null});
 mock.createUser.mockResolvedValue({data:{user:{id:'new'}},error:null});mock.deleteUser.mockResolvedValue({error:null});
 mock.from.mockImplementation(t=>result(t==='memberships'?{roles:['Firma Yöneticisi'],branch_id:branch}:t==='organizations'?{subscription_status:'active',plan_type:'pro'}:{id:branch}));
 mock.rpc.mockResolvedValue({data:{id:'membership',joined_at:'2026-09-07T00:00:00Z'},error:null});
});
describe('select-org authority boundary',()=>{
 it('requires bearer session',async()=>{expect((await selectOrg(req({orgId:org},false))).status).toBe(401);});
 it('rejects missing membership even if metadata says manager',async()=>{mock.from.mockReturnValue(result(null));expect((await selectOrg(req({orgId:org}))).status).toBe(403);expect(mock.updateUserById).not.toHaveBeenCalled();});
 it('rejects branchless employee',async()=>{mock.from.mockReturnValue(result({roles:['Sekreter'],branch_id:null}));expect((await selectOrg(req({orgId:org}))).status).toBe(403);});
 it('refreshes org, branch and roles together',async()=>{expect((await selectOrg(req({orgId:org}))).status).toBe(200);expect(mock.updateUserById).toHaveBeenCalledWith('actor',{app_metadata:{organization_id:org,branch_id:branch,roles:['Firma Yöneticisi']}});});
 it('denies suspended tenant',async()=>{mock.from.mockImplementation(t=>result(t==='memberships'?{roles:['Firma Yöneticisi'],branch_id:branch}:{subscription_status:'suspended'}));expect((await selectOrg(req({orgId:org}))).status).toBe(403);});
});
describe('invite-user tenant boundary',()=>{
 it('rejects unsupported role before Auth mutation',async()=>{expect((await invite(req({...body,roles:['superadmin']}))).status).toBe(400);expect(mock.createUser).not.toHaveBeenCalled();});
 it('ignores self-editable metadata permissions',async()=>{mock.from.mockReturnValue(result({roles:['Sekreter']}));expect((await invite(req(body))).status).toBe(403);expect(mock.createUser).not.toHaveBeenCalled();});
 it('rejects foreign or missing branch',async()=>{mock.from.mockImplementation(t=>result(t==='memberships'?{roles:['Firma Yöneticisi']}:t==='organizations'?{subscription_status:'active',plan_type:'pro'}:null));expect((await invite(req(body))).status).toBe(400);expect(mock.createUser).not.toHaveBeenCalled();});
 it('does not reuse existing Auth accounts',async()=>{mock.createUser.mockResolvedValue({data:{user:null},error:{message:'exists'}});expect((await invite(req(body))).status).toBe(409);expect(mock.rpc).not.toHaveBeenCalled();});
 it('compensates new Auth user after DB provisioning failure',async()=>{mock.rpc.mockResolvedValue({data:null,error:{message:'quota',code:'P0001'}});expect((await invite(req(body))).status).toBe(409);expect(mock.deleteUser).toHaveBeenCalledWith('new');});
 it('requires a branch for ordinary staff',async()=>{expect((await invite(req({...body,branchId:null}))).status).toBe(400);expect(mock.createUser).not.toHaveBeenCalled();});
});
