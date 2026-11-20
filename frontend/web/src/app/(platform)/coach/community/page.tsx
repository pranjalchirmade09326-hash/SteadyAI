'use client';

import { usePlatformContext } from '@/features/platform/PlatformProvider';
import { UserRole } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface CommunityPost {
  id: string;
  author: string;
  badge?: string;
  isDoctor?: boolean;
  timeAgo: string;
  title: string;
  content: string;
  likes: number;
  replies: number;
}

const INITIAL_POSTS: CommunityPost[] = [
  {
    id: 'post-01',
    author: 'Dr. Sarah Jenkins, MD',
    badge: 'Clinical Lead & Sports Physician',
    isDoctor: true,
    timeAgo: '2 hours ago',
    title: '📢 Weekly Guidance: Hydration and Electrolyte Timing in High-Volume Training',
    content:
      'If you are engaging in >60 minute training sessions, sodium balance is paramount. Please aim for 500mg sodium in 750ml water 30 minutes pre-session to prevent delayed muscular cramping.',
    likes: 24,
    replies: 7
  },
  {
    id: 'post-02',
    author: 'Alex Mercer',
    badge: 'Member (Hypertrophy Cohort)',
    timeAgo: '4 hours ago',
    title: 'Question on Creatine Monohydrate timing on rest days',
    content:
      'Should I continue the 5g daily dose at the exact same hour on non-training days or does saturation remain regardless?',
    likes: 8,
    replies: 3
  },
  {
    id: 'post-03',
    author: 'Dr. Sarah Jenkins, MD',
    badge: 'Clinical Lead & Sports Physician',
    isDoctor: true,
    timeAgo: '3 hours ago',
    title: 'Re: Question on Creatine Monohydrate timing on rest days',
    content:
      'Creatine works via chronic cellular saturation rather than acute stimulation. You can take it whenever convenient with a meal containing carbohydrates or protein for enhanced uptake.',
    likes: 19,
    replies: 1
  }
];

