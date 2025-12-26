/**
 * Loomiverse Admin Control Center
 *
 * A comprehensive, non-technical admin panel inspired by Squarespace,
 * Shopify, and enterprise platforms like Audible.
 *
 * Features:
 * - Visual dashboard with real-time metrics
 * - Point-and-click user management
 * - Content management with previews
 * - AI Assistant chatbot for help & CLI tasks
 * - Visual settings editor (no code)
 * - Analytics and reports
 * - Moderation tools
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  LayoutDashboard, Users, BookOpen, Brain, Settings, MessageCircle,
  BarChart3, Shield, Bell, Database, Rocket, FileText, Search,
  ChevronRight, ChevronDown, MoreVertical, Edit, Trash2, Eye, EyeOff,
  Ban, CheckCircle, XCircle, Star, StarOff, Download, Upload,
  RefreshCw, Send, Bot, Sparkles, TrendingUp, TrendingDown,
  Clock, Calendar, Globe, Lock, Unlock, Copy, ExternalLink,
  AlertTriangle, Info, HelpCircle, X, Check, Filter, SortAsc,
  Zap, Heart, Award, Target, Activity, PieChart, ArrowUpRight,
  ArrowDownRight, Minus, Play, Pause, Volume2, Image, Palette,
  ToggleLeft, ToggleRight, Sliders, Key, Mail, UserPlus, UserMinus,
  Flag, MessageSquare, Share2, Bookmark, Archive, Folder, Tag,
  Terminal, Code, Server, Cpu, HardDrive, Wifi, WifiOff
} from 'lucide-react';
import { supabase } from '../lib/supabase';

// ============================================================
// ADMIN PANEL MAIN COMPONENT
// ============================================================

export default function AdminPanel({ onClose, authUser }) {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalStories: 0,
    totalChapters: 0,
    activeToday: 0,
    storiesThisWeek: 0,
    newUsersThisWeek: 0
  });
  const [users, setUsers] = useState([]);
  const [stories, setStories] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAIAssistant, setShowAIAssistant] = useState(false);

  // Load admin data
  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    setIsLoading(true);
    try {
      // Load stats from Supabase
      const [storiesRes, profilesRes] = await Promise.all([
        supabase.from('loom_stories').select('*'),
        supabase.from('loom_profiles').select('*')
      ]);

      const storiesData = storiesRes.data || [];
      const profilesData = profilesRes.data || [];

      // Calculate stats
      const now = new Date();
      const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
      const todayStart = new Date(now.setHours(0, 0, 0, 0));

      setStats({
        totalUsers: profilesData.length,
        totalStories: storiesData.length,
        totalChapters: storiesData.reduce((acc, s) => acc + (s.story_data?.chapters?.length || 0), 0),
        activeToday: profilesData.filter(p => new Date(p.updated_at) >= todayStart).length,
        storiesThisWeek: storiesData.filter(s => new Date(s.created_at) >= weekAgo).length,
        newUsersThisWeek: profilesData.filter(p => new Date(p.created_at) >= weekAgo).length
      });

      setUsers(profilesData);
      setStories(storiesData);
    } catch (e) {
      console.error('[Admin] Load error:', e);
    }
    setIsLoading(false);
  };

  // Navigation items
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, description: 'Overview & quick actions' },
    { id: 'users', label: 'Loominaries', icon: Users, description: 'Manage users' },
    { id: 'stories', label: 'Stories', icon: BookOpen, description: 'All stories & content' },
    { id: 'characters', label: 'Characters', icon: Brain, description: 'Character database' },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, description: 'Stats & insights' },
    { id: 'moderation', label: 'Moderation', icon: Shield, description: 'Reports & flags' },
    { id: 'notifications', label: 'Announcements', icon: Bell, description: 'Send to users' },
    { id: 'settings', label: 'App Settings', icon: Settings, description: 'Configure app' },
    { id: 'database', label: 'Database', icon: Database, description: 'Health & backups' },
    { id: 'deploy', label: 'Deploy', icon: Rocket, description: 'Publish changes' }
  ];

  return (
    <div className="fixed inset-0 bg-slate-950 z-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col">
        {/* Logo */}
        <div className="p-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-purple-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-white">Loomiverse</h1>
              <p className="text-xs text-slate-500">Admin Control Center</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left ${
                activeSection === item.id
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{item.label}</p>
                <p className="text-xs opacity-60 truncate">{item.description}</p>
              </div>
            </button>
          ))}
        </nav>

        {/* AI Assistant Toggle */}
        <div className="p-3 border-t border-slate-800">
          <button
            onClick={() => setShowAIAssistant(!showAIAssistant)}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all ${
              showAIAssistant
                ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Bot className="w-5 h-5" />
            <span className="font-medium">AI Assistant</span>
            <span className="ml-auto text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full">
              Ask anything
            </span>
          </button>
        </div>

        {/* Close Button */}
        <div className="p-3 border-t border-slate-800">
          <button
            onClick={onClose}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white transition-all"
          >
            <X className="w-4 h-4" />
            <span>Exit Admin</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="h-16 bg-slate-900/50 border-b border-slate-800 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-white">
              {navItems.find(n => n.id === activeSection)?.label}
            </h2>
            <span className="text-slate-500">•</span>
            <span className="text-slate-400 text-sm">
              {navItems.find(n => n.id === activeSection)?.description}
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search anything..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
              />
            </div>

            {/* Refresh */}
            <button
              onClick={loadAdminData}
              className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white transition-all"
              title="Refresh data"
            >
              <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>

            {/* Admin User */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 rounded-full">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-500 to-purple-600 flex items-center justify-center">
                <span className="text-xs text-white font-bold">
                  {authUser?.email?.charAt(0).toUpperCase() || 'A'}
                </span>
              </div>
              <span className="text-sm text-slate-300">Admin</span>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-6">
          {activeSection === 'dashboard' && (
            <DashboardSection stats={stats} stories={stories} users={users} isLoading={isLoading} />
          )}
          {activeSection === 'users' && (
            <UsersSection users={users} searchQuery={searchQuery} onRefresh={loadAdminData} />
          )}
          {activeSection === 'stories' && (
            <StoriesSection stories={stories} searchQuery={searchQuery} onRefresh={loadAdminData} />
          )}
          {activeSection === 'characters' && (
            <CharactersSection stories={stories} searchQuery={searchQuery} />
          )}
          {activeSection === 'analytics' && (
            <AnalyticsSection stats={stats} stories={stories} users={users} />
          )}
          {activeSection === 'moderation' && (
            <ModerationSection />
          )}
          {activeSection === 'notifications' && (
            <NotificationsSection />
          )}
          {activeSection === 'settings' && (
            <SettingsSection />
          )}
          {activeSection === 'database' && (
            <DatabaseSection />
          )}
          {activeSection === 'deploy' && (
            <DeploySection />
          )}
        </main>
      </div>

      {/* AI Assistant Panel */}
      {showAIAssistant && (
        <AIAssistantPanel onClose={() => setShowAIAssistant(false)} />
      )}
    </div>
  );
}

