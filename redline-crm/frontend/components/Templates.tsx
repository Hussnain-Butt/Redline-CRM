import React, { useState, useEffect } from 'react';
import {
    FileText, Plus, Search, Copy, Edit3, Trash2, Eye, Download,
    FolderOpen, Star, Clock, CheckCircle, X, Sparkles, Loader2
} from 'lucide-react';
import { templateApi, Template, CreateTemplateDTO } from '../services/templateApi';

const categoryConfig: { [key: string]: { label: string, color: string, icon: string } } = {
    sales: { label: 'Sales', color: 'bg-blue-100 text-blue-700', icon: '💰' },
    meeting: { label: 'Meeting', color: 'bg-green-100 text-green-700', icon: '📅' },
    'follow-up': { label: 'Follow-up', color: 'bg-purple-100 text-purple-700', icon: '📞' },
    proposal: { label: 'Proposal', color: 'bg-orange-100 text-orange-700', icon: '📋' },
    contract: { label: 'Contract', color: 'bg-red-100 text-red-700', icon: '📝' },
    welcome: { label: 'Welcome', color: 'bg-teal-100 text-teal-700', icon: '👋' },
    custom: { label: 'Custom', color: 'bg-gray-100 text-gray-700', icon: '✏️' }
};

interface TemplatesProps {
    onUseTemplate?: (template: Template) => void;
}

