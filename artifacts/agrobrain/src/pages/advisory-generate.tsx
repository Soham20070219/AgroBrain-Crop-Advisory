import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLocation } from 'wouter';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, CircleHelp, Coins, MapPin, MessageSquare, Sprout } from 'lucide-react';
import { AdvisoryInputBudgetLevel, AdvisoryInputTargetSeason, useGenerateAdvisory, useListFarms, getGetDashboardSummaryQueryKey, getListAdvisoriesQueryKey, getListFarmsQueryKey } from '@workspace/api-client-react';
import { AgroShell, EmptyState, ErrorState, LoadingBlocks, PageHeader } from '@/components/agro-shell';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

const schema = z.object({ farmId: z.string().min(1, 'Choose a farm'), targetSeason: z.enum(['Kharif', 'Rabi', 'Zaid', 'Spring', 'Summer', 'Winter']), budgetLevel: z.enum(['Low', 'Medium', 'High']), specificConcerns: z.string().max(2000, 'Keep concerns under 2000 characters').default('') });
type FormValues = z.infer<typeof schema>;
const req = (userId: string | null) => ({ headers: { 'x-user-id': userId ?? '' } });

export default function AdvisoryGenerate({ userId }: { userId: string | null }) {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const farmsQuery = useListFarms({ query: { enabled: !!userId, queryKey: getListFarmsQueryKey() }, request: req(userId) });
  const farms = farmsQuery.data ?? [];
  const initialFarm = useMemo(() => new URLSearchParams(window.location.search).get('farm') ?? farms[0]?.id ?? '', [farms]);
  const form = useForm<FormValues>({ resolver: zodResolver(schema), values: { farmId: initialFarm, targetSeason: 'Rabi', budgetLevel: 'Medium', specificConcerns: '' } });
  const generate = useGenerateAdvisory({ request: req(userId) });
  const onSubmit = (values: FormValues) => generate.mutate({ data: values }, { onSuccess: advisory => { queryClient.invalidateQueries({ queryKey: getListAdvisoriesQueryKey() }); queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() }); setLocation(`/advisory/${advisory.id}`); } });
  return <AgroShell userId={userId}><div className="page-enter mx-auto max-w-[1060px] px-5 py-9 sm:px-8 lg:px-10 lg:py-12">
    <button onClick={() => setLocation('/dashboard')} className="mb-8 inline-flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground" data-testid="button-back-dashboard"><ArrowLeft className="size-3.5" /> Back to overview</button>
    <PageHeader eyebrow="New field note / 02" title="Ask a better question." description="Tell us where you are planting, what season is ahead, and what keeps you up at night. We will do the agronomy work." />
    {farmsQuery.isLoading ? <LoadingBlocks count={2} /> : farmsQuery.isError ? <ErrorState /> : !farms.length ? <EmptyState title="Add a farm first." description="Advisories need a place to belong. Create a farm profile, then come back with your question." action={<Button onClick={() => setLocation('/farms/new')} data-testid="button-generate-add-farm">Add a farm <ArrowRight className="size-4" /></Button>} /> : <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6 lg:grid-cols-[1fr_310px]" data-testid="form-generate-advisory">
      <div className="space-y-6">
        <section className="rounded-2xl border border-border bg-card p-5 paper-shadow sm:p-7"><div className="mb-6 flex items-start gap-3"><span className="flex size-9 items-center justify-center rounded-xl bg-secondary text-primary"><MapPin className="size-[17px]" /></span><div><h2 className="font-bold">Choose your ground</h2><p className="mt-1 text-xs text-muted-foreground">Recommendations begin with the farm, not the crop.</p></div></div><label className="block"><span className="mb-2 block text-xs font-bold">Farm profile</span><select {...form.register('farmId')} className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring" data-testid="select-advisory-farm">{farms.map(farm => <option value={farm.id} key={farm.id}>{farm.name} · {farm.region} · {farm.areaAcres} acres</option>)}</select>{form.formState.errors.farmId && <span className="mt-1.5 block text-xs text-destructive">{form.formState.errors.farmId.message}</span>}</label></section>
        <section className="rounded-2xl border border-border bg-card p-5 paper-shadow sm:p-7"><div className="mb-6 flex items-start gap-3"><span className="flex size-9 items-center justify-center rounded-xl bg-accent/25 text-accent-foreground"><Sprout className="size-[17px]" /></span><div><h2 className="font-bold">Frame the decision</h2><p className="mt-1 text-xs text-muted-foreground">The season and budget keep the answer grounded.</p></div></div><div className="grid gap-5 sm:grid-cols-2"><Choice label="Target season" name="targetSeason" register={form.register} options={Object.values(AdvisoryInputTargetSeason)} testId="select-target-season" /><Choice label="Available budget" name="budgetLevel" register={form.register} options={Object.values(AdvisoryInputBudgetLevel)} testId="select-budget-level" /></div></section>
        <section className="rounded-2xl border border-border bg-card p-5 paper-shadow sm:p-7"><div className="mb-6 flex items-start gap-3"><span className="flex size-9 items-center justify-center rounded-xl bg-[hsl(var(--chart-3)/.12)] text-[hsl(var(--chart-3))]"><MessageSquare className="size-[17px]" /></span><div><h2 className="font-bold">What should we watch?</h2><p className="mt-1 text-xs text-muted-foreground">Optional. Mention water, pests, labour, price, or anything specific to this field.</p></div></div><Textarea {...form.register('specificConcerns')} placeholder="e.g. Water may be limited in February. I want a crop that can be harvested before the late rains." rows={5} data-testid="textarea-specific-concerns" /><div className="mt-2 flex justify-between text-[11px] text-muted-foreground"><span>Specific questions make more useful recommendations.</span><span>{form.watch('specificConcerns').length}/2000</span></div></section>
        {generate.isError && <p className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm font-semibold text-destructive" data-testid="status-advisory-error">The advisory could not be generated right now. Please try again.</p>}
        <div className="flex justify-end"><Button type="submit" disabled={generate.isPending} className="gap-2 px-5" data-testid="button-generate-advisory">{generate.isPending ? 'Reading the field…' : 'Generate field note'}<ArrowRight className="size-4" /></Button></div>
      </div>
      <aside className="h-fit rounded-2xl border border-border bg-secondary/60 p-5 sm:p-6"><Coins className="size-5 text-primary" /><h3 className="mt-4 font-bold">The economics matter</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">Budget level influences the balance between input cost, yield potential, and resilience. It is not a constraint to hide.</p><div className="mt-6 rounded-xl bg-card p-4"><div className="flex items-start gap-2"><CircleHelp className="mt-0.5 size-4 text-[hsl(var(--chart-3))]" /><p className="text-xs leading-5 text-muted-foreground">Your report will show the reasoning behind each crop score.</p></div></div></aside>
    </form>}
  </div></AgroShell>;
}

function Choice({ label, name, register, options, testId }: { label: string; name: 'targetSeason' | 'budgetLevel'; register: ReturnType<typeof useForm<FormValues>>['register']; options: string[]; testId: string }) { return <label className="block"><span className="mb-2 block text-xs font-bold">{label}</span><select {...register(name)} className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring" data-testid={testId}>{options.map(option => <option value={option} key={option}>{option}</option>)}</select></label>; }