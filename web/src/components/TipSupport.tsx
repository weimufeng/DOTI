import "./TipSupport.css";

const TIP_SRC = `${import.meta.env.BASE_URL}tip-alipay.jpeg`;

/** Compact Alipay tip block for landing / result / poster. */
export function TipSupport({ className = "" }: { className?: string }) {
  return (
    <aside className={`tip-support ${className}`.trim()} aria-label="打赏支持">
      <img
        className="tip-support__qr"
        src={TIP_SRC}
        alt="支付宝收款码"
        width={96}
        height={96}
        loading="lazy"
        decoding="async"
      />
      <p className="tip-support__caption">如果你觉得做得不错，欢迎打赏</p>
    </aside>
  );
}
