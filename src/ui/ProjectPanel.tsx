import type { Project } from '../data/projects'

type Props = {
  project: Project
  open: boolean // false = fading out (it stays mounted a moment so it can animate away)
  onClose: () => void
}

// Basic 2D overlay shown when a zone is clicked. Fade/slide animation in index.css.
export function ProjectPanel({ project, open, onClose }: Props) {
  return (
    <aside
      className={open ? 'project-panel open' : 'project-panel'}
      inert={!open}
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
      <button
        onClick={onClose}
        aria-label="Close"
        className="round-button"
        style={{
          float: 'right',
          width: 32,
          height: 32,
          marginLeft: 12,
          border: 'none',
          borderRadius: 8,
          background: 'rgba(0,0,0,0.06)',
          color: 'inherit',
          fontSize: 16,
          cursor: 'pointer',
        }}
      >
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
