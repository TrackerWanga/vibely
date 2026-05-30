import { useState } from 'react';
import { ArrowLeft, Shield, Bell, Music, Smartphone, Settings, ExternalLink, ChevronDown, ChevronRight, Mail, Phone, Github, MessageCircle, Heart, Zap, Globe, Code, Cpu, Palette } from 'lucide-react';

interface Props { onBack: () => void; }

export default function DocsPage({ onBack }: Props) {
  const [openSection, setOpenSection] = useState<string | null>('permissions');

  const toggle = (section: string) => {
    setOpenSection(openSection === section ? null : section);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#06060e', color: '#f1f5f9' }}>
      {/* Header */}
      <div style={{ 
        padding: '20px 24px', 
        background: 'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(6,182,212,0.1))',
        borderBottom: '1px solid rgba(255,255,255,0.05)'
      }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#a78bfa', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '16px' }}>
          <ArrowLeft size={16} /> Back
        </button>
        <h1 style={{ fontSize: '32px', fontWeight: 900, marginBottom: '8px' }}>
          <Zap size={28} style={{ display: 'inline', marginRight: '10px', color: '#f59e0b' }} />
          Vibely Docs
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '14px' }}>Complete guide to setup permissions and use the app</p>
      </div>

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '24px' }}>

        {/* Quick Start */}
        <div className="glass-card" style={{ padding: '20px', marginBottom: '24px', background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: '16px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Zap size={20} color="#f59e0b" /> Quick Start
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: 1.7 }}>
            Vibely needs two permissions to work fully: <strong style={{ color: '#10b981' }}>Music & Audio</strong> (to play offline files) 
            and <strong style={{ color: '#06b6d4' }}>Notifications</strong> (to show playback controls).
          </p>
        </div>

        {/* Permissions Guide */}
        <div className="glass-card" style={{ padding: '16px', marginBottom: '12px', cursor: 'pointer' }} onClick={() => toggle('permissions')}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Shield size={22} color="#a78bfa" />
              <span style={{ fontWeight: 600, fontSize: '16px' }}>How to Enable Permissions</span>
            </div>
            {openSection === 'permissions' ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
          </div>
          
          {openSection === 'permissions' && (
            <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ color: '#f1f5f9', fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>Step 1: Open App Info</h3>
                <p style={{ color: '#94a3b8', fontSize: '13px', lineHeight: 1.7, marginBottom: '12px' }}>
                  Long press the Vibely app icon → Tap <strong style={{ color: '#a78bfa' }}>App Info</strong> (ℹ️)
                </p>
                <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <img src="/docs/app-info.jpg" alt="App Info" style={{ width: '100%', display: 'block' }} />
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ color: '#f1f5f9', fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>Step 2: Enable Permissions</h3>
                <p style={{ color: '#94a3b8', fontSize: '13px', lineHeight: 1.7, marginBottom: '12px' }}>
                  Tap <strong style={{ color: '#a78bfa' }}>Permissions</strong> → Turn on <strong style={{ color: '#10b981' }}>Music & audio</strong> and <strong style={{ color: '#06b6d4' }}>Notifications</strong>
                </p>
                <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', marginBottom: '8px' }}>
                  <img src="/docs/permissions-off.jpg" alt="Permissions Off" style={{ width: '100%', display: 'block' }} />
                </div>
                <p style={{ color: '#64748b', fontSize: '11px', textAlign: 'center' }}>Both permissions turned off — tap each to enable</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
                <div>
                  <div style={{ borderRadius: '10px', overflow: 'hidden', border: '1px solid rgba(16,185,129,0.3)', marginBottom: '6px' }}>
                    <img src="/docs/music-audio-on.jpg" alt="Music On" style={{ width: '100%', display: 'block' }} />
                  </div>
                  <p style={{ color: '#10b981', fontSize: '11px', textAlign: 'center' }}>✅ Music & audio ON</p>
                </div>
                <div>
                  <div style={{ borderRadius: '10px', overflow: 'hidden', border: '1px solid rgba(6,182,212,0.3)', marginBottom: '6px' }}>
                    <img src="/docs/notification-on.jpg" alt="Notifications On" style={{ width: '100%', display: 'block' }} />
                  </div>
                  <p style={{ color: '#06b6d4', fontSize: '11px', textAlign: 'center' }}>✅ Notifications ON</p>
                </div>
              </div>

              <div style={{ padding: '12px', background: 'rgba(16,185,129,0.1)', borderRadius: '10px', border: '1px solid rgba(16,185,129,0.2)' }}>
                <p style={{ color: '#10b981', fontSize: '13px', textAlign: 'center' }}>
                  🎉 Done! Both permissions enabled. Restart Vibely for best results.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Features */}
        <div className="glass-card" style={{ padding: '16px', marginBottom: '12px', cursor: 'pointer' }} onClick={() => toggle('features')}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Music size={22} color="#7c3aed" />
              <span style={{ fontWeight: 600, fontSize: '16px' }}>Features</span>
            </div>
            {openSection === 'features' ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
          </div>
          {openSection === 'features' && (
            <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { icon: <Globe size={16} color="#06b6d4" />, title: '31 Countries', desc: 'Browse music from 31 countries worldwide' },
                { icon: <Music size={16} color="#a78bfa" />, title: '8,398 Songs', desc: 'Discover 1,689 artists across all genres' },
                { icon: <Zap size={16} color="#f59e0b" />, title: 'Trending Now', desc: 'Real-time trending music from YouTube' },
                { icon: <Smartphone size={16} color="#10b981" />, title: 'Offline Library', desc: 'Play downloaded music without internet' },
                { icon: <Bell size={16} color="#f43f5e" />, title: 'Playback Controls', desc: 'Control music from notification shade' },
                { icon: <Code size={16} color="#7c3aed" />, title: 'Open Source', desc: 'Built with React, Capacitor, and Megan APIs' },
              ].map((f, i) => (
                <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <div style={{ marginTop: '2px' }}>{f.icon}</div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '13px', color: '#f1f5f9' }}>{f.title}</div>
                    <div style={{ color: '#64748b', fontSize: '12px' }}>{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* About Developer */}
        <div className="glass-card" style={{ padding: '16px', marginBottom: '12px', cursor: 'pointer' }} onClick={() => toggle('about')}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Heart size={22} color="#f43f5e" />
              <span style={{ fontWeight: 600, fontSize: '16px' }}>About the Developer</span>
            </div>
            {openSection === 'about' ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
          </div>
          {openSection === 'about' && (
            <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <img 
                  src="https://files.catbox.moe/r1rptl.png" 
                  alt="Tracker Wanga"
                  style={{ width: '150px', height: '150px', borderRadius: '50%', objectFit: 'cover', border: '3px solid rgba(124,58,237,0.5)', marginBottom: '12px' }}
                />
                <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '4px' }}>Tracker Wanga</h3>
                <p style={{ color: '#a78bfa', fontSize: '13px' }}>🇰🇪 Kenya • 20 Years Old</p>
                <p style={{ color: '#64748b', fontSize: '12px', marginTop: '4px' }}>Full-Stack Developer & Creator</p>
              </div>

              <p style={{ color: '#94a3b8', fontSize: '13px', lineHeight: 1.8, textAlign: 'center', marginBottom: '20px' }}>
                Passionate developer from Kenya building the future of music discovery. 
                Expert in <strong style={{ color: '#a78bfa' }}>React</strong>, <strong style={{ color: '#06b6d4' }}>TypeScript</strong>, 
                <strong style={{ color: '#10b981' }}> Node.js</strong>, <strong style={{ color: '#f59e0b' }}>Capacitor</strong>, 
                and cross-platform mobile development.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '20px' }}>
                {[
                  { icon: <Cpu size={16} />, label: 'React & Vite', color: '#06b6d4' },
                  { icon: <Palette size={16} />, label: 'TypeScript', color: '#7c3aed' },
                  { icon: <Globe size={16} />, label: 'Node.js & Express', color: '#10b981' },
                  { icon: <Smartphone size={16} />, label: 'Capacitor Apps', color: '#f59e0b' },
                  { icon: <Code size={16} />, label: 'Megan APIs', color: '#f43f5e' },
                  { icon: <Zap size={16} />, label: 'Falcon Tech', color: '#a78bfa' },
                ].map((s, i) => (
                  <div key={i} style={{ padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', textAlign: 'center' }}>
                    <div style={{ color: s.color, marginBottom: '4px' }}>{s.icon}</div>
                    <div style={{ color: '#94a3b8', fontSize: '11px' }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Contact Links */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <a href="https://whatsapp.com/channel/0029Vb7FYNA8qIzs2P5dcE37" target="_blank" rel="noopener" style={{
                  display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px',
                  background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)',
                  borderRadius: '10px', color: '#10b981', textDecoration: 'none', fontSize: '13px'
                }}>
                  <MessageCircle size={18} /> WhatsApp Channel: 𝐌𝐄𝐆𝐀𝐍-𝐗𝐌𝐃
                </a>
                <a href="https://wa.me/254758476795" target="_blank" rel="noopener" style={{
                  display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px',
                  background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.2)',
                  borderRadius: '10px', color: '#06b6d4', textDecoration: 'none', fontSize: '13px'
                }}>
                  <Phone size={18} /> +254 758 476 795
                </a>
                <a href="https://github.com/TrackerWanga" target="_blank" rel="noopener" style={{
                  display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px',
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '10px', color: '#f1f5f9', textDecoration: 'none', fontSize: '13px'
                }}>
                  <Github size={18} /> Tracker Wanga
                </a>
                <a href="mailto:tracker.wanga@megan.qzz.io" style={{
                  display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px',
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '10px', color: '#94a3b8', textDecoration: 'none', fontSize: '13px'
                }}>
                  <Mail size={18} /> tracker.wanga@megan.qzz.io
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Legal */}
        <div style={{ textAlign: 'center', padding: '24px', color: '#475569', fontSize: '11px', lineHeight: 1.6 }}>
          <p style={{ fontWeight: 600, color: '#64748b', marginBottom: '4px' }}>© 2026 Vibely by Tracker Wanga</p>
          <p>Powered by Megan Music • Falcon Tech</p>
          <p style={{ marginTop: '8px' }}>Version 2.1.0 • 1,689 Artists • 8,398 Songs • 31 Countries</p>
        </div>
      </div>
    </div>
  );
}
