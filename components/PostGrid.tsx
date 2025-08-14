import PostCard from "./PostCard";

interface Post {
  id: number;
  title: string;
  excerpt: string;
  createdAt: number;
  tags: { id: number; name: string; norm: string }[];
  gameCategories: { id: number; name: string; displayName: string }[];
}

interface PostGridProps {
  posts: Post[];
}

export default function PostGrid({ posts }: PostGridProps) {
  return (
    <div
      className="grid grid-cols-1 
  md:grid-cols-2 lg:grid-cols-3 gap-6"
    >
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}
