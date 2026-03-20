import type { ParsedResume, TemplateStyle } from '@/types';

interface Props {
  data: ParsedResume;
  style: TemplateStyle;
}

/** Normalize ALL-CAPS names (e.g. "MUKHARJI VAJJE" → "Mukharji Vajje") */
function normalizeName(name: string): string {
  if (!name) return name;
  // If the string is entirely uppercase (common in PDF exports), convert to title case
  if (name === name.toUpperCase()) {
    return name.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
  }
  return name;
}

// ─── Minimal ATS ────────────────────────────────────────────────────────────

function MinimalTemplate({ data }: { data: ParsedResume }) {
  return (
    <div style={{ fontFamily: 'Arial, sans-serif', fontSize: 13, lineHeight: 1.45, color: '#111' }}>
      <div style={{ marginBottom: 8 }}>
        <div style={{ fontSize: 20, fontWeight: 700 }}>{normalizeName(data.fullName)}</div>
        <div style={{ color: '#555', marginTop: 2 }}>
          {[data.contact.email, data.contact.phone, data.contact.location].filter(Boolean).join(' | ')}
        </div>
        {(data.contact.linkedIn || data.contact.website) && (
          <div style={{ color: '#555' }}>
            {[data.contact.linkedIn, data.contact.website].filter(Boolean).join(' | ')}
          </div>
        )}
      </div>

      <hr style={{ border: 'none', borderTop: '2px solid #111', marginBottom: 8 }} />

      {data.summary && <MinSection title="Summary"><p style={{ margin: 0 }}>{data.summary}</p></MinSection>}

      {data.skills.length > 0 && (
        <MinSection title="Skills">
          <p style={{ margin: 0 }}>{data.skills.join(', ')}</p>
        </MinSection>
      )}

      {data.experience.length > 0 && (
        <MinSection title="Experience">
          {data.experience.map(exp => (
            <div key={exp.id} style={{ marginBottom: 10, breakInside: 'avoid' } as React.CSSProperties}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 600 }}>
                  {exp.title} — {exp.company}{exp.location ? `, ${exp.location}` : ''}
                </span>
                <span style={{ color: '#666', whiteSpace: 'nowrap', marginLeft: 12 }}>
                  {exp.startDate} – {exp.current ? 'Present' : exp.endDate}
                </span>
              </div>
              <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
                {exp.bullets.map((b, i) => <li key={i} style={{ marginBottom: 2 }}>{b}</li>)}
              </ul>
            </div>
          ))}
        </MinSection>
      )}

      {data.education.length > 0 && (
        <MinSection title="Education">
          {data.education.map(edu => (
            <div key={edu.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span>
                <strong>{edu.degree} in {edu.field}</strong> — {edu.institution}
                {edu.gpa ? ` (GPA: ${edu.gpa})` : ''}
              </span>
              <span style={{ color: '#666', whiteSpace: 'nowrap', marginLeft: 12 }}>{edu.graduationDate}</span>
            </div>
          ))}
        </MinSection>
      )}

      {data.certifications.length > 0 && (
        <MinSection title="Certifications">
          {data.certifications.map(c => (
            <p key={c.id} style={{ margin: '2px 0' }}>{c.name} — {c.issuer} ({c.date})</p>
          ))}
        </MinSection>
      )}

      {data.projects.length > 0 && (
        <MinSection title="Projects">
          {data.projects.map(p => (
            <div key={p.id} style={{ marginBottom: 6 }}>
              <strong>{p.name}</strong>
              {p.technologies.length > 0 && <span style={{ color: '#666' }}> [{p.technologies.join(', ')}]</span>}
              <p style={{ margin: '2px 0 0' }}>{p.description}</p>
            </div>
          ))}
        </MinSection>
      )}
    </div>
  );
}

function MinSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
        {title}
      </div>
      {children}
    </div>
  );
}

// ─── Modern Professional ────────────────────────────────────────────────────

const TEAL = '#0d9488';
const TEAL_LIGHT = '#f0fdfa';
const TEAL_BORDER = '#99f6e4';

