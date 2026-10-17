import type { Project } from '../data/projects'

type Props = {
  project: Project
  onClose: () => void
}

// Basic 2D overlay shown when a zone is clicked. Style it properly later.
export function ProjectPanel({ project, onClose }: Props) {
  return (
    <aside
      style={{
        position: 'absolute',
        top: 16,
        right: 16,
        width: 'min(360px, calc(100% - 32px))',
        padding: 20,
        background: 'rgba(255, 255, 255, 0.92)',
        borderRadius: 12,
        boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
      }}
    >
      <button onClick={onClose} style={{ float: 'right' }} aria-label="Close">
        ✕
      </button>
      <h2 style={{ marginTop: 0 }}>{project.title}</h2>
      <p>{project.summary}</p>
      {project.links?.map((link) => (
        <p key={link.url}>
          <a href={link.url} target="_blank" rel="noreferrer">
            {link.label}
          </a>
        </p>
      ))}
    </aside>
  )
}
