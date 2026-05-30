import { useState, useEffect } from 'react';
import { X, Home, Search, Music, Heart, HardDrive, Info, Shield, ExternalLink, User, Smartphone } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { openAppSettings } from '../services/permissions';
import { requestStoragePermission, hasStoragePermission } from '../services/permissions';

export default function Sidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [storageGranted, setStorageGranted] = useState(false);

  useEffect(() => {
    if (isOpen) {
      hasStoragePermission().then(setStorageGranted);
    }
  }, [isOpen]);

  const handleNav = (path: string) => {
    navigate(path);
    onClose();
  };

  const handleStorageRequest = async () => {
    const ok = await requestStoragePermission();
    if (!ok) openAppSettings();
    setStorageGranted(await hasStoragePermission());
  };

  if (!isOpen) return null;

  const navItems = [
    { icon: <Home size={18} />, label: 'Home', path: '/' },
    { icon: <Search size={18} />, label: 'Search', path: '/search' },
    { icon: <Music size={18} />, label: 'Gospel', path: '/gospel' },
    { icon: <Heart size={18} />, label: 'Beloved', path: '/beloved' },
    { icon: <HardDrive size={18} />, label: 'Offline Library', path: '/offline' },
    { icon: <Info size={18} />, label: 'Docs', path: '/docs' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      {/* Overlay */}
      <div onClick={onClose} style={{
        position: 'fixed', inset: 0, zIndex: 300,
        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)'
      }} />
      
      {/* Sidebar */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: '320px', maxWidth: '85vw',
        zIndex: 301, background: '#0a0a18', borderLeft: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <span style={{ fontWeight: 700, fontSize: '16px', color: '#f1f5f9' }}>Menu</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}>
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <div style={{ padding: '8px' }}>
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => handleNav(item.path)}
              style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                width: '100%', padding: '12px 16px',
                background: isActive(item.path) ? 'rgba(124,58,237,0.15)' : 'transparent',
                border: 'none', borderRadius: '10px',
                color: isActive(item.path) ? '#a78bfa' : '#94a3b8',
                fontSize: '14px', fontWeight: isActive(item.path) ? 600 : 400,
                cursor: 'pointer', marginBottom: '2px', transition: 'all 0.15s'
              }}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>

        {/* Divider */}
        <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '8px 16px' }} />

        {/* Storage Permission */}
        <div style={{ padding: '8px' }}>
          <button onClick={handleStorageRequest} style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            width: '100%', padding: '12px 16px',
            background: storageGranted ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
            border: 'none', borderRadius: '10px',
            color: storageGranted ? '#10b981' : '#f59e0b',
            fontSize: '14px', cursor: 'pointer', marginBottom: '2px'
          }}>
            <Shield size={18} />
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontWeight: 600, fontSize: '13px' }}>
                {storageGranted ? '✅ Storage Granted' : '⚠ Storage Permission'}
              </div>
              <div style={{ fontSize: '11px', opacity: 0.8 }}>
                {storageGranted ? 'Music & audio access allowed' : 'Tap to grant music access'}
              </div>
            </div>
          </button>
        </div>

        {/* Divider */}
        <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '8px 16px' }} />

        {/* External Links */}
        <div style={{ padding: '8px' }}>
          <a href="https://music.megan.qzz.io" target="_blank" rel="noopener" style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            width: '100%', padding: '12px 16px',
            background: 'rgba(255,255,255,0.02)',
            border: 'none', borderRadius: '10px',
            color: '#94a3b8', fontSize: '13px',
            cursor: 'pointer', marginBottom: '2px', textDecoration: 'none'
          }}>
            <ExternalLink size={16} />
            Visit music.megan.qzz.io
          </a>
          <a href="https://apps.megan.qzz.io" target="_blank" rel="noopener" style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            width: '100%', padding: '12px 16px',
            background: 'rgba(255,255,255,0.02)',
            border: 'none', borderRadius: '10px',
            color: '#94a3b8', fontSize: '13px',
            cursor: 'pointer', marginBottom: '2px', textDecoration: 'none'
          }}>
            <Smartphone size={16} />
            Download Megan Music App
          </a>
        </div>

        {/* About Section */}
        <div style={{ marginTop: 'auto', padding: '20px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', gap: '14px', alignItems: 'center', marginBottom: '16px' }}>
            <img 
              src="https://files.catbox.moe/r1rptl.png" 
              alt="Tracker Wanga"
              style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(124,58,237,0.4)' }}
            />
            <div>
              <div style={{ fontWeight: 700, fontSize: '15px', color: '#f1f5f9' }}>Tracker Wanga</div>
              <div style={{ color: '#a78bfa', fontSize: '12px' }}>🇰🇪 Kenya • 20 years old</div>
              <div style={{ color: '#64748b', fontSize: '11px', marginTop: '2px' }}>Full-Stack Developer</div>
            </div>
          </div>

          <div style={{ color: '#94a3b8', fontSize: '12px', lineHeight: 1.7, marginBottom: '16px' }}>
            Passionate developer from Kenya with expertise in React, TypeScript, Node.js, Express, Capacitor, and building cross-platform mobile apps. Creator of Vibely, Megan APIs, and Megan Music.
          </div>

          {/* Contact */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' }}>
            <a href="https://wa.me/254758476795" target="_blank" rel="noopener" style={{
              color: '#06b6d4', fontSize: '12px', textDecoration: 'none',
              display: 'flex', alignItems: 'center', gap: '6px'
            }}>
              <ExternalLink size={12} /> WhatsApp: +254 758 476 795
            </a>
          </div>

          {/* Legal */}
          <div style={{ color: '#475569', fontSize: '10px', lineHeight: 1.6, borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '12px' }}>
            <p style={{ fontWeight: 600, color: '#64748b', marginBottom: '4px' }}>© 2026 Vibely by Tracker Wanga</p>
            <p>All rights reserved. Vibely is a music discovery platform that connects users with global artists. Content is streamed via Megan APIs and third-party services. Vibely does not host or store copyrighted music files. All trademarks and copyrights belong to their respective owners.</p>
            <p style={{ marginTop: '8px' }}>For inquiries, contact: tracker.wanga@megan.qzz.io</p>
            <p style={{ marginTop: '4px' }}>Powered by Megan Music • Falcon Tech</p>
          </div>
        </div>
      </div>
    </>
  );
}