function ModernTemplate({ data }: { data: ParsedResume }) {
  return (
    <div style={{ fontFamily: '"Segoe UI", system-ui, sans-serif', fontSize: 13, lineHeight: 1.5, color: '#1f2937' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 4 }}>
        <div style={{ fontSize: 26, fontWeight: 700, color: '#111827' }}>{normalizeName(data.fullName)}</div>
        <div style={{ color: '#6b7280', fontSize: 12, marginTop: 2 }}>
          {[data.contact.email, data.contact.phone, data.contact.location].filter(Boolean).join('  ·  ')}
        </div>
        {(data.contact.linkedIn || data.contact.website) && (
          <div style={{ color: '#6b7280', fontSize: 12 }}>
            {[data.contact.linkedIn, data.contact.website].filter(Boolean).join('  ·  ')}
          </div>
        )}
      </div>
      {/* Teal accent bar */}
      <div style={{ height: 3, background: TEAL, borderRadius: 9999, margin: '8px 0 14px' }} />

      {data.summary && (
        <ModSection title="Professional Summary">
          <p style={{ margin: 0, color: '#374151' }}>{data.summary}</p>
        </ModSection>
      )}

      {data.skills.length > 0 && (
        <ModSection title="Skills">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {data.skills.map(s => (
              <span key={s} style={{
                padding: '2px 8px', background: TEAL_LIGHT,
                border: `1px solid ${TEAL_BORDER}`, borderRadius: 4,
                fontSize: 12, color: '#134e4a',
              }}>{s}</span>
            ))}
          </div>
        </ModSection>
      )}

      {data.experience.length > 0 && (
        <ModSection title="Work Experience">
          {data.experience.map(exp => (
            <div key={exp.id} style={{ marginBottom: 14, breakInside: 'avoid' } as React.CSSProperties}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontWeight: 600, color: '#111827' }}>{exp.title}</div>
                  <div style={{ color: TEAL, fontSize: 12 }}>{exp.company}{exp.location ? ` · ${exp.location}` : ''}</div>
                </div>
                <span style={{ fontSize: 11, color: '#9ca3af', whiteSpace: 'nowrap', marginLeft: 12 }}>
                  {exp.startDate} – {exp.current ? 'Present' : exp.endDate}
                </span>
              </div>
              <ul style={{ margin: '6px 0 0 0', padding: 0, listStyle: 'none' }}>
                {exp.bullets.map((b, i) => (
                  <li key={i} style={{ display: 'flex', gap: 8, marginBottom: 3 }}>
                    <span style={{ color: TEAL, marginTop: 3, fontSize: 10, flexShrink: 0 }}>▸</span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </ModSection>
      )}

      {data.education.length > 0 && (
        <ModSection title="Education">
          {data.education.map(edu => (
            <div key={edu.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <div>
                <div style={{ fontWeight: 600, color: '#111827' }}>{edu.degree} in {edu.field}</div>
                <div style={{ color: '#6b7280', fontSize: 12 }}>{edu.institution}{edu.gpa ? ` · GPA ${edu.gpa}` : ''}</div>
              </div>
              <span style={{ fontSize: 11, color: '#9ca3af', whiteSpace: 'nowrap', marginLeft: 12 }}>{edu.graduationDate}</span>
            </div>
          ))}
        </ModSection>
      )}

      {data.certifications.length > 0 && (
        <ModSection title="Certifications">
          {data.certifications.map(c => (
            <p key={c.id} style={{ margin: '3px 0' }}>
              <strong>{c.name}</strong> · {c.issuer} <span style={{ color: '#9ca3af' }}>({c.date})</span>
            </p>
          ))}
        </ModSection>
      )}

      {data.projects.length > 0 && (
        <ModSection title="Projects">
          {data.projects.map(p => (
            <div key={p.id} style={{ marginBottom: 10 }}>
              <div style={{ fontWeight: 600, color: '#111827' }}>{p.name}</div>
              <div style={{ color: '#4b5563' }}>{p.description}</div>
              {p.technologies.length > 0 && (
                <div style={{ fontSize: 11, color: TEAL, marginTop: 2 }}>{p.technologies.join(' · ')}</div>
              )}
            </div>
          ))}
        </ModSection>
      )}
    </div>
  );
}

function ModSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: TEAL }}>
          {title}
        </span>
        <div style={{ flex: 1, height: 1, background: TEAL_BORDER }} />
      </div>
      {children}
    </div>
  );
}

// ─── Executive Clean ─────────────────────────────────────────────────────────

const NAVY = '#1a2744';
const NAVY_FAINT = 'rgba(26,39,68,0.15)';

function ExecutiveTemplate({ data }: { data: ParsedResume }) {
  return (
    <div style={{ fontFamily: 'Georgia, "Times New Roman", serif', fontSize: 13, lineHeight: 1.55, color: '#1a1a1a' }}>
      {/* Two-column header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
        <div style={{ fontSize: 28, fontWeight: 700, color: NAVY }}>{normalizeName(data.fullName)}</div>
        <div style={{ textAlign: 'right', fontSize: 12, color: '#555', lineHeight: 1.6 }}>
          {data.contact.email && <div>{data.contact.email}</div>}
          {data.contact.phone && <div>{data.contact.phone}</div>}
          {data.contact.location && <div>{data.contact.location}</div>}
          {data.contact.linkedIn && <div>{data.contact.linkedIn}</div>}
          {data.contact.website && <div>{data.contact.website}</div>}
        </div>
      </div>
      <div style={{ height: 2, background: NAVY, marginBottom: 14 }} />

      {data.summary && (
        <ExecSection title="Executive Summary">
          <p style={{ margin: 0, fontStyle: 'italic', color: '#374151' }}>{data.summary}</p>
        </ExecSection>
      )}

      {data.skills.length > 0 && (
        <ExecSection title="Core Competencies">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2px 16px' }}>
            {data.skills.map(s => (
              <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ color: NAVY, fontSize: 8 }}>◆</span> {s}
              </div>
            ))}
          </div>
        </ExecSection>
      )}

      {data.experience.length > 0 && (
        <ExecSection title="Professional Experience">
          {data.experience.map(exp => (
            <div key={exp.id} style={{ marginBottom: 16, breakInside: 'avoid' } as React.CSSProperties}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontWeight: 700, fontSize: 14 }}>{exp.title}</span>
                <span style={{ fontSize: 11, color: '#888' }}>{exp.startDate} – {exp.current ? 'Present' : exp.endDate}</span>
              </div>
              <div style={{ fontWeight: 600, fontSize: 12, color: NAVY, marginBottom: 4 }}>
                {exp.company}{exp.location ? `  ·  ${exp.location}` : ''}
              </div>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                {exp.bullets.map((b, i) => (
                  <li key={i} style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
                    <span style={{ color: NAVY, fontSize: 8, marginTop: 5, flexShrink: 0 }}>●</span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </ExecSection>
      )}

      {data.education.length > 0 && (
        <ExecSection title="Education">
          {data.education.map(edu => (
            <div key={edu.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <div>
                <div style={{ fontWeight: 700 }}>{edu.degree} in {edu.field}</div>
                <div style={{ color: '#555' }}>{edu.institution}{edu.gpa ? `  ·  GPA: ${edu.gpa}` : ''}</div>
              </div>
              <span style={{ fontSize: 11, color: '#888', whiteSpace: 'nowrap', marginLeft: 12 }}>{edu.graduationDate}</span>
            </div>
          ))}
        </ExecSection>
      )}

      {data.certifications.length > 0 && (
        <ExecSection title="Certifications & Credentials">
          {data.certifications.map(c => (
            <p key={c.id} style={{ margin: '3px 0' }}>
              <strong>{c.name}</strong> · {c.issuer} ({c.date})
            </p>
          ))}
        </ExecSection>
      )}

      {data.projects.length > 0 && (
        <ExecSection title="Notable Projects">
          {data.projects.map(p => (
            <div key={p.id} style={{ marginBottom: 10 }}>
              <div style={{ fontWeight: 700 }}>{p.name}</div>
              <div style={{ color: '#374151' }}>{p.description}</div>
              {p.technologies.length > 0 && (
                <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>{p.technologies.join(' · ')}</div>
              )}
            </div>
          ))}
        </ExecSection>
      )}
    </div>
  );
}

function ExecSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: NAVY, marginBottom: 4 }}>
        {title}
      </div>
      <div style={{ height: 1, background: NAVY_FAINT, marginBottom: 8 }} />
      {children}
    </div>
  );
}

// ─── Export ──────────────────────────────────────────────────────────────────

export function ResumeTemplateRenderer({ data, style }: Props) {
  if (style === 'modern') return <ModernTemplate data={data} />;
  if (style === 'executive') return <ExecutiveTemplate data={data} />;
  return <MinimalTemplate data={data} />;
}
