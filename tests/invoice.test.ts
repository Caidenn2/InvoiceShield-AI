import { describe,it,expect } from 'vitest';
import { invoiceSchema,review,parseAIResponse,blankInvoice } from '../src/lib/invoice';
import { samples } from '../src/lib/samples';
describe('Invoice verification',()=>{
 it('accepts a complete invoice and rejects negative amounts / invalid calendar dates',()=>{expect(invoiceSchema.safeParse(samples[0]).success).toBe(true);expect(invoiceSchema.safeParse({...samples[0],total:-1}).success).toBe(false);expect(invoiceSchema.safeParse({...samples[0],date:'2026-02-31'}).success).toBe(false);});
 it('reports missing fields without inventing values',()=>{const f=review(blankInvoice,[]);expect(f[0].title).toBe('Missing information');expect(blankInvoice.total).toBeNull();});
 it('passes consistent invoice arithmetic',()=>expect(review(samples[0],[])).toEqual([]));
 it('detects total and line arithmetic mismatches',()=>{const f=review({...samples[0],total:999,items:[{description:'Work',quantity:2,unitPrice:50,amount:20}]},[]);expect(f.map(v=>v.title)).toEqual(expect.arrayContaining(['Total does not add up','Line items do not match subtotal','Line item arithmetic mismatch']));});
 it('compares exact and near duplicates without AI',()=>{expect(review(samples[2],[samples[0]]).some(f=>f.title==='Potential duplicate')).toBe(true);expect(review(samples[3],[samples[0]]).some(f=>f.title==='Similar invoice found')).toBe(true);});
 it('does not confuse vendors or currencies',()=>{expect(review({...samples[0],vendor:'Different'},[samples[0]])).toEqual([]);expect(review({...samples[3],currency:'EUR'},[samples[0]])).toEqual([]);});
 it('identifies changed payment details',()=>expect(review({...samples[0],paymentDetails:'new account'},[samples[0]]).some(f=>f.title==='Vendor payment details changed')).toBe(true));
 it('detects unusual amounts from vendor history',()=>{const old=[1,2,3].map(i=>({...samples[0],id:String(i),number:`old-${i}`}));expect(review({...samples[0],number:'new',total:10000},old).some(f=>f.title==='Unusual invoice amount')).toBe(true);});
 it('validates AI responses, rejects malformed output, preserves nulls',()=>{expect(parseAIResponse(blankInvoice).vendor).toBeNull();expect(()=>parseAIResponse({total:'made up'})).toThrow();expect(()=>parseAIResponse({...blankInvoice,total:Infinity})).toThrow();});
});
