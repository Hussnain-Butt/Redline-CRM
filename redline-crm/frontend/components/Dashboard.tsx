import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area } from 'recharts';
import { PhoneIncoming, PhoneOutgoing, Voicemail, TrendingUp, Users, MessageSquare, Sparkles, Bell, Clock, ChevronRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { CallLog, Contact, SMSMessage } from '../types';

// Import Reminder type
export interface Reminder {
  id: string;
  contactId?: string;
  contactName?: string;
  type: 'call' | 'email' | 'meeting' | 'task';
  title: string;
  notes?: string;
  dueDate: Date;
  dueTime?: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'completed' | 'snoozed';
  createdAt: Date;
  updatedAt: Date;
}

interface DashboardProps {
  logs: CallLog[];
  contacts: Contact[];
  sms: SMSMessage[];
  reminders?: Reminder[];
  onNavigateToReminders?: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ logs, contacts, sms, reminders = [], onNavigateToReminders }) => {
  // Calculate real stats from logs
  const stats = useMemo(() => {
    const inbound = logs.filter(l => l.type === 'inbound').length;
    const outbound = logs.filter(l => l.type === 'outbound').length;
    const missed = logs.filter(l => l.type === 'missed').length;
    const total = logs.length;
    return { total, inbound, outbound, missed };
  }, [logs]);

  // Calculate weekly performance from real data
  const weeklyData = useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const result = days.map(name => ({ name, calls: 0 }));

    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    logs.forEach(log => {
      const logDate = new Date(log.date);
      if (logDate >= oneWeekAgo) {
        let dayIndex = logDate.getDay() - 1; // 0 = Monday in our array
        if (dayIndex < 0) dayIndex = 6; // Sunday
        result[dayIndex].calls++;
      }
    });

    return result;
  }, [logs]);

  // Calculate today's call volume by time slot
  const dailyVolumeData = useMemo(() => {
    const timeSlots = [
      { time: '9am', volume: 0, startHour: 9, endHour: 11 },
      { time: '11am', volume: 0, startHour: 11, endHour: 13 },
      { time: '1pm', volume: 0, startHour: 13, endHour: 15 },
      { time: '3pm', volume: 0, startHour: 15, endHour: 17 },
      { time: '5pm', volume: 0, startHour: 17, endHour: 24 },
    ];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    logs.forEach(log => {
      const logDate = new Date(log.date);
      if (logDate >= today) {
        const hour = logDate.getHours();
        const slot = timeSlots.find(s => hour >= s.startHour && hour < s.endHour);
        if (slot) slot.volume++;
      }
    });

    return timeSlots.map(({ time, volume }) => ({ time, volume }));
  }, [logs]);

  // Calculate week-over-week change
  const weeklyChange = useMemo(() => {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const thisWeek = logs.filter(l => new Date(l.date) >= oneWeekAgo).length;
    const lastWeek = logs.filter(l => {
      const d = new Date(l.date);
      return d >= twoWeeksAgo && d < oneWeekAgo;
    }).length;

    if (lastWeek === 0) return thisWeek > 0 ? 100 : 0;
    return Math.round(((thisWeek - lastWeek) / lastWeek) * 100);
  }, [logs]);

  // Get real stats using props
  const newLeadsCount = useMemo(() => contacts.filter(c => c.status === 'Lead').length, [contacts]);

  // Get today's reminders (real data from backend)
  const todayReminders = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return reminders
      .filter(r => {
        const dueDate = new Date(r.dueDate);
        return r.status === 'pending' && dueDate >= today && dueDate < tomorrow;
      })
      .sort((a, b) => {
        // Sort by priority first (high > medium > low)
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
        if (priorityDiff !== 0) return priorityDiff;
        
        // Then by time
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      })
      .slice(0, 3); // Show max 3 tasks
  }, [reminders]);

  // Calculate stale leads (not contacted in 7+ days)
  const staleLeadsCount = useMemo(() => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    return contacts.filter(contact => {
      if (contact.status !== 'Lead') return false;
      
      // Check if contact has any recent activity
      const recentCalls = logs.some(log => 
        log.contactId === contact.id && new Date(log.date) >= sevenDaysAgo
      );
      const recentSMS = sms.some(msg => 
        msg.contactId === contact.id && new Date(msg.timestamp) >= sevenDaysAgo
      );
      
      return !recentCalls && !recentSMS;
    }).length;
  }, [contacts, logs, sms]);

  const StatCard = ({ title, value, icon: Icon, gradient, change }: any) => (
    <div className="stat-card group">
      <div className="stat-card-glow" />
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-neutral-500 mb-1">{title}</p>
          <h3 className="text-3xl font-bold text-neutral-900">{value}</h3>
          {change !== undefined && (
            <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              <TrendingUp className={`w-3 h-3 ${change < 0 ? 'rotate-180' : ''}`} />
              <span>{change >= 0 ? '+' : ''}{change}% from last week</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-xl ${gradient} text-white shadow-lg`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-8 h-full overflow-y-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-neutral-900">Dashboard</h1>
        <p className="text-neutral-500 mt-1">Welcome back, here is your daily activity.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard 
          title="Total Calls" 
          value={stats.total} 
          icon={PhoneIncoming} 
          gradient="bg-gradient-to-br from-blue-500 to-blue-600"
          change={weeklyChange}
        />
        <StatCard 
          title="Outbound" 
          value={stats.outbound} 
          icon={PhoneOutgoing} 
          gradient="bg-gradient-to-br from-green-500 to-emerald-600"
        />
        <StatCard 
          title="Missed" 
          value={stats.missed} 
          icon={Voicemail} 
          gradient="bg-gradient-to-br from-red-500 to-rose-600"
        />
        <StatCard 
          title="New Leads" 
          value={newLeadsCount} 
          icon={Users} 
          gradient="bg-gradient-to-br from-purple-500 to-violet-600"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Weekly Performance Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-neutral-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-neutral-900">Weekly Performance</h3>
              <p className="text-sm text-neutral-500">Call activity over the week</p>
            </div>
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${weeklyChange >= 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
              <TrendingUp className={`w-4 h-4 ${weeklyChange < 0 ? 'rotate-180' : ''}`} />
              <span>{weeklyChange >= 0 ? '+' : ''}{weeklyChange}%</span>
            </div>
          </div>
          <div className="h-64">
            {stats.total === 0 ? (
              <div className="h-full flex items-center justify-center text-neutral-400">
                <div className="text-center">
                  <PhoneOutgoing className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p>No call data yet</p>
                  <p className="text-sm">Make some calls to see your performance</p>
                </div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData}>
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#dc2626" />
                      <stop offset="100%" stopColor="#f97316" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f5" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#737373', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#737373', fontSize: 12 }} />
                  <Tooltip 
                    cursor={{ fill: '#fafafa' }} 
                    contentStyle={{ 
                      borderRadius: '12px', 
                      border: 'none', 
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      padding: '8px 12px'
                    }} 
                  />
                  <Bar dataKey="calls" fill="url(#barGradient)" radius={[8, 8, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Today's Tasks Widget */}
        <div className="bg-white p-6 rounded-2xl border border-neutral-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-red-500" />
              <h3 className="text-lg font-bold text-neutral-900">Today's Tasks</h3>
            </div>
            <span className="px-2.5 py-1 bg-red-100 text-red-600 text-xs font-semibold rounded-full">
              {todayReminders.length}
            </span>
          </div>
          
          <div className="space-y-3">
            {todayReminders.length === 0 ? (
              <div className="text-center py-8 text-neutral-400">
                <Bell className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No tasks for today</p>
                <p className="text-xs mt-1">You're all caught up! 🎉</p>
              </div>
            ) : (
              todayReminders.map(reminder => (
                <div key={reminder.id} className="flex items-center gap-3 p-3 bg-neutral-50 rounded-xl hover:bg-neutral-100 transition-colors cursor-pointer">
                  <div className={`w-2 h-2 rounded-full ${
                    reminder.priority === 'high' ? 'bg-red-500' : 
                    reminder.priority === 'medium' ? 'bg-amber-500' : 'bg-green-500'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-neutral-900 truncate">{reminder.title}</p>
                    <p className="text-xs text-neutral-500">
                      {reminder.dueTime || new Date(reminder.dueDate).toLocaleTimeString('en-US', { 
                        hour: 'numeric', 
                        minute: '2-digit',
                        hour12: true 
                      })}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-neutral-400" />
                </div>
              ))
            )}
          </div>

          <button 
            onClick={onNavigateToReminders}
            className="w-full mt-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-colors"
          >
            View All Reminders
          </button>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Call Volume Chart */}
        <div className="bg-white p-6 rounded-2xl border border-neutral-100 shadow-sm">
          <h3 className="text-lg font-bold text-neutral-900 mb-2">Call Volume (Today)</h3>
          <p className="text-sm text-neutral-500 mb-6">Hourly distribution of calls</p>
          <div className="h-48">
            {dailyVolumeData.every(d => d.volume === 0) ? (
              <div className="h-full flex items-center justify-center text-neutral-400">
                <div className="text-center">
                  <PhoneIncoming className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No calls today</p>
                </div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyVolumeData}>
                  <defs>
                    <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#dc2626" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#dc2626" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f5" />
                  <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: '#737373', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#737373', fontSize: 12 }} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                  <Area type="monotone" dataKey="volume" stroke="#dc2626" strokeWidth={3} fillOpacity={1} fill="url(#colorVolume)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* AI Insights Card */}
        <div className="bg-gradient-to-br from-neutral-900 to-neutral-800 p-6 rounded-2xl text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-full blur-3xl" />
          
          <div className="relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-gradient-to-r from-red-500 to-orange-500 rounded-xl">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold">AI Insights</h3>
            </div>

            <div className="space-y-4">
              {/* Dynamic insight based on weekly change */}
              {weeklyChange >= 0 ? (
                <div className="flex items-start gap-3 p-4 bg-white/5 rounded-xl border border-white/10">
                  <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium">
                      {weeklyChange > 20 ? 'Excellent performance!' : 'Great engagement this week!'}
                    </p>
                    <p className="text-xs text-neutral-400 mt-1">
                      Your call volume is up {weeklyChange}% compared to last week. Keep it going!
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3 p-4 bg-white/5 rounded-xl border border-white/10">
                  <AlertCircle className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium">Activity decreased this week</p>
                    <p className="text-xs text-neutral-400 mt-1">
                      Your call volume is down {Math.abs(weeklyChange)}% from last week. Let's boost those numbers!
                    </p>
                  </div>
                </div>
              )}

              {/* Dynamic insight based on stale leads */}
              {staleLeadsCount > 0 ? (
                <div className="flex items-start gap-3 p-4 bg-white/5 rounded-xl border border-white/10">
                  <AlertCircle className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium">{staleLeadsCount} lead{staleLeadsCount > 1 ? 's' : ''} need{staleLeadsCount === 1 ? 's' : ''} attention</p>
                    <p className="text-xs text-neutral-400 mt-1">
                      These leads haven't been contacted in over 7 days.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3 p-4 bg-white/5 rounded-xl border border-white/10">
                  <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium">All leads are up to date!</p>
                    <p className="text-xs text-neutral-400 mt-1">
                      Great job staying on top of your leads. Keep up the momentum!
                    </p>
                  </div>
                </div>
              )}
            </div>

            <button className="mt-4 w-full py-2.5 bg-white/10 hover:bg-white/20 text-white text-sm font-medium rounded-xl transition-colors border border-white/10">
              Ask AI Assistant
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
