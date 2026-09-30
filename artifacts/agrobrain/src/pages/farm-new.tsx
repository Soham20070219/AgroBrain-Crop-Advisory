import { type ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLocation } from 'wouter';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, Check, Info, MapPin, Sprout } from 'lucide-react';
import { useCreateFarm, getListFarmsQueryKey, getGetDashboardSummaryQueryKey } from '@workspace/api-client-react';
import { AgroShell, PageHeader } from '@/components/agro-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const schema = z.object({
  name: z.string().min(2, 'Give this farm a name'),
  region: z.string().min(2, 'Add the district, state, or region'),
  areaAcres: z.coerce.number().positive('Area must be greater than zero'),
  soilType: z.enum(['Loamy', 'Clay', 'Sandy', 'Peaty', 'Saline', 'Chalky']),
  irrigationMethod: z.enum(['Rainfed', 'Drip', 'Sprinkler', 'Flood']),
  climateZone: z.enum(['Arid', 'Semi-arid', 'Tropical', 'Sub-tropical', 'Temperate']),
  historicCrop: z.string().min(2, 'Tell us what was grown most recently'),
});
type FormValues = z.infer<typeof schema>;
const req = (userId: string | null) => ({ headers: { 'x-user-id': userId ?? '' } });

export default function FarmNew({ userId }: { userId: string | null }) {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { name: '', region: '', areaAcres: 0, soilType: 'Loamy', irrigationMethod: 'Rainfed', climateZone: 'Semi-arid', historicCrop: '' } });
  const createFarm = useCreateFarm({ request: req(userId) });
  const onSubmit = (values: FormValues) => createFarm.mutate({ data: values }, { onSuccess: () => { queryClient.invalidateQueries({ queryKey: getListFarmsQueryKey() }); queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() }); setLocation('/dashboard'); } });
  return <AgroShell userId={userId}><div className="page-enter mx-auto max-w-[980px] px-5 py-9 sm:px-8 lg:px-10 lg:py-12">
    <button onClick={() => setLocation('/dashboard')} className="mb-8 inline-flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground" data-testid="button-back-dashboard"><ArrowLeft className="size-3.5" /> Back to overview</button>
    <PageHeader eyebrow="Farm profile / 01" title="Put your ground on paper." description="A few precise details help AgroBrain make advice that belongs to your farm, not a generic region." />
    <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6 lg:grid-cols-[1fr_300px]" data-testid="form-new-farm">
      <div className="space-y-6">
        <section className="rounded-2xl border border-border bg-card p-5 paper-shadow sm:p-7"><div className="mb-6 flex items-start gap-3"><span className="flex size-9 items-center justify-center rounded-xl bg-secondary text-primary"><MapPin className="size-[17px]" /></span><div><h2 className="font-bold">Name the place</h2><p className="mt-1 text-xs text-muted-foreground">Use the name you call it in the field.</p></div></div><div className="grid gap-5 sm:grid-cols-2"><Field label="Farm name" error={form.formState.errors.name?.message}><Input {...form.register('name')} placeholder="e.g. Kaveri North" data-testid="input-farm-name" /></Field><Field label="Region or district" error={form.formState.errors.region?.message}><Input {...form.register('region')} placeholder="e.g. Mandya, Karnataka" data-testid="input-farm-region" /></Field><Field label="Area (acres)" error={form.formState.errors.areaAcres?.message}><Input type="number" step="0.1" {...form.register('areaAcres')} placeholder="8.5" data-testid="input-farm-area" /></Field><Field label="Most recent crop" error={form.formState.errors.historicCrop?.message}><Input {...form.register('historicCrop')} placeholder="e.g. Cotton" data-testid="input-farm-crop" /></Field></div></section>
        <section className="rounded-2xl border border-border bg-card p-5 paper-shadow sm:p-7"><div className="mb-6 flex items-start gap-3"><span className="flex size-9 items-center justify-center rounded-xl bg-[hsl(var(--chart-3)/.12)] text-[hsl(var(--chart-3))]"><Sprout className="size-[17px]" /></span><div><h2 className="font-bold">The technical picture</h2><p className="mt-1 text-xs text-muted-foreground">These inputs shape crop fit, timing, and risk.</p></div></div><div className="grid gap-5 sm:grid-cols-2"><SelectField label="Soil type" name="soilType" register={form.register} options={['Loamy', 'Clay', 'Sandy', 'Peaty', 'Saline', 'Chalky']} testId="select-soil-type" /><SelectField label="Irrigation method" name="irrigationMethod" register={form.register} options={['Rainfed', 'Drip', 'Sprinkler', 'Flood']} testId="select-irrigation-method" /><SelectField label="Climate zone" name="climateZone" register={form.register} options={['Arid', 'Semi-arid', 'Tropical', 'Sub-tropical', 'Temperate']} testId="select-climate-zone" /></div></section>
        {createFarm.isError && <p className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm font-semibold text-destructive" data-testid="status-farm-error">We couldn't save this profile. Check the details and try again.</p>}
        <div className="flex justify-end"><Button type="submit" disabled={createFarm.isPending} className="gap-2 px-5" data-testid="button-save-farm">{createFarm.isPending ? 'Saving profile…' : 'Save farm profile'}<ArrowRight className="size-4" /></Button></div>
      </div>
      <aside className="h-fit rounded-2xl border border-[hsl(var(--chart-3)/.25)] bg-[hsl(var(--chart-3)/.07)] p-5 sm:p-6"><Info className="size-5 text-[hsl(var(--chart-3))]" /><h3 className="mt-4 font-bold">Why we ask</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">A crop that thrives in loam may struggle in saline soil. The details here are the difference between plausible advice and useful advice.</p><div className="mt-6 space-y-3 border-t border-[hsl(var(--chart-3)/.2)] pt-5 text-xs"><div className="flex gap-2"><Check className="mt-0.5 size-3.5 text-[hsl(var(--chart-3))]" /> No agronomy jargon required</div><div className="flex gap-2"><Check className="mt-0.5 size-3.5 text-[hsl(var(--chart-3))]" /> You can update this later</div></div></aside>
    </form>
  </div></AgroShell>;
}

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) { return <label className="block"><span className="mb-2 block text-xs font-bold">{label}</span>{children}{error && <span className="mt-1.5 block text-xs text-destructive">{error}</span>}</label>; }
function SelectField({ label, name, register, options, testId }: { label: string; name: keyof FormValues; register: ReturnType<typeof useForm<FormValues>>['register']; options: string[]; testId: string }) { return <label className="block"><span className="mb-2 block text-xs font-bold">{label}</span><select {...register(name)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-offset-background focus:ring-2 focus:ring-ring" data-testid={testId}>{options.map(option => <option value={option} key={option}>{option}</option>)}</select></label>; }