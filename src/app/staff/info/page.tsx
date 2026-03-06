import Image from 'next/image'
import { Building2, ShieldCheck } from 'lucide-react'

const ohsoDescription =
  'OHSO deals with all aspects of health and safety in the University and has a strong focus on the primary prevention of hazards. Our goal is to prevent/mitigate accidents to our employees, students and clients within the campus.'

export default function StaffInfoPage () {
  return (
    <div className='h-full overflow-y-auto pr-1'>
      <div className='space-y-4'>
        <section className='rounded-3xl border border-slate-200 bg-white p-6 shadow-sm'>
          <p className='text-xs uppercase tracking-[0.2em] text-slate-500'>
            Office Information
          </p>
          <h1 className='mt-2 text-3xl font-bold text-[#1D2981]'>About OHSO</h1>
          <p className='mt-2 max-w-3xl text-sm text-slate-600'>
            University health and safety context for UMak LINK staff operations.
          </p>
        </section>

        <section className='rounded-3xl border border-slate-200 bg-white p-6 shadow-sm'>
          <div className='grid gap-6 lg:grid-cols-[8rem_minmax(0,1fr)_22rem] lg:items-start'>
            <div className='inline-flex size-32 items-center justify-center justify-self-center rounded-full border-4 border-[#1D2981]/20 bg-[#e9f4fb]'>
              <Image
                src='/images/umak-ohso.svg'
                alt='University of Makati Occupational Health and Safety Office logo'
                width={96}
                height={96}
                priority
                className='size-24'
              />
            </div>

            <article className='space-y-3'>
              <h2 className='text-3xl font-semibold text-slate-700'>
                Occupational Health and Safety Office (OHSO)
              </h2>
              <p className='text-base leading-relaxed text-slate-700'>
                {ohsoDescription}
              </p>
            </article>

            <aside>
              <p className='mb-3 text-sm font-semibold text-[#1D2981]'>
                Focus Areas
              </p>
              <div className='space-y-3'>
                <div className='rounded-2xl border border-slate-200 bg-slate-50 p-3'>
                  <p className='inline-flex items-center gap-2 text-sm font-semibold text-slate-800'>
                    <Building2 className='size-4 text-[#1D2981]' />
                    Campus-Wide Safety
                  </p>
                  <p className='mt-1 text-sm text-slate-600'>
                    Health and safety support across university environments.
                  </p>
                </div>

                <div className='rounded-2xl border border-slate-200 bg-slate-50 p-3'>
                  <p className='inline-flex items-center gap-2 text-sm font-semibold text-slate-800'>
                    <ShieldCheck className='size-4 text-[#1D2981]' />
                    Hazard Prevention
                  </p>
                  <p className='mt-1 text-sm text-slate-600'>
                    Primary prevention to reduce risk before incidents occur.
                  </p>
                </div>
              </div>
            </aside>
          </div>
        </section>
      </div>
    </div>
  )
}
