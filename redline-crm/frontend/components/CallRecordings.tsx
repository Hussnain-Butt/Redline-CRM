import React, { useState, useEffect } from 'react';
import { Phone, Download, Search, Filter, Play, Calendar, Clock } from 'lucide-react';
import { CallLog } from '../types';
import { callApi } from '../services/callApi';

interface CallRecordingsProps {
    callLogs: CallLog[];
    onRefresh: () => void;
}

const CallRecordings: React.FC<CallRecordingsProps> = ({ callLogs, onRefresh }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'recorded'>('all');

    useEffect(() => {
        onRefresh();
    }, []);

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        if (mins === 0) return `${secs}s`;
        return `${mins}m ${secs}s`;
    };

    const formatDate = (date: string | Date) => {
        return new Date(date).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Convert Twilio recording URL to backend proxy URL
    const getProxyRecordingUrl = (twilioUrl: string): string => {
        // Extract recording SID from Twilio URL
        // Format: https://api.twilio.com/.../Recordings/RExxxxx or RExxxxx.mp3
        const match = twilioUrl.match(/RE[a-f0-9]{32}/i);
        if (match) {
            const recordingSid = match[0];
            // VITE_APP_URL already includes /api
            return `${import.meta.env.VITE_APP_URL || 'http://localhost:3000/api'}/calls/recording/${recordingSid}`;
        }
        return twilioUrl; // Fallback to original URL
    };

    // Filter calls
    const filteredCalls = callLogs.filter(call => {
        const matchesSearch = searchTerm === '' || 
            call.number?.includes(searchTerm) ||
            call.fromNumber?.includes(searchTerm);
        
        const matchesFilter = filterStatus === 'all' || 
            (filterStatus === 'recorded' && call.recordingUrl);
        
        return matchesSearch && matchesFilter;
    });

    // Sort by date (newest first)
    const sortedCalls = [...filteredCalls].sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    return (
        <div className="h-full flex flex-col bg-white">
            {/* Header */}
            <div className="p-6 border-b border-neutral-100">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
                            🎙️ Call Recordings
                        </h1>
                        <p className="text-neutral-500 text-sm mt-1">
                            {sortedCalls.filter(c => c.recordingUrl).length} recordings available
                        </p>
                    </div>
                    <button
                        onClick={onRefresh}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                        Refresh
                    </button>
                </div>

                {/* Search and Filter */}
                <div className="flex gap-3">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                        <input
                            type="text"
                            placeholder="Search by phone number..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                        />
                    </div>
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value as 'all' | 'recorded')}
                        className="px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                        <option value="all">All Calls</option>
                        <option value="recorded">With Recordings</option>
                    </select>
                </div>
            </div>

            {/* Calls List */}
            <div className="flex-1 overflow-y-auto p-6">
                {sortedCalls.length === 0 ? (
                    <div className="text-center py-12 text-neutral-400">
                        <Phone className="w-16 h-16 mx-auto mb-4 opacity-30" />
                        <p className="text-lg font-medium">No calls found</p>
                        <p className="text-sm mt-1">Make some calls to see recordings here</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {sortedCalls.map((call) => (
                            <div
                                key={call.id}
                                className="p-5 border border-neutral-200 rounded-xl hover:shadow-md transition-shadow bg-white"
                            >
                                {/* Call Header */}
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-start gap-3">
                                        <div className={`p-3 rounded-full ${
                                            call.type === 'inbound' ? 'bg-green-100' :
                                            call.type === 'outbound' ? 'bg-blue-100' : 'bg-red-100'
                                        }`}>
                                            <Phone className={`w-5 h-5 ${
                                                call.type === 'inbound' ? 'text-green-600' :
                                                call.type === 'outbound' ? 'text-blue-600' : 'text-red-600'
                                            }`} />
                                        </div>
                                        <div>
                                            <p className="text-lg font-bold text-neutral-900">
                                                {call.number || call.fromNumber || 'Unknown'}
                                            </p>
                                            <p className="text-sm text-neutral-500 capitalize">
                                                {call.type} Call
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-medium text-neutral-900">
                                            {formatDuration(call.durationSeconds)}
                                        </p>
                                        <p className="text-xs text-neutral-400 mt-1">
                                            {formatDate(call.date)}
                                        </p>
                                    </div>
                                </div>

                                {/* Call Details */}
                                <div className="flex items-center gap-4 text-xs text-neutral-500 mb-3">
                                    <div className="flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        {new Date(call.date).toLocaleDateString()}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {new Date(call.date).toLocaleTimeString()}
                                    </div>
                                    {call.fromNumber && (
                                        <div>From: {call.fromNumber}</div>
                                    )}
                                </div>

                                {/* Recording Player */}
                                {call.recordingUrl ? (
                                    <div className="mt-4 p-4 bg-neutral-50 rounded-lg">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                <Play className="w-4 h-4 text-red-500" />
                                                <span className="text-sm font-semibold text-neutral-700">
                                                    Recording Available
                                                </span>
                                            </div>
                                            <a
                                                href={getProxyRecordingUrl(call.recordingUrl)}
                                                download={`recording-${call.id}.mp3`}
                                                className="flex items-center gap-2 px-3 py-1.5 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors text-sm"
                                            >
                                                <Download className="w-4 h-4" />
                                                Download
                                            </a>
                                        </div>
                                        <audio
                                            controls
                                            className="w-full"
                                            src={getProxyRecordingUrl(call.recordingUrl)}
                                            preload="metadata"
                                        >
                                            Your browser does not support the audio element.
                                        </audio>
                                    </div>
                                ) : (
                                    <div className="mt-4 p-3 bg-neutral-50 rounded-lg text-center text-sm text-neutral-400">
                                        No recording available for this call
                                    </div>
                                )}

                                {/* AI Summary */}
                                {call.summary && (
                                    <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                                        <p className="text-xs font-semibold text-blue-700 uppercase mb-1">
                                            AI Summary
                                        </p>
                                        <p className="text-sm text-neutral-700">{call.summary}</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CallRecordings;
