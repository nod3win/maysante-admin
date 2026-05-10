import ArticleForm from "@/components/ArticleForm";

export default function NewArticlePage() {
  return (
    <ArticleForm
      article={{
        title: "",
        slug: "",
        excerpt: null,
        body: "",
        status: "draft",
      }}
    />
  );
}
