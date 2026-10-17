import { useState, type CSSProperties } from 'react'
import { profile } from '../data/profile'
import { projects, type ProjectId } from '../data/projects'
import { ZONES } from '../scene/layout'
import { SocialIcon } from './SocialIcon'

type Props = {
  selected: ProjectId | null
  onSelect: (id: ProjectId) => void
}

// Always-visible menu in the top-left corner: name, social icons, and (when opened)
// the project list, About me, Skills & tools and the CV. Picking a project flies there.
export function CornerMenu({ selected, onSelect }: Props) {
  const [open, setOpen] = useState(false)

  // Only projects that have a place on the island (internship has none yet).
  const zoneIds = Object.keys(ZONES) as ProjectId[]

  return (
    <nav className={selected ? 'corner-menu panel-open' : 'corner-menu'} style={card} aria-label="Menu">
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 18 }}>{profile.name}</div>
          <div style={{ fontSize: 13, opacity: 0.7 }}>{profile.tagline}</div>
        </div>
        {/* Three bars that morph into an ✕ (animation in index.css). */}
        <button
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-label={open ? 'Close menu' : 'Open menu'}
          className={open ? 'menu-toggle round-button open' : 'menu-toggle round-button'}
          style={toggle}
        >
          <span />
          <span />
          <span />
        </button>
      </div>

      <div style={{ display: 'flex', gap: 12, marginTop: 10 }}>
        {profile.socials.map((social) =>
          social.url ? (
            <a key={social.kind} href={social.url} target="_blank" rel="noreferrer" aria-label={social.label} title={social.label} style={{ color: 'inherit' }}>
              <SocialIcon kind={social.kind} />
            </a>
          ) : (
            // Not filled in yet (see src/data/profile.ts): greyed out, not clickable.
            <span key={social.kind} title={`${social.label}: TODO`} style={{ opacity: 0.3 }}>
              <SocialIcon kind={social.kind} />
            </span>
          ),
        )}
      </div>

      {/* Always rendered so it can grow and shrink; `inert` makes it unclickable and
          skipped by the keyboard while closed. */}
      <div className={open ? 'menu-body open' : 'menu-body'} inert={!open}>
        <div>
          <div style={{ ...heading, marginTop: 14 }}>Projects</div>
          {zoneIds.map((id) => (
            <button
              key={id}
              onClick={() => {
                onSelect(id)
                setOpen(false)
              }}
              aria-current={id === selected}
              className="menu-project"
              style={projectButton}
            >
              <div style={{ fontWeight: 600 }}>{projects[id].title}</div>
              <div style={{ fontSize: 12, opacity: 0.6 }}>{projects[id].zone}</div>
            </button>
          ))}

          {/* <details> is a built-in HTML fold-out: click the summary to open it. */}
          <details style={section}>
            <summary style={summary}>About me</summary>
            <p style={{ margin: '8px 0 0', fontSize: 14 }}>{profile.about}</p>
          </details>

          <details style={section}>
            <summary style={summary}>Skills &amp; tools</summary>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
              {profile.skills.map((skill) => (
                <span key={skill} style={chip}>
                  {skill}
                </span>
              ))}
            </div>
          </details>

          <div style={section}>
            {profile.cvUrl ? (
              <a href={profile.cvUrl} download style={{ ...summary, color: 'inherit' }}>
                Download CV ↓
              </a>
            ) : (
              <span style={{ ...summary, opacity: 0.4 }} title="TODO: add the CV PDF">
                CV (coming soon)
              </span>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

const card: CSSProperties = {
  position: 'absolute',
  top: 16,
  left: 16,
  width: 'min(280px, calc(100% - 32px))',
  maxHeight: 'calc(100% - 32px)',
  overflowY: 'auto',
  padding: 16,
  background: 'rgba(255, 255, 255, 0.92)',
  borderRadius: 12,
  boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
}

const toggle: CSSProperties = {
  position: 'relative',
  flexShrink: 0,
  width: 36,
  height: 36,
  border: 'none',
  borderRadius: 8,
  background: 'rgba(0,0,0,0.06)',
  color: 'inherit',
  cursor: 'pointer',
}

const heading: CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: 0.5,
  opacity: 0.5,
  marginBottom: 4,
}

const projectButton: CSSProperties = {
  display: 'block',
  width: '100%',
  padding: '6px 8px',
  border: 'none',
  borderRadius: 8,
  background: 'transparent',
  font: 'inherit',
  textAlign: 'left',
  cursor: 'pointer',
}

const section: CSSProperties = {
  marginTop: 10,
  paddingTop: 10,
  borderTop: '1px solid rgba(0,0,0,0.1)',
}

const summary: CSSProperties = {
  fontWeight: 600,
  cursor: 'pointer',
  textDecoration: 'none',
}

const chip: CSSProperties = {
  padding: '3px 10px',
  borderRadius: 999,
  background: 'rgba(0,0,0,0.06)',
  fontSize: 13,
}
