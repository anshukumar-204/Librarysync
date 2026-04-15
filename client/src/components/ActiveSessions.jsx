import React, { useState, useEffect } from 'react';
import { Monitor, Smartphone, Tablet, Globe, XCircle, Loader2, Shield, Clock, MapPin } from 'lucide-react';
import API from '../services/api';
import { toast } from 'react-hot-toast';


const ActiveSessions = ({ studentId = null, isAdmin = false }) => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [revokingId, setRevokingId] = useState(null);
  const currentSessionId = localStorage.getItem('sessionId');

  const fetchSessions = async () => {
    try {
      const url = isAdmin && studentId 
        ? `/students/${studentId}/sessions`
        : `/students/sessions`;
      
      const response = await API.get(url);
      
      if (response.data.success) {
        setSessions(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
      toast.error('Could not load active devices');
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchSessions();
  }, [studentId]);

  const handleRevoke = async (sessionId) => {
    if (!window.confirm('Are you sure you want to logout this device?')) return;
    
    setRevokingId(sessionId);
    try {
      const url = isAdmin && studentId
        ? `/students/${studentId}/sessions/${sessionId}`
        : `/students/sessions/${sessionId}`;
        
      const response = await API.delete(url);

      if (response.data.success) {

        toast.success('Device logged out');
        setSessions(sessions.filter(s => s.id !== sessionId));
        // If user logs out their own current session, they'll be kicked out by interceptors
        if (sessionId === currentSessionId) {
          window.location.href = '/login';
        }
      }
    } catch (error) {
      toast.error('Failed to revoke session');
    } finally {
      setRevokingId(null);
    }
  };

  const getDeviceIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'mobile': return <Smartphone className="text-emerald-500" size={20} />;
      case 'tablet': return <Tablet className="text-blue-500" size={20} />;
      default: return <Monitor className="text-indigo-500" size={20} />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="animate-spin text-zinc-500" size={24} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sessions.length === 0 ? (
        <div className="text-center p-8 bg-zinc-900/50 border border-white/5 rounded-3xl">
          <Globe className="mx-auto text-zinc-700 mb-3" size={32} />
          <p className="text-zinc-500 text-sm font-medium">No active sessions found</p>
        </div>
      ) : (
        sessions.map((session) => (
          <div 
            key={session.id}
            className={`flex items-center justify-between p-5 bg-zinc-900/40 border ${session.id === currentSessionId ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-white/5'} rounded-3xl group hover:border-white/10 transition-all`}
          >
            <div className="flex items-start gap-4">
              <div className="p-3 bg-zinc-800 rounded-2xl group-hover:scale-110 transition-transform">
                {getDeviceIcon(session.deviceType)}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-white font-bold text-sm tracking-tight">
                    {session.browser || 'Unknown Browser'} on {session.os || 'Unknown OS'}
                  </h4>
                  {session.id === currentSessionId && (
                    <span className="px-2 py-0.5 bg-emerald-500 text-[8px] font-black text-white uppercase tracking-widest rounded-full">
                      This Device
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                  <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                    <MapPin size={10} />
                    {session.ipAddress || 'Unknown IP'}
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                    <Clock size={10} />
                    Last active: {new Date(session.lastActiveAt).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => handleRevoke(session.id)}
              disabled={revokingId === session.id}
              className="p-2 text-zinc-600 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all disabled:opacity-50"
              title="Logout this device"
            >
              {revokingId === session.id ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <XCircle size={18} />
              )}
            </button>
          </div>
        ))
      )}
    </div>
  );
};

export default ActiveSessions;
