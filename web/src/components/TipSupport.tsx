import "./TipSupport.css";

const ALIPAY_SRC = `${import.meta.env.BASE_URL}tip-alipay.jpeg`;
const WECHAT_SRC = `${import.meta.env.BASE_URL}tip-wechat.jpeg`;

/** Tip QR block for landing / result / poster. */
export function TipSupport({ className = "" }: { className?: string }) {
  return (
    <aside className={`tip-support ${className}`.trim()} aria-label="打赏支持">
      <div className="tip-support__codes">
        <figure className="tip-support__item">
          <img
            className="tip-support__qr"
            src={ALIPAY_SRC}
            alt="支付宝收款码"
            width={96}
            height={96}
            loading="lazy"
            decoding="async"
          />
          <figcaption>支付宝</figcaption>
        </figure>
        <figure className="tip-support__item">
          <img
            className="tip-support__qr"
            src={WECHAT_SRC}
            alt="微信收款码"
            width={96}
            height={96}
            loading="lazy"
            decoding="async"
          />
          <figcaption>微信</figcaption>
        </figure>
      </div>
      <p className="tip-support__caption">如果你觉得做得不错，欢迎打赏</p>
    </aside>
  );
}
