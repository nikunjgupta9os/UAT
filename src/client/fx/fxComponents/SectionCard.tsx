// New unified SectionCard component
import React, { useState } from "react";
import type { ReactNode } from "react";

interface SectionCardProps {
  title?: string;
  heading?: string;
  children: ReactNode;
  defaultOpen?: boolean;
}

const SectionCard: React.FC<SectionCardProps> = ({
  title,
  heading,
  children,
  defaultOpen = true,
}) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="shadow rounded-xl mb-4">
      <div
        className="cursor-pointer p-4 text-primary font-semibold border-t border-x border-body-hover bg-primary-xl rounded-t-xl"
        onClick={() => setOpen(!open)}
      >
        {heading || title}
      </div>
      {open && <div className="p-4 border border-body-hover bg-secondary-color rounded-b-xl">{children}</div>}
    </div>
  );
};

export default SectionCard;
