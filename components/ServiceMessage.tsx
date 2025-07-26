"use client";

interface ServiceMessageProps {
  title?: string;
  description?: React.ReactNode;
}

export default function ServiceMessage({
  title = "FPSの“最適感度”、見つけよう。",
  description = (
    <>
      APEXも、VALOも、OWも。気になるあの設定、まとめて見れるのがFRAGBASE。
      <br />
      <br />
      <br />
      FragBaseは現在α版として運営しています。
      <br />
      まだ整っていない部分もありますが、皆さんの声や投稿をもとに、
      <br />
      より良いサービスへと一緒に育てていきたいと考えています。
    </>
  ),
}: ServiceMessageProps) {
  return (
    <section className="flex justify-center">
      <div className="p-6 text-center">
        <h2 className="text-xl font-semibold mb-2">{title}</h2>
        <p className="text-gray-300">{description}</p>
      </div>
    </section>
  );
}
