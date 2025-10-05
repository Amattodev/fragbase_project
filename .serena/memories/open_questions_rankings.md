Open questions to revisit if needed:
- Is posts.createdAt equal to publish time in current workflow? If not, add publishedAt.
- Are there soft-delete flags for posts/users? Currently no; only status and FK cascades.
- Will we need per-language or per-tag rankings later?
- Should AllTime snapshots also include window_start=null semantics?