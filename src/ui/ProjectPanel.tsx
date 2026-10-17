import type { Project } from '../data/projects'
import { Panel } from './Panel'

type Props = {
  project: Project
  open: boolean // false = fading out (it stays mounted a moment so it can animate away)
  onClose: () => void
}

// Basic 2D overlay shown when a zone is clicked.
export function ProjectPanel({ project, open, onClose }: Props) {
  return (
    <Panel open={open} onClose={onClose}>
      <h2 style={{ marginTop: 0 }}>{project.title}</h2>
      <p>{project.summary}</p>
      {project.links?.map((link) => (
        <p key={link.url}>
          <a href={link.url} target="_blank" rel="noreferrer">
            {link.label}
          </a>
        </p>
      ))}
    </Panel>
  )
}
