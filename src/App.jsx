import React, { useEffect, useMemo, useState } from 'react';
import './styles.css';

const NAV_ITEMS = [
  { id: 'home', label: 'Home' },
  { id: 'services', label: 'Services' },
  { id: 'book', label: 'Book' },
  { id: 'contact', label: 'Contact' },
  { id: 'admin', label: 'Admin' },
];

const SERVICE_ITEMS = [
  {
    title: 'Comprehensive eye exams',
    text: 'Routine vision checks, refraction, screening, and follow-up care in one calm workflow.',
  },
  {
    title: 'Glaucoma and retina screening',
    text: 'Early detection support for pressure, retinal health, and diabetic eye monitoring.',
  },
  {
    title: 'Surgical care coordination',
    text: 'Structured scheduling for consultations, procedure preparation, and post-operative review.',
  },
];

const DOCTOR_OPTIONS = [
  'Dr. Thomas Louie F. Albacete – Ophthalmology & Surgery',
  'Eye Center Team – comprehensive eye care',
];

const APPOINTMENT_TYPES = [
  'Initial eye consultation',
  'Follow-up',
  'Post-operative check',
  'Screening package',
];

const GALLERY = [
  {
    src: 'https://pplx-res.cloudinary.com/image/upload/pplx_search_images/80ceed31f437ab9db8814d4df4b63ca5ba15fb36.jpg',
    alt: 'Eye doctor consulting a patient in a clinic',
    eyebrow: 'Patient care',
    title: 'Comfort-first consultations',
  },
  {
    src: 'https://pplx-res.cloudinary.com/image/upload/pplx_search_images/f35f2a2aba3d3d0493183d10505572519256f53a.jpg',
    alt: 'Eye exam being performed with diagnostic equipment',
    eyebrow: 'Diagnostics',
    title: 'Modern eye examination flow',
  },
  {
    src: 'https://pplx-res.cloudinary.com/image/upload/pplx_search_images/858d7ba1300b302e33f95e00a0c798ae1e520d27.jpg',
    alt: 'Eye clinic examination room with ophthalmology equipment',
    eyebrow: 'Clinic space',
    title: 'Clean and organized exam rooms',
  },
];

const formatDateLabel = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(`${dateStr}T00:00:00`);
  return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
};

