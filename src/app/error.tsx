"use client";

import { RotateCcw } from "lucide-react";

export default function ErrorPage({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <section className="error-state">
      <div>
        <p className="eyebrow">Ошибка</p>
        <h2 className="section-title">Не удалось загрузить мониторинг</h2>
        <p className="panel-copy">{error.message}</p>
        <button className="primary-button" onClick={reset} type="button">
          <RotateCcw size={16} />
          Повторить
        </button>
      </div>
    </section>
  );
}
