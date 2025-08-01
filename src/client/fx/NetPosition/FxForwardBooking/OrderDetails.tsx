import React, { useEffect, useState } from "react";
import SectionCard from "./SectionCard";

interface OrderDetailsResponse {
  orderRef?: string;
  tradeRef?: string;
  orderType?: string;
  channel?: string;
}

const fallbackOrderDetails: OrderDetailsResponse = {
  orderRef: "-",
  tradeRef: "-",
  orderType: "-",
  channel: "-",
};

const fetchOrderDetails = async (): Promise<OrderDetailsResponse> => {
  const res = await fetch("/api/order-details"); // 🔁 Replace with actual API
  if (!res.ok) throw new Error("Failed to fetch order details");
  return res.json();
};

const OrderDetails: React.FC = () => {
  const [order, setOrder] = useState<OrderDetailsResponse>(fallbackOrderDetails);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    fetchOrderDetails()
      .then((res) => setOrder(res))
      .catch((err) => {
         console.error("Error fetching order details:", err);
        setOrder(fallbackOrderDetails);
        setError("Unable to load order details.");
      })
      .finally(() => setIsLoading(false));
  }, []);

  const fields = [
    { label: "Order Ref", value: order.orderRef },
    { label: "Trade Ref", value: order.tradeRef },
    { label: "Order Type", value: order.orderType },
    { label: "Channel", value: order.channel },
  ];

  return (
    <SectionCard title="Order Details">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {fields.map((field, idx) => (
            <div key={idx} className="flex flex-col">
              <label className="text-sm text-secondary-text mb-1">{field.label}</label>
              <div className="mt-1 border border-border rounded px-3 py-2 bg-secondary-color-lt text-secondary-text-dark min-h-[38px]">
                {field.value || "-"}
              </div>
            </div>
          ))}
        </div>
    </SectionCard>
  );
};

export default OrderDetails;