const Templates: React.FC<TemplatesProps> = ({ onUseTemplate }) => {
    const [templates, setTemplates] = useState<Template[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
    
    // Create form state
    const [newTemplate, setNewTemplate] = useState({
        name: '',
        category: 'custom',
        subject: '',
        content: ''
    });
    const [isCreating, setIsCreating] = useState(false);

    // Fetch templates
    useEffect(() => {
        loadTemplates();
    }, []);

    const loadTemplates = async () => {
        try {
            setIsLoading(true);
            const data = await templateApi.getAll();
            setTemplates(data);
        } catch (error) {
            console.error('Failed to load templates:', error);
            // toast.error('Failed to load templates'); // Assuming toast is defined elsewhere
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateTemplate = async () => {
        if (!newTemplate.name || !newTemplate.content) {
            // toast.error('Please fill in required fields'); // Assuming toast is defined elsewhere
            alert('Please fill in required fields');
            return;
        }

        try {
            setIsCreating(true);
            const created = await templateApi.create(newTemplate);
            setTemplates(prev => [created, ...prev]);
            setShowCreateModal(false);
            setNewTemplate({ name: '', category: 'custom', subject: '', content: '' });
            // toast.success('Template created successfully'); // Assuming toast is defined elsewhere
        } catch (error) {
            console.error('Failed to create template:', error);
            // Show more detailed error from backend if available
            // toast.error(`Failed to create template: ${error instanceof Error ? error.message : 'Unknown error'}`); // Assuming toast is defined elsewhere
            alert(`Failed to create template: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setIsCreating(false);
        }
    };

    const handleDeleteTemplate = async (id: string) => {
        if (!confirm('Are you sure you want to delete this template?')) return;
        
        try {
            await templateApi.delete(id);
            setTemplates(prev => prev.filter(t => t.id !== id));
            // toast.success('Template deleted'); // Assuming toast is defined elsewhere
            if (selectedTemplate?.id === id) setSelectedTemplate(null);
        } catch (error) {
            console.error('Failed to delete template:', error);
            // toast.error('Failed to delete template'); // Assuming toast is defined elsewhere
            alert('Failed to delete template');
        }
    };

    const handleUseTemplate = () => {
        if (selectedTemplate && onUseTemplate) {
            onUseTemplate(selectedTemplate);
            setSelectedTemplate(null); // Close modal
        }
    };

    // Filter templates logic
    const filteredTemplates = templates.filter(template => {
        const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase());
        
        // Handle custom category logic vs predefined categories
        const matchesCategory = !selectedCategory || template.category === selectedCategory || 
            (selectedCategory === 'custom' && !Object.keys(categoryConfig).filter(k => k !== 'custom').includes(template.category));
            
        return matchesSearch && matchesCategory;
    });

    const categories = Object.entries(categoryConfig);

    return (
        <div className="h-full flex flex-col bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-neutral-100 bg-gradient-to-r from-neutral-50 to-white">
                <div className="flex justify-between items-center mb-5">
                    <div>
                        <h2 className="text-2xl font-bold text-neutral-900">Templates</h2>
                        <p className="text-sm text-neutral-500 mt-1">Create and manage document templates</p>
                    </div>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-red-600 to-orange-500 text-white rounded-xl font-medium hover:opacity-90 transition-opacity shadow-lg shadow-red-500/25"
                    >
                        <Plus className="w-4 h-4" />
                        Create Template
                    </button>
                </div>

                {/* Search */}
                <div className="relative mb-4">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                    <input
                        type="text"
                        placeholder="Search templates..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                    />
                </div>

                {/* Category Filter */}
                <div className="flex gap-2 flex-wrap">
                    <button
                        onClick={() => setSelectedCategory(null)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${!selectedCategory
                            ? 'bg-neutral-900 text-white'
                            : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                            }`}
                    >
                        All
                    </button>
                    {categories.map(([key, config]) => (
                        <button
                            key={key}
                            onClick={() => setSelectedCategory(key)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${selectedCategory === key
                                ? 'bg-neutral-900 text-white'
                                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                                }`}
                        >
                            <span>{config.icon}</span>
                            {config.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Templates Grid */}
            <div className="flex-1 overflow-y-auto p-6">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-full text-neutral-400">
                        <Loader2 className="w-8 h-8 animate-spin mb-2" />
                        <p>Loading templates...</p>
                    </div>
                ) : filteredTemplates.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-neutral-400">
                        <FileText className="w-16 h-16 mb-4 opacity-20" />
                        <p className="text-lg font-medium">No templates found</p>
                        <p className="text-sm mt-1">Create your first template to get started</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredTemplates.map(template => (
                            <div
                                key={template.id}
                                className="template-card group relative"
                            >
                                {/* Delete Button */}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteTemplate(template.id);
                                    }}
                                    className="absolute top-4 right-4 p-1.5 text-neutral-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-white/80 rounded"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>

                                {/* Category Badge */}
                                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium mb-3 ${categoryConfig[template.category]?.color || 'bg-gray-100'}`}>
                                    <span>{categoryConfig[template.category]?.icon || '📄'}</span>
                                    {categoryConfig[template.category]?.label || template.category}
                                </div>

                                {/* Title */}
                                <h3 className="text-lg font-bold text-neutral-900 mb-1 line-clamp-1">{template.name}</h3>
                                {template.subject && <p className="text-sm text-neutral-500 mb-2 truncate">Subject: {template.subject}</p>}
                                {/* <p className="text-sm text-neutral-500 mb-4 line-clamp-2">{template.content}</p> */}

                                {/* Variables */}
                                <div className="flex flex-wrap gap-1.5 mb-4 h-12 overflow-hidden content-start">
                                    {template.variables?.length > 0 ? (
                                        template.variables.slice(0, 3).map(variable => (
                                            <span
                                                key={variable}
                                                className="px-2 py-0.5 bg-neutral-100 text-neutral-600 rounded text-xs font-mono"
                                            >
                                                {`{{${variable}}}`}
                                            </span>
                                        ))
                                    ) : (
                                        <span className="text-xs text-neutral-400 italic">No variables</span>
                                    )}
                                    
                                    {template.variables?.length > 3 && (
                                        <span className="px-2 py-0.5 bg-neutral-100 text-neutral-600 rounded text-xs">
                                            +{template.variables.length - 3} more
                                        </span>
                                    )}
                                </div>

                                {/* Stats */}
                                <div className="flex items-center gap-4 text-xs text-neutral-400 mb-4">
                                    <span className="flex items-center gap-1">
                                        <Clock className="w-3.5 h-3.5" />
                                        Created: {new Date(template.createdAt).toLocaleDateString()}
                                    </span>
                                </div>

                            {/* Actions */}
                                <div className="flex gap-2 pt-4 border-t border-neutral-100">
                                    <button
                                        onClick={() => setSelectedTemplate(template)}
                                        className="flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50 rounded-lg transition-colors"
                                    >
                                        <Eye className="w-4 h-4" />
                                        Preview
                                    </button>
                                    <button 
                                        onClick={() => {
                                            setSelectedTemplate(template);
                                            // onUseTemplate is called inside the modal or we can call it directly here if we want instant use
                                            // The previous logic opened modal.
                                            // But wait, the previous code had a "Use" button that did nothing in view_file?
                                            // Line 251 was empty onClick? No, it had no onClick.
                                            // I should probably make this "Use" button also trigger the use action.
                                            if (onUseTemplate) onUseTemplate(template);
                                        }}
                                        className="flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50 rounded-lg transition-colors"
                                    >
                                        <Copy className="w-4 h-4" />
                                        Use
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Preview Modal */}
            {selectedTemplate && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col animate-slide-up">
                        <div className="flex items-center justify-between p-6 border-b border-neutral-100">
                            <div>
                                <h3 className="text-xl font-bold text-neutral-900">{selectedTemplate.name}</h3>
                                {selectedTemplate.subject && <p className="text-sm text-neutral-500 mt-1">Subject: {selectedTemplate.subject}</p>}
                            </div>
                            <button
                                onClick={() => setSelectedTemplate(null)}
                                className="p-2 hover:bg-neutral-100 rounded-xl transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6">
                            <div className="bg-neutral-50 rounded-xl p-6 font-mono text-sm text-neutral-700 whitespace-pre-wrap">
                                {selectedTemplate.content}
                            </div>

                            <div className="mt-6">
                                <h4 className="text-sm font-semibold text-neutral-700 mb-3">Available Variables</h4>
                                <div className="flex flex-wrap gap-2">
                                    {selectedTemplate.variables?.length > 0 ? selectedTemplate.variables.map(variable => (
                                        <span
                                            key={variable}
                                            className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-mono"
                                        >
                                            {`{{${variable}}}`}
                                        </span>
                                    )) : <span className="text-sm text-neutral-400">No variables detected</span>}
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 p-6 border-t border-neutral-100">
                            <button
                                onClick={handleUseTemplate}
                                className="flex-1 py-3 bg-gradient-to-r from-red-600 to-orange-500 text-white rounded-xl font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                            >
                                <Copy className="w-4 h-4" />
                                Use This Template
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Create Template Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl animate-slide-up">
                        <div className="flex items-center justify-between p-6 border-b border-neutral-100">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-gradient-to-r from-red-500 to-orange-500 rounded-xl text-white">
                                    <Sparkles className="w-5 h-5" />
                                </div>
                                <h3 className="text-xl font-bold text-neutral-900">Create Template</h3>
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
                                <label className="block text-sm font-medium text-neutral-700 mb-2">Template Name</label>
                                <input
                                    type="text"
                                    placeholder="e.g., Welcome Email"
                                    value={newTemplate.name}
                                    onChange={(e) => setNewTemplate({...newTemplate, name: e.target.value})}
                                    className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-2">Subject (Optional)</label>
                                <input
                                    type="text"
                                    placeholder="Email Subject"
                                    value={newTemplate.subject}
                                    onChange={(e) => setNewTemplate({...newTemplate, subject: e.target.value})}
                                    className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-2">Category</label>
                                <select 
                                    className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                                    value={newTemplate.category}
                                    onChange={(e) => setNewTemplate({...newTemplate, category: e.target.value})}
                                >
                                    {categories.map(([key, config]) => (
                                        <option key={key} value={key}>{config.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-2">Content</label>
                                <textarea
                                    placeholder="Write your template content... Use {{variable}} for dynamic fields"
                                    rows={6}
                                    value={newTemplate.content}
                                    onChange={(e) => setNewTemplate({...newTemplate, content: e.target.value})}
                                    className="w-full px-4 py-3 border border-neutral-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-red-500"
                                />
                                <p className="text-xs text-neutral-400 mt-1">
                                    Tip: Typing <code>{`{{name}}`}</code> will automatically create a variable.
                                </p>
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
                                onClick={handleCreateTemplate}
                                disabled={isCreating}
                                className="flex-1 py-3 bg-gradient-to-r from-red-600 to-orange-500 text-white rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                            >
                                {isCreating ? 'Creating...' : 'Create Template'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Templates;
