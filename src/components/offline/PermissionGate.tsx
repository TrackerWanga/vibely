import { Shield, Settings } from 'lucide-react';
import { openAppSettings } from '../../services/permissions';

interface Props {
  onRequestPermission: () => void;
}

export default function PermissionGate({ onRequestPermission }: Props) {
  return (
    <div style={{
      minHeight: '100vh', background: '#06060e', color: '#f1f5f9',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '24px', textAlign: 'center'
    }}>
      <Shield size={80} color="#a78bfa" style={{ marginBottom: '24px' }} />
      <h1 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '12px' }}>Access Your Music</h1>
      <p style={{ color: '#94a3b8', fontSize: '15px', lineHeight: 1.6, marginBottom: '32px', maxWidth: '360px' }}>
        Vibely needs permission to find and play music files stored on your device.
      </p>
      
      <button onClick={onRequestPermission} className="btn-primary" style={{ padding: '16px 40px', fontSize: '16px', width: '100%', maxWidth: '320px', marginBottom: '12px' }}>
        <Shield size={18} /> Grant Permission
      </button>
      
      <button onClick={openAppSettings} style={{ width: '100%', maxWidth: '320px', padding: '14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#94a3b8', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
        <Settings size={16} /> Open App Settings
      </button>
      
      <p style={{ color: '#64748b', fontSize: '11px', marginTop: '16px' }}>
        Settings → Apps → Vibely → Permissions → Music & audio
      </p>
    </div>
  );
}
