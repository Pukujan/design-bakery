export const OPEN_EXPERIENCE_EVENT = 'design-bakery:open-experience';

export type OpenExperienceDetail = {
  experienceId: number;
};

export function openExperience(experienceId: number): void {
  window.dispatchEvent(
    new CustomEvent<OpenExperienceDetail>(OPEN_EXPERIENCE_EVENT, {
      detail: { experienceId },
    }),
  );
  window.history.replaceState(null, '', `#experience-${experienceId}`);
  document.getElementById('experience')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export function parseExperienceHash(hash: string): number | null {
  const match = hash.replace(/^#/, '').match(/^experience-(\d+)$/);
  if (!match) return null;
  const id = Number(match[1]);
  return Number.isFinite(id) && id > 0 ? id : null;
}