function App() {
  const [activeView, setActiveView] = useState('home');
  const [appointments, setAppointments] = useState([]);
  const [todayLabel, setTodayLabel] = useState('Today');
  const [toast, setToast] = useState({ open: false, message: '' });
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const now = new Date();
    setTodayLabel(`Today · ${now.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}`);
  }, []);

  const loadAppointments = async () => {
    try {
      const res = await fetch('/appointments', { headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setAppointments(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Failed to load appointments', e);
      setAppointments([]);
    }
  };

  useEffect(() => { loadAppointments(); }, []);

  const sortedAppointments = useMemo(() =>
    [...appointments].sort((a, b) => {
      const ad = `${a.date || ''}T${a.time || '00:00'}`;
      const bd = `${b.date || ''}T${b.time || '00:00'}`;
      return new Date(ad) - new Date(bd);
    }), [appointments]);

  const showToast = (message) => {
    setToast({ open: true, message });
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => setToast(p => ({ ...p, open: false })), 2800);
  };

  const jumpTo = (view) => {
    setActiveView(view);
    setMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = {
      name: fd.get('name')?.toString().trim(),
      phone: fd.get('phone')?.toString().trim(),
      date: fd.get('date')?.toString(),
      time: fd.get('time')?.toString(),
      doctor: fd.get('doctor')?.toString(),
      type: fd.get('type')?.toString(),
      reason: fd.get('reason')?.toString(),
      insurance: fd.get('insurance')?.toString(),
    };
    try {
      const res = await fetch('/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await loadAppointments();
      e.currentTarget.reset();
      jumpTo('admin');
      showToast('Appointment saved to clinic schedule.');
    } catch (err) {
      console.error(err);
      showToast('Could not save. Check Pages Functions and D1 binding.');
    }
  };

  return (
    <>
      <div className="app-bg" />
      <div className="app-shell">
        <header className="topbar">
          <div className="brand-block">
            <div className="brand-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M2.5 12s3.4-6 9.5-6 9.5 6 9.5 6-3.4 6-9.5 6-9.5-6-9.5-6Z" />
                <circle cx="12" cy="12" r="3.2" />
              </svg>
            </div>
            <div>
              <p className="eyebrow">Albacete Eye Center &amp; Medical Clinics</p>
              <h1 className="site-title">Clearer eye care, simpler appointments.</h1>
            </div>
          </div>
          <button
            className="menu-toggle"
            type="button"
            onClick={() => setMenuOpen(p => !p)}
            aria-expanded={menuOpen}
            aria-label="Toggle navigation"
          >
            <span /><span /><span />
          </button>
          <nav className={`topnav${menuOpen ? ' open' : ''}`} aria-label="Primary navigation">
            {NAV_ITEMS.map(item => (
              <button
                key={item.id}
                type="button"
                className={`nav-link${activeView === item.id ? ' active' : ''}`}
                onClick={() => jumpTo(item.id)}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </header>

        <main className="layout-grid">
          <section className="hero-panel card">
            <div className="hero-copy-block">
              <span className="soft-badge">Iloilo City · Jaro branch</span>
              <h2>Clearer eye care journeys, from consultation to follow-up.</h2>
              <p>Book appointments quickly, present clinic essentials clearly, and keep your front desk schedule synced with Cloudflare Pages Functions and D1.</p>
              <div className="hero-actions">
                <button type="button" className="primary-btn" onClick={() => jumpTo('book')}>Book appointment</button>
                <button type="button" className="secondary-btn" onClick={() => jumpTo('contact')}>Clinic details</button>
              </div>
            </div>
            <div className="hero-image-stack">
              <article className="feature-image-card large">
                <img src={GALLERY[0].src} alt={GALLERY[0].alt} loading="lazy" width="1500" height="1000" />
                <div className="image-meta"><span>{GALLERY[0].eyebrow}</span><strong>{GALLERY[0].title}</strong></div>
              </article>
              <div className="mini-image-row">
                {GALLERY.slice(1).map(item => (
                  <article key={item.title} className="feature-image-card small">
                    <img src={item.src} alt={item.alt} loading="lazy" width="1024" height="768" />
                    <div className="image-meta compact"><span>{item.eyebrow}</span><strong>{item.title}</strong></div>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <aside className="summary-panel card">
            <div className="panel-heading-row">
              <div>
                <p className="section-label">Schedule preview</p>
                <h3>{todayLabel}</h3>
              </div>
              <span className="live-pill">Booking live</span>
            </div>
            <div className="stat-list">
              <div className="stat-item"><span>Upcoming</span><strong>{sortedAppointments.length} appointment{sortedAppointments.length !== 1 ? 's' : ''}</strong></div>
              <div className="stat-item"><span>Services</span><strong>Eye exams · screening · follow-up</strong></div>
              <div className="stat-item"><span>Contact</span><strong>+63 963 862 9414</strong></div>
            </div>
            <div className="timeline-list">
              {sortedAppointments.length === 0
                ? <p className="empty-note">No appointments yet. New bookings appear here automatically.</p>
                : sortedAppointments.slice(0, 5).map(appt => (
                  <div className="timeline-item" key={appt.id ?? `${appt.name}-${appt.date}-${appt.time}`}>
                    <div><strong>{appt.name || 'Unnamed patient'}</strong><p>{formatDateLabel(appt.date)} · {appt.time || 'TBA'}</p></div>
                    <span>{appt.type || 'Consultation'}</span>
                  </div>
                ))}
            </div>
          </aside>

          {activeView === 'home' && (
            <section className="content-panel card span-2">
              <div className="section-header"><div><p className="section-label">Clinic flow</p><h3>Designed to feel calm on mobile and desktop.</h3></div></div>
              <div className="feature-grid">
                <article className="info-card"><h4>Fast first action</h4><p>Patients see one primary action first — book without navigating a complex layout.</p></article>
                <article className="info-card"><h4>Readable service essentials</h4><p>Core eye clinic services grouped into short, scan-friendly cards with generous spacing.</p></article>
                <article className="info-card"><h4>Mobile-first navigation</h4><p>A compact menu collapses for smaller screens so booking remains reachable with one thumb.</p></article>
              </div>
            </section>
          )}

          {activeView === 'services' && (
            <section className="content-panel card span-2">
              <div className="section-header"><div><p className="section-label">Services</p><h3>Essential eye clinic offerings.</h3></div></div>
              <div className="feature-grid">
                {SERVICE_ITEMS.map(item => (
                  <article className="info-card" key={item.title}><h4>{item.title}</h4><p>{item.text}</p></article>
                ))}
              </div>
            </section>
          )}

          {activeView === 'book' && (
            <section className="content-panel card span-2">
              <div className="section-header"><div><p className="section-label">Appointment form</p><h3>Simple booking flow with D1 persistence.</h3></div></div>
              <form className="booking-form" onSubmit={handleSubmit} autoComplete="off">
                <div className="input-grid">
                  <label>Full name<input name="name" type="text" placeholder="Maria Santos" required /></label>
                  <label>Mobile number<input name="phone" type="tel" placeholder="09xx xxx xxxx" required /></label>
                  <label>Preferred date<input name="date" type="date" required /></label>
                  <label>Preferred time<input name="time" type="time" required /></label>
                  <label>Doctor
                    <select name="doctor" required defaultValue="">
                      <option value="" disabled>Select doctor</option>
                      {DOCTOR_OPTIONS.map(d => <option key={d}>{d}</option>)}
                    </select>
                  </label>
                  <label>Appointment type
                    <select name="type" required defaultValue="">
                      <option value="" disabled>Select type</option>
                      {APPOINTMENT_TYPES.map(t => <option key={t}>{t}</option>)}
                    </select>
                  </label>
                </div>
                <label>Main concern<textarea name="reason" placeholder="Blurry vision, follow-up review, diabetic eye screening" required /></label>
                <label>Insurance / HMO<input name="insurance" type="text" placeholder="Optional" /></label>
                <div className="form-actions">
                  <p className="support-note">Submitted via Cloudflare Pages Functions and saved to D1.</p>
                  <button type="submit" className="primary-btn">Save appointment</button>
                </div>
              </form>
            </section>
          )}

          {activeView === 'contact' && (
            <section className="content-panel card span-2">
              <div className="section-header"><div><p className="section-label">Contact</p><h3>Clinic essentials in one place.</h3></div></div>
              <div className="contact-grid">
                <article className="info-card"><h4>Location</h4><p>JEA Bldg, E Lopez St, Jaro, Iloilo City, beside Jollibee.</p></article>
                <article className="info-card"><h4>Phone</h4><p>+63 963 862 9414</p></article>
                <article className="info-card"><h4>Facebook</h4><p><a href="https://www.facebook.com/AlbaceteEyeClinic/" target="_blank" rel="noopener noreferrer">@AlbaceteEyeClinic</a></p></article>
                <article className="info-card"><h4>Schedule note</h4><p>Confirm latest branch schedules and announcements through the official Facebook page.</p></article>
              </div>
            </section>
          )}

          {activeView === 'admin' && (
            <section className="content-panel card span-2">
              <div className="section-header"><div><p className="section-label">Admin schedule</p><h3>Responsive appointment list.</h3></div></div>
              <div className="admin-list">
                {sortedAppointments.length === 0
                  ? <p className="empty-note">No booked appointments yet. Add one in the booking form.</p>
                  : sortedAppointments.map(appt => (
                    <article className="admin-card" key={appt.id ?? `${appt.name}-${appt.date}-${appt.time}`}>
                      <div><h4>{appt.name || 'Unnamed patient'}</h4><p>{appt.doctor || 'Doctor not set'}</p></div>
                      <div className="admin-meta">
                        <span>{formatDateLabel(appt.date)}</span>
                        <span>{appt.time || 'TBA'}</span>
                        <span>{appt.type || 'Consultation'}</span>
                      </div>
                    </article>
                  ))}
              </div>
            </section>
          )}
        </main>
      </div>
      <div className={`toast${toast.open ? ' show' : ''}`} role="status" aria-live="polite">{toast.message}</div>
    </>
  );
}

export default App;
