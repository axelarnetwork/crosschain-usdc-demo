import React, { FunctionComponent } from "react";
import Image from "next/image";

interface SwapContainerProps {}

export const SwapContainer: FunctionComponent<SwapContainerProps> = ({
  children,
}) => {
  return (
    <div className="z-40 flex flex-col p-4 py-6 m-8 shadow-xl card rounded-3xl bg-base-900 bg-gradient-to-b to-[#191E31] from-[#192431] relative max-w-xl mx-auto">
      <div className="z-10 flex flex-col p-4">{children}</div>
      <div className="absolute top-0 left-0 z-0 w-full h-full">
        <div className="relative w-full h-full">
          <Image
            className="scale-110 rotate-3"
            src={"/assets/svg/pattern.svg"}
            layout="fill"
            alt="background pattern"
            objectFit="cover"
          />
        </div>
      </div>
    </div>
  );
};
