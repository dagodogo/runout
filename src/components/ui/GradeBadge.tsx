import type { Grade } from '@/lib/solver/grade';
import { cn } from '@/lib/cn';
import { GRADE_CUE } from './readoutMath';

/** 16 px shape: circle with a check (good) or triangle with "!" (bad); solid = stronger. */
function GradeShape({ grade }: { grade: Grade }) {
  const { shape, fill } = GRADE_CUE[grade];
  const solid = fill === 'solid';
  const mark = solid ? 'var(--color-black)' : 'currentColor';
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" className="shrink-0">
      {shape === 'circle' ? (
        <>
          <circle cx="8" cy="8" r={solid ? 7.5 : 6.75} fill={solid ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={solid ? 0 : 1.5} />
          <path d="M4.8 8.3 7 10.4l4.2-4.6" fill="none" stroke={mark} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        </>
      ) : (
        <>
          <path d="M8 1.6 15 14.2H1Z" fill={solid ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M8 6v3.6" stroke={mark} strokeWidth="1.75" strokeLinecap="round" />
          <circle cx="8" cy="11.9" r="0.95" fill={mark} />
        </>
      )}
    </svg>
  );
}

/** Grade cue: shape + word, coloured blue (good) or orange (bad). Never colour alone. */
export function GradeBadge({ grade, className }: { grade: Grade; className?: string }) {
  const cue = GRADE_CUE[grade];
  return (
    <span className={cn('inline-flex items-center gap-1.5 font-semibold', cue.tone === 'good' ? 'text-good' : 'text-bad', className)}>
      <GradeShape grade={grade} />
      {cue.word}
    </span>
  );
}
