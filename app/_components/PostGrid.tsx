"use client";
import PostCard from "@/components/PostCard";
import type { Post } from "@/lib/services/posts";

interface PostGridProps {
  posts: Post[];
  linkMode?: "default" | "editDrafts";
  origin?: "default" | "profile";
  profileUsername?: string;
}

export default function PostGrid({ posts, linkMode, origin = "default", profileUsername }: PostGridProps) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          linkMode={linkMode}
          origin={origin}
          profileUsername={profileUsername}
        />
      ))}
    </div>
  );
}