export default function CoachCommunityPage() {
  const { workspace, isLoading } = usePlatformContext();
  const router = useRouter();

  const [posts, setPosts] = useState<CommunityPost[]>(INITIAL_POSTS);
  const [announcementText, setAnnouncementText] = useState('');
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  // Role Access Guard
  useEffect(() => {
    if (!isLoading && workspace.role !== UserRole.COACH && workspace.role !== UserRole.ADMIN) {
      router.replace('/dashboard');
    }
  }, [isLoading, router, workspace.role]);

  if (isLoading || (workspace.role !== UserRole.COACH && workspace.role !== UserRole.ADMIN)) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-6 text-center text-[#5f5145]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#1d140d] border-t-transparent" />
          <p className="text-sm font-medium">Loading Community Hub...</p>
        </div>
      </div>
    );
  }

  const handlePublish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementTitle.trim() || !announcementText.trim()) return;

    setIsPublishing(true);
    setTimeout(() => {
      const newPost: CommunityPost = {
        id: `post-${Date.now()}`,
        author: 'Dr. Sarah Jenkins, MD',
        badge: 'Clinical Lead & Sports Physician',
        isDoctor: true,
        timeAgo: 'Just now',
        title: `📢 ${announcementTitle}`,
        content: announcementText,
        likes: 1,
        replies: 0
      };
      setPosts([newPost, ...posts]);
      setAnnouncementTitle('');
      setAnnouncementText('');
      setIsPublishing(false);
      setNotice('Clinical announcement broadcasted to all enrolled patients.');
      setTimeout(() => setNotice(null), 3500);
    }, 400);
  };

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#9e8a7b]">
            <Link href="/coach" className="hover:text-[#1d140d] transition">
              Doctor Workspace
            </Link>
            <span>/</span>
            <span className="text-amber-800 dark:text-amber-400">Community Hub</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-[#1d140d] dark:text-white sm:text-3xl">
            Doctor &amp; Patient Community Hub
          </h1>
          <p className="text-sm text-[#7a6858] dark:text-[#c4b5a5]">
            Broadcast clinical health guidelines, host asynchronous Q&amp;A, and monitor patient discussions.
          </p>
        </div>

        <Link
          href="/coach"
          className="inline-flex items-center gap-1.5 self-start rounded-xl border border-[#d8c4b3] bg-white px-4 py-2 text-xs font-bold text-[#1d140d] shadow-sm hover:bg-[#fbf8f5] transition"
        >
          ← Back to Command Center
        </Link>
      </div>

      {notice && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-900 shadow-sm animate-in fade-in">
          ✓ {notice}
        </div>
      )}

      {/* Broadcast Composer */}
      <form
        onSubmit={handlePublish}
        className="rounded-2xl border border-amber-300 bg-amber-50/50 p-5 shadow-sm dark:border-amber-900/40 dark:bg-amber-950/20"
      >
        <div className="flex items-center gap-2 text-xs font-bold text-amber-900 dark:text-amber-400">
          <span>🩺 Broadcast Clinical Guidance to Roster</span>
        </div>
        <div className="mt-3 flex flex-col gap-2.5">
          <input
            type="text"
            placeholder="Announcement Topic / Headline..."
            value={announcementTitle}
            onChange={(e) => setAnnouncementTitle(e.target.value)}
            className="w-full rounded-xl border border-[#d8c4b3] bg-white px-3.5 py-2 text-xs font-medium text-[#1d140d] placeholder:text-[#9e8a7b] focus:border-[#1d140d] focus:outline-none dark:border-[#4a3528] dark:bg-[#120d09] dark:text-white"
            required
          />
          <textarea
            rows={3}
            placeholder="Write clinical advice, protocol updates, or weekly check-in reminders..."
            value={announcementText}
            onChange={(e) => setAnnouncementText(e.target.value)}
            className="w-full rounded-xl border border-[#d8c4b3] bg-white px-3.5 py-2 text-xs font-medium text-[#1d140d] placeholder:text-[#9e8a7b] focus:border-[#1d140d] focus:outline-none dark:border-[#4a3528] dark:bg-[#120d09] dark:text-white"
            required
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isPublishing}
              className="rounded-xl bg-[#1d140d] px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#342417] transition disabled:opacity-50 dark:bg-[#f3c99f] dark:text-[#1d140d]"
            >
              {isPublishing ? 'Publishing...' : 'Broadcast to Patients →'}
            </button>
          </div>
        </div>
      </form>

      {/* Posts Stream */}
      <div className="flex flex-col gap-4">
        {posts.map((post) => (
          <div
            key={post.id}
            className={`rounded-2xl border bg-white p-5 shadow-sm dark:bg-[#1a1410] ${
              post.isDoctor
                ? 'border-amber-300 dark:border-amber-800'
                : 'border-[#e8d7c6] dark:border-[#38271e]'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-2xl font-black text-xs ${
                    post.isDoctor
                      ? 'bg-amber-800 text-white'
                      : 'bg-[#1d140d] text-white dark:bg-[#f3c99f] dark:text-[#1d140d]'
                  }`}
                >
                  {post.isDoctor ? '🩺' : '👤'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#1d140d] dark:text-white">{post.author}</span>
                    {post.isDoctor && (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-900 dark:bg-amber-950 dark:text-amber-300">
                        Verified Doctor
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#9e8a7b]">
                    {post.badge} • {post.timeAgo}
                  </p>
                </div>
              </div>
            </div>

            <h3 className="mt-3 text-sm font-bold text-[#1d140d] dark:text-white">{post.title}</h3>
            <p className="mt-1 text-xs text-[#4e4035] leading-relaxed dark:text-[#c4b5a5]">
              {post.content}
            </p>

            <div className="mt-3 flex items-center gap-4 text-xs font-semibold text-[#8a7667]">
              <span>❤️ {post.likes} Helpful</span>
              <span>💬 {post.replies} Replies</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
