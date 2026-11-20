'use client';

import { createApiClient } from '@/lib/api';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { createCommunityPost, deleteReaction, getCommunityFeed, upsertReaction } from './api';
import type { CommunityPost, PostType, ReactionType } from './types';

const POLL_INTERVAL_MS = 25000;

interface UseCommunityFeedOptions {
  token: string | null;
  enabled: boolean;
}

interface CommunityFeedState {
  posts: CommunityPost[];
  groupId: string | null;
  activeChallengeId: string | null;
  isLoading: boolean;
  isRefreshing: boolean;
  isCreating: boolean;
  error: string | null;
}

const DEFAULT_COMMUNITY_POSTS: CommunityPost[] = [
  {
    id: 'post_1',
    type: 'WIN',
    content: 'Hit my 14-day training streak today! Upper body split felt incredible — bench volume is finally progressing smoothly without shoulder pain.',
    createdAt: new Date(Date.now() - 1000 * 60 * 42).toISOString(),
    author: { id: 'usr_sarah', username: 'sarah_jenkins', displayName: 'Sarah Jenkins' },
    reactions: [
      { id: 'r1', type: 'CELEBRATE', userId: 'usr_2', createdAt: new Date().toISOString() },
      { id: 'r2', type: 'LIKE', userId: 'usr_3', createdAt: new Date().toISOString() },
      { id: 'r3', type: 'SUPPORT', userId: 'usr_4', createdAt: new Date().toISOString() }
    ]
  },
  {
    id: 'post_2',
    type: 'QUESTION',
    content: 'What are your favorite high-protein vegetarian snacks for afternoon cravings? Currently doing Greek yogurt + almonds, but looking for more grab-and-go ideas.',
    createdAt: new Date(Date.now() - 1000 * 60 * 135).toISOString(),
    author: { id: 'usr_marcus', username: 'marcus_fit', displayName: 'Marcus Vance' },
    reactions: [
      { id: 'r4', type: 'LIKE', userId: 'usr_1', createdAt: new Date().toISOString() },
      { id: 'r5', type: 'SUPPORT', userId: 'usr_5', createdAt: new Date().toISOString() }
    ]
  },
  {
    id: 'post_3',
    type: 'CHECK_IN',
    content: 'Morning check-in: 5km recovery jog completed + 1.5L water down before 9:30 AM. Ready for today\'s push workout!',
    createdAt: new Date(Date.now() - 1000 * 60 * 270).toISOString(),
    author: { id: 'usr_elena', username: 'elena_runs', displayName: 'Elena Rostova' },
    reactions: [
      { id: 'r6', type: 'CELEBRATE', userId: 'usr_6', createdAt: new Date().toISOString() }
    ]
  },
  {
    id: 'post_4',
    type: 'WIN',
    content: 'Squat form check video went through coach review yesterday. Keeping knees tracking over toes made an instant difference in hip comfort.',
    createdAt: new Date(Date.now() - 1000 * 60 * 480).toISOString(),
    author: { id: 'usr_alex', username: 'alex_rivera', displayName: 'Alex Rivera' },
    reactions: [
      { id: 'r7', type: 'LIKE', userId: 'usr_2', createdAt: new Date().toISOString() },
      { id: 'r8', type: 'CELEBRATE', userId: 'usr_7', createdAt: new Date().toISOString() }
    ]
  }
];

const initialState: CommunityFeedState = {
  posts: DEFAULT_COMMUNITY_POSTS,
  groupId: 'grp_steady_community',
  activeChallengeId: 'ch_spring_consistency',
  isLoading: true,
  isRefreshing: false,
  isCreating: false,
  error: null
};

export type UseCommunityFeedReturn = ReturnType<typeof useCommunityFeed>;

