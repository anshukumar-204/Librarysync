import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Monitor, Smartphone, Tablet, Globe, XCircle, Loader2, Clock, MapPin, ShieldCheck } from 'lucide-react';
import { toast } from 'react-hot-toast';
import API from '../services/api';
import { clearAuthSession } from '../store/slices/authSlice';

const getDeviceIcon = (type) => {
  switch (type?.toLowerCase()) {
    case 'mobile':
      return <Smartphone className="text-emerald-400" size={18} />;
    case 'tablet':
      return <Tablet className="text-sky-400" size={18} />;
    default:
      return <Monitor className="text-indigo-400" size={18} />;
  }
};

const getLocationLabel = (session) => {
  const location = session?.location;
  const locationParts = [
    location?.city,
    location?.district,
    location?.region,
    location?.state,
    location?.country,
    session?.city,
    session?.region,
    session?.state,
    session?.country,
    session?.locationName,
    session?.placeName
  ].filter(Boolean);

  if (locationParts.length > 0) {
    return locationParts.join(', ');
  }

  if (typeof location === 'string' && location.trim()) {
    return location;
  }

  if (session?.latitude && session?.longitude) {
    return 'Location captured';
  }

  return session?.ipAddress || 'Unknown location';
};

const getLastActiveLabel = (value) => {
  if (!value) return 'Unknown activity';

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Unknown activity';

  return parsed.toLocaleString([], {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const ActiveSessions = ({ studentId = null, isAdmin = false }) => {
  const dispatch = useDispatch();
  const reduxSessionId = useSelector((state) => state.adminAuth?.sessionId);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [revokingId, setRevokingId] = useState(null);
  const currentSessionId = reduxSessionId || localStorage.getItem('sessionId');

  useEffect(() => {
    let isMounted = true;

    const fetchSessions = async () => {
      setLoading(true);
      setSessions([]);

      try {
        const url = isAdmin && studentId
          ? `/students/${studentId}/sessions`
          : '/students/sessions';

        const response = await API.get(url);
        const nextSessions = response?.data?.data;

        if (isMounted) {
          setSessions(Array.isArray(nextSessions) ? nextSessions : []);
        }
      } catch (error) {
        if (isMounted) {
          setSessions([]);
          toast.error('Could not load active devices');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchSessions();

    return () => {
      isMounted = false;
    };
  }, [studentId, isAdmin, currentSessionId]);

  const handleRevoke = async (sessionId) => {
    if (!window.confirm('Are you sure you want to logout this device?')) return;

    setRevokingId(sessionId);
    try {
      const url = isAdmin && studentId
        ? `/students/${studentId}/sessions/${sessionId}`
        : `/students/sessions/${sessionId}`;

      const response = await API.delete(url);

      if (response?.data?.success) {
        toast.success(sessionId === currentSessionId ? 'Current device logged out' : 'Device logged out');
        setSessions((prevSessions) => prevSessions.filter((session) => session.id !== sessionId));

        if (sessionId === currentSessionId) {
          dispatch(clearAuthSession());
          window.location.replace('/login');
          return;
        }
      }
    } catch (error) {
      toast.error('Failed to revoke session');
    } finally {
      setRevokingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-[2rem] border border-white/5 bg-zinc-950/40 p-8 sm:p-12">
        <Loader2 className="animate-spin text-zinc-500" size={24} />
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="rounded-[2rem] border border-white/5 bg-zinc-950/40 p-8 text-center">
        <Globe className="mx-auto mb-3 text-zinc-700" size={30} />
        <p className="text-sm font-semibold text-zinc-400">No active sessions found</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {sessions.map((session) => {
        const isCurrentSession = session.id === currentSessionId;

        return (
          <div
            key={session.id}
            className={`rounded-[2rem] border p-4 sm:p-5 transition-all ${
              isCurrentSession
                ? 'border-emerald-500/30 bg-emerald-500/5'
                : 'border-white/5 bg-zinc-900/40 hover:border-white/10'
            }`}
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-zinc-800">
                    {getDeviceIcon(session.deviceType)}
                  </div>

                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="truncate text-sm font-bold tracking-tight text-white sm:text-base">
                        {session.browser || 'Unknown Browser'} on {session.os || 'Unknown OS'}
                      </h4>
                      {isCurrentSession && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.18em] text-white">
                          <ShieldCheck size={10} />
                          This Device
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 gap-2 text-[11px] font-semibold text-zinc-400 sm:grid-cols-2">
                      <div className="flex items-center gap-2 rounded-xl bg-black/20 px-3 py-2">
                        <MapPin size={12} className="shrink-0 text-zinc-500" />
                        <span className="truncate">{getLocationLabel(session)}</span>
                      </div>
                      <div className="flex items-center gap-2 rounded-xl bg-black/20 px-3 py-2">
                        <Clock size={12} className="shrink-0 text-zinc-500" />
                        <span className="truncate">Last active {getLastActiveLabel(session.lastActiveAt)}</span>
                      </div>
                    </div>

                    {session.ipAddress && getLocationLabel(session) !== session.ipAddress && (
                      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                        IP {session.ipAddress}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleRevoke(session.id)}
                disabled={revokingId === session.id}
                className="flex h-11 w-full shrink-0 items-center justify-center rounded-2xl border border-white/5 bg-white/[0.03] text-zinc-500 transition-all hover:border-rose-500/20 hover:bg-rose-500/10 hover:text-rose-400 disabled:opacity-50 sm:w-11"
                title="Logout this device"
              >
                {revokingId === session.id ? <Loader2 className="animate-spin" size={18} /> : <XCircle size={18} />}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ActiveSessions;
