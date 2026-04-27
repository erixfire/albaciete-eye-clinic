import React, { useEffect, useMemo, useRef, useState } from 'react';
import './styles.css';

const NAV_ITEMS = [
  { id: 'home',     label: '🏠 Home' },
  { id: 'services', label: '👁 Services' },
  { id: 'contact',  label: '📍 Contact' },
  { id: 'admin',    label: '🗂 Admin' },
];

const SERVICE_ITEMS = [
  { icon: '🔬', title: 'Comprehensive Eye Exam',  text: 'Routine examinations, refraction, visual screening for adults and children.' },
  { icon: '👁', title: 'Glaucoma & Retina',        text: 'Eye pressure screening, diabetic eye monitoring, retinal evaluation.' },
  { icon: '🏥', title: 'Surgical Coordination',    text: 'Pre-op consultation, procedure scheduling, post-operative follow-up.' },
  { icon: '🔄', title: 'Follow-up Care',           text: 'Ongoing treatment plans, medication review, progress monitoring.' },
  { icon: '📋', title: 'Patient Intake',           text: 'Structured name, mobile, date, concern, and insurance capture.' },
  { icon: '📊', title: 'Front Desk Dashboard',     text: 'Staff appointment queue backed by Cloudflare D1, accessible on any device.' },
];

const DOCTOR_OPTIONS = [
  'Dr. Thomas Louie F. Albacete – Ophthalmology & Surgery',
  'Next available eye clinic doctor',
];

const APPOINTMENT_TYPES = [
  'Initial consultation',
  'Comprehensive eye exam',
  'Follow-up visit',
  'Post-operative check',
  'Glaucoma / retina screening',
  'General eye concern',
];

const CONTACT_CARDS = [
  { icon: '🏥', title: 'Clinic',   text: 'Albacete Eye Center & Medical Clinics' },
  { icon: '📍', title: 'Location', text: 'JEA Building, E. Lopez St, Jaro, Iloilo City (beside Jollibee)' },
  { icon: '📞', title: 'Phone',    text: '+63 963 862 9414' },
  { icon: '📘', title: 'Facebook', text: '@AlbaceteEyeClinic', href: 'https://www.facebook.com/AlbaceteEyeClinic/' },
];

const GALLERY = [
  { src: 'https://pplx-res.cloudinary.com/image/upload/pplx_search_images/80ceed31f437ab9db8814d4df4b63ca5ba15fb36.jpg', alt: 'Eye doctor consulting a patient' },
  { src: 'https://pplx-res.cloudinary.com/image/upload/pplx_search_images/f35f2a2aba3d3d0493183d10505572519256f53a.jpg', alt: 'Eye exam with diagnostic equipment' },
];

const CLINIC_START = 8;
const CLINIC_END   = 17;
const SLOT_MINS    = 30;