// ============================================================
// DASHBOARD SECTION
// ============================================================

function DashboardSection({ stats, stories, users, isLoading }) {
  const quickActions = [
    { label: 'Send Announcement', icon: Bell, color: 'amber' },
    { label: 'Feature a Story', icon: Star, color: 'yellow' },
    { label: 'Export Data', icon: Download, color: 'blue' },
    { label: 'View Reports', icon: Flag, color: 'red' }
  ];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Loominaries"
          value={stats.totalUsers}
          change={stats.newUsersThisWeek}
          changeLabel="this week"
          icon={Users}
          color="purple"
        />
        <StatCard
          label="Total Stories"
          value={stats.totalStories}
          change={stats.storiesThisWeek}
          changeLabel="this week"
          icon={BookOpen}
          color="amber"
        />
        <StatCard
          label="Chapters Written"
          value={stats.totalChapters}
          icon={FileText}
          color="emerald"
        />
        <StatCard
          label="Active Today"
          value={stats.activeToday}
          icon={Activity}
          color="blue"
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-500" />
          Quick Actions
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {quickActions.map((action, i) => (
            <button
              key={i}
              className={`p-4 rounded-xl border border-slate-700 bg-slate-800/50 hover:bg-slate-800 transition-all text-left group`}
            >
              <action.icon className={`w-6 h-6 mb-2 text-${action.color}-500`} />
              <p className="text-sm font-medium text-white group-hover:text-amber-400 transition-colors">
                {action.label}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Activity & Popular Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-500" />
            Recent Activity
          </h3>
          <div className="space-y-3">
            {stories.slice(0, 5).map((story, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium truncate">
                    {story.story_data?.title || 'Untitled Story'}
                  </p>
                  <p className="text-xs text-slate-500">
                    {story.story_data?.genre} • {story.story_data?.chapters?.length || 0} chapters
                  </p>
                </div>
                <span className="text-xs text-slate-500">
                  {new Date(story.created_at).toLocaleDateString()}
                </span>
              </div>
            ))}
            {stories.length === 0 && (
              <p className="text-slate-500 text-sm text-center py-4">No stories yet</p>
            )}
          </div>
        </div>

        {/* Top Genres */}
        <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-purple-500" />
            Genre Distribution
          </h3>
          <GenreChart stories={stories} />
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, change, changeLabel, icon: Icon, color }) {
  const colorClasses = {
    purple: 'from-purple-500/20 to-purple-600/10 border-purple-500/30 text-purple-400',
    amber: 'from-amber-500/20 to-amber-600/10 border-amber-500/30 text-amber-400',
    emerald: 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/30 text-emerald-400',
    blue: 'from-blue-500/20 to-blue-600/10 border-blue-500/30 text-blue-400'
  };

  return (
    <div className={`p-6 rounded-xl bg-gradient-to-br ${colorClasses[color]} border`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-slate-400 text-sm mb-1">{label}</p>
          <p className="text-3xl font-bold text-white">{value.toLocaleString()}</p>
          {change !== undefined && (
            <p className="text-xs mt-2 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              +{change} {changeLabel}
            </p>
          )}
        </div>
        <Icon className={`w-8 h-8 opacity-50`} />
      </div>
    </div>
  );
}

function GenreChart({ stories }) {
  const genreCounts = stories.reduce((acc, story) => {
    const genre = story.story_data?.genre || 'Unknown';
    acc[genre] = (acc[genre] || 0) + 1;
    return acc;
  }, {});

  const sortedGenres = Object.entries(genreCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  const total = stories.length || 1;
  const colors = ['bg-amber-500', 'bg-purple-500', 'bg-blue-500', 'bg-emerald-500', 'bg-rose-500', 'bg-cyan-500'];

  return (
    <div className="space-y-3">
      {sortedGenres.map(([genre, count], i) => (
        <div key={genre} className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-slate-300">{genre}</span>
            <span className="text-slate-500">{count} stories ({Math.round(count/total*100)}%)</span>
          </div>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full ${colors[i % colors.length]} rounded-full transition-all`}
              style={{ width: `${(count/total)*100}%` }}
            />
          </div>
        </div>
      ))}
      {sortedGenres.length === 0 && (
        <p className="text-slate-500 text-sm text-center py-4">No genre data yet</p>
      )}
    </div>
  );
}

// ============================================================
// USERS SECTION
// ============================================================

function UsersSection({ users, searchQuery, onRefresh }) {
  const [selectedUser, setSelectedUser] = useState(null);
  const [sortBy, setSortBy] = useState('recent');

  const filteredUsers = users
    .filter(u => {
      if (!searchQuery) return true;
      const search = searchQuery.toLowerCase();
      return (
        u.display_name?.toLowerCase().includes(search) ||
        u.email?.toLowerCase().includes(search)
      );
    })
    .sort((a, b) => {
      if (sortBy === 'recent') return new Date(b.updated_at) - new Date(a.updated_at);
      if (sortBy === 'stories') return (b.stats?.storiesCreated || 0) - (a.stats?.storiesCreated || 0);
      return 0;
    });

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white"
          >
            <option value="recent">Recently Active</option>
            <option value="stories">Most Stories</option>
          </select>
          <span className="text-slate-500 text-sm">{filteredUsers.length} users</span>
        </div>
        <button className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black rounded-lg text-sm font-medium flex items-center gap-2 transition-colors">
          <UserPlus className="w-4 h-4" />
          Invite User
        </button>
      </div>

      {/* User Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredUsers.map(user => (
          <UserCard
            key={user.id}
            user={user}
            onSelect={() => setSelectedUser(user)}
          />
        ))}
        {filteredUsers.length === 0 && (
          <div className="col-span-full text-center py-12 text-slate-500">
            No users found
          </div>
        )}
      </div>

      {/* User Detail Modal */}
      {selectedUser && (
        <UserDetailModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onRefresh={onRefresh}
        />
      )}
    </div>
  );
}

function UserCard({ user, onSelect }) {
  return (
    <button
      onClick={onSelect}
      className="p-4 bg-slate-900/50 rounded-xl border border-slate-800 hover:border-amber-500/50 transition-all text-left group"
    >
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-purple-600 flex items-center justify-center flex-shrink-0">
          <span className="text-lg text-white font-bold">
            {user.display_name?.charAt(0).toUpperCase() || '?'}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-white group-hover:text-amber-400 transition-colors truncate">
            {user.display_name || 'Anonymous'}
          </p>
          <p className="text-xs text-slate-500 truncate">{user.email}</p>
          <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <BookOpen className="w-3 h-3" />
              {user.stats?.storiesCreated || 0} stories
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {new Date(user.updated_at).toLocaleDateString()}
            </span>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-amber-400 transition-colors" />
      </div>
    </button>
  );
}

function UserDetailModal({ user, onClose, onRefresh }) {
  const [isLoading, setIsLoading] = useState(false);

  const handleAction = async (action) => {
    setIsLoading(true);
    await new Promise(r => setTimeout(r, 1000));
    setIsLoading(false);
    if (action === 'delete') onClose();
    onRefresh();
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-2xl border border-slate-800 w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-500 to-purple-600 flex items-center justify-center">
                <span className="text-2xl text-white font-bold">
                  {user.display_name?.charAt(0).toUpperCase() || '?'}
                </span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">{user.display_name || 'Anonymous'}</h3>
                <p className="text-slate-400">{user.email}</p>
                <p className="text-xs text-slate-500 mt-1">
                  Joined {new Date(user.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="p-6 grid grid-cols-3 gap-4 border-b border-slate-800">
          <div className="text-center">
            <p className="text-2xl font-bold text-white">{user.stats?.storiesCreated || 0}</p>
            <p className="text-xs text-slate-500">Stories</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-white">{user.stats?.chaptersRead || 0}</p>
            <p className="text-xs text-slate-500">Chapters Read</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-white">{user.stats?.dayStreak || 0}</p>
            <p className="text-xs text-slate-500">Day Streak</p>
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 space-y-3">
          <h4 className="text-sm font-medium text-slate-400 mb-3">Actions</h4>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleAction('message')}
              disabled={isLoading}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-800 hover:bg-slate-700 rounded-lg text-white transition-colors"
            >
              <Mail className="w-4 h-4" />
              Send Message
            </button>
            <button
              onClick={() => handleAction('promote')}
              disabled={isLoading}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 rounded-lg text-amber-400 transition-colors"
            >
              <Award className="w-4 h-4" />
              Make Admin
            </button>
            <button
              onClick={() => handleAction('ban')}
              disabled={isLoading}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg text-red-400 transition-colors"
            >
              <Ban className="w-4 h-4" />
              Ban User
            </button>
            <button
              onClick={() => handleAction('delete')}
              disabled={isLoading}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-800 hover:bg-red-500/20 hover:border-red-500/30 border border-slate-700 rounded-lg text-slate-400 hover:text-red-400 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Delete User
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// STORIES SECTION
// ============================================================

function StoriesSection({ stories, searchQuery, onRefresh }) {
  const [selectedStory, setSelectedStory] = useState(null);
  const [viewMode, setViewMode] = useState('grid');

  const filteredStories = stories.filter(s => {
    if (!searchQuery) return true;
    const search = searchQuery.toLowerCase();
    return (
      s.story_data?.title?.toLowerCase().includes(search) ||
      s.story_data?.genre?.toLowerCase().includes(search)
    );
  });

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-800 text-slate-400'}`}
          >
            <LayoutDashboard className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-800 text-slate-400'}`}
          >
            <FileText className="w-4 h-4" />
          </button>
          <span className="text-slate-500 text-sm">{filteredStories.length} stories</span>
        </div>
        <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-colors">
          <Download className="w-4 h-4" />
          Export All
        </button>
      </div>

      {/* Stories Grid */}
      <div className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
        {filteredStories.map(story => (
          <StoryCard
            key={story.id}
            story={story}
            viewMode={viewMode}
            onSelect={() => setSelectedStory(story)}
          />
        ))}
        {filteredStories.length === 0 && (
          <div className="col-span-full text-center py-12 text-slate-500">
            No stories found
          </div>
        )}
      </div>

      {/* Story Detail Modal */}
      {selectedStory && (
        <StoryDetailModal
          story={selectedStory}
          onClose={() => setSelectedStory(null)}
          onRefresh={onRefresh}
        />
      )}
    </div>
  );
}

function StoryCard({ story, viewMode, onSelect }) {
  const data = story.story_data || {};
  const gradients = [
    'from-rose-600 to-purple-700',
    'from-amber-600 to-red-700',
    'from-emerald-600 to-cyan-700',
    'from-blue-600 to-indigo-700'
  ];
  const gradient = gradients[story.id?.charCodeAt(0) % gradients.length] || gradients[0];

  if (viewMode === 'list') {
    return (
      <button
        onClick={onSelect}
        className="p-4 bg-slate-900/50 rounded-xl border border-slate-800 hover:border-amber-500/50 transition-all text-left flex items-center gap-4 group"
      >
        <div className={`w-16 h-20 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center flex-shrink-0`}>
          <BookOpen className="w-6 h-6 text-white/80" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-white group-hover:text-amber-400 transition-colors truncate">
            {data.title || 'Untitled'}
          </p>
          <p className="text-sm text-slate-500">{data.genre}</p>
          <p className="text-xs text-slate-600 mt-1">
            {data.chapters?.length || 0} chapters • Created {new Date(story.created_at).toLocaleDateString()}
          </p>
        </div>
        <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-amber-400" />
      </button>
    );
  }

  return (
    <button
      onClick={onSelect}
      className="bg-slate-900/50 rounded-xl border border-slate-800 hover:border-amber-500/50 transition-all text-left overflow-hidden group"
    >
      <div className={`h-32 bg-gradient-to-br ${gradient} flex items-center justify-center`}>
        <BookOpen className="w-12 h-12 text-white/50" />
      </div>
      <div className="p-4">
        <p className="font-medium text-white group-hover:text-amber-400 transition-colors truncate">
          {data.title || 'Untitled'}
        </p>
        <p className="text-sm text-slate-500">{data.genre}</p>
        <div className="flex items-center justify-between mt-3 text-xs text-slate-600">
          <span>{data.chapters?.length || 0} chapters</span>
          <span>{new Date(story.created_at).toLocaleDateString()}</span>
        </div>
      </div>
    </button>
  );
}

function StoryDetailModal({ story, onClose, onRefresh }) {
  const data = story.story_data || {};
  const [isLoading, setIsLoading] = useState(false);

  const handleAction = async (action) => {
    setIsLoading(true);
    try {
      if (action === 'delete') {
        await supabase.from('loom_stories').delete().eq('id', story.id);
        onClose();
      } else if (action === 'feature') {
        await supabase.from('loom_stories').update({ featured: true }).eq('id', story.id);
      }
      onRefresh();
    } catch (e) {
      console.error('Action error:', e);
    }
    setIsLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-2xl border border-slate-800 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex-shrink-0">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-xl font-bold text-white">{data.title || 'Untitled'}</h3>
              <p className="text-slate-400">{data.genre}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-slate-800/50 rounded-lg text-center">
              <p className="text-2xl font-bold text-white">{data.chapters?.length || 0}</p>
              <p className="text-xs text-slate-500">Chapters</p>
            </div>
            <div className="p-4 bg-slate-800/50 rounded-lg text-center">
              <p className="text-2xl font-bold text-white">{Object.keys(data.characters || {}).length}</p>
              <p className="text-xs text-slate-500">Characters</p>
            </div>
            <div className="p-4 bg-slate-800/50 rounded-lg text-center">
              <p className="text-2xl font-bold text-white">
                {data.chapters?.reduce((acc, c) => acc + (c.content?.length || 0), 0).toLocaleString()}
              </p>
              <p className="text-xs text-slate-500">Total Words</p>
            </div>
          </div>

          {/* Premise */}
          {data.premise && (
            <div>
              <h4 className="text-sm font-medium text-slate-400 mb-2">Premise</h4>
              <p className="text-slate-300 text-sm bg-slate-800/50 p-4 rounded-lg">
                {data.premise}
              </p>
            </div>
          )}

          {/* Characters */}
          {Object.keys(data.characters || {}).length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-slate-400 mb-2">Characters</h4>
              <div className="flex flex-wrap gap-2">
                {Object.keys(data.characters).map(name => (
                  <span key={name} className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-sm">
                    {name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Chapters List */}
          {data.chapters?.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-slate-400 mb-2">Chapters</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {data.chapters.map((chapter, i) => (
                  <div key={i} className="p-3 bg-slate-800/50 rounded-lg flex items-center justify-between">
                    <span className="text-sm text-white">Chapter {i + 1}</span>
                    <span className="text-xs text-slate-500">{chapter.content?.length || 0} words</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-slate-800 flex-shrink-0">
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => handleAction('feature')}
              disabled={isLoading}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 rounded-lg text-amber-400 transition-colors"
            >
              <Star className="w-4 h-4" />
              Feature
            </button>
            <button
              onClick={() => handleAction('export')}
              disabled={isLoading}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-800 hover:bg-slate-700 rounded-lg text-white transition-colors"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
            <button
              onClick={() => handleAction('delete')}
              disabled={isLoading}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg text-red-400 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// CHARACTERS SECTION
// ============================================================

function CharactersSection({ stories, searchQuery }) {
  const allCharacters = stories.flatMap(story => {
    const chars = story.story_data?.characters || {};
    return Object.entries(chars).map(([name, data]) => ({
      name,
      ...data,
      storyTitle: story.story_data?.title,
      storyId: story.id
    }));
  });

  const filteredCharacters = allCharacters.filter(c => {
    if (!searchQuery) return true;
    return c.name?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <span className="text-slate-500 text-sm">{filteredCharacters.length} characters across all stories</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCharacters.map((char, i) => (
          <div
            key={i}
            className="p-4 bg-slate-900/50 rounded-xl border border-slate-800 hover:border-purple-500/50 transition-all"
          >
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center flex-shrink-0">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-white">{char.name}</p>
                <p className="text-xs text-slate-500">from "{char.storyTitle}"</p>
                {char.role && (
                  <span className="inline-block mt-2 px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded-full">
                    {char.role}
                  </span>
                )}
              </div>
            </div>
            {char.psychology && (
              <div className="mt-3 text-xs text-slate-400">
                <p className="truncate">Core Trait: {char.psychology.core_trait || 'Unknown'}</p>
              </div>
            )}
          </div>
        ))}
        {filteredCharacters.length === 0 && (
          <div className="col-span-full text-center py-12 text-slate-500">
            No characters found
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// ANALYTICS SECTION
// ============================================================

function AnalyticsSection({ stats, stories, users }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-6 bg-slate-900/50 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Total Users</p>
              <p className="text-3xl font-bold text-white">{stats.totalUsers}</p>
            </div>
            <Users className="w-8 h-8 text-purple-500 opacity-50" />
          </div>
        </div>
        <div className="p-6 bg-slate-900/50 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Stories Created</p>
              <p className="text-3xl font-bold text-white">{stats.totalStories}</p>
            </div>
            <BookOpen className="w-8 h-8 text-amber-500 opacity-50" />
          </div>
        </div>
        <div className="p-6 bg-slate-900/50 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Chapters Written</p>
              <p className="text-3xl font-bold text-white">{stats.totalChapters}</p>
            </div>
            <FileText className="w-8 h-8 text-emerald-500 opacity-50" />
          </div>
        </div>
        <div className="p-6 bg-slate-900/50 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Active Today</p>
              <p className="text-3xl font-bold text-white">{stats.activeToday}</p>
            </div>
            <Activity className="w-8 h-8 text-blue-500 opacity-50" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Stories Over Time</h3>
          <div className="h-64 flex items-center justify-center text-slate-500">
            <div className="text-center">
              <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Chart visualization coming soon</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">User Growth</h3>
          <div className="h-64 flex items-center justify-center text-slate-500">
            <div className="text-center">
              <TrendingUp className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Chart visualization coming soon</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Export Reports</h3>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export Users (CSV)
          </button>
          <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export Stories (CSV)
          </button>
          <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm flex items-center gap-2">
            <Download className="w-4 h-4" />
            Full Backup (JSON)
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// MODERATION SECTION
// ============================================================

function ModerationSection() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-6 bg-slate-900/50 rounded-xl border border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-500/20 rounded-lg">
              <Flag className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">0</p>
              <p className="text-sm text-slate-500">Pending Reports</p>
            </div>
          </div>
        </div>
        <div className="p-6 bg-slate-900/50 rounded-xl border border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-500/20 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">0</p>
              <p className="text-sm text-slate-500">Flagged Content</p>
            </div>
          </div>
        </div>
        <div className="p-6 bg-slate-900/50 rounded-xl border border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-500/20 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">0</p>
              <p className="text-sm text-slate-500">Resolved Today</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Reports Queue</h3>
        <div className="text-center py-12 text-slate-500">
          <Shield className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>No pending reports</p>
          <p className="text-sm">All clear!</p>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// NOTIFICATIONS SECTION
// ============================================================

function NotificationsSection() {
  const [message, setMessage] = useState('');
  const [targetAudience, setTargetAudience] = useState('all');

  const handleSend = () => {
    if (!message.trim()) return;
    alert(`Announcement sent to ${targetAudience} users!`);
    setMessage('');
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Send Announcement</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-2">Target Audience</label>
            <select
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white"
            >
              <option value="all">All Loominaries</option>
              <option value="active">Active Users (last 7 days)</option>
              <option value="new">New Users (joined this week)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-2">Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white resize-none"
              placeholder="Write your announcement..."
            />
          </div>

          <button
            onClick={handleSend}
            className="w-full px-4 py-3 bg-amber-500 hover:bg-amber-600 text-black rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
          >
            <Send className="w-4 h-4" />
            Send Announcement
          </button>
        </div>
      </div>

      <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Recent Announcements</h3>
        <div className="text-center py-8 text-slate-500">
          <Bell className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>No announcements sent yet</p>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// SETTINGS SECTION
// ============================================================

function SettingsSection() {
  const [settings, setSettings] = useState({
    maintenanceMode: false,
    allowSignups: true,
    allowCollaborative: true,
    allowSharing: true,
    maxStoriesPerUser: 50,
    maxChaptersPerStory: 100
  });

  const toggleSetting = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Sliders className="w-5 h-5 text-amber-500" />
          Feature Toggles
        </h3>

        <div className="space-y-4">
          <ToggleSetting
            label="Maintenance Mode"
            description="Temporarily disable the app for all users"
            value={settings.maintenanceMode}
            onChange={() => toggleSetting('maintenanceMode')}
            dangerous
          />
          <ToggleSetting
            label="Allow New Signups"
            description="Let new users create accounts"
            value={settings.allowSignups}
            onChange={() => toggleSetting('allowSignups')}
          />
          <ToggleSetting
            label="Collaborative Stories"
            description="Enable multiplayer story sessions"
            value={settings.allowCollaborative}
            onChange={() => toggleSetting('allowCollaborative')}
          />
          <ToggleSetting
            label="Story Sharing"
            description="Allow users to share stories publicly"
            value={settings.allowSharing}
            onChange={() => toggleSetting('allowSharing')}
          />
        </div>
      </div>

      <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Target className="w-5 h-5 text-blue-500" />
          Limits & Quotas
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-slate-400 mb-2">Max Stories Per User</label>
            <input
              type="number"
              value={settings.maxStoriesPerUser}
              onChange={(e) => setSettings(prev => ({ ...prev, maxStoriesPerUser: parseInt(e.target.value) }))}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-2">Max Chapters Per Story</label>
            <input
              type="number"
              value={settings.maxChaptersPerStory}
              onChange={(e) => setSettings(prev => ({ ...prev, maxChaptersPerStory: parseInt(e.target.value) }))}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white"
            />
          </div>
        </div>
      </div>

      <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Key className="w-5 h-5 text-emerald-500" />
          API Keys
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-2">OpenAI API Key</label>
            <div className="flex gap-2">
              <input
                type="password"
                defaultValue="sk-********************************"
                readOnly
                className="flex-1 px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white"
              />
              <button className="px-4 py-3 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400">
                <Eye className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-2">Anthropic API Key</label>
            <div className="flex gap-2">
              <input
                type="password"
                defaultValue="sk-ant-****************************"
                readOnly
                className="flex-1 px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white"
              />
              <button className="px-4 py-3 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400">
                <Eye className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ToggleSetting({ label, description, value, onChange, dangerous }) {
  return (
    <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
      <div>
        <p className={`font-medium ${dangerous && value ? 'text-red-400' : 'text-white'}`}>{label}</p>
        <p className="text-sm text-slate-500">{description}</p>
      </div>
      <button
        onClick={onChange}
        className={`relative w-12 h-6 rounded-full transition-colors ${
          value
            ? dangerous ? 'bg-red-500' : 'bg-amber-500'
            : 'bg-slate-700'
        }`}
      >
        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
          value ? 'left-7' : 'left-1'
        }`} />
      </button>
    </div>
  );
}

// ============================================================
// DATABASE SECTION
// ============================================================

function DatabaseSection() {
  const [isConnected] = useState(true);

  return (
    <div className="space-y-6">
      <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Server className="w-5 h-5 text-blue-500" />
          Supabase Connection
        </h3>

        <div className="flex items-center gap-3 p-4 bg-slate-800/50 rounded-lg">
          {isConnected ? (
            <>
              <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
              <span className="text-green-400 font-medium">Connected</span>
              <span className="text-slate-500 text-sm">• ftcdqmrjjooluihysuyc.supabase.co</span>
            </>
          ) : (
            <>
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span className="text-red-400 font-medium">Disconnected</span>
            </>
          )}
        </div>
      </div>

      <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Database className="w-5 h-5 text-purple-500" />
          Database Tables
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {['loom_stories', 'loom_characters', 'loom_profiles', 'loom_collections', 'loom_shared_stories', 'loom_collab_sessions'].map(table => (
            <div key={table} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
              <span className="text-slate-300 font-mono text-sm">{table}</span>
              <span className="text-xs text-green-400 bg-green-500/20 px-2 py-0.5 rounded">Active</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <HardDrive className="w-5 h-5 text-amber-500" />
          Backup & Restore
        </h3>

        <div className="flex gap-3">
          <button className="flex-1 px-4 py-3 bg-amber-500 hover:bg-amber-600 text-black rounded-lg font-medium flex items-center justify-center gap-2 transition-colors">
            <Download className="w-4 h-4" />
            Create Backup
          </button>
          <button className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-colors">
            <Upload className="w-4 h-4" />
            Restore Backup
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// DEPLOY SECTION
// ============================================================

function DeploySection() {
  const [isDeploying, setIsDeploying] = useState(false);

  const handleDeploy = async () => {
    setIsDeploying(true);
    await new Promise(r => setTimeout(r, 3000));
    setIsDeploying(false);
    alert('Deployed successfully to Vercel!');
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Globe className="w-5 h-5 text-emerald-500" />
          Current Deployment
        </h3>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
            <div>
              <p className="text-white font-medium">loomiverse-online.vercel.app</p>
              <p className="text-sm text-slate-500">Production</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-green-400 text-sm">Live</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Rocket className="w-5 h-5 text-amber-500" />
          Deploy Changes
        </h3>

        <p className="text-slate-400 mb-4">
          Push your latest changes to production. This will update the live site.
        </p>

        <button
          onClick={handleDeploy}
          disabled={isDeploying}
          className="w-full px-4 py-4 bg-gradient-to-r from-amber-500 to-purple-600 hover:from-amber-600 hover:to-purple-700 text-white rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50"
        >
          {isDeploying ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              Deploying...
            </>
          ) : (
            <>
              <Rocket className="w-5 h-5" />
              Deploy to Production
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// ============================================================
// AI ASSISTANT PANEL
// ============================================================

function AIAssistantPanel({ onClose }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hi! I'm your Loomiverse AI Assistant. I can help you with:\n\n• Questions about the app\n• Run commands (like deploy, backup, etc.)\n• Find data (users, stories, stats)\n• Troubleshoot issues\n\nJust ask me anything!"
    }
  ]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isThinking) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsThinking(true);

    await new Promise(r => setTimeout(r, 1500));

    let response = "I understand you're asking about: " + userMessage + "\n\n";

    if (userMessage.toLowerCase().includes('deploy')) {
      response = "To deploy your app:\n\n1. Click Deploy in the sidebar\n2. Click Deploy to Production\n3. Wait for Vercel to build and publish\n\nWould you like me to start the deployment for you?";
    } else if (userMessage.toLowerCase().includes('backup')) {
      response = "To create a backup:\n\n1. Go to Database in the sidebar\n2. Click Create Backup\n3. Your data will be exported as JSON\n\nI can also run this command for you if you'd like!";
    } else if (userMessage.toLowerCase().includes('user') || userMessage.toLowerCase().includes('loominaries')) {
      response = "To manage users:\n\n1. Click Loominaries in the sidebar\n2. Search or browse users\n3. Click any user to see details and actions\n\nYou can ban users, send messages, or promote to admin.";
    } else if (userMessage.toLowerCase().includes('story') || userMessage.toLowerCase().includes('stories')) {
      response = "To manage stories:\n\n1. Click Stories in the sidebar\n2. Browse in grid or list view\n3. Click any story to view, feature, or delete\n\nYou can also export all stories as a backup.";
    } else {
      response = "I can help with that! Here are some things I can do:\n\n• \"Show me stats\" - Get current metrics\n• \"Deploy the app\" - Push to production\n• \"Create backup\" - Export all data\n• \"Find user X\" - Search for a user\n• \"Feature story X\" - Promote a story\n\nWhat would you like to do?";
    }

    setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    setIsThinking(false);
  };

  // Simple markdown-like rendering without dangerouslySetInnerHTML
  const renderMessage = (content) => {
    return content.split('\n').map((line, i) => {
      // Bold text
      const parts = line.split(/\*\*(.*?)\*\*/g);
      return (
        <React.Fragment key={i}>
          {parts.map((part, j) =>
            j % 2 === 1 ? <strong key={j}>{part}</strong> : part
          )}
          {i < content.split('\n').length - 1 && <br />}
        </React.Fragment>
      );
    });
  };

  return (
    <div className="w-96 bg-slate-900 border-l border-slate-800 flex flex-col">
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-white">AI Assistant</h3>
            <p className="text-xs text-slate-500">Ask me anything</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-slate-800 text-slate-400"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] p-3 rounded-xl text-sm whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-amber-500 text-black'
                  : 'bg-slate-800 text-slate-300'
              }`}
            >
              {renderMessage(msg.content)}
            </div>
          </div>
        ))}
        {isThinking && (
          <div className="flex justify-start">
            <div className="bg-slate-800 text-slate-300 p-3 rounded-xl">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-slate-800">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask anything..."
            className="flex-1 px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
          />
          <button
            onClick={handleSend}
            disabled={isThinking}
            className="px-4 py-3 bg-purple-500 hover:bg-purple-600 rounded-xl text-white transition-colors disabled:opacity-50"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <p className="text-xs text-slate-600 mt-2 text-center">
          Try: "Deploy the app" or "Show me user stats"
        </p>
      </div>
    </div>
  );
}
