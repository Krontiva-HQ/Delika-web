import { FunctionComponent, useMemo, type CSSProperties } from "react";

export type DelikaLogoType = {
  className?: string;
  vector?: string;

  /** Style props */
  frameWidth?: CSSProperties["width"];
  frameAlignItems?: CSSProperties["alignItems"];
  vectorIconBorderRadius?: CSSProperties["borderRadius"];
};

const DelikaLogo: FunctionComponent<DelikaLogoType> = ({
  className = "",
  vector,
  frameWidth,
  frameAlignItems,
  vectorIconBorderRadius,
}) => {
  const frameStyle: CSSProperties = useMemo(() => {
    return {
      width: frameWidth,
      alignItems: frameAlignItems,
    };
  }, [frameWidth, frameAlignItems]);

  const vectorIconStyle: CSSProperties = useMemo(() => {
    return {
      borderRadius: vectorIconBorderRadius,
    };
  }, [vectorIconBorderRadius]);

  return (
    <div
      className={`w-[137px] overflow-hidden flex flex-col items-end justify-center text-center text-[40px] text-[#fe5b18] font-[Inter] ${className}`}
      style={frameStyle}
    >
      <div className="w-[120px] h-[89px] flex flex-col items-center justify-start">
        <div className="w-[120px] flex flex-col items-center justify-start gap-[18px]">
          <img
            className="w-[33.8px] relative rounded-[2.5px] h-[41.1px] object-contain"
            alt=""
            src={vector}
            style={vectorIconStyle}
          />
          <h1 className="m-[0px] self-stretch relative text-inherit tracking-[-0.28px] leading-[16px] font-bold font-[inherit]">
            Delika
          </h1>
        </div>
      </div>
    </div>
  );
};

export default DelikaLogo;
