// Personal info (not a project): shown in the corner menu, later also in the Home place
// and the simple text version. Fill in the TODOs with real content.

export type SocialKind = 'github' | 'linkedin' | 'email'

export type Social = {
  kind: SocialKind // picks the icon
  label: string
  url: string // empty = not filled in yet, shown greyed out. Email: 'mailto:you@example.com'
}

export type Profile = {
  name: string
  tagline: string
  about: string
  skills: string[]
  socials: Social[]
  cvUrl: string | null // put the PDF in public/ (e.g. public/cv.pdf) and set '/cv.pdf'
}

export const profile: Profile = {
  name: 'Mathijs', // TODO: full name?
  tagline: 'TODO: one line about who you are',
  about: 'TODO: a few sentences about you.',
  skills: ['TODO: skill', 'TODO: tool'],
  // TODO: which socials exist? Remove the ones you don't use.
  socials: [
    { kind: 'github', label: 'GitHub', url: '' },
    { kind: 'linkedin', label: 'LinkedIn', url: '' },
    { kind: 'email', label: 'Email', url: '' },
  ],
  cvUrl: null, // TODO: add the CV PDF
}