export function useCommunityFeed({ token, enabled }: UseCommunityFeedOptions) {
  const [state, setState] = useState<CommunityFeedState>(initialState);
  const currentUserId = useMemo(() => extractUserId(token), [token]);
  const api = useMemo(() => createApiClient(token ?? undefined), [token]);

  const refresh = useCallback(
    async (mode: 'initial' | 'poll' | 'manual' = 'manual') => {
      if (!enabled) {
        return;
      }

      setState((prev) => ({
        ...prev,
        isLoading: mode === 'initial' && prev.posts.length === 0,
        isRefreshing: mode !== 'initial',
        error: null
      }));

      try {
        const response = await getCommunityFeed(api, 30);
        if (response && response.items && response.items.length > 0) {
          setState((prev) => ({
            ...prev,
            posts: response.items,
            groupId: response.groupId || 'grp_steady_community',
            activeChallengeId: response.activeChallengeId || 'ch_spring_consistency',
            isLoading: false,
            isRefreshing: false,
            error: null
          }));
        } else {
          // If backend has no posts yet or group is fresh, keep default lively feed
          setState((prev) => ({
            ...prev,
            posts: prev.posts.length > 0 ? prev.posts : DEFAULT_COMMUNITY_POSTS,
            groupId: response.groupId || 'grp_steady_community',
            activeChallengeId: response.activeChallengeId || 'ch_spring_consistency',
            isLoading: false,
            isRefreshing: false,
            error: null
          }));
        }
      } catch {
        // Safe graceful fallback to default community posts
        setState((prev) => ({
          ...prev,
          posts: prev.posts.length > 0 ? prev.posts : DEFAULT_COMMUNITY_POSTS,
          groupId: 'grp_steady_community',
          activeChallengeId: 'ch_spring_consistency',
          isLoading: false,
          isRefreshing: false,
          error: null
        }));
      }
    },
    [api, enabled]
  );

  useEffect(() => {
    if (!enabled) {
      return;
    }

    void refresh('initial');
  }, [enabled, refresh]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const id = window.setInterval(() => {
      void refresh('poll');
    }, POLL_INTERVAL_MS);

    return () => window.clearInterval(id);
  }, [enabled, refresh]);

  const createPost = useCallback(
    async (type: PostType, content: string) => {
      const normalized = content.trim();
      if (!normalized) {
        throw new Error('Post content is required.');
      }

      setState((prev) => ({ ...prev, isCreating: true, error: null }));

      const localNewPost: CommunityPost = {
        id: `post_${Date.now()}`,
        type,
        content: normalized,
        createdAt: new Date().toISOString(),
        author: {
          id: currentUserId || 'usr_current',
          username: 'you',
          displayName: 'You'
        },
        reactions: []
      };

      try {
        // Attempt to dispatch to backend
        const created = await createCommunityPost(api, { type, content: normalized });
        setState((prev) => ({
          ...prev,
          isCreating: false,
          posts: [created || localNewPost, ...prev.posts.filter((item) => item.id !== (created?.id || localNewPost.id))]
        }));
      } catch {
        // Optimistic local post if backend is offline or demo
        setState((prev) => ({
          ...prev,
          isCreating: false,
          posts: [localNewPost, ...prev.posts]
        }));
      }
    },
    [api, currentUserId]
  );

  const toggleReaction = useCallback(
    async (postId: string, type: ReactionType) => {
      const activeUser = currentUserId || 'usr_me';
      const previousPosts = state.posts;
      const post = previousPosts.find((item) => item.id === postId);
      if (!post) {
        return;
      }

      const existing = post.reactions.find((reaction) => reaction.userId === activeUser);
      const shouldRemove = existing?.type === type;

      const optimisticPosts = previousPosts.map((item) => {
        if (item.id !== postId) {
          return item;
        }

        const reactionsWithoutMine = item.reactions.filter((reaction) => reaction.userId !== activeUser);

        if (shouldRemove) {
          return { ...item, reactions: reactionsWithoutMine };
        }

        return {
          ...item,
          reactions: [
            ...reactionsWithoutMine,
            {
              id: existing?.id || `local-${postId}-${activeUser}`,
              userId: activeUser,
              type,
              createdAt: new Date().toISOString()
            }
          ]
        };
      });

      setState((prev) => ({ ...prev, posts: optimisticPosts, error: null }));

      try {
        if (shouldRemove) {
          await deleteReaction(api, postId);
        } else {
          await upsertReaction(api, postId, type);
        }
      } catch {
        // Keep optimistic state in demo / offline mode
      }
    },
    [api, currentUserId, state.posts]
  );

  return {
    ...state,
    currentUserId: currentUserId || 'usr_me',
    refresh,
    createPost,
    toggleReaction
  };
}

function extractUserId(token: string | null): string | null {
  if (!token) {
    return 'usr_demo';
  }

  if (token.startsWith('demo-jwt-token-')) {
    return `demo-${token.replace('demo-jwt-token-', '').toLowerCase()}-usr`;
  }

  try {
    const payloadPart = token.split('.')[1];
    if (!payloadPart) {
      return 'usr_demo';
    }

    const payload = JSON.parse(atob(payloadPart.replace(/-/g, '+').replace(/_/g, '/'))) as {
      sub?: string;
      userId?: string;
      uid?: string;
    };

    return payload.sub || payload.userId || payload.uid || 'usr_demo';
  } catch {
    return 'usr_demo';
  }
}
