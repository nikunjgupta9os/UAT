
import React, { useEffect, useState } from "react";
import { Calendar, Clock } from "lucide-react";

interface MaturityBucket {
  amount: string;
  contracts: string;
}

interface MaturityBucketsApiResponse {
  "Next 30 Days": MaturityBucket;
  "31-90 Days": MaturityBucket;
  "91-180 Days": MaturityBucket;
  "180+ Days": MaturityBucket;
}

const maturityLabels = [
  "Next 30 Days",
  "31-90 Days",
  "91-180 Days",
  "180+ Days",
];

const ForwardMaturityAnalysisCard: React.FC = () => {
  const [buckets, setBuckets] = useState<MaturityBucketsApiResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBuckets = async () => {
      try {
        const res = await fetch("https://backend-slqi.onrender.com/api/forwardDash/maturity-buckets");
        const data = await res.json();
        setBuckets(data);
      } catch (err) {
        setBuckets(null);
      } finally {
        setLoading(false);
      }
    };
    fetchBuckets();
  }, []);

  return (
    <div className="relative bg-gradient-to-bl from-[#62B37A] to-[#259D51] rounded-2xl border border-[#198641] p-6 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        <svg className="w-full h-full" width="100%" height="100%">
          <defs>
            <pattern
              id="grid-pattern"
              width="40"
              height="40"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 40 0 L 0 0 0 40"
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="1"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid-pattern)" />
        </svg>
      </div>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-white/50 rounded-full flex items-center justify-center">
          <Calendar className="w-5 h-5 text-green-600" />
        </div>
        <div className="text-left">
          <h3 className="text-lg font-semibold text-white">Forward Maturity Analysis</h3>
          <p className="text-sm text-white">Upcoming Settlements and Exposures</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mt-8 ">
        {maturityLabels.map((label, idx) => {
          const item = buckets?.[label];
          return (
            <div
              key={label}
              className={`bg-secondary-color-dark p-6 rounded-xl border-primary-lt border flex flex-col justify-center`}
            >
              <div className="flex items-center gap-2 mb-4">
                <Clock className={`w-5 h-5 text-primary`} />
                <h4 className={`text-base font-medium text-secondary-text-dark`}>{label}</h4>
              </div>
              <p className="text-4xl font-bold text-primary mb-2">
                {loading ? "Loading..." : item?.amount ?? "-"}
              </p>
              <p className="text-md font-medium text-secondary-text">
                {loading ? "Loading..." : item?.contracts ?? "-"}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ForwardMaturityAnalysisCard;
