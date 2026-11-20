'use client';

import { BottomSheet } from '@/components/BottomSheet';
import { useCommunity, CommunityProvider } from '@/features/community/CommunityProvider';
import { PostCreator } from '@/features/community/components/PostCreator';
import { FeedList } from '@/features/community/components/FeedList';
import Link from 'next/link';
import { useState } from 'react';

function CommunityPageContent() {
  const { error } = useCommunity();
  const [isPostSheetOpen, setIsPostSheetOpen] = useState(false);

  return (
    <>
      {error && (
        <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-3.5 text-center text-xs font-medium text-amber-800">
          Note: Currently connected via local community feed sync.
        </div>
      )}

      {/* Community Circle Banner */}
      <div className="mb-6 rounded-2xl border border-[#ead9ca] bg-[#fffaf5] p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1d140d] text-base text-white font-bold">
            👥
          </div>
          <div>
            <p className="text-sm font-bold text-[#1d140d]">SteadyAI Peer Circle #1</p>
            <p className="text-xs text-[#7a4b28]">48 active members • Spring Consistency Focus</p>
          </div>
        </div>
        <span className="self-start sm:self-auto rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-bold text-emerald-700">
          🟢 Live Accountability Group
        </span>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[0.85fr_1.15fr] 2xl:grid-cols-[0.75fr_1.25fr]">
        <div className="hidden md:block">
          <PostCreator />
        </div>
        <section className="rounded-[32px] border border-white/80 bg-[#fffaf5]/82 p-4 shadow-[0_18px_60px_rgba(80,48,24,0.1)] dark:border-[#4a372b] dark:bg-[#231914]/88 dark:shadow-[0_18px_60px_rgba(0,0,0,0.3)] sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#8a4b22] dark:text-[#f3c99f]">Peer feed</p>
              <h2 className="mt-1 text-2xl font-bold tracking-[-0.04em] text-[#1d140d] dark:text-[#fff7ed]">Community Updates</h2>
            </div>
            <span className="text-xs font-semibold text-[#7a4b28] bg-[#f3e7da] px-3 py-1 rounded-full">
              Real-time
            </span>
          </div>
          <FeedList />
        </section>
      </div>

      <button
        type="button"
        onClick={() => setIsPostSheetOpen(true)}
        className="fixed bottom-[calc(5.75rem+var(--safe-bottom))] right-4 z-30 min-h-14 rounded-full bg-[#1d140d] px-5 py-4 text-base font-bold text-white shadow-[0_18px_46px_rgba(29,20,13,0.3)] active:scale-[0.99] dark:bg-[#fff7ed] dark:text-[#1d140d] md:hidden"
      >
        + New post
      </button>

      <BottomSheet
        open={isPostSheetOpen}
        title="Create a post"
        description="Share a quick win, question, or check-in with your group."
        onClose={() => setIsPostSheetOpen(false)}
      >
        <PostCreator compact onPostCreated={() => setIsPostSheetOpen(false)} />
      </BottomSheet>
    </>
  );
}

export default function CommunityPage() {
  return (
    <CommunityProvider>
      <div className="w-full min-h-screen px-4 pb-28 pt-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 space-y-6">
        <header className="rounded-[34px] border border-white/80 bg-[#fffaf5]/84 p-5 shadow-[0_18px_70px_rgba(80,48,24,0.1)] dark:border-[#4a372b] dark:bg-[#231914]/88 dark:shadow-[0_18px_70px_rgba(0,0,0,0.28)] sm:p-7">
          <p className="text-xs font-bold uppercase tracking-[0.26em] text-[#8a4b22] dark:text-[#f3c99f]">Accountability</p>
          <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-[-0.05em] text-[#1d140d] dark:text-[#fff7ed] sm:text-4xl">Community</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#5f5145] dark:text-[#d6c2ae] sm:text-base">
                Share quick wins, ask low-pressure questions, and stay connected to people building steady routines.
              </p>
            </div>
            <Link
              href="/ai-coach"
              className="inline-flex justify-center rounded-full bg-[#1d140d] px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(29,20,13,0.2)] hover:bg-[#342417] transition"
            >
              Draft a post with coach
            </Link>
          </div>
        </header>
        <CommunityPageContent />
      </div>
    </CommunityProvider>
  );
}
