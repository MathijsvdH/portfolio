// All project text lives here, not in the 3D components.
// Fill in the TODOs with real content.

export type ProjectId = 'coral-reef' | 'knot-tying' | 'animal-classification' | 'robotics' | 'internship'

export type Project = {
  id: ProjectId
  title: string
  zone: string // where it lives on the island
  summary: string
  links?: { label: string; url: string }[]
}

export const projects: Record<ProjectId, Project> = {
  'coral-reef': {
    id: 'coral-reef',
    title: 'Coral Reef',
    zone: 'Coral reef off the coast',
    summary: 'TODO: describe the coral reef project.',
  },
  'knot-tying': {
    id: 'knot-tying',
    title: 'Knot Tying',
    zone: 'Boat at the jetty',
    summary: 'TODO: describe the knot-tying project.',
  },
  'animal-classification': {
    id: 'animal-classification',
    title: 'Animal Classification',
    zone: 'Wildlife across the island',
    // Note from Mathijs: classification used the iNaturalist API, and sharing works much like iNaturalist.
    summary: 'TODO: describe the animal classification project.',
  },
  robotics: {
    id: 'robotics',
    title: 'Robotics',
    zone: 'Learning robot in a corner',
    // Note from Mathijs: a pick-and-place robot arm, comparing ACT and flow matching on the same task.
    summary: 'TODO: describe the robotics project.',
  },
  internship: {
    id: 'internship',
    title: 'Internship',
    zone: 'The mirror',
    summary: 'TODO: describe the internship and what you learned.',
  },
}
