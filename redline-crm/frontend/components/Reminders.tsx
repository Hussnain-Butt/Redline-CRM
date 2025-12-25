import React, { useState, useEffect } from 'react';
import {
    Bell, Plus, Search, Calendar, Clock, Phone, Mail, Users,
    CheckCircle2, AlertCircle, X, ChevronDown, Flag, Filter,
    MoreHorizontal, Trash2, Edit3, CalendarDays, Loader2
} from 'lucide-react';
import { reminderApi, Reminder, CreateReminderDTO } from '../services/reminderApi';

const typeConfig: { [key: string]: { icon: any, color: string, bg: string } } = {
    call: { icon: Phone, color: 'text-blue-500', bg: 'bg-blue-50' },
    email: { icon: Mail, color: 'text-purple-500', bg: 'bg-purple-50' },
    meeting: { icon: Users, color: 'text-green-500', bg: 'bg-green-50' },
    task: { icon: CheckCircle2, color: 'text-orange-500', bg: 'bg-orange-50' }
};

const priorityConfig: { [key: string]: { label: string, color: string, dot: string } } = {
    high: { label: 'High', color: 'bg-red-100 text-red-700', dot: 'bg-red-500' },
    medium: { label: 'Medium', color: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' },
    low: { label: 'Low', color: 'bg-green-100 text-green-700', dot: 'bg-green-500' }
};

const Reminders: React.FC = () => {
    const [reminders, setReminders] = useState<Reminder[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<string | null>(null);
    const [filterPriority, setFilterPriority] = useState<string | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [view, setView] = useState<'list' | 'calendar'>('list');

    // Form state
    const [newReminder, setNewReminder] = useState<CreateReminderDTO>({
        title: '',
        type: 'task',
        priority: 'medium',
        dueDate: new Date().toISOString().split('T')[0],
        dueTime: '',
        notes: ''
    });
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        loadReminders();
    }, []);

    const loadReminders = async () => {
        try {
            setIsLoading(true);
            const data = await reminderApi.getAll();
            setReminders(data);
        } catch (error) {
            console.error('Failed to load reminders:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateReminder = async () => {
        if (!newReminder.title || !newReminder.dueDate) {
            alert('Please fill in Title and Date');
            return;
        }

        try {
            setIsCreating(true);
            await reminderApi.create(newReminder);
            await loadReminders();
            setShowCreateModal(false);
            setNewReminder({
                title: '',
                type: 'task',
                priority: 'medium',
                dueDate: new Date().toISOString().split('T')[0],
                dueTime: '',
                notes: ''
            });
        } catch (error) {
            console.error('Failed to create reminder:', error);
            alert('Failed to create reminder');
        } finally {
            setIsCreating(false);
        }
    };

    const markComplete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            // Optimistic update
            setReminders(prev => prev.map(r => 
                r.id === id ? { ...r, status: 'completed' } : r
            ));
            await reminderApi.updateStatus(id, 'completed');
        } catch (error) {
            console.error('Failed to update status:', error);
            loadReminders(); // Revert on failure
        }
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('Are you sure you want to delete this reminder?')) return;

        try {
            await reminderApi.delete(id);
            setReminders(prev => prev.filter(r => r.id !== id));
        } catch (error) {
            console.error('Failed to delete reminder:', error);
        }
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const isOverdue = (date: Date) => {
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        return d < today;
    };

    const isToday = (date: Date) => {
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        return d.getTime() === today.getTime();
    };

    const filteredReminders = reminders.filter(r => {
        const matchesSearch = r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (r.contactName || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = !filterType || r.type === filterType;
        const matchesPriority = !filterPriority || r.priority === filterPriority;
        return matchesSearch && matchesType && matchesPriority;
    });

    const sortReminders = (list: Reminder[]) => {
        return list.sort((a, b) => {
            return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        });
    }

    const pendingReminders = filteredReminders.filter(r => r.status !== 'completed');
    const overdueReminders = sortReminders(pendingReminders.filter(r => isOverdue(r.dueDate)));
    const todayReminders = sortReminders(pendingReminders.filter(r => isToday(r.dueDate)));
    const upcomingReminders = sortReminders(pendingReminders.filter(r => !isOverdue(r.dueDate) && !isToday(r.dueDate)));

    const ReminderCard = ({ reminder }: { reminder: Reminder }) => {
        const TypeIcon = typeConfig[reminder.type]?.icon || CheckCircle2;
        const overdue = isOverdue(reminder.dueDate);
        
        return (
            <div className={`reminder-card ${overdue ? 'overdue' : ''} group relative`}>
                 {/* Delete Button */}
                 <button
                    onClick={(e) => handleDelete(reminder.id, e)}
                    className="absolute top-2 right-2 p-1.5 text-neutral-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-white/80 rounded"
                >
                    <Trash2 className="w-4 h-4" />
                </button>

                <div className={`p-2.5 rounded-xl ${typeConfig[reminder.type]?.bg || 'bg-gray-50'}`}>
                    <TypeIcon className={`w-5 h-5 ${typeConfig[reminder.type]?.color || 'text-gray-500'}`} />
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-neutral-900 truncate pr-6">{reminder.title}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${priorityConfig[reminder.priority]?.color}`}>
                            {priorityConfig[reminder.priority]?.label}
                        </span>
                    </div>
                    {reminder.contactName && <p className="text-sm text-neutral-500">{reminder.contactName}</p>}
                    <div className="flex items-center gap-3 mt-2 text-xs text-neutral-400">
                        {reminder.dueTime && (
                             <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                {reminder.dueTime}
                            </span>
                        )}
                        <span className="flex items-center gap-1">
                            <CalendarDays className="w-3.5 h-3.5" />
                            {new Date(reminder.dueDate).toLocaleDateString()}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-1">
                    <button
                        onClick={(e) => markComplete(reminder.id, e)}
                        className="p-2 text-neutral-400 hover:text-green-500 hover:bg-green-50 rounded-lg transition-colors"
                        title="Mark Complete"
                    >
                        <CheckCircle2 className="w-5 h-5" />
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="h-full flex flex-col bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-neutral-100 bg-gradient-to-r from-neutral-50 to-white">
                <div className="flex justify-between items-center mb-5">
                    <div>
                        <h2 className="text-2xl font-bold text-neutral-900">Reminders</h2>
                        <p className="text-sm text-neutral-500 mt-1">Stay on top of your follow-ups</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex bg-neutral-100 rounded-xl p-1">
                            <button
                                onClick={() => setView('list')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${view === 'list' ? 'bg-white shadow-sm text-neutral-900' : 'text-neutral-500'}`}
                            >
                                List
                            </button>
                            <button
                                onClick={() => setView('calendar')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${view === 'calendar' ? 'bg-white shadow-sm text-neutral-900' : 'text-neutral-500'}`}
                            >
                                Calendar
                            </button>
                        </div>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-red-600 to-orange-500 text-white rounded-xl font-medium hover:opacity-90 transition-opacity shadow-lg shadow-red-500/25"
                        >
                            <Plus className="w-4 h-4" />
                            Add Reminder
                        </button>
                    </div>
                </div>

                {/* Search & Filters */}
                <div className="flex gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                        <input
                            type="text"
                            placeholder="Search reminders..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                        />
                    </div>

                    <div className="relative">
                        <button
                            onClick={() => setFilterType(filterType ? null : 'call')}
                            className={`flex items-center gap-2 px-4 py-3 border rounded-xl transition-colors ${filterType === 'call' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-neutral-50 border-neutral-200 hover:bg-neutral-100'}`}
                        >
                            <Filter className="w-4 h-4 text-neutral-500" />
                            <span className="text-sm">Type</span>
                            <ChevronDown className="w-4 h-4 text-neutral-400" />
                        </button>
                    </div>

                    <div className="relative">
                        <button
                            onClick={() => setFilterPriority(filterPriority ? null : 'high')}
                            className={`flex items-center gap-2 px-4 py-3 border rounded-xl transition-colors ${filterPriority === 'high' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-neutral-50 border-neutral-200 hover:bg-neutral-100'}`}
                        >
                            <Flag className="w-4 h-4 text-neutral-500" />
                            <span className="text-sm">Priority</span>
                            <ChevronDown className="w-4 h-4 text-neutral-400" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Reminder List */}
            <div className="flex-1 overflow-y-auto p-6">
                {isLoading ? (
                     <div className="flex flex-col items-center justify-center h-full text-neutral-400">
                        <Loader2 className="w-8 h-8 animate-spin mb-2" />
                        <p>Loading reminders...</p>
                    </div>
                ) : filteredReminders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-neutral-400">
                        <Bell className="w-16 h-16 mb-4 opacity-20" />
                        <p className="text-lg font-medium">No reminders</p>
                        <p className="text-sm mt-1">Create your first reminder to get started</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {overdueReminders.length > 0 && (
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <AlertCircle className="w-5 h-5 text-red-500" />
                                    <h3 className="text-sm font-semibold text-red-600 uppercase tracking-wide">
                                        Overdue ({overdueReminders.length})
                                    </h3>
                                </div>
                                <div className="space-y-2">
                                    {overdueReminders.map(reminder => (
                                        <ReminderCard key={reminder.id} reminder={reminder} />
                                    ))}
                                </div>
                            </div>
                        )}

                        {todayReminders.length > 0 && (
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <Calendar className="w-5 h-5 text-blue-500" />
                                    <h3 className="text-sm font-semibold text-neutral-600 uppercase tracking-wide">
                                        Today ({todayReminders.length})
                                    </h3>
                                </div>
                                <div className="space-y-2">
                                    {todayReminders.map(reminder => (
                                        <ReminderCard key={reminder.id} reminder={reminder} />
                                    ))}
                                </div>
                            </div>
                        )}

                        {upcomingReminders.length > 0 && (
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <Clock className="w-5 h-5 text-neutral-400" />
                                    <h3 className="text-sm font-semibold text-neutral-600 uppercase tracking-wide">
                                        Upcoming ({upcomingReminders.length})
                                    </h3>
                                </div>
                                <div className="space-y-2">
                                    {upcomingReminders.map(reminder => (
                                        <ReminderCard key={reminder.id} reminder={reminder} />
                                    ))}
                                </div>
                            </div>
                        )}
                        
                        {pendingReminders.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-10 text-neutral-400">
                                <CheckCircle2 className="w-12 h-12 mb-3 text-green-100" />
                                <p className="text-lg font-medium text-neutral-500">All caught up!</p>
                                <p className="text-sm">No pending reminders.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Create Reminder Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-slide-up">
                        <div className="flex items-center justify-between p-6 border-b border-neutral-100">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-gradient-to-r from-red-500 to-orange-500 rounded-xl text-white">
                                    <Bell className="w-5 h-5" />
                                </div>
                                <h3 className="text-xl font-bold text-neutral-900">New Reminder</h3>
                            </div>
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="p-2 hover:bg-neutral-100 rounded-xl transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-2">Title</label>
                                <input
                                    type="text"
                                    placeholder="e.g., Follow-up call with John"
                                    value={newReminder.title}
                                    onChange={(e) => setNewReminder({ ...newReminder, title: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-2">Type</label>
                                    <select 
                                        value={newReminder.type}
                                        onChange={(e) => setNewReminder({ ...newReminder, type: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                                    >
                                        <option value="call">📞 Call</option>
                                        <option value="email">📧 Email</option>
                                        <option value="meeting">👥 Meeting</option>
                                        <option value="task">✅ Task</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-2">Priority</label>
                                    <select 
                                        value={newReminder.priority}
                                        onChange={(e) => setNewReminder({ ...newReminder, priority: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                                    >
                                        <option value="high">🔴 High</option>
                                        <option value="medium">🟡 Medium</option>
                                        <option value="low">🟢 Low</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-2">Date</label>
                                    <input
                                        type="date"
                                        value={newReminder.dueDate}
                                        onChange={(e) => setNewReminder({ ...newReminder, dueDate: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-2">Time</label>
                                    <input
                                        type="time"
                                        value={newReminder.dueTime}
                                        onChange={(e) => setNewReminder({ ...newReminder, dueTime: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-2">Notes</label>
                                <textarea
                                    placeholder="Add any additional notes..."
                                    rows={3}
                                    value={newReminder.notes}
                                    onChange={(e) => setNewReminder({ ...newReminder, notes: e.target.value })}
                                    className="w-full px-4 py-3 border border-neutral-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-red-500"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 p-6 border-t border-neutral-100">
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="flex-1 py-3 border border-neutral-200 text-neutral-700 rounded-xl font-medium hover:bg-neutral-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateReminder}
                                disabled={isCreating}
                                className="flex-1 py-3 bg-gradient-to-r from-red-600 to-orange-500 text-white rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                            >
                                {isCreating ? 'Creating...' : 'Create Reminder'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Reminders;