function generateSlots() {
  const slots = [];
  for (let h = CLINIC_START; h < CLINIC_END; h++) {
    for (let m = 0; m < 60; m += SLOT_MINS) {
      slots.push(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`);
    }
  }
  return slots;
}
const ALL_SLOTS = generateSlots();

const AM_SLOTS = ALL_SLOTS.filter(s => parseInt(s) < 12);
const PM_SLOTS = ALL_SLOTS.filter(s => parseInt(s) >= 12);

function fmt12(t) {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${String(m).padStart(2,'0')} ${ampm}`;
}

const toISO  = d => d.toISOString().split('T')[0];
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate()+n); return x; };

const formatDateLabel = d => {
  if (!d) return '';
  return new Date(`${d}T00:00:00`).toLocaleDateString(undefined,{weekday:'short',month:'short',day:'numeric'});
};
const formatDateFull = d => {
  if (!d) return '';
  return new Date(`${d}T00:00:00`).toLocaleDateString(undefined,{weekday:'long',month:'long',day:'numeric',year:'numeric'});
};

const statusLabel = s => s ? s.charAt(0).toUpperCase()+s.slice(1) : 'Pending';

/* ── Month Calendar Picker ───────────────────────────────── */
function MonthPicker({ selected, onSelect, bookedDates }) {
  const today = useMemo(() => toISO(new Date()), []);
  const [cursor, setCursor] = useState(() => {
    const d = new Date(); d.setDate(1); return d;
  });

  const year  = cursor.getFullYear();
  const month = cursor.getMonth();
  const monthName = cursor.toLocaleDateString(undefined,{month:'long',year:'numeric'});

  const firstDow = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month+1, 0).getDate();

  const prevMonth = () => setCursor(d => { const x=new Date(d); x.setMonth(x.getMonth()-1); return x; });
  const nextMonth = () => setCursor(d => { const x=new Date(d); x.setMonth(x.getMonth()+1); return x; });

  const cells = [];
  for (let i=0; i<firstDow; i++) cells.push(null);
  for (let d=1; d<=daysInMonth; d++) cells.push(d);

  return (
    <div className="month-picker">
      <div className="mpk-header">
        <button type="button" className="mpk-nav" onClick={prevMonth}>‹</button>
        <span className="mpk-title">{monthName}</span>
        <button type="button" className="mpk-nav" onClick={nextMonth}>›</button>
      </div>
      <div className="mpk-dow">
        {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d=><span key={d}>{d}</span>)}
      </div>
      <div className="mpk-grid">
        {cells.map((day, i) => {
          if (!day) return <span key={`e${i}`} />;
          const iso    = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
          const isPast = iso < today;
          const isSun  = new Date(iso).getDay() === 0;
          const isSel  = iso === selected;
          const hasBook= bookedDates?.has(iso);
          return (
            <button
              key={iso} type="button"
              disabled={isPast || isSun}
              onClick={() => onSelect(iso)}
              className={[
                'mpk-day',
                isPast ? 'past' : '',
                isSun  ? 'sunday' : '',
                isSel  ? 'selected' : '',
                hasBook && !isSel ? 'has-booking' : '',
              ].filter(Boolean).join(' ')}
            >
              {day}
              {hasBook && !isPast && !isSun && <span className="mpk-dot" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ── Time Slot Pills ───────────────────────────────────────── */
function SlotPills({ date, appointments, selected, onSelect }) {
  const bookedTimes = useMemo(() => {
    if (!date) return new Set();
    return new Set(
      appointments
        .filter(a => a.date === date && a.status !== 'cancelled')
        .map(a => a.time)
    );
  }, [date, appointments]);

  const today  = toISO(new Date());
  const isPastDate = date < today;
  const now    = new Date();
  const curMin = now.getHours()*60 + now.getMinutes();

  const isSlotDisabled = (slot) => {
    if (isPastDate) return true;
    if (bookedTimes.has(slot)) return true;
    if (date === today) {
      const [sh,sm] = slot.split(':').map(Number);
      if (sh*60+sm <= curMin) return true;
    }
    return false;
  };

  if (!date) return (
    <div className="slot-empty">📅 Pick a date above to see available times</div>
  );

  return (
    <div className="slot-pills-wrap">
      <div className="slot-period-label">Morning</div>
      <div className="slot-pills">
        {AM_SLOTS.map(slot => {
          const disabled = isSlotDisabled(slot);
          const booked   = bookedTimes.has(slot);
          return (
            <button key={slot} type="button"
              disabled={disabled}
              onClick={() => !disabled && onSelect(slot)}
              className={['slot-pill', booked?'booked':'', selected===slot?'selected':'', disabled&&!booked?'past':''].filter(Boolean).join(' ')}
            >
              {fmt12(slot)}
            </button>
          );
        })}
      </div>
      <div className="slot-period-label">Afternoon</div>
      <div className="slot-pills">
        {PM_SLOTS.map(slot => {
          const disabled = isSlotDisabled(slot);
          const booked   = bookedTimes.has(slot);
          return (
            <button key={slot} type="button"
              disabled={disabled}
              onClick={() => !disabled && onSelect(slot)}
              className={['slot-pill', booked?'booked':'', selected===slot?'selected':'', disabled&&!booked?'past':''].filter(Boolean).join(' ')}
            >
              {fmt12(slot)}
            </button>
          );
        })}
      </div>
      <div className="slot-legend">
        <span><span className="sleg available"/>Available</span>
        <span><span className="sleg booked-dot"/>Booked</span>
        <span><span className="sleg sel-dot"/>Selected</span>
      </div>
    </div>
  );
}

/* ── Admin week-view calendar (read-only) ─────────────────── */
function WeekCalendar({ appointments }) {
  const today = useMemo(() => toISO(new Date()), []);
  const [weekStart, setWeekStart] = useState(() => {
    const d = new Date(); d.setDate(d.getDate()-d.getDay()); return d;
  });
  const days = useMemo(() => Array.from({length:7},(_,i)=>addDays(weekStart,i)),[weekStart]);

  const bookedMap = useMemo(() => {
    const m={};
    appointments.forEach(a=>{
      if(a.date&&a.time){
        const k=`${a.date}|${a.time}`;
        m[k]=(m[k]||[]).concat(a);
      }
    });
    return m;
  },[appointments]);

  const monthRange = () => {
    const f=days[0].toLocaleDateString(undefined,{month:'short',day:'numeric'});
    const l=days[6].toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'});
    return `${f} – ${l}`;
  };

  return (
    <div className="week-cal">
      <div className="cal-header">
        <button type="button" className="cal-nav" onClick={()=>setWeekStart(w=>addDays(w,-7))}>‹</button>
        <span className="cal-range">{monthRange()}</span>
        <button type="button" className="cal-nav" onClick={()=>setWeekStart(w=>addDays(w,7))}>›</button>
        <button type="button" className="secondary-btn sm cal-today"
          onClick={()=>setWeekStart(()=>{const d=new Date();d.setDate(d.getDate()-d.getDay());return d;})}
        >Today</button>
      </div>
      <div className="cal-grid">
        <div className="cal-time-col">
          <div className="cal-corner" />
          {ALL_SLOTS.map(s=><div key={s} className="cal-time-label">{fmt12(s)}</div>)}
        </div>
        {days.map(day=>{
          const iso=toISO(day);
          const isPast=iso<today;
          const isToday=iso===today;
          return (
            <div key={iso} className="cal-day-col">
              <div className={`cal-day-header${isToday?' today':''}${isPast?' past':''}`}>
                <span className="cal-day-name">{day.toLocaleDateString(undefined,{weekday:'short'})}</span>
                <span className="cal-day-num">{day.getDate()}</span>
              </div>
              {ALL_SLOTS.map(slot=>{
                const booked=(bookedMap[`${iso}|${slot}`]||[]);
                const isBooked=booked.length>0;
                return (
                  <div key={slot}
                    className={['cal-cell',isBooked?'booked':'',isPast?'past':'',isToday?'today-col':''].filter(Boolean).join(' ')}
                    title={isBooked?`${booked[0].name} – ${booked[0].type||'Consultation'}`:''}
                  >
                    {isBooked&&<span className="cal-cell-name">{booked[0].name?.split(' ')[0]}</span>}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
      <div className="cal-legend">
        <span className="legend-dot available"/>Available
        <span className="legend-dot booked"/>Booked
      </div>
    </div>
  );
}

/* ── Booking Form ──────────────────────────────────────────── */
function BookingForm({ appointments, onSuccess }) {
  const EMPTY = { name:'', phone:'', date:'', time:'', doctor:DOCTOR_OPTIONS[0], type:'', reason:'', insurance:'' };
  const [step, setStep]   = useState(1);
  const [form, setForm]   = useState(EMPTY);
  const [busy, setBusy]   = useState(false);

  const bookedDates = useMemo(() => {
    const s = new Set();
    appointments.forEach(a => { if(a.date && a.status!=='cancelled') s.add(a.date); });
    return s;
  }, [appointments]);

  const set = e => setForm(p=>({...p,[e.target.name]:e.target.value}));

  const goReview = e => {
    e.preventDefault();
    if (!form.date || !form.time) return;
    if (e.currentTarget.reportValidity()) setStep(2);
  };

  const submit = async e => {
    e.preventDefault(); setBusy(true);
    try {
      const res = await fetch('/appointments',{
        method:'POST',
        headers:{'Content-Type':'application/json',Accept:'application/json'},
        body: JSON.stringify({...form, status:'pending'}),
      });
      if (!res.ok) throw new Error();
      setForm(EMPTY); setStep(1);
      onSuccess('✅ Appointment booked! We’ll see you then.');
    } catch {
      onSuccess('❌ Could not save. Please try again.');
    } finally { setBusy(false); }
  };

  return (
    <div className="booking-widget card" id="booking-form">

      {/* Header */}
      <div className="bw-header">
        <div className="bw-icon">📅</div>
        <div>
          <p className="section-label">Book Appointment</p>
          <h3>Albacete Eye Clinic</h3>
        </div>
        <span className="bw-badge">30 min</span>
      </div>

      {/* Step indicator */}
      <div className="step-track">
        <div className={`step-node${step>=1?' active':''}`}>
          <span>1</span><p>Details</p>
        </div>
        <div className="step-connector" />
        <div className={`step-node${step>=2?' active':''}`}>
          <span>2</span><p>Confirm</p>
        </div>
      </div>

      {/* ─ Step 1 ─ */}
      {step===1 && (
        <form onSubmit={goReview} autoComplete="off" className="bw-form">

          <div className="bw-section">
            <p className="bw-section-title">👤 Patient info</p>
            <div className="bw-row">
              <label>Full name
                <input name="name" type="text" placeholder="Maria Santos" required value={form.name} onChange={set}/>
              </label>
              <label>Mobile
                <input name="phone" type="tel" placeholder="09xx xxx xxxx" required value={form.phone} onChange={set}/>
              </label>
            </div>
            <label>Visit type
              <select name="type" required value={form.type} onChange={set}>
                <option value="" disabled>Select type…</option>
                {APPOINTMENT_TYPES.map(o=><option key={o}>{o}</option>)}
              </select>
            </label>
            <label>Main concern
              <textarea name="reason" placeholder="Describe your concern…" required value={form.reason} onChange={set}/>
            </label>
            <label>Insurance / HMO <span className="optional">(optional)</span>
              <input name="insurance" type="text" placeholder="PhilHealth, Maxicare…" value={form.insurance} onChange={set}/>
            </label>
          </div>

          <div className="bw-section">
            <p className="bw-section-title">📅 Pick a date</p>
            <MonthPicker
              selected={form.date}
              onSelect={d=>setForm(p=>({...p,date:d,time:''}))}
              bookedDates={bookedDates}
            />
          </div>

          {form.date && (
            <div className="bw-section">
              <p className="bw-section-title">🕐 Pick a time · <span className="bw-date-label">{formatDateFull(form.date)}</span></p>
              <SlotPills
                date={form.date}
                appointments={appointments}
                selected={form.time}
                onSelect={t=>setForm(p=>({...p,time:t}))}
              />
            </div>
          )}

          <button
            type="submit"
            className="primary-btn full-width"
            disabled={!form.date||!form.time}
          >
            {form.date&&form.time
              ? `Review booking → ${formatDateLabel(form.date)} ${fmt12(form.time)}`
              : form.date ? 'Select a time to continue' : 'Select a date to continue'
            }
          </button>
        </form>
      )}

      {/* ─ Step 2 ─ */}
      {step===2 && (
        <form onSubmit={submit} className="bw-form">
          <div className="review-card">
            <div className="review-slot">
              <span className="review-slot-icon">📅</span>
              <div>
                <strong>{formatDateFull(form.date)}</strong>
                <p>{fmt12(form.time)} · 30 minutes</p>
              </div>
            </div>
            <div className="review-divider"/>
            <div className="review-rows">
              <div className="review-row"><span>Patient</span><strong>{form.name}</strong></div>
              <div className="review-row"><span>Mobile</span><strong>{form.phone}</strong></div>
              <div className="review-row"><span>Type</span><strong>{form.type}</strong></div>
              <div className="review-row"><span>Concern</span><strong>{form.reason}</strong></div>
              {form.insurance&&<div className="review-row"><span>Insurance</span><strong>{form.insurance}</strong></div>}
            </div>
          </div>
          <div className="form-actions">
            <button type="button" className="secondary-btn" onClick={()=>setStep(1)} disabled={busy}>← Edit</button>
            <button type="submit" className="primary-btn" disabled={busy}>
              {busy?'Saving…':'✓ Confirm booking'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

/* ── App ───────────────────────────────────────────────── */
function App() {
  const [activeView, setActiveView] = useState('home');
  const [appointments, setAppts]   = useState([]);
  const [todayLabel, setTodayLabel] = useState('');
  const [toast, setToast]          = useState({open:false,message:''});
  const [search, setSearch]        = useState('');
  const [loading, setLoading]      = useState(true);
  const toastRef = useRef(null);

  useEffect(()=>{
    setTodayLabel(new Date().toLocaleDateString(undefined,{weekday:'long',month:'long',day:'numeric'}));
  },[]);
  useEffect(()=>()=>{ if(toastRef.current) clearTimeout(toastRef.current); },[]);

  const loadAppts = async () => {
    setLoading(true);
    try {
      const r = await fetch('/appointments',{headers:{Accept:'application/json'}});
      const d = await r.json();
      setAppts(Array.isArray(d)?d:[]);
    } catch { setAppts([]); }
    finally { setLoading(false); }
  };
  useEffect(()=>{loadAppts();},[]);

  const sorted = useMemo(()=>
    [...appointments].sort((a,b)=>new Date(`${a.date}T${a.time||'00:00'}`)-new Date(`${b.date}T${b.time||'00:00'}`)),
  [appointments]);

  const filtered = useMemo(()=>{
    const q=search.trim().toLowerCase();
    return q?sorted.filter(a=>(a.name||'').toLowerCase().includes(q)||(a.date||'').includes(q)):sorted;
  },[search,sorted]);

  const showToast = msg => {
    setToast({open:true,message:msg});
    if(toastRef.current) clearTimeout(toastRef.current);
    toastRef.current = setTimeout(()=>setToast(p=>({...p,open:false})),3200);
  };

  const jumpTo = v => { setActiveView(v); window.scrollTo({top:0,behavior:'smooth'}); };

  const handleDelete = async id => {
    if(!id||!confirm('Cancel this appointment?')) return;
    try {
      await fetch(`/appointments?id=${id}`,{method:'DELETE'});
      await loadAppts(); showToast('Appointment cancelled.');
    } catch { showToast('Could not cancel.'); }
  };

  return (
    <>
      <div className="app-bg"/>
      <div className="app-shell">

        <header className="topbar">
          <div className="brand-block">
            <div className="brand-icon" aria-hidden>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M2.5 12s3.4-6 9.5-6 9.5 6 9.5 6-3.4 6-9.5 6-9.5-6-9.5-6Z"/>
                <circle cx="12" cy="12" r="3.2"/>
              </svg>
            </div>
            <div>
              <p className="eyebrow">Albacete Eye Center & Medical Clinics</p>
              <h1 className="site-title">Clearer vision, simpler care.</h1>
            </div>
          </div>
          <nav className="topnav">
            {NAV_ITEMS.map(item=>(
              <button key={item.id} type="button"
                className={activeView===item.id?'nav-link active':'nav-link'}
                onClick={()=>jumpTo(item.id)}>
                {item.label}
              </button>
            ))}
          </nav>
        </header>

        <div className="page-grid">
          {/* LEFT */}
          <main className="left-col">
            {activeView==='home'&&(
              <>
                <section className="hero-card card">
                  <div className="hero-images">
                    {GALLERY.map((g,i)=>(
                      <img key={i} src={g.src} alt={g.alt}
                        className={i===0?'hero-img-main':'hero-img-sub'} loading="lazy"/>
                    ))}
                  </div>
                  <div className="hero-copy">
                    <span className="soft-badge">📍 Jaro, Iloilo City</span>
                    <h2>Eye care appointments made simple for patients and staff.</h2>
                    <p>Pick a 30-minute slot on the calendar — your booking goes straight to the clinic queue.</p>
                    <div className="hero-actions">
                      <a href="#booking-form" className="primary-btn">Book a slot ↓</a>
                      <button type="button" className="secondary-btn" onClick={()=>jumpTo('contact')}>📞 Contact</button>
                    </div>
                  </div>
                </section>
                <section className="stats-row">
                  <div className="stat-chip"><strong>{sorted.length}</strong><span>Upcoming</span></div>
                  <div className="stat-chip"><strong>30 min</strong><span>Per slot</span></div>
                  <div className="stat-chip"><strong>8–5 PM</strong><span>Hours</span></div>
                  <div className="stat-chip"><strong>Mon–Sat</strong><span>Open days</span></div>
                </section>
                <section className="services-section card">
                  <p className="section-label">Services</p>
                  <h3>What we offer</h3>
                  <div className="services-grid">
                    {SERVICE_ITEMS.map(s=>(
                      <div className="service-card" key={s.title}>
                        <span className="service-icon">{s.icon}</span>
                        <div><strong>{s.title}</strong><p>{s.text}</p></div>
                      </div>
                    ))}
                  </div>
                </section>
              </>
            )}
            {activeView==='services'&&(
              <section className="services-section card">
                <p className="section-label">All Services</p>
                <h3>Eye clinic services &amp; care workflow</h3>
                <div className="services-grid">
                  {SERVICE_ITEMS.map(s=>(
                    <div className="service-card" key={s.title}>
                      <span className="service-icon">{s.icon}</span>
                      <div><strong>{s.title}</strong><p>{s.text}</p></div>
                    </div>
                  ))}
                </div>
              </section>
            )}
            {activeView==='contact'&&(
              <section className="contact-section card">
                <p className="section-label">Contact</p>
                <h3>Clinic details &amp; location</h3>
                <div className="contact-list">
                  {CONTACT_CARDS.map(c=>(
                    <div className="contact-item" key={c.title}>
                      <span className="contact-icon">{c.icon}</span>
                      <div>
                        <span className="contact-label">{c.title}</span>
                        {c.href
                          ?<a href={c.href} target="_blank" rel="noopener noreferrer">{c.text}</a>
                          :<strong>{c.text}</strong>}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="map-placeholder">
                  <iframe title="Clinic location"
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.5!2d122.563!3d10.734!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zSmFybywgSWxvaWxvIENpdHk!5e0!3m2!1sen!2sph!4v1"
                    width="100%" height="220" style={{border:0,borderRadius:'16px'}} allowFullScreen loading="lazy"
                  />
                </div>
              </section>
            )}
            {activeView==='admin'&&(
              <section className="admin-section card">
                <div className="section-header-row">
                  <div><p className="section-label">Admin · Doctor Schedule</p><h3>{todayLabel}</h3></div>
                  <button type="button" className="secondary-btn sm" onClick={loadAppts}>↻ Refresh</button>
                </div>
                <div className="admin-cal-wrap">
                  <p className="section-label" style={{marginBottom:8}}>Dr. Albacete – Weekly Schedule</p>
                  <WeekCalendar appointments={sorted}/>
                </div>
                <div style={{marginTop:20}}>
                  <input type="text" className="admin-search"
                    placeholder="Search patient name or date…"
                    value={search} onChange={e=>setSearch(e.target.value)}/>
                </div>
                <div className="admin-list">
                  {loading
                    ?Array.from({length:3}).map((_,i)=>(
                        <div className="admin-card skeleton-card" key={i} aria-hidden>
                          <div className="skeleton sk-title"/>
                          <div className="skeleton sk-line"/>
                          <div className="skeleton sk-line short"/>
                        </div>
                      ))
                    :filtered.length===0
                      ?<div className="empty-state">📭 No appointments found.</div>
                      :filtered.map(appt=>(
                        <article className="admin-card" key={appt.id??`${appt.name}-${appt.date}`}>
                          <div className="admin-card-top">
                            <div className="admin-name-row">
                              <h4>{appt.name||'Unnamed'}</h4>
                              <span className={`badge badge-${appt.status||'pending'}`}>{statusLabel(appt.status)}</span>
                            </div>
                            <p className="admin-sub">{appt.doctor||'Doctor TBA'} · {appt.type||'Consultation'}</p>
                            <p className="admin-reason">{appt.reason||'No concern specified'}</p>
                          </div>
                          <div className="admin-card-bottom">
                            <div className="admin-pills">
                              <span>📅 {formatDateLabel(appt.date)}</span>
                              <span>🕐 {fmt12(appt.time)}</span>
                              <span>⏱ 30 min</span>
                              <span>📞 {appt.phone||'—'}</span>
                              {appt.insurance&&<span>🏥 {appt.insurance}</span>}
                            </div>
                            <button type="button" className="danger-btn sm" onClick={()=>handleDelete(appt.id)}>Cancel</button>
                          </div>
                        </article>
                      ))
                  }
                </div>
              </section>
            )}
          </main>

          {/* RIGHT: sticky booking */}
          <aside className="right-col">
            <BookingForm appointments={appointments} onSuccess={msg=>{showToast(msg);loadAppts();}}/>
            <div className="clinic-info-card card">
              <p className="section-label">Clinic info</p>
              <ul className="clinic-info-list">
                <li>📍 JEA Building, E. Lopez St, Jaro</li>
                <li>📞 +63 963 862 9414</li>
                <li>🕐 Mon–Sat · 8:00 AM – 5:00 PM</li>
                <li>📘 <a href="https://www.facebook.com/AlbaceteEyeClinic/" target="_blank" rel="noopener noreferrer">@AlbaceteEyeClinic</a></li>
              </ul>
            </div>
          </aside>
        </div>

        <nav className="bottom-nav">
          {NAV_ITEMS.map(item=>(
            <button key={item.id} type="button"
              className={activeView===item.id?'bnav-btn active':'bnav-btn'}
              onClick={()=>jumpTo(item.id)}>
              {item.label}
            </button>
          ))}
          <a href="#booking-form" className="bnav-btn bnav-book">📅 Book</a>
        </nav>
      </div>

      <div className={`toast${toast.open?' show':''}`} role="status" aria-live="polite">{toast.message}</div>
    </>
  );
}

export default App;
